"""
IoT environmental-sensor telemetry producer (DPE Custom Action).
A per-device state machine drives a realistic failure lifecycle so every run
shows the full story: OK -> DEGRADED -> FAULT -> OFFLINE -> (repaired) -> OK.
Run as a Custom Action in Always-up mode. Entry function: customfunc.
Add `kafka-python` to the action's Python Requirements (NOT bare `kafka`).
"""

try:
    from forepaas.dwh.connect import connect  # platform boilerplate; absent locally
except ImportError:
    connect = None
import logging
import time
import json
import math
import random
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# CONNECTION -- confirm before running.
# KAFKA_MODE: "ssl" = mTLS (CA + client cert + key); "sasl_ssl" = SASL/SCRAM; "noauth".
KAFKA_MODE = "ssl"
TOPIC = "iot_readings"
BOOTSTRAP = "<your-kafka-bootstrap-host>:<port>"

# Run duration. None = always-up (best for a live dashboard). Set seconds (e.g. 600)
# for a finite run that exits cleanly with SUCCESS instead of a manual "stopped".
MAX_RUNTIME_SECS = None

# Cert source: "bucket" pulls the 3 files from an LHM bucket at runtime (recommended);
# "files" reads local files. Auto-falls back to "files" when the SDK is absent.
CERT_SOURCE = "bucket"
CERT_BUCKET = "iot-demo-certs"
CA_OBJECT = "certificate.txt"
CERT_OBJECT = "user-certificate.txt"
KEY_OBJECT = "user-access-key.txt"
CA_PATH, CERT_PATH, KEY_PATH = "certificate.txt", "user-certificate.txt", "user-access-key.txt"

# sasl_ssl settings (only if KAFKA_MODE="sasl_ssl"):
SASL_USERNAME = "REPLACE_WITH_USERNAME"
SASL_PASSWORD = "REPLACE_WITH_PASSWORD"
SASL_MECHANISM = "SCRAM-SHA-512"  # confirm in your broker dashboard


def resolve_certs():
    """Return (cafile, certfile, keyfile) local paths for the TLS handshake."""
    use_bucket = CERT_SOURCE == "bucket"
    if use_bucket and connect is None:
        logger.warning("SDK not available -> falling back to local cert files.")
        use_bucket = False
    if use_bucket:
        bucket = connect("data_store/" + CERT_BUCKET)
        targets = [
            (CA_OBJECT, "/tmp/iot_ca.pem"),
            (CERT_OBJECT, "/tmp/iot_cert.pem"),
            (KEY_OBJECT, "/tmp/iot_key.pem"),
        ]
        for object_name, local_path in targets:
            bucket.fget(object_name, local_path)
        logger.info("Fetched mTLS certs from bucket '%s' to /tmp", CERT_BUCKET)
        return "/tmp/iot_ca.pem", "/tmp/iot_cert.pem", "/tmp/iot_key.pem"
    return CA_PATH, CERT_PATH, KEY_PATH


def build_producer():
    """Return a configured KafkaProducer for the selected KAFKA_MODE."""
    from kafka import KafkaProducer  # kafka-python
    if KAFKA_MODE == "ssl":
        cafile, certfile, keyfile = resolve_certs()
        return KafkaProducer(bootstrap_servers=BOOTSTRAP, security_protocol="SSL",
                             ssl_cafile=cafile, ssl_certfile=certfile, ssl_keyfile=keyfile)
    if KAFKA_MODE == "sasl_ssl":
        cafile, _, _ = resolve_certs()
        return KafkaProducer(bootstrap_servers=BOOTSTRAP, security_protocol="SASL_SSL",
                             sasl_mechanism=SASL_MECHANISM, sasl_plain_username=SASL_USERNAME,
                             sasl_plain_password=SASL_PASSWORD, ssl_cafile=cafile)
    return KafkaProducer(bootstrap_servers=BOOTSTRAP)  # noauth


# FLEET DEFINITION -- dimensions are denormalized onto each reading for easy grouping.
SITES = [
    ("paris-dc1",   "EU-W",  "indoor-air"),
    ("london-dc2",  "EU-W",  "indoor-air"),
    ("frankfurt-1", "EU-C",  "indoor-air"),
    ("warsaw-edge", "EU-E",  "outdoor-air"),
]
DEVICES_PER_SITE = 3  # 4 sites x 3 -> 12 devices

METRIC_PROFILE = {
    "temperature": {"base": 21.0, "swing": 4.0,  "noise": 0.4},
    "humidity":    {"base": 45.0, "swing": 12.0, "noise": 1.5},
    "co2":         {"base": 480.0, "swing": 220.0, "noise": 25.0},
    "pm25":        {"base": 9.0,  "swing": 6.0,  "noise": 1.2},
}

PHASE_DEGRADED, PHASE_FAULT, PHASE_OFFLINE, PHASE_REPAIRED_COOLDOWN = 120, 90, 60, 90


def build_fleet():
    """Create the per-device state table."""
    fleet = []
    for site, region, dtype in SITES:
        for n in range(1, DEVICES_PER_SITE + 1):
            fleet.append({
                "device_id": f"{site}-sensor-{n:02d}", "site": site, "region": region,
                "device_type": dtype, "status": "OK",
                "battery_pct": round(random.uniform(80.0, 100.0), 1),
                "phase_until": 0.0, "fault_value": None,
            })
    return fleet


def daily_factor(now_epoch):
    """Sine over a compressed 10-minute 'day' so cycles are visible fast."""
    period = 600.0
    return math.sin((now_epoch % period) / period * 2 * math.pi)


def healthy_reading(metric, now_epoch):
    """Baseline + daily swing + Gaussian noise for one metric."""
    p = METRIC_PROFILE[metric]
    return round(p["base"] + p["swing"] * daily_factor(now_epoch) + random.gauss(0, p["noise"]), 2)


def schedule_failures(fleet, now_epoch, started_epoch):
    """Deterministically kick off the failure story (victim #0 fast, #1 later)."""
    elapsed = now_epoch - started_epoch
    for idx, after in [(0, 15.0), (5, 180.0)]:
        dev = fleet[idx]
        if dev["status"] == "OK" and elapsed >= after and now_epoch >= dev["phase_until"]:
            dev["status"] = "DEGRADED"
            dev["phase_until"] = now_epoch + PHASE_DEGRADED


def advance_state(dev, now_epoch):
    """Walk a device through its phases and drain battery. Returns True if it should emit."""
    dev["battery_pct"] = max(0.0, round(dev["battery_pct"] - (0.05 if dev["status"] == "OK" else 0.25), 2))
    if dev["status"] != "OK" and now_epoch >= dev["phase_until"]:
        if dev["status"] == "DEGRADED":
            dev["status"], dev["fault_value"] = "FAULT", None
            dev["phase_until"] = now_epoch + PHASE_FAULT
        elif dev["status"] == "FAULT":
            dev["status"] = "OFFLINE"
            dev["phase_until"] = now_epoch + PHASE_OFFLINE
        elif dev["status"] == "OFFLINE":
            dev["status"] = "OK"  # repaired
            dev["battery_pct"] = round(random.uniform(85.0, 100.0), 1)
            dev["fault_value"] = None
            dev["phase_until"] = now_epoch + PHASE_REPAIRED_COOLDOWN
    if dev["status"] == "OK" and dev["battery_pct"] < 15.0:
        dev["status"] = "DEGRADED"
        dev["phase_until"] = now_epoch + PHASE_DEGRADED
    return dev["status"] != "OFFLINE"  # OFFLINE = true downtime, emit nothing


def make_message(dev, now_epoch):
    """Build the flat-JSON reading for a device in its current state."""
    status, error_code = dev["status"], "NONE"
    readings = {m: healthy_reading(m, now_epoch) for m in METRIC_PROFILE}
    if status == "DEGRADED":
        for m in readings:
            readings[m] = round(readings[m] + random.gauss(0, METRIC_PROFILE[m]["noise"] * 4), 2)
        error_code = "E_BATTERY" if dev["battery_pct"] < 20.0 else "E_DRIFT"
    elif status == "FAULT":
        if dev["fault_value"] is None:
            dev["fault_value"] = readings
        else:
            readings = dev["fault_value"]
        error_code = "E_STUCK"
        if random.random() < 0.3:  # occasional wild pm25 spike
            readings = dict(readings)
            readings["pm25"] = round(readings["pm25"] + random.uniform(80.0, 160.0), 2)
            error_code = "E_SPIKE"
    return {
        "ts": datetime.now(timezone.utc).isoformat(),
        "device_id": dev["device_id"], "site": dev["site"],
        "region": dev["region"], "device_type": dev["device_type"],
        "temperature": float(readings["temperature"]), "humidity": float(readings["humidity"]),
        "co2": float(readings["co2"]), "pm25": float(readings["pm25"]),
        "battery_pct": float(dev["battery_pct"]), "status": status, "error_code": error_code,
    }


def customfunc(event):
    logger.info("Begin IoT producer (mode=%s, topic=%s)", KAFKA_MODE, TOPIC)
    fleet = build_fleet()
    try:
        producer = build_producer()
    except Exception as err:
        logger.critical("Failed to connect to Kafka: %s", err)
        raise
    started, sent, last_log = time.time(), 0, time.time()
    LOG_EVERY_SECS = 25
    try:
        while True:
            now = time.time()
            if MAX_RUNTIME_SECS is not None and now - started >= MAX_RUNTIME_SECS:
                logger.info("MAX_RUNTIME_SECS reached -> stopping after ~%d messages", sent)
                break
            schedule_failures(fleet, now, started)
            for dev in fleet:
                if not advance_state(dev, now):
                    continue  # OFFLINE -> gap in the data
                producer.send(TOPIC, json.dumps(make_message(dev, now)).encode("utf-8"))
                sent += 1
            if now - last_log >= LOG_EVERY_SECS:
                breakdown = {}
                for d in fleet:
                    breakdown[d["status"]] = breakdown.get(d["status"], 0) + 1
                logger.info("sent ~%d messages; fleet: %s", sent, breakdown)
                last_log = now
            producer.flush()
            time.sleep(5)  # one reading per device every 5s
    except Exception as err:
        logger.critical("Producer loop error: %s", err)
        raise
    finally:
        producer.flush()
        producer.close()
        logger.info("Producer closed. Total messages sent: ~%d", sent)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    customfunc(None)
