"""
AI enrichment action: applies one Trino AI function of the project's AI
consumer to the rows of a table and writes the results to a target table,
in chunks that run side by side.

Use: fill the config block, run the action. A trigger POST body can override
any config key for one run, e.g. {"row_limit": 500, "chunks": 8}.

AI_EXPR is the call to apply, copied from the consumer's Usage tab, with {c}
in place of the text column. Examples:
    ai_classify({c}, ARRAY['bug', 'praise'])        ai_analyze_sentiment({c})
    ai_translate({c}, 'french')                     ai_fix_grammar({c})
    ai_mask({c}, ARRAY['email'])                    ai_gen(concat('Summarise: ', {c}))
    json_format(cast(ai_extract({c}, ARRAY['price']) AS json))   (a map, kept as JSON text)

The target is created on the first run with <id>, source_text, ai_operation,
ai_output, and holds the results of one function. Each run enriches up to
row_limit new rows (rounded up to a multiple of chunks); rows already in the
target are skipped, so a rerun continues where the last one stopped. Every row
is one billed call to the provider, and a retried chunk bills its rows again.
Do not run two instances at once. Keep customfunc as the entry point and the
file under 10 KB (platform WAF limit).
"""

import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor

from forepaas.dwh import connect

log = logging.getLogger(__name__)

# --- Config: fill in before the first run -----------------------------------
SOURCE = "dwh/<dataset>/"       # dataset connection, trailing slash required
SOURCE_TABLE = "<table>"
ID_COLUMN = "<id column>"       # non-null and unique
TEXT_COLUMN = "<text column>"
AI_EXPR = "ai_classify({c}, ARRAY['<label>', '<label>'])"
TARGET_TABLE = ""               # empty: "<table>_ai_<function>"
CHUNKS = 4                      # concurrent chunk queries, at most 16
ROW_LIMIT = 100                 # new rows enriched per run: the spend cap
AI_CATALOG = ""                 # empty: this project's db_<project_id>_ai
# ----------------------------------------------------------------------------

MAX_CHUNKS = 16     # each chunk holds a Trino query slot
CHUNK_RETRIES = 2   # attempts per chunk; a failed attempt writes nothing
_AI_FUNC = re.compile(r"\bai_(\w+)\(")


def _ident(name):
    """Validate a table, column or catalog name and quote it for SQL."""
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", str(name)):
        raise ValueError(f"invalid identifier {name!r}: letters, digits and _ only")
    return f'"{name}"'


def _config(event):
    """File defaults overridden by the trigger body, validated."""
    cfg = {"source": SOURCE, "source_table": SOURCE_TABLE, "id_column": ID_COLUMN,
           "text_column": TEXT_COLUMN, "ai_expr": AI_EXPR, "target_table": TARGET_TABLE,
           "chunks": CHUNKS, "row_limit": ROW_LIMIT, "ai_catalog": AI_CATALOG}
    overrides = getattr(event, "content", None)   # the platform's Event
    if overrides is None and isinstance(event, dict):
        overrides = event.get("content", event)   # a plain dict for local tests
    cfg.update(overrides or {})
    for key in ("source", "source_table", "id_column", "text_column"):
        if "<" in str(cfg[key]):
            raise ValueError(f"fill in {key} in the config block")
    if "<label>" in cfg["ai_expr"] or "{c}" not in cfg["ai_expr"]:
        raise ValueError("fill in ai_expr: an AI call using {c} as the text column")
    func = _AI_FUNC.search(cfg["ai_expr"])
    if not func:
        raise ValueError("ai_expr must call one of the ai_* functions")
    cfg["operation"] = func.group(1)   # classify, extract, gen, ... stored with each row
    if not re.match(r"^dwh/.*/$", str(cfg["source"])):
        raise ValueError("source must look like dwh/<dataset>/")
    cfg["target_table"] = cfg["target_table"] or f"{cfg['source_table']}_ai_{cfg['operation']}"
    cfg["ai_catalog"] = cfg["ai_catalog"] or f"db_{os.environ.get('DATAPLANT_ID', '')}_ai"
    if cfg["ai_catalog"] == "db__ai":
        raise ValueError("DATAPLANT_ID is not set: fill in ai_catalog")
    cfg["chunks"] = max(1, min(int(cfg["chunks"]), MAX_CHUNKS))
    cfg["row_limit"] = int(cfg["row_limit"])
    if cfg["row_limit"] < 1:
        raise ValueError("row_limit must be at least 1")
    return cfg


def customfunc(event, *args, **kwargs):
    cfg = _config(event)
    uri, chunks, op = cfg["source"], cfg["chunks"], cfg["operation"]
    table, target = _ident(cfg["source_table"]), _ident(cfg["target_table"])
    id_col, text_col = _ident(cfg["id_column"]), _ident(cfg["text_column"])
    # The AI call, qualified with the project's AI catalog, on the text column.
    expr = _AI_FUNC.sub(rf"{_ident(cfg['ai_catalog'])}.ai.ai_\1(", cfg["ai_expr"]).replace("{c}", text_col)
    # Rows still to enrich: text not null and not already in the target.
    todo = (f"SELECT {id_col}, {text_col} FROM {table} t WHERE {text_col} IS NOT NULL "
            f"AND NOT EXISTS (SELECT 1 FROM {target} x WHERE x.{id_col} = t.{id_col})")
    # Each row belongs to one chunk, by a hash of its id.
    bucket = f"mod(abs(from_big_endian_64(xxhash64(to_utf8(cast({id_col} AS varchar))))), {chunks})"
    per_chunk = -(-cfg["row_limit"] // chunks)

    cn = connect(uri)

    def count(sql):
        return cn.query(f"SELECT count(*) AS n FROM {sql}", return_type="dict")[0]["n"]

    # Creates the target with the right columns and no rows: Trino type-checks
    # the AI call here without calling the model.
    cn.query(f"CREATE TABLE IF NOT EXISTS {target} AS SELECT {id_col}, {text_col} AS source_text, "
             f"'{op}' AS ai_operation, {expr} AS ai_output FROM {table} WHERE false")
    try:  # an existing target must have the expected columns
        other = cn.query(f"SELECT ai_operation FROM {target} WHERE ai_operation <> '{op}' LIMIT 1", return_type="dict")
    except Exception as err:
        raise Exception(f"target {cfg['target_table']} exists with another layout, drop it: {err}") from err
    if other:
        raise Exception(f"target {cfg['target_table']} holds results of ai_{other[0]['ai_operation']}, "
                        f"not ai_{op}: drop it or pick another target")
    before = count(target)
    n = min(count(f"({todo}) t"), cfg["row_limit"])
    log.info("[ai-enrich] %s: up to %d rows to enrich in %d chunks, %d already in %s",
             cfg["source_table"], n, chunks, before, cfg["target_table"])
    if n == 0:
        return {"rows_enriched": 0, "rows_in_target": before}

    def run_chunk(k):
        sql = (f"INSERT INTO {target} ({id_col}, source_text, ai_operation, ai_output) "
               f"SELECT {id_col}, {text_col}, '{op}', {expr} FROM ({todo} AND {bucket} = {k} "
               f"ORDER BY {id_col} LIMIT {per_chunk}) t")
        for attempt in range(1, CHUNK_RETRIES + 1):
            started = time.time()
            try:
                connect(uri).query(sql)
                log.info("[ai-enrich] chunk %d done in %.0fs", k, time.time() - started)
                return None
            except Exception as err:
                log.warning("[ai-enrich] chunk %d attempt %d/%d failed: %s", k, attempt, CHUNK_RETRIES, str(err)[:200])
        return k

    with ThreadPoolExecutor(max_workers=chunks) as pool:
        failed = [k for k in pool.map(run_chunk, range(chunks)) if k is not None]
    after = count(target)
    summary = {"rows_enriched": after - before, "rows_in_target": after, "chunks_failed": failed}
    log.info("[ai-enrich] done: %s", summary)
    if failed:  # the run is marked failed; the rows already enriched are kept
        raise Exception(f"chunks failed: {failed}; rerun the action, rows already in the target are skipped")
    return summary
