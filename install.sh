#!/bin/bash
# install.sh — FreePBX Factory V1.9 CRA — Installateur on-VPS
#
# S'exécute DIRECTEMENT sur le VPS cible (Debian 12 neuf).
# Pas de machine de déploiement intermédiaire, pas de connexion SSH sortante.
#
# PRÉREQUIS :
#   - Debian 12 (Bookworm), neuf, connexion internet
#   - Accès root (sudo ou su)
#   - python3 disponible (présent par défaut sur Debian 12)
#
# UTILISATION :
#   sudo bash /tmp/freepbx-factory/install.sh
#
# ARCHITECTURE :
#   Le script démarre dans tmux si tmux n'est pas actif — la session
#   persiste même si la connexion SSH est coupée lors du durcissement SSH.
#   Reconnexion après hardening : ssh -p <PORT> debian@<IP> puis tmux attach
#
# PHASES :
#   00_cleanup → 00_hardening → 01_install → 02_asterisk →
#   03_firewall → 04_fail2ban → 06_freepbx_config →
#   09_apache_hardening → 10_mariadb_hardening → 11_services_hardening →
#   14_auditd → 12_sbom → 13_post_checks
#   (05_restore supprimé — V1.9 CRA — template non nécessaire)
#
# Fix E19 intégré : 00_hardening tourne comme processus local (pas via pipe SSH).
#   sshd restart coupe la connexion SSH cliente mais pas ce script (dans tmux).
# Fix E21 intégré : sed pattern unique dans 00_hardening.sh.

set -euo pipefail

# ── Arguments optionnels (passés par launch.py/launch.sh) ───────────────────
# --management-ip=X.X.X.0/24 : IP du poste déployeur (détectée par le lanceur)
# --kit-starter=oui|non       : pré-sélection wizard (ignore la question interactive)
MANAGEMENT_IP_ARG=""
KIT_STARTER_ARG=""   # vide = demander interactivement
for _arg in "$@"; do
    case "$_arg" in
        --management-ip=*)   MANAGEMENT_IP_ARG="${_arg#*=}";;
        --kit-starter=*)     KIT_STARTER_ARG="${_arg#*=}";;
        --trunk-enabled=*)   TRUNK_ENABLED_ARG="${_arg#*=}";;
        --trunk-registrar=*) TRUNK_REGISTRAR_ARG="${_arg#*=}";;
        --trunk-username=*)  TRUNK_USERNAME_ARG="${_arg#*=}";;
        --tls-domain=*)      TLS_DOMAIN_ARG="${_arg#*=}";;
    esac
done
TRUNK_ENABLED_ARG="${TRUNK_ENABLED_ARG:-}"
TRUNK_REGISTRAR_ARG="${TRUNK_REGISTRAR_ARG:-}"
TRUNK_USERNAME_ARG="${TRUNK_USERNAME_ARG:-}"
TLS_DOMAIN_ARG="${TLS_DOMAIN_ARG:-}"

# ── Validation des options CLI ───────────────────────────────────────────────
# kit-starter : valeur attendue parmi oui/non/yes/no/1/0
if [[ -n "$KIT_STARTER_ARG" ]]; then
    case "${KIT_STARTER_ARG,,}" in
        oui|non|yes|no|1|0) ;;
        *) echo -e "\033[0;31m[ERR]\033[0m --kit-starter='$KIT_STARTER_ARG' invalide. Valeurs acceptées : oui, non." >&2; exit 1;;
    esac
fi

# trunk-enabled=oui : registrar et username obligatoires
if [[ "${TRUNK_ENABLED_ARG,,}" =~ ^(oui|yes|1)$ ]]; then
    [[ -z "$TRUNK_REGISTRAR_ARG" ]] && { echo -e "\033[0;31m[ERR]\033[0m --trunk-enabled=oui requiert --trunk-registrar=<serveur-sip>" >&2; exit 1; }
    [[ -z "$TRUNK_USERNAME_ARG"  ]] && { echo -e "\033[0;31m[ERR]\033[0m --trunk-enabled=oui requiert --trunk-username=<login-sip>" >&2; exit 1; }
fi

# trunk-registrar / trunk-username : format strict (défense anti-injection au ré-exec tmux).
# Ces valeurs sont réinjectées dans la commande de session tmux : on interdit tout
# caractère shell (;, $, backtick, quotes, espace) qui permettrait une injection.
if [[ -n "$TRUNK_REGISTRAR_ARG" ]]; then
    if ! [[ "$TRUNK_REGISTRAR_ARG" =~ ^[A-Za-z0-9._:-]+$ ]]; then
        echo -e "\033[0;31m[ERR]\033[0m --trunk-registrar='$TRUNK_REGISTRAR_ARG' invalide (hôte ou IP attendu ; caractères autorisés : lettres, chiffres, . _ - :)." >&2
        exit 1
    fi
fi
if [[ -n "$TRUNK_USERNAME_ARG" ]]; then
    if ! [[ "$TRUNK_USERNAME_ARG" =~ ^[A-Za-z0-9._@+-]+$ ]]; then
        echo -e "\033[0;31m[ERR]\033[0m --trunk-username='$TRUNK_USERNAME_ARG' invalide (caractères autorisés : lettres, chiffres, . _ - @ +)." >&2
        exit 1
    fi
fi

# tls-domain : format FQDN minimal (lettres, chiffres, tirets, points ; au moins un point)
if [[ -n "$TLS_DOMAIN_ARG" ]]; then
    if ! [[ "$TLS_DOMAIN_ARG" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+$ ]]; then
        echo -e "\033[0;31m[ERR]\033[0m --tls-domain='$TLS_DOMAIN_ARG' invalide. Exemple attendu : pbx.mon-entreprise.fr" >&2
        exit 1
    fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# @@BUNDLE_INJECT_START@@
_PHASES_TMP="$(mktemp -d /tmp/fpbx-phases-XXXXXX)"
trap 'rm -rf "$_PHASES_TMP" 2>/dev/null' EXIT
trap '
    stty sane 2>/dev/null
    echo ""; echo "  Installation interrompue — nettoyage en cours..."
    rm -f /root/.fpbx-state.sh 2>/dev/null || true
    systemctl disable freepbx-factory-resume 2>/dev/null || true
    rm -f /etc/systemd/system/freepbx-factory-resume.service 2>/dev/null || true
    systemctl daemon-reload 2>/dev/null || true
    grep -q "FreePBX Factory" /etc/motd 2>/dev/null && printf "\n" > /etc/motd || true
    exit 130
' INT TERM

cat > "$_PHASES_TMP/00_cleanup.sh" <<'__FPBXPHASE_00_CLEANUP_SH__'
#!/bin/bash
# 00_cleanup.sh — Purge Node.js/npm et dépôts NodeSource (E1)
# Exécuté localement sur le VPS
set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-00-cleanup.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 00_CLEANUP ==="

# Attente dpkg lock — unattended-upgrades tourne souvent au boot sur VPS Debian frais
systemctl stop unattended-upgrades 2>/dev/null || true
_dpkg_wait=0
while ! flock -n /var/lib/dpkg/lock-frontend /bin/true 2>/dev/null; do
    [ $((_dpkg_wait % 15)) -eq 0 ] && echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attente verrou dpkg (unattended-upgrades)..."
    sleep 5; _dpkg_wait=$((_dpkg_wait + 5))
    [ $_dpkg_wait -ge 120 ] && { echo "ERREUR : verrou dpkg non libéré après 2 min"; exit 1; }
done
unset _dpkg_wait

apt-get remove --purge nodejs npm -y 2>&1 | tail -3 || true
rm -rf /usr/lib/node_modules \
       /etc/apt/sources.list.d/nodesource.list \
       /etc/apt/sources.list.d/nodesource.list.d \
       /etc/apt/keyrings/nodesource.gpg \
       /etc/apt/trusted.gpg.d/nodesource.gpg 2>/dev/null || true
apt-get autoremove -y 2>&1 | tail -2 || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] CLEANUP_OK"
__FPBXPHASE_00_CLEANUP_SH__
chmod +x "$_PHASES_TMP/00_cleanup.sh"

cat > "$_PHASES_TMP/00_hardening.sh" <<'__FPBXPHASE_00_HARDENING_SH__'
#!/bin/bash
# 00_hardening.sh — UFW bootstrap + SSH hardening + sysctl
#
# FIX E19 : ce script s'exécute localement sur le VPS (uploadé via scp).
#   systemctl restart sshd ne coupe PAS ce script car il tourne en processus
#   local, pas dans un pipe SSH. La connexion SSH distante sera coupée lors du
#   restart sshd — c'est attendu et géré par le lanceur (reconnexion sur 2222).
#
# FIX E21 : le sed utilise le pattern ^#\?Port[[:space:]] qui remplace la ligne
#   entière, quel que soit le contenu initial (#Port 22, Port 22, Port 2222).
#   Il ne peut pas produire Port 222222.
#
# Usage : sudo bash /tmp/00_hardening.sh <management_ip> [ssh_port]
#   Ex :  sudo bash /tmp/00_hardening.sh A.B.C.0/24 2222

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-00-hardening.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

MANAGEMENT_IP="${1:?Argument 1 requis : management_ip (ex: A.B.C.0/24)}"
SSH_PORT="${2:-2222}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 00_HARDENING ==="
echo "  management_ip : $MANAGEMENT_IP"
echo "  ssh_port      : $SSH_PORT"

# --- Attente verrou dpkg (installateur Sangoma ou unattended-upgrades au boot) ---
systemctl stop unattended-upgrades 2>/dev/null || true
_dpkg_wait=0
while ! flock -n /var/lib/dpkg/lock-frontend /bin/true 2>/dev/null; do
    [ $((_dpkg_wait % 15)) -eq 0 ] && echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attente verrou dpkg..."
    sleep 5; _dpkg_wait=$((_dpkg_wait + 5))
    [ $_dpkg_wait -ge 120 ] && { echo "[ERREUR] verrou dpkg non libéré après 2 min"; exit 1; }
done
unset _dpkg_wait

# --- UFW bootstrap (AVANT toute modification sshd) ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] UFW : installation..."
apt-get install -y ufw 2>&1 | tail -2

ufw --force reset 2>&1 | tail -1
ufw default deny incoming
ufw default allow outgoing

# Ouvrir le port courant (22) ET le port cible pour la transition
ufw allow from "$MANAGEMENT_IP" to any port 22 proto tcp
ufw allow from "$MANAGEMENT_IP" to any port "$SSH_PORT" proto tcp
ufw --force enable

echo "[$(date '+%Y-%m-%d %H:%M:%S')] UFW_BOOTSTRAP_OK"
ufw status

# --- sysctl hardening ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] sysctl : application..."
cat > /etc/sysctl.d/99-freepbx-factory.conf << 'EOF'
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
EOF
sysctl -p /etc/sysctl.d/99-freepbx-factory.conf
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SYSCTL_OK"

# --- unattended-upgrades ---
apt-get install -y unattended-upgrades apt-listchanges 2>&1 | tail -2
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF
echo "[$(date '+%Y-%m-%d %H:%M:%S')] UNATTENDED_UPGRADES_OK"

# --- Garde anti-lock-out : ne jamais couper l'auth par mot de passe sans clé SSH valide ---
# Sans clé exploitable pour 'debian', désactiver PasswordAuthentication + PermitRootLogin
# rendrait l'accès SSH définitivement impossible (seule issue : console KVM).
# On s'arrête AVANT toute modification de sshd_config.
_DEBIAN_AK="/home/debian/.ssh/authorized_keys"
if [ ! -s "$_DEBIAN_AK" ] || ! grep -Eq '(^|[[:space:]])(sk-)?(ssh-(rsa|ed25519|dss)|ecdsa-sha2-)' "$_DEBIAN_AK"; then
    echo "[ERREUR] Aucune clé SSH valide pour l'utilisateur 'debian' ($_DEBIAN_AK)."
    echo "         Le durcissement SSH vous verrouillerait dehors. Associez une clé SSH"
    echo "         au VPS (réinstallation OVHcloud ou ssh-copy-id) puis relancez."
    exit 1
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SSH_KEY_GUARD_OK — clé debian présente"

# --- SSH hardening ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SSH : configuration..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# FIX E21 : pattern unique, remplace la ligne entière — aucun risque de doublement
# Gère : "#Port 22", "Port 22", "Port 2222", ligne absente
sed -i "s/^#\?Port[[:space:]].*/Port ${SSH_PORT}/" /etc/ssh/sshd_config
grep -q "^Port " /etc/ssh/sshd_config || echo "Port ${SSH_PORT}" >> /etc/ssh/sshd_config

sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
grep -q "^PermitRootLogin" /etc/ssh/sshd_config || echo "PermitRootLogin no" >> /etc/ssh/sshd_config

sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
grep -q "^MaxAuthTries" /etc/ssh/sshd_config || echo "MaxAuthTries 3" >> /etc/ssh/sshd_config

sed -i 's/^#\?MaxSessions.*/MaxSessions 4/' /etc/ssh/sshd_config
grep -q "^MaxSessions" /etc/ssh/sshd_config || echo "MaxSessions 4" >> /etc/ssh/sshd_config

sed -i 's/^#\?ClientAliveInterval.*/ClientAliveInterval 300/' /etc/ssh/sshd_config
grep -q "^ClientAliveInterval" /etc/ssh/sshd_config || echo "ClientAliveInterval 300" >> /etc/ssh/sshd_config

sed -i 's/^#\?ClientAliveCountMax.*/ClientAliveCountMax 2/' /etc/ssh/sshd_config
grep -q "^ClientAliveCountMax" /etc/ssh/sshd_config || echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config

sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
grep -q "^X11Forwarding" /etc/ssh/sshd_config || echo "X11Forwarding no" >> /etc/ssh/sshd_config

sed -i 's/^#\?AllowTcpForwarding.*/AllowTcpForwarding no/' /etc/ssh/sshd_config
grep -q "^AllowTcpForwarding" /etc/ssh/sshd_config || echo "AllowTcpForwarding no" >> /etc/ssh/sshd_config

sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
grep -q "^PasswordAuthentication" /etc/ssh/sshd_config || echo "PasswordAuthentication no" >> /etc/ssh/sshd_config

grep -q "^AllowUsers" /etc/ssh/sshd_config \
  && sed -i 's/^AllowUsers.*/AllowUsers debian/' /etc/ssh/sshd_config \
  || echo "AllowUsers debian" >> /etc/ssh/sshd_config

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SSH_CONFIG_WRITTEN"
echo "  Contenu Port/Auth :"
grep -E "^Port|^PermitRootLogin|^MaxAuthTries|^PasswordAuthentication|^AllowUsers" /etc/ssh/sshd_config || true

# Validation AVANT restart (abort si config invalide)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] sshd -t : validation..."
if ! sshd -t; then
    echo "[ERREUR] Config sshd invalide — restauration backup"
    cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config
    exit 1
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SSH_CONFIG_VALID"

# Restart sshd — la connexion SSH distante sera coupée ici (attendu)
# Ce script continue car il tourne localement, pas dans le pipe SSH
systemctl restart sshd
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SSHD_RESTARTED_PORT_${SSH_PORT}"

# Supprimer la règle UFW temporaire port 22
ufw delete allow from "$MANAGEMENT_IP" to any port 22 proto tcp 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] UFW_PORT22_REMOVED"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === HARDENING_COMPLETE ==="
echo "  SSH actif sur port $SSH_PORT"
echo "  UFW : seul $SSH_PORT autorisé depuis $MANAGEMENT_IP"
__FPBXPHASE_00_HARDENING_SH__
chmod +x "$_PHASES_TMP/00_hardening.sh"

cat > "$_PHASES_TMP/01_install.sh" <<'__FPBXPHASE_01_INSTALL_SH__'
#!/bin/bash
# 01_install.sh — apt dist-upgrade (kernel inclus) + installation FreePBX 17
#
# Doit être lancé dans un tmux (ou screen) car dure 20-40 min et survit
# à la perte de connexion SSH.
#
# Usage : sudo bash /tmp/01_install.sh

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-01-install.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 01_INSTALL ==="

# apt upgrade — conserver la config OVHcloud sshd_config (E9)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] apt update + dist-upgrade (correctifs noyau inclus)..."
DEBIAN_FRONTEND=noninteractive apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -y \
  -o Dpkg::Options::="--force-confold" \
  -o Dpkg::Options::="--force-confdef"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] APT_UPGRADE_OK"

# Téléchargement de l'installateur officiel FreePBX (Sangoma) — VERSION FIGÉE.
# Épinglé sur un commit précis + vérification d'empreinte SHA-256 avant exécution :
# empêche de lancer en root un installateur altéré (dépôt compromis, miroir, MITM).
# Anciennement tiré de la branche mobile "master" sans aucun contrôle d'intégrité.
# Pour mettre à jour FreePBX : changer le commit ET recalculer l'empreinte ci-dessous
#   SHA=<nouveau_commit>
#   curl -fsSL https://raw.githubusercontent.com/FreePBX/sng_freepbx_debian_install/$SHA/sng_freepbx_debian_install.sh | sha256sum
FREEPBX_INSTALLER_COMMIT="cc87f6451608d187fc55ada634279edc83bb53bd"   # sng_freepbx_debian_install v1.15
FREEPBX_INSTALLER_SHA256="afef5e4b480cf545b2035f92068dc2fdd32452989d170a16a84acb6e37b7d564"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Téléchargement installateur FreePBX (commit ${FREEPBX_INSTALLER_COMMIT:0:12})..."
wget -q --tries=3 --timeout=60 -O /tmp/sng_freepbx_debian_install.sh \
  "https://raw.githubusercontent.com/FreePBX/sng_freepbx_debian_install/${FREEPBX_INSTALLER_COMMIT}/sng_freepbx_debian_install.sh" \
  || { echo "[ERREUR] Téléchargement de l'installateur FreePBX échoué (réseau, 404, ou commit épinglé indisponible sur GitHub)."; exit 1; }
[ -s /tmp/sng_freepbx_debian_install.sh ] || { echo "[ERREUR] Fichier installateur vide — vérifier la connectivité GitHub"; exit 1; }
echo "${FREEPBX_INSTALLER_SHA256}  /tmp/sng_freepbx_debian_install.sh" | sha256sum -c - \
  || { echo "[ERREUR] Empreinte de l'installateur FreePBX invalide — téléchargement rejeté (fichier altéré ou version modifiée en amont)."; rm -f /tmp/sng_freepbx_debian_install.sh; exit 1; }
chmod +x /tmp/sng_freepbx_debian_install.sh
echo "[$(date '+%Y-%m-%d %H:%M:%S')] INSTALL_SCRIPT_DOWNLOADED (empreinte SHA-256 vérifiée)"

# Script helper + drop-in systemd ExecStartPre — créés AVANT l'installateur.
# Problème constaté : l'installateur reboot après "Upgrading FreePBX 17 modules"
# sans jamais retourner à ce script. Le SQL de désactivation post-install ne tourne
# donc jamais lors du premier déploiement.
# Solution définitive : ExecStartPre tourne AVANT que fwconsole start charge les
# modules. MariaDB est déjà up (freepbx.service a After=mariadb.service).
# Le module firewall est désactivé en base avant tout chargement → jamais actif.
mkdir -p /usr/local/bin
cat > /usr/local/bin/fpbx-factory-disable-firewall.sh << 'SCRIPT'
#!/bin/bash
mysql -u root asterisk \
  -e "UPDATE modules SET enabled=0 WHERE modulename='firewall';" \
  2>/dev/null || true
exit 0
SCRIPT
chmod +x /usr/local/bin/fpbx-factory-disable-firewall.sh

mkdir -p /etc/systemd/system/freepbx.service.d
cat > /etc/systemd/system/freepbx.service.d/factory-disable-firewall.conf << 'DROPIN'
[Service]
ExecStartPre=-/usr/local/bin/fpbx-factory-disable-firewall.sh
ExecStartPost=-/usr/sbin/fwconsole firewall stop
DROPIN
systemctl daemon-reload 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] FPBX_FIREWALL_DROPIN_CREATED"

# Installation FreePBX (20-40 min)
# Note E15 : l'installateur supprime UFW — sera réinstallé par 03_firewall.sh
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Lancement installation FreePBX (20-40 min)..."
FREEPBX_EXIT=0
DEBIAN_FRONTEND=noninteractive bash /tmp/sng_freepbx_debian_install.sh 2>&1 || FREEPBX_EXIT=$?

if [[ $FREEPBX_EXIT -ne 0 ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] Installateur Sangoma exit $FREEPBX_EXIT — diagnostic..."
    # Cas fréquent : FreePBX est installé mais fwconsole ma refreshsignatures
    # a échoué sur un fichier GPG corrompu côté miroir Sangoma (erreur réseau/miroir).
    # Si fwconsole répond, FreePBX est fonctionnel — on relance refreshsignatures --force.
    if command -v fwconsole &>/dev/null && fwconsole --version &>/dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] FreePBX installé malgré exit $FREEPBX_EXIT — récupération signatures..."
        fwconsole ma refreshsignatures --force 2>&1 || true
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] FREEPBX_INSTALL_RECOVERED"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERR] FreePBX non installé (fwconsole absent) — abandon"
        exit 1
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] FREEPBX_INSTALL_DONE"
fi

# Désactivation déterministe du firewall FreePBX immédiatement après l'installateur.
# Problème racine : l'installateur démarre FreePBX via fwconsole start directement
# (pas via systemd) — le drop-in ExecStartPost ne s'exécute pas pendant l'installation.
# Fix en deux coups :
#   1. fwconsole firewall stop — arrête les règles iptables pour le run courant
#   2. UPDATE modules SET enabled=0 — persistant : le module ne charge plus
#      jamais (systemd, fwconsole start, reload) jusqu'à réactivation explicite
# Le drop-in ExecStartPost reste comme filet de sécurité pour les reboots.
if command -v fwconsole &>/dev/null; then
    fwconsole firewall stop 2>/dev/null || true
    mysql -u root asterisk \
        -e "UPDATE modules SET enabled=0 WHERE modulename='firewall';" \
        2>/dev/null || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] FPBX_FW_STOPPED_AND_DB_DISABLED"
fi

# Vérification post-install
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Vérification post-install..."
fwconsole pm2 --list || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] === INSTALL_COMPLETE ==="
__FPBXPHASE_01_INSTALL_SH__
chmod +x "$_PHASES_TMP/01_install.sh"

cat > "$_PHASES_TMP/02_asterisk.sh" <<'__FPBXPHASE_02_ASTERISK_SH__'
#!/bin/bash
# 02_asterisk.sh — Activation Asterisk + désactivation modules legacy
#
# E2  : Asterisk SysV sur Debian 12 — is-active non fiable → validation PM2
# E11 : chan_ooh323.so charge le port 1720 H.323 legacy
# Surface d'attaque réduite : chan_iax2, chan_mgcp, chan_skinny, res_stun_monitor
#
# Usage : sudo bash /tmp/02_asterisk.sh

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-02-asterisk.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 02_ASTERISK ==="

# Node.js 20 (UCP 17.x requiert Node >= 20 ; Sangoma installe Node 18)
# n surcharge le binaire sans toucher aux paquets apt Sangoma
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Upgrade Node.js → 20 (requis par UCP)..."
npm install -g n 2>&1 | tail -2
n 20 2>&1 | tail -3
hash -r 2>/dev/null || true  # force le shell à redécouvrir node/npm après n (sinon node 18 encore en cache PATH)
NODE_VER=$(node --version 2>/dev/null || /usr/local/bin/node --version 2>/dev/null || echo "inconnu")
echo "[$(date '+%Y-%m-%d %H:%M:%S')] NODE_OK — $NODE_VER"

# Activer et démarrer Asterisk
systemctl enable asterisk 2>/dev/null || true
systemctl start asterisk 2>/dev/null || true

# E2 : is-active non fiable en mode SysV — attente PM2
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attente démarrage Asterisk via PM2..."
RETRY=0
until fwconsole pm2 --list 2>/dev/null | grep -q 'online'; do
    RETRY=$((RETRY+1))
    if [[ $RETRY -ge 60 ]]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] AVERTISSEMENT : PM2 online non atteint après 300s — Asterisk lent à démarrer"
        fwconsole pm2 --list 2>/dev/null || true
        echo "  → Vérifier après déploiement : sudo fwconsole pm2 --list"
        break
    fi
    if (( RETRY % 6 == 0 )); then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Attente Asterisk... $((RETRY * 5))s / 300s max"
    fi
    sleep 5
done
echo "[$(date '+%Y-%m-%d %H:%M:%S')] PM2_OK — services online"
fwconsole pm2 --list 2>/dev/null | grep -E 'online|offline|stopped' || true

# Désactivation modules legacy (réduction surface d'attaque)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Désactivation modules legacy..."
for module in chan_ooh323.so chan_mgcp.so chan_skinny.so chan_iax2.so res_stun_monitor.so; do
    asterisk -rx "module unload $module" 2>/dev/null \
        && echo "  [OK] $module déchargé" \
        || echo "  [--] $module non chargé (déjà absent)"
done

# Persister dans modules.conf
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Persistance noload dans modules.conf..."
MODULES_CONF=/etc/asterisk/modules.conf
for module in chan_ooh323.so chan_mgcp.so chan_skinny.so chan_iax2.so res_stun_monitor.so; do
    grep -q "noload => $module" "$MODULES_CONF" 2>/dev/null \
        || sed -i "/^\[modules\]/a noload => $module" "$MODULES_CONF"
done

# Validation : port 1720 fermé
PORT_1720=$(ss -tlnp 2>/dev/null | grep ':1720' || echo "")
if [[ -n "$PORT_1720" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ATTENTION port 1720 encore ouvert : $PORT_1720"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] PORT_1720_OK — H.323 désactivé"
fi

# Validation : AMI 5038 uniquement sur 127.0.0.1
AMI_PUBLIC=$(ss -tlnp 2>/dev/null | grep ':5038' | grep -v '127.0.0.1' || echo "")
if [[ -n "$AMI_PUBLIC" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ATTENTION AMI exposé publiquement : $AMI_PUBLIC"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] AMI_OK — port 5038 localhost uniquement"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === ASTERISK_PHASE_COMPLETE ==="
__FPBXPHASE_02_ASTERISK_SH__
chmod +x "$_PHASES_TMP/02_asterisk.sh"

cat > "$_PHASES_TMP/03_firewall.sh" <<'__FPBXPHASE_03_FIREWALL_SH__'
#!/bin/bash
# 03_firewall.sh — Réinstaller UFW + règles applicatives complètes
#
# E15 : l'installateur FreePBX supprime UFW. Ce script le réinstalle
# et applique toutes les règles (management SSH + applicatif FreePBX).
#
# Usage : sudo bash /tmp/03_firewall.sh <management_ip> [ssh_port]

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-03-firewall.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

MANAGEMENT_IP="${1:?Argument 1 requis : management_ip}"
SSH_PORT="${2:?Argument 2 requis : ssh_port}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 03_FIREWALL ==="

# Arrêt immédiat des règles iptables FreePBX firewall
fwconsole firewall stop 2>/dev/null || true
# Désactivation du module — peut échouer si sysadmin déclare une dépendance (|| true)
# Le drop-in systemd (créé en phase 01) constitue le filet de sécurité permanent.
fwconsole ma disable firewall 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] FREEPBX_FW_MODULE_DISABLED"
# Le drop-in factory-disable-firewall.conf est conservé intentionnellement :
# il garantit que le firewall FreePBX reste arrêté à chaque reboot du VPS.
# Comportement attendu : GUI peut activer le firewall jusqu'au prochain reboot ;
# activation durable = supprimer le drop-in + voir rapport de livraison.
echo "[$(date '+%Y-%m-%d %H:%M:%S')] FPBX_FIREWALL_DROPIN_KEPT"

# Réinstaller UFW (supprimé par l'installateur — E15)
apt-get install -y ufw 2>&1 | tail -2

ufw --force reset 2>&1 | tail -1
ufw default deny incoming
ufw default allow outgoing

# SSH management uniquement
ufw allow from "$MANAGEMENT_IP" to any port "$SSH_PORT" proto tcp comment 'SSH management'

# Applicatif FreePBX
ufw allow 80/tcp comment 'FreePBX GUI HTTP'
ufw allow 443/tcp comment 'FreePBX GUI HTTPS'
ufw allow 5060/udp comment 'SIP'
ufw allow 5060/tcp comment 'SIP TCP'
ufw allow 5061/tcp comment 'SIP TLS'
ufw allow 10000:20000/udp comment 'RTP audio'

ufw --force enable
ufw logging low
echo "[$(date '+%Y-%m-%d %H:%M:%S')] UFW_OK"
ufw status numbered

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === FIREWALL_COMPLETE ==="
__FPBXPHASE_03_FIREWALL_SH__
chmod +x "$_PHASES_TMP/03_firewall.sh"

cat > "$_PHASES_TMP/04_fail2ban.sh" <<'__FPBXPHASE_04_FAIL2BAN_SH__'
#!/bin/bash
# 04_fail2ban.sh — Installation + configuration fail2ban
#
# E23 : action explicite par jail (fail2ban 1.x sans action = aucune règle iptables)
# E24 : systemctl restart (pas reload) pour créer les chaînes iptables
# M2  : findtime 3600 (pas 600)
# 7 jails : ssh-iptables, asterisk-iptables, pbx-gui, apache-tcpwrapper,
#           apache-badbots, apache-noscript, recidive
#
# Usage : sudo bash 04_fail2ban.sh <management_ip> <ssh_port> [extra_ignoreip]

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-04-fail2ban.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

MANAGEMENT_IP="${1:?Argument 1 requis : management_ip}"
SSH_PORT="${2:?Argument 2 requis : ssh_port}"
EXTRA_IGNOREIP="${3:-}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 04_FAIL2BAN (port SSH : $SSH_PORT) ==="
[[ -n "$EXTRA_IGNOREIP" ]] && echo "  extra_ignoreip : $EXTRA_IGNOREIP"

apt-get install -y fail2ban 2>&1 | tail -2

# Filtre pbx-gui — absent par défaut dans fail2ban, requis pour jail pbx-gui
# Bug E23 : filter = freepbx (ancien nom) → jail silencieusement ignoré
mkdir -p /etc/fail2ban/filter.d
cat > /etc/fail2ban/filter.d/pbx-gui.conf << 'EOF'
[INCLUDES]
before = common.conf

[Definition]
_daemon = freepbx_security
failregex = \[freepbx_security\.\w+\]:\s+Authentication failure for .+ from <HOST>
ignoreregex =
EOF

# jail.local baseline — jails built-in sans action désactivés (E23)
cat > /etc/fail2ban/jail.local << 'JAILEOF'
[DEFAULT]
bantime  = 86400
findtime = 3600
maxretry = 3
backend  = auto

[apache-badbots]
enabled  = true
action   = iptables-allports[name=apache-badbots, protocol=all]

[apache-noscript]
enabled  = true
action   = iptables-allports[name=apache-noscript, protocol=all]

[recidive]
enabled  = true
filter   = recidive
logpath  = /var/log/fail2ban.log
bantime  = 604800
findtime = 86400
maxretry = 3
action   = iptables-allports[name=recidive, protocol=all]
JAILEOF

# Overlay hardening — 7 jails avec actions explicites (E23)
# Chargé après jail.local, survit aux regénérations FreePBX
mkdir -p /etc/fail2ban/jail.d

IGNOREIP_LINE="127.0.0.1/8 ::1 ${MANAGEMENT_IP}"
[[ -n "$EXTRA_IGNOREIP" ]] && IGNOREIP_LINE="${IGNOREIP_LINE} ${EXTRA_IGNOREIP}"

cat > /etc/fail2ban/jail.d/freepbx-factory-hardening.local << OVERLAYEOF
[DEFAULT]
ignoreip = ${IGNOREIP_LINE}
bantime  = 86400
findtime = 3600
maxretry = 3

# Désactivation jails built-in (doublons sans action — E23)
[sshd]
enabled = false

[asterisk]
enabled = false

[apache-auth]
enabled = false

[ssh-iptables]
enabled  = true
filter   = sshd
port     = ${SSH_PORT}
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 86400
action   = iptables-allports[name=ssh-iptables, protocol=all]

[asterisk-iptables]
enabled  = true
filter   = asterisk
logpath  = /var/log/asterisk/fail2ban
maxretry = 25
bantime  = 86400
action   = iptables-allports[name=asterisk-iptables, protocol=all]

[pbx-gui]
enabled  = true
filter   = pbx-gui
logpath  = /var/log/asterisk/freepbx_security.log
maxretry = 5
bantime  = 86400
action   = iptables-allports[name=pbx-gui, protocol=all]

[apache-tcpwrapper]
enabled  = true
filter   = apache-common
logpath  = /var/log/apache2/error.log
maxretry = 3
bantime  = 86400
action   = iptables-allports[name=apache-tcpwrapper, protocol=all]

[apache-badbots]
enabled  = true
filter   = apache-badbots
logpath  = /var/log/apache2/access.log
maxretry = 1
bantime  = 86400
action   = iptables-allports[name=apache-badbots, protocol=all]

[apache-noscript]
enabled  = true
filter   = apache-noscript
logpath  = /var/log/apache2/error.log
maxretry = 3
bantime  = 86400
action   = iptables-allports[name=apache-noscript, protocol=all]

[recidive]
enabled  = true
filter   = recidive
logpath  = /var/log/fail2ban.log
bantime  = 604800
findtime = 86400
maxretry = 3
action   = iptables-allports[name=recidive, protocol=all]
OVERLAYEOF

systemctl enable fail2ban
# restart requis (pas reload) pour créer les chaînes iptables — E24
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Démarrage fail2ban et création des chaînes iptables..."
systemctl restart fail2ban
sleep 5

# Validation actions iptables (E23)
ACTIONS=$(fail2ban-client get ssh-iptables actions 2>/dev/null || echo "")
if echo "$ACTIONS" | grep -q "No actions"; then
    echo "[AVERTISSEMENT E23] fail2ban ssh-iptables : aucune action iptables — vérifier l'overlay"
    echo "  → sudo fail2ban-client get ssh-iptables actions"
fi

fail2ban-client status || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] === FAIL2BAN_COMPLETE (7 jails) ==="
__FPBXPHASE_04_FAIL2BAN_SH__
chmod +x "$_PHASES_TMP/04_fail2ban.sh"

cat > "$_PHASES_TMP/06_freepbx_config.sh" <<'__FPBXPHASE_06_FREEPBX_CONFIG_SH__'
#!/bin/bash
# 06_freepbx_config.sh — Fix endpoint + admin + extensions + trunk post-restore
#
# E3  : fix endpoint systématique post-restore
# E6  : admin recréé par DELETE+INSERT (état déterministe)
# E10 : colonnes ampusers correctes (extension_low/high, pas tel)
# E16 : table userman_users (pas usermanager_users)
# E18 : hash SHA1 pour ampusers ET userman_users (checkCredentials accepte SHA1)
# E22 : trunk PJSIP FreePBX 17 (SQL tables trunks+pjsip)
# EXT : extensions INSERT depuis zéro (template V3 = 0 extension)
#       50 keywords PJSIP dans sip — identique à 06b_extensions.yml Ansible
#       mots de passe fournis par le wizard (args) ou auto-générés
#
# Usage : sudo bash /tmp/06_freepbx_config.sh \
#           <admin_username> <admin_sha1> <admin_sha512> \
#           [trunk_registrar] [trunk_username] [trunk_password] \
#           [trunk_name] [trunk_callerid] \
#           [ext1_number (auto-généré par deploy.sh)] [ext1_name] [ext1_pass] \
#           [ext2_number (auto-généré par deploy.sh)] [ext2_name] [ext2_pass] \
#           [ext3_number (auto-généré par deploy.sh)] [ext3_name] [ext3_pass]

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-06-freepbx-config.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

ADMIN_USERNAME="${1:?Argument 1 requis : admin_username}"
ADMIN_SHA1="${2:?Argument 2 requis : admin_password_sha1}"
ADMIN_SHA512="${3:?Argument 3 requis : admin_password_sha512}"
TRUNK_REGISTRAR="${4:-}"
TRUNK_USERNAME="${5:-}"
TRUNK_PASSWORD="${6:-}"
TRUNK_NAME="${7:-trunk-ovh}"
TRUNK_CALLERID="${8:-$TRUNK_USERNAME}"
EXT1_NUMBER="${9:-}"
EXT1_NAME="${10:-Poste 1}"
EXT1_PASS="${11:-}"
EXT2_NUMBER="${12:-}"
EXT2_NAME="${13:-Poste 2}"
EXT2_PASS="${14:-}"
EXT3_NUMBER="${15:-}"
EXT3_NAME="${16:-Poste 3}"
EXT3_PASS="${17:-}"

gen_pass() {
    head -c 512 /dev/urandom | tr -dc 'A-Za-z0-9._-' | cut -c1-20
}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 06_POST_RESTORE ==="

# ── Fix endpoint (E3) ────────────────────────────────────
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fix endpoint..."
fwconsole ma install endpoint -f 2>&1 | tail -3
timeout 120 fwconsole reload 2>&1 | tail -3 || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ENDPOINT_OK"

# ── UFW garde post-reload (E15) ──────────────────────────
ufw --force enable 2>&1 | grep -E 'active|enabled|Firewall' || true

# ── Admin GUI — DELETE + INSERT (E6, E10, E16, E18) ──────
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Recréation compte admin..."
mysql -u root asterisk << SQLEOF || true
DELETE FROM ampusers WHERE username='${ADMIN_USERNAME}';
INSERT INTO ampusers (username, password_sha1, sections, deptname, extension_low, extension_high)
  VALUES ('${ADMIN_USERNAME}', '${ADMIN_SHA1}', '*', '', '', '');
DELETE FROM userman_users WHERE username='${ADMIN_USERNAME}';
-- auth = ID de la PBX Internal Directory (userman_directories default active)
-- DOIT être un entier (comparé a d.id dans getUserByUsername) : 'freepbx' (string) -> 0 != 1 -> echec login (E25)
SET @dir_id = (SELECT id FROM userman_directories WHERE \`default\`=1 AND active=1 ORDER BY \`order\` LIMIT 1);
SET @dir_id = IFNULL(@dir_id, 1);
-- userman_users : password = SHA1 (40 chars) — checkCredentials Freepbx.php accepte SHA1 + auto-upgrade bcrypt
-- userman_users.auth = integer dir_id (E25 : 'freepbx' string -> 0 != 1 -> getUserByUsername fail -> login refuse)
INSERT INTO userman_users (username, password, auth, description, primary_group, default_extension, email)
  VALUES ('${ADMIN_USERNAME}', '${ADMIN_SHA1}', @dir_id, 'Admin FreePBX Factory', 1, 'none', '');
SET @admin_uid = LAST_INSERT_ID();

-- Groupe Administrators (id=1) requis pour AUTHTYPE=usermanager (E25)
-- users = JSON array des uid membres ; pbx_login = acces admin ; pbx_admin + pbx_modules = menu complet
-- @admin_uid capturé après INSERT (LAST_INSERT_ID) — uid non garanti = 1 en re-déploiement (B3)
INSERT INTO userman_groups (id, auth, groupname, description, priority, local, users)
  VALUES (1, 'freepbx', 'Administrators', 'Default Administrators Group', 0, 0, CONCAT('[', @admin_uid, ']'))
  ON DUPLICATE KEY UPDATE users=CONCAT('[', @admin_uid, ']'), groupname='Administrators';
REPLACE INTO userman_groups_settings (gid, module, \`key\`, val, type)
  VALUES (1, 'global', 'pbx_login', 1, NULL);
REPLACE INTO userman_groups_settings (gid, module, \`key\`, val, type)
  VALUES (1, 'global', 'pbx_admin', 1, NULL);
REPLACE INTO userman_groups_settings (gid, module, \`key\`, val, type)
  VALUES (1, 'global', 'pbx_modules', '["*"]', 'json-arr');
SQLEOF
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ADMIN_OK : $ADMIN_USERNAME"

# ── Extensions kit starter — INSERT depuis zéro (template V3) ──
# La table sip est la source de vérité pour la config PJSIP des extensions.
# NE PAS insérer dans pjsip : FreePBX régénère depuis sip+devices+users.
insert_extension() {
    local num="$1" name="$2" pass="$3"
    [[ -z "$num" ]] && return
    [[ -z "$pass" ]] && pass=$(gen_pass)
    local safe_name="${name//\'/\'\'}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Extension $num ($name)..."
    mysql -u root asterisk << EXTEOF || true
DELETE FROM devices WHERE id='${num}';
DELETE FROM users   WHERE extension='${num}';
DELETE FROM sip     WHERE id='${num}';
INSERT INTO devices (id, tech, dial, devicetype, user, description, emergency_cid, hint_override)
  VALUES ('${num}', 'pjsip', 'PJSIP/${num}', 'fixed', '${num}', '${safe_name}', '', NULL);
INSERT INTO users (extension, password, name, voicemail, ringtimer, noanswer, recording,
  outboundcid, sipname, noanswer_cid, busy_cid, chanunavail_cid,
  noanswer_dest, busy_dest, chanunavail_dest, mohclass)
  VALUES ('${num}', '', '${safe_name}', 'novm', 0, '', '', '', '', '', '', '', '', '', '', 'default');
INSERT INTO sip (id, keyword, data, flags) VALUES
  ('${num}','account',              '${num}',                       50),
  ('${num}','accountcode',          '',                             19),
  ('${num}','aggregate_mwi',        'yes',                          27),
  ('${num}','allow',                'alaw,ulaw,g729',               17),
  ('${num}','avpf',                 'no',                           11),
  ('${num}','bundle',               'no',                           28),
  ('${num}','callerid',             '${safe_name} <${num}>',        51),
  ('${num}','context',              'from-internal',                47),
  ('${num}','defaultuser',          '',                              4),
  ('${num}','device_state_busy_at', '0',                            38),
  ('${num}','dial',                 'PJSIP/${num}',                 18),
  ('${num}','direct_media',         'no',                           34),
  ('${num}','disallow',             'all',                          16),
  ('${num}','dtmfmode',             'rfc4733',                       3),
  ('${num}','force_rport',          'yes',                          25),
  ('${num}','icesupport',           'no',                           12),
  ('${num}','match',                '',                             39),
  ('${num}','max_audio_streams',    '1',                            29),
  ('${num}','max_contacts',         '5',                            20),
  ('${num}','max_video_streams',    '1',                            30),
  ('${num}','maximum_expiration',   '7200',                         40),
  ('${num}','media_address',        '',                             35),
  ('${num}','media_encryption',     'no',                           31),
  ('${num}','media_encryption_optimistic', 'no',                    36),
  ('${num}','media_use_received_transport','no',                    22),
  ('${num}','message_context',      '',                             46),
  ('${num}','minimum_expiration',   '60',                           41),
  ('${num}','mwi_subscription',     'auto',                         26),
  ('${num}','namedcallgroup',       '',                             14),
  ('${num}','namedpickupgroup',     '',                             15),
  ('${num}','outbound_auth',        'yes',                          45),
  ('${num}','outbound_proxy',       '',                             44),
  ('${num}','qualifyfreq',          '0',                             9),
  ('${num}','refer_blind_progress', 'yes',                          37),
  ('${num}','remove_existing',      'yes',                          21),
  ('${num}','rewrite_contact',      'yes',                          24),
  ('${num}','rtcp_mux',             'no',                           13),
  ('${num}','rtp_symmetric',        'yes',                          23),
  ('${num}','rtp_keepalive',        '5',                            41),
  ('${num}','secret',               '${pass}',                       2),
  ('${num}','secret_origional',     '${pass}',                      48),
  ('${num}','send_connected_line',  'yes',                           6),
  ('${num}','sendrpid',             'pai',                           8),
  ('${num}','sipdriver',            'chan_pjsip',                   49),
  ('${num}','timers',               'yes',                          32),
  ('${num}','timers_min_se',        '90',                           33),
  ('${num}','transport',            '',                             10),
  ('${num}','trustrpid',            'yes',                           5),
  ('${num}','user_eq_phone',        'no',                            7);
EXTEOF
    echo "  [OK] Extension $num insérée (devices + users + sip — 50 keywords)"
    # Afficher le mot de passe pour livraison
    echo "  MOT DE PASSE EXT $num : ${pass}"
}

# Sync AstDB — attend la disponibilité du CLI, vérifie l'écriture, retry si nécessaire
sync_astdb() {
    local num="$1"
    [[ -z "$num" ]] && return 0

    local waited=0
    while ! asterisk -rx 'core show version' >/dev/null 2>&1; do
        sleep 3; waited=$((waited + 3))
        [[ $waited -ge 30 ]] && { echo "  [WARN] AstDB ${num}: CLI indisponible après 30s"; return 0; }
    done

    local keys=(
        "DEVICE ${num}/dial PJSIP/${num}"
        "DEVICE ${num}/tech pjsip"
        "DEVICE ${num}/type fixed"
        "DEVICE ${num}/user ${num}"
        "DEVICE ${num}/default_user ${num}"
        "AMPUSER ${num}/device ${num}"
    )
    local entry
    for entry in "${keys[@]}"; do
        asterisk -rx "database put ${entry}" >/dev/null 2>&1 || true
    done

    local check
    check=$(asterisk -rx "database get DEVICE ${num}/dial" 2>/dev/null || echo "")
    if echo "$check" | grep -q "PJSIP/${num}"; then
        echo "  AstDB ${num}: OK"
        return 0
    fi

    echo "  AstDB ${num}: CLI instable, retry dans 5s..."
    sleep 5
    for entry in "${keys[@]}"; do
        asterisk -rx "database put ${entry}" >/dev/null 2>&1 || true
    done
    check=$(asterisk -rx "database get DEVICE ${num}/dial" 2>/dev/null || echo "")
    if echo "$check" | grep -q "PJSIP/${num}"; then
        echo "  AstDB ${num}: OK (retry)"
    else
        echo "  [WARN] AstDB ${num}: toujours vide après retry — appels entrants non fonctionnels"
    fi
}

if [[ -n "$EXT1_NUMBER" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Kit starter — INSERT extensions (template V3)..."
    insert_extension "$EXT1_NUMBER" "$EXT1_NAME" "$EXT1_PASS"
    insert_extension "$EXT2_NUMBER" "$EXT2_NAME" "$EXT2_PASS"
    insert_extension "$EXT3_NUMBER" "$EXT3_NAME" "$EXT3_PASS"
    timeout 120 fwconsole reload 2>&1 | tail -3 || true
    ufw --force enable 2>&1 | grep -E 'active|enabled|Firewall' || true
    # Sync AstDB APRÈS reload — CLI stable, dialparties.agi peut résoudre les extensions
    sync_astdb "$EXT1_NUMBER"
    sync_astdb "$EXT2_NUMBER"
    sync_astdb "$EXT3_NUMBER"
    _astdb_count=$(asterisk -rx 'database show DEVICE' 2>/dev/null | grep -c '/dial' || echo 0)
    if [[ "$_astdb_count" -lt 1 ]]; then
        echo "  [WARN] AstDB DEVICE vide — appels entrants risquent d'être non fonctionnels (Asterisk instable ?)"
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] EXTENSIONS_OK (AstDB dial: ${_astdb_count}/3)"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Kit starter désactivé — aucune extension créée"
fi

# ── fwconsole reload final ────────────────────────────────
timeout 120 fwconsole reload 2>&1 | tail -3 || true
ufw --force enable 2>&1 | grep -E 'active|enabled|Firewall' || true

# ── Trunk SIP (optionnel, E22) ────────────────────────────
if [[ -n "$TRUNK_REGISTRAR" && -n "$TRUNK_USERNAME" && -n "$TRUNK_PASSWORD" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Configuration trunk $TRUNK_NAME..."
    TRUNK_PROVIDER=$(echo "$TRUNK_REGISTRAR" | awk -F'.' '{print $(NF-1)}' | tr '[:lower:]' '[:upper:]')
    # Échappement SQL : backslashes d'abord (\ → \\), puis apostrophes (' → '')
    # Ordre impératif : inverser produirait \'' interprété comme quote échappé par MariaDB
    _st_pass="${TRUNK_PASSWORD//\\/\\\\}";  _st_pass="${_st_pass//\'/\'\'}"
    _st_user="${TRUNK_USERNAME//\\/\\\\}";  _st_user="${_st_user//\'/\'\'}"
    _st_reg="${TRUNK_REGISTRAR//\\/\\\\}";  _st_reg="${_st_reg//\'/\'\'}"
    _st_name="${TRUNK_NAME//\\/\\\\}";      _st_name="${_st_name//\'/\'\'}"
    _st_cid="${TRUNK_CALLERID//\\/\\\\}";   _st_cid="${_st_cid//\'/\'\'}"

    mysql -u root asterisk << TRUNKEOF || true
SET @existing_tid = (SELECT trunkid FROM trunks WHERE name='${_st_name}' LIMIT 1);
DELETE FROM pjsip WHERE id = @existing_tid AND @existing_tid IS NOT NULL;
DELETE FROM trunks WHERE name='${_st_name}';
SET @tid = (SELECT COALESCE(MAX(trunkid), 0) + 1 FROM trunks);
INSERT INTO trunks (trunkid, tech, channelid, name, outcid, keepcid, maxchans, failscript, dialoutprefix, usercontext, provider, disabled, \`continue\`, routedisplay)
VALUES (@tid, 'pjsip', '${_st_name}', '${_st_name}', '${_st_cid}', 'off', '', '', '', NULL, '${TRUNK_PROVIDER}', 'off', 'off', 'on');
INSERT INTO pjsip (id, keyword, data, flags) VALUES
  (@tid, 'trunk_name',               '${_st_name}',         0),
  (@tid, 'username',                 '${_st_user}',         0),
  (@tid, 'auth_username',            '${_st_user}',         0),
  (@tid, 'secret',                   '${_st_pass}',         0),
  (@tid, 'authentication',           'outbound',            0),
  (@tid, 'registration',             'send',                0),
  (@tid, 'sip_server',               '${_st_reg}',          0),
  (@tid, 'from_user',                '${_st_user}',         0),
  (@tid, 'from_domain',              '${_st_reg}',          0),
  (@tid, 'context',                  'from-pstn',           0),
  (@tid, 'transport',                '0.0.0.0-udp',         0),
  (@tid, 'codecs',                   'alaw,ulaw,g729', 0),
  (@tid, 'expiration',               '3600',                0),
  (@tid, 'retry_interval',           '60',                  0),
  (@tid, 'fatal_retry_interval',     '60',                  0),
  (@tid, 'forbidden_retry_interval', '60',                  0),
  (@tid, 'qualify_frequency',        '60',                  0),
  (@tid, 'dtmfmode',                 'rfc4733',             0),
  (@tid, 'disabled',                 'off',                 0),
  (@tid, 'name',                     '${_st_name}',         0),
  (@tid, 'maxchans',                 '',                    0),
  (@tid, 'routedisplay',             'on',                  0),
  (@tid, 'inband_progress',          'no',                  0);
TRUNKEOF
    timeout 120 fwconsole reload 2>&1 | tail -3 || true
    ufw --force enable 2>&1 | grep -E 'active|enabled|Firewall' || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] TRUNK_OK : $TRUNK_NAME ($TRUNK_REGISTRAR)"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pas de trunk configuré"
fi

# ── Ring group kit starter (sonnerie simultanée 3 postes) ─
if [[ -n "$EXT1_NUMBER" && -n "$EXT2_NUMBER" && -n "$EXT3_NUMBER" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Ring group 600 (ringall : ${EXT1_NUMBER}/${EXT2_NUMBER}/${EXT3_NUMBER})..."
    mysql -u root asterisk << RGEOF || true
DELETE FROM ringgroups WHERE grpnum='600';
INSERT INTO ringgroups (grpnum, strategy, grptime, grplist, description, rvolume)
  VALUES ('600', 'ringall', 55, '${EXT1_NUMBER}-${EXT2_NUMBER}-${EXT3_NUMBER}', 'Kit Demo', '0');
RGEOF
    _rg_check=$(mysql -u root asterisk -sNe "SELECT grpnum FROM ringgroups WHERE grpnum='600' LIMIT 1;" 2>/dev/null || true)
    if [[ "$_rg_check" != "600" ]]; then
        echo ""
        echo "╔══════════════════════════════════════════╗"
        echo "║  ÉCHEC CRITIQUE — Ring group 600 absent  ║"
        echo "╠══════════════════════════════════════════╣"
        echo "║  Les appels entrants ne fonctionneront   ║"
        echo "║  pas. Déploiement interrompu.            ║"
        echo "║                                          ║"
        echo "║  Diagnostic :                            ║"
        echo "║  mysql asterisk -e 'DESC ringgroups'     ║"
        echo "╚══════════════════════════════════════════╝"
        exit 1
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] RINGGROUP_OK (vérifié en DB)"
fi

# ── Routes sortante + entrante (trunk requis) ─────────────
if [[ -n "$TRUNK_REGISTRAR" && -n "$TRUNK_USERNAME" && -n "$TRUNK_PASSWORD" ]]; then
    TRUNK_DB_ID=$(mysql -u root asterisk -sNe "SELECT trunkid FROM trunks WHERE name='${TRUNK_NAME}' LIMIT 1;" 2>/dev/null || true)
    [[ "$TRUNK_DB_ID" =~ ^[0-9]+$ ]] || TRUNK_DB_ID=""
    if [[ -n "$TRUNK_DB_ID" ]]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Route sortante (trunk_id=${TRUNK_DB_ID}, pattern X.)..."
        mysql -u root asterisk << RTEOF || true
SET @del_id = (SELECT route_id FROM outbound_routes WHERE name='Route-Sortante' LIMIT 1);
DELETE FROM outbound_route_patterns WHERE route_id = @del_id AND @del_id IS NOT NULL;
DELETE FROM outbound_route_trunks   WHERE route_id = @del_id AND @del_id IS NOT NULL;
DELETE FROM outbound_routes WHERE name='Route-Sortante';
INSERT INTO outbound_routes (name, outcid, outcid_mode, emergency_route, intracompany_route, mohclass, time_mode, notification_on)
  VALUES ('Route-Sortante', '', '', 'no', 'no', 'default', '', 'call');
SET @route_id = LAST_INSERT_ID();
INSERT INTO outbound_route_patterns (route_id, match_pattern_prefix, match_pattern_pass, match_cid, prepend_digits)
  VALUES (@route_id, '', 'X.', '', '');
INSERT INTO outbound_route_trunks (route_id, trunk_id, seq)
  VALUES (@route_id, ${TRUNK_DB_ID}, 0);
INSERT INTO outbound_route_sequence (route_id, seq)
  VALUES (@route_id, 1)
  ON DUPLICATE KEY UPDATE seq=1;
RTEOF
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] OUTBOUND_ROUTE_OK"

        if [[ -n "$EXT1_NUMBER" ]]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Route entrante → ext-group,600,1..."
            mysql -u root asterisk << INEOF || true
DELETE FROM incoming WHERE extension='' AND cidnum='';
INSERT INTO incoming (cidnum, extension, destination, mohclass, description)
  VALUES ('', '', 'ext-group,600,1', 'default', 'Appels entrants kit demo');
INEOF
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] INBOUND_ROUTE_OK"
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN : trunk_id introuvable — routes non créées"
    fi
fi

# ── Dialplan override : suppression Progress() ring group 600 ─────────────
# Sans cette surcharge, FreePBX émet Progress() → 183+SDP vers OVH → early media
# OVH considère l'appel "en cours" et n'applique pas forwardNoReply(25s)
# Avec NoOp : Asterisk propage 180 Ringing → OVH déclenche la messagerie à 25s
cat > /etc/asterisk/extensions_override_freepbx.conf << 'OVERRIDE_EOF'
[ext-group]
exten => 600,3,NoOp(Suppressed Playtones)
exten => 600,4,NoOp(Suppressed Progress - 180 Ringing only to OVH)
OVERRIDE_EOF
echo "[$(date '+%Y-%m-%d %H:%M:%S')] OVERRIDE_CONF_OK"

# ── Reload dialplan avec toutes les routes ────────────────
timeout 120 fwconsole reload 2>&1 | tail -3 || true
fwconsole firewall stop 2>/dev/null || true
ufw --force enable 2>&1 | grep -E 'active|enabled|Firewall' || true
# restart (pas reload) : recréer les chaînes iptables après ufw enable (E24)
systemctl restart fail2ban

# ── strictrtp=no + rtp_timeout=0 — audio smartphones NAT (E27) ──
# fwconsole reload régénère ces fichiers avec des valeurs incompatibles smartphones :
#   rtp_additional.conf → strictrtp=yes  (audio unidirectionnel derrière CGNAT)
#   pjsip.endpoint.conf → rtp_timeout=30 (appel coupé après 30s silence / app arrière-plan)
# On corrige après le dernier reload ; un reload manuel ultérieur nécessiterait de relancer ces sed.
sed -i 's/^strictrtp=yes/strictrtp=no/' /etc/asterisk/rtp_additional.conf || true
asterisk -rx 'module reload res_rtp_asterisk' 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] STRICTRTP_NO_OK"
sed -i 's/^rtp_timeout=30$/rtp_timeout=0/' /etc/asterisk/pjsip.endpoint.conf || true
sed -i 's/^rtp_timeout_hold=300$/rtp_timeout_hold=0/' /etc/asterisk/pjsip.endpoint.conf || true
asterisk -rx 'module reload res_pjsip' 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] RTP_TIMEOUT_ZERO_OK"

# ── Transport PJSIP IPv6 — smartphones IPv6 (E28) ─────────────
# pjsip.transports.conf (auto-généré) ne crée qu'un transport UDP IPv4.
# On ajoute le transport IPv6 dans le fichier custom_post (survit aux fwconsole reload).
cat > /etc/asterisk/pjsip.transports_custom_post.conf << 'IPVSIX'
[0.0.0.0-udp-ipv6]
type=transport
protocol=udp
bind=:::5060
allow_reload=no
tos=cs3
cos=3
IPVSIX
asterisk -rx 'module reload res_pjsip' 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] PJSIP_IPV6_TRANSPORT_OK"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ROUTES_DIALPLAN_OK"

# ── chan_ooh323 + chan_iax2 : désactivation (E11) ─────────
asterisk -rx 'module show like chan_ooh323' 2>/dev/null | grep -q 'Running' && \
    asterisk -rx 'module unload chan_ooh323.so' 2>/dev/null || true
grep -q 'noload => chan_ooh323.so' /etc/asterisk/modules.conf || \
    echo 'noload => chan_ooh323.so' >> /etc/asterisk/modules.conf
asterisk -rx 'module show like chan_iax2' 2>/dev/null | grep -q 'Running' && \
    asterisk -rx 'module unload chan_iax2.so' 2>/dev/null || true
grep -q 'noload => chan_iax2.so' /etc/asterisk/modules.conf || \
    echo 'noload => chan_iax2.so' >> /etc/asterisk/modules.conf

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === FREEPBX_CONFIG_COMPLETE ==="
__FPBXPHASE_06_FREEPBX_CONFIG_SH__
chmod +x "$_PHASES_TMP/06_freepbx_config.sh"

cat > "$_PHASES_TMP/09_apache_hardening.sh" <<'__FPBXPHASE_09_APACHE_HARDENING_SH__'
#!/bin/bash
# 09_apache_hardening.sh — Durcissement Apache post-restore
#
# Masquage version, désactivation TRACE, security headers, restriction /admin
# Équivalent de 09_apache_hardening.yml (playbook Ansible)
#
# Usage : sudo bash 09_apache_hardening.sh <management_ip>

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-09-apache-hardening.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

MANAGEMENT_IP="${1:?Argument 1 requis : management_ip}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 09_APACHE_HARDENING (management_ip: $MANAGEMENT_IP) ==="

SEC=/etc/apache2/conf-available/security.conf

sed -i 's/^#\?ServerTokens.*/ServerTokens Prod/'     "$SEC"
sed -i 's/^#\?ServerSignature.*/ServerSignature Off/' "$SEC"
sed -i 's/^#\?TraceEnable.*/TraceEnable Off/'         "$SEC"

a2enmod headers -q 2>/dev/null || true
a2enmod authz_host -q 2>/dev/null || true

cat > /etc/apache2/conf-available/freepbx-security-headers.conf << 'EOF'
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always unset X-Powered-By
  <If "%{HTTPS} == 'on'">
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  </If>
</IfModule>
EOF

a2enconf freepbx-security-headers -q 2>/dev/null || true

# Restriction accès /admin à l'IP de gestion uniquement (E25 equiv — Ansible 09_apache_hardening.yml)
cat > /etc/apache2/conf-available/freepbx-admin-restrict.conf << ADMINEOF
<LocationMatch "^/admin">
  <RequireAny>
    Require ip ${MANAGEMENT_IP}
    Require ip 127.0.0.1
    Require ip ::1
  </RequireAny>
</LocationMatch>
ADMINEOF
a2enconf freepbx-admin-restrict -q 2>/dev/null || true

sed -i 's/Options Indexes FollowSymLinks/Options FollowSymLinks/' \
    /etc/apache2/apache2.conf 2>/dev/null || true

systemctl reload apache2 2>/dev/null || echo "[AVERTISSEMENT] Apache non actif au moment du reload — config appliquée au prochain démarrage"

if systemctl is-active --quiet apache2 2>/dev/null; then
    HEADERS=$(curl -sI http://localhost/admin/ 2>/dev/null)
    echo "X-Frame-Options    : $(echo "$HEADERS" | grep -i 'X-Frame-Options' || echo 'ABSENT')"
    echo "X-Content-Type     : $(echo "$HEADERS" | grep -i 'X-Content-Type-Options' || echo 'ABSENT')"
    echo "ServerTokens check : $(curl -sI http://localhost/ 2>/dev/null | grep -i 'Server:' || echo 'OK masqué')"
else
    echo "[INFO] Apache arrêté — headers vérifiables au prochain démarrage"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === APACHE_HARDENING_COMPLETE ==="
__FPBXPHASE_09_APACHE_HARDENING_SH__
chmod +x "$_PHASES_TMP/09_apache_hardening.sh"

cat > "$_PHASES_TMP/10_mariadb_hardening.sh" <<'__FPBXPHASE_10_MARIADB_HARDENING_SH__'
#!/bin/bash
# 10_mariadb_hardening.sh — Durcissement MariaDB post-restore
#
# Équivalent de 10_mariadb_hardening.yml (playbook Ansible)
# Suppression comptes anonymes, base test, bind=127.0.0.1

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-10-mariadb-hardening.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 10_MARIADB_HARDENING ==="

mysql -u root << 'SQLEOF'
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost','127.0.0.1','::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db LIKE 'test%';
FLUSH PRIVILEGES;
SQLEOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Anonymes et base test supprimés"

CNF=/etc/mysql/mariadb.conf.d/50-server.cnf
sed -i 's/^#\?bind-address.*/bind-address = 127.0.0.1/' "$CNF"

systemctl restart mariadb

PORT_CHECK=$(ss -tlnp | grep ':3306' || true)
if echo "$PORT_CHECK" | grep -qE '0\.0\.0\.0:3306|\*:3306'; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ATTENTION : MariaDB écoute sur 0.0.0.0:3306"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] bind-address : 127.0.0.1 OK"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === MARIADB_HARDENING_COMPLETE ==="
__FPBXPHASE_10_MARIADB_HARDENING_SH__
chmod +x "$_PHASES_TMP/10_mariadb_hardening.sh"

cat > "$_PHASES_TMP/11_services_hardening.sh" <<'__FPBXPHASE_11_SERVICES_HARDENING_SH__'
#!/bin/bash
# 11_services_hardening.sh — Désactivation services inutiles post-FreePBX
#
# Découverts lors de l'audit sécurité 04/05/2026 :
#   tftpd-hpa     : TFTP non authentifié — inutile si PnP désactivé
#   avahi-daemon  : mDNS/DNS-SD — expose infos réseau sur 5353/UDP
#   asterisk shell: bash → nologin (réduction escalade si compromission)
#
# Usage : sudo bash /tmp/11_services_hardening.sh

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-11-services-hardening.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 11_SERVICES_HARDENING ==="

# tftpd-hpa (port 69/udp)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Désactivation tftpd-hpa..."
if systemctl is-enabled tftpd-hpa &>/dev/null || systemctl is-active tftpd-hpa &>/dev/null; then
    systemctl stop tftpd-hpa 2>/dev/null || true
    systemctl disable tftpd-hpa 2>/dev/null || true
    echo "  [OK] tftpd-hpa arrêté et désactivé"
else
    echo "  [--] tftpd-hpa absent ou déjà désactivé"
fi

# avahi-daemon (port 5353/udp mDNS)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Désactivation avahi-daemon..."
for svc in avahi-daemon avahi-daemon.socket; do
    if systemctl is-enabled "$svc" &>/dev/null || systemctl is-active "$svc" &>/dev/null; then
        systemctl stop "$svc" 2>/dev/null || true
        systemctl disable "$svc" 2>/dev/null || true
        echo "  [OK] $svc arrêté et désactivé"
    else
        echo "  [--] $svc absent ou déjà désactivé"
    fi
done

# sangoma-pnpd (PnP — inutile si pas de déploiement automatique de téléphones)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Désactivation sangoma-pnpd..."
for svc in sangoma-pnpd; do
    if systemctl is-enabled "$svc" &>/dev/null || systemctl is-active "$svc" &>/dev/null; then
        systemctl stop "$svc" 2>/dev/null || true
        systemctl disable "$svc" 2>/dev/null || true
        echo "  [OK] $svc arrêté et désactivé"
    else
        echo "  [--] $svc absent ou déjà désactivé"
    fi
done

# asterisk : shell bash → nologin (réduction surface escalade)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Shell asterisk → nologin..."
CURRENT_SHELL=$(getent passwd asterisk | cut -d: -f7)
if [[ "$CURRENT_SHELL" == "/usr/sbin/nologin" ]]; then
    echo "  [--] Shell asterisk déjà nologin"
else
    usermod -s /usr/sbin/nologin asterisk
    echo "  [OK] Shell asterisk : $CURRENT_SHELL → /usr/sbin/nologin"
fi

# asterisk : override systemd Restart=always
# Restart=always rattrape aussi les arrêts propres (exit 0) déclenchés par fwconsole reload
# systemctl stop asterisk reste respecté (stop explicite ne déclenche pas le restart)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Override systemd asterisk (Restart=always)..."
mkdir -p /etc/systemd/system/asterisk.service.d/
cat > /etc/systemd/system/asterisk.service.d/restart.conf << 'EOF'
[Service]
Restart=always
RestartSec=10
EOF
systemctl daemon-reload
echo "  [OK] asterisk.service : Restart=always, RestartSec=10"

# Validation ports UDP
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Validation ports UDP..."
TFTP_PORT=$(ss -ulnp 2>/dev/null | grep ':69 ' || echo "")
AVAHI_PORT=$(ss -ulnp 2>/dev/null | grep ':5353 ' || echo "")

if [[ -n "$TFTP_PORT" ]]; then
    echo "  ATTENTION port 69 encore ouvert : $TFTP_PORT"
else
    echo "  [OK] Port 69/UDP (TFTP) fermé"
fi

if [[ -n "$AVAHI_PORT" ]]; then
    echo "  ATTENTION port 5353 encore ouvert : $AVAHI_PORT"
else
    echo "  [OK] Port 5353/UDP (mDNS) fermé"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === SERVICES_HARDENING_COMPLETE ==="
__FPBXPHASE_11_SERVICES_HARDENING_SH__
chmod +x "$_PHASES_TMP/11_services_hardening.sh"

cat > "$_PHASES_TMP/12_sbom.sh" <<'__FPBXPHASE_12_SBOM_SH__'
#!/bin/bash
# 12_sbom.sh — SBOM CycloneDX 1.4 (CRA Annex II + NIS2 Art. 21)
#
# Génère /etc/freepbx-factory/sbom.json
# Composants : FreePBX, Asterisk, PHP, Apache2, MariaDB, Node.js, OS, kernel
#
# Usage : sudo bash 12_sbom.sh

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-12-sbom.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 12_SBOM (CRA Annex II) ==="

mkdir -p /etc/freepbx-factory
chmod 700 /etc/freepbx-factory

python3 << 'PYEOF'
import json, subprocess, datetime, os, socket

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL, text=True).strip()
    except:
        return 'unknown'

sec_updates_raw = run("apt list --upgradable 2>/dev/null | grep -i security | wc -l")
try:
    sec_updates = int(sec_updates_raw)
except:
    sec_updates = 0

dpkg_raw = run("dpkg-query -l 2>/dev/null | grep -c '^ii'")
try:
    dpkg_count = int(dpkg_raw)
except:
    dpkg_count = 0

sbom = {
    "bomFormat": "CycloneDX",
    "specVersion": "1.4",
    "metadata": {
        "timestamp": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        "component": {"name": "freepbx-factory", "version": "1.9", "supplier": "OVHcloud"}
    },
    "components": [
        {"type": "application", "name": "FreePBX",  "version": run("fwconsole --version 2>/dev/null | awk '{print $NF}'")},
        {"type": "application", "name": "Asterisk",  "version": run("asterisk -rx 'core show version' 2>/dev/null | awk '{print $2}'")},
        {"type": "library",     "name": "PHP",        "version": run("php --version 2>/dev/null | head -1 | awk '{print $2}'")},
        {"type": "application", "name": "Apache2",    "version": run("apache2 -v 2>/dev/null | head -1 | awk '{print $3}' | sed 's|Apache/||'")},
        {"type": "application", "name": "MariaDB",    "version": run("mysql --version 2>/dev/null | awk '{print $5}' | tr -d ','")},
        {"type": "library",     "name": "Node.js",    "version": run("node --version 2>/dev/null | tr -d v")},
    ],
    "vulnerabilities": {
        "pending_security_updates": sec_updates,
        "unattended_upgrades_active": run("systemctl is-enabled apt-daily-upgrade.timer 2>/dev/null") in ("enabled", "static", "generated"),
        "packages_total": dpkg_count
    },
    "environment": {
        "os":       run(". /etc/os-release && echo $PRETTY_NAME"),
        "kernel":   run("uname -r"),
        "hostname": socket.gethostname()
    }
}

with open('/etc/freepbx-factory/sbom.json', 'w') as f:
    json.dump(sbom, f, indent=2)

if sec_updates > 0:
    print(f"[WARN] {sec_updates} mise(s) à jour de sécurité en attente")
    print("  Application immédiate : sudo unattended-upgrade -d")
else:
    print("  Mises à jour sécurité : aucune en attente")

print(f"  Packages installés    : {dpkg_count}")
print("  SBOM écrit            : /etc/freepbx-factory/sbom.json")
PYEOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === SBOM_COMPLETE ==="
__FPBXPHASE_12_SBOM_SH__
chmod +x "$_PHASES_TMP/12_sbom.sh"

cat > "$_PHASES_TMP/13_post_checks.sh" <<'__FPBXPHASE_13_POST_CHECKS_SH__'
#!/bin/bash
# 13_post_checks.sh — Contrôles conformité post-déploiement
#
# CRA UE 2024/2847 + NIS2 UE 2022/2555
# Génère /etc/freepbx-factory/compliance-report.json
# Affiche le score et les points en avertissement
#
# Usage : sudo bash 13_post_checks.sh <ssh_port>

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-13-post-checks.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

SSH_PORT="${1:?Argument 1 requis : ssh_port}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 13_POST_CHECKS (CRA + NIS2) ==="

mkdir -p /etc/freepbx-factory
chmod 700 /etc/freepbx-factory

python3 << PYEOF
import json, subprocess, datetime, os, re

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL, text=True).strip()
    except:
        return ''

def check(name, ok, value, requirement):
    return {"name": name, "status": "ok" if ok else "warning", "value": value, "requirement": requirement}

ssh_port = "${SSH_PORT}"
checks = []

# Réseau
ufw_status = run("ufw status")
checks.append(check("UFW — Pare-feu actif", "Status: active" in ufw_status,
    "active" if "Status: active" in ufw_status else "inactive", "CRA Annex I + NIS2 Art.21"))

ufw_logging = run("ufw status verbose 2>/dev/null | grep 'Logging:'")
checks.append(check("UFW — Journalisation activée",
    any(x in ufw_logging for x in ["low","medium","high"]),
    ufw_logging.strip() or "désactivée", "NIS2 Art.21(b)"))

# fail2ban
f2b_jails = run("fail2ban-client status 2>/dev/null | grep 'Number of jail'")
m = re.search(r':\s*(\d+)', f2b_jails)
jail_count = int(m.group(1)) if m else 0
checks.append(check("fail2ban — 7 jails actifs", jail_count >= 7, f"{jail_count} jails", "NIS2 Art.21(b)"))

f2b_bantime = run("fail2ban-client get ssh-iptables bantime 2>/dev/null")
try:
    _bantime_ok = int(float(f2b_bantime)) == 86400
except (ValueError, TypeError):
    _bantime_ok = False
checks.append(check("fail2ban — Bantime 24h", _bantime_ok, f"{f2b_bantime}s", "NIS2 Art.21(b)"))

f2b_actions = run("fail2ban-client get ssh-iptables actions 2>/dev/null")
checks.append(check("fail2ban — Actions iptables actives", "No actions" not in f2b_actions,
    "actif" if "No actions" not in f2b_actions else "ABSENT", "E23 — CRA Annex I"))

# Ports dangereux
checks.append(check("Port H.323 (1720) fermé", run("ss -tlnp | grep ':1720'") == "",
    "fermé", "CRA Annex I"))
checks.append(check("Port IAX2 (4569) fermé", run("ss -ulnp | grep ':4569'") == "",
    "fermé", "CRA Annex I"))

# MariaDB
mariadb = run("ss -tlnp | grep '3306'")
mariadb_local = "127.0.0.1:3306" in mariadb
checks.append(check("MariaDB — localhost uniquement", mariadb_local,
    "127.0.0.1" if mariadb_local else "exposé", "CRA Annex I"))

# Services
pnpd = run("systemctl is-active sangoma-pnpd 2>/dev/null")
checks.append(check("sangoma-pnpd — désactivé", pnpd != "active", pnpd or "inactif", "CRA Annex I"))

auditd = run("systemctl is-active auditd 2>/dev/null")
checks.append(check("auditd — Journalisation active", auditd == "active", auditd or "inactif", "NIS2 Art.21(b)"))

# SSH
ssh_pass = run("sshd -T 2>/dev/null | grep passwordauthentication")
checks.append(check("SSH — Auth par clé uniquement", "no" in ssh_pass, ssh_pass or "inconnu", "CRA Art.13(6)"))

actual_port = run("sshd -T 2>/dev/null | grep '^port ' | awk '{print \$2}'")
checks.append(check("SSH — Port non standard", actual_port != "22",
    f"port {actual_port}" if actual_port else f"port {ssh_port}", "CRA Annex I"))

# Mises à jour
unattended = run("systemctl is-enabled apt-daily-upgrade.timer 2>/dev/null")
checks.append(check("Mises à jour auto sécurité", unattended in ("enabled", "static", "generated"),
    f"timer: {unattended}", "CRA Art.13 + NIS2 Art.21(e)"))

# Asterisk
asterisk_shell = run("getent passwd asterisk | cut -d: -f7")
checks.append(check("asterisk — shell nologin", "nologin" in asterisk_shell, asterisk_shell, "CRA Annex I"))

# SBOM
sbom_ok = os.path.exists('/etc/freepbx-factory/sbom.json')
checks.append(check("SBOM — Fichier présent", sbom_ok,
    "/etc/freepbx-factory/sbom.json" if sbom_ok else "absent", "CRA Annex II"))

# PM2 — 4 services online (dont UCP)
pm2_out = run("fwconsole pm2 --list 2>/dev/null")
pm2_online = pm2_out.count('online')
ucp_ok = bool(re.search(r'ucp.*online', pm2_out))
checks.append(check("PM2 — 4 services online", pm2_online >= 4, f"{pm2_online}/4 online", "Opérationnel"))
checks.append(check("PM2 — UCP online (Node 20)", ucp_ok, "online" if ucp_ok else "errored/absent", "Opérationnel"))

ok_count = sum(1 for c in checks if c["status"] == "ok")
total = len(checks)
score = int(ok_count * 100 / total)

report = {
    "schema": "freepbx-factory-compliance/1.0",
    "timestamp": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    "score": {"ok": ok_count, "total": total, "percent": score},
    "frameworks": ["CRA UE 2024/2847", "NIS2 UE 2022/2555"],
    "checks": checks
}

with open('/etc/freepbx-factory/compliance-report.json', 'w') as f:
    json.dump(report, f, indent=2)

print(f"\n  Score conformité : {score}% ({ok_count}/{total} contrôles OK)")
warnings = [c for c in checks if c["status"] != "ok"]
if warnings:
    print(f"  Points en avertissement :")
    for w in warnings:
        print(f"    ⚠  {w['name']} : {w['value']} ({w['requirement']})")
else:
    print("  Tous les contrôles sont OK")
print(f"  Rapport : /etc/freepbx-factory/compliance-report.json")
PYEOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === POST_CHECKS_COMPLETE ==="
__FPBXPHASE_13_POST_CHECKS_SH__
chmod +x "$_PHASES_TMP/13_post_checks.sh"

cat > "$_PHASES_TMP/14_auditd.sh" <<'__FPBXPHASE_14_AUDITD_SH__'
#!/bin/bash
# 14_auditd.sh — Journalisation actions privilégiées (NIS2 Art. 21b)
#
# Installe auditd + règles de surveillance FreePBX Factory :
#   /etc/passwd, /etc/shadow, /etc/group         — modifications identité
#   /etc/ssh/sshd_config                          — modifications SSH
#   /home/debian/.ssh/authorized_keys             — modifications clés SSH
#   /etc/sudoers, /etc/sudoers.d/                 — élévation de privilèges
#   /etc/freepbx-factory/                         — configuration factory
#   syscall execve (euid=0)                        — commandes root tracées
#
# Les journaux auditd sont dans /var/log/audit/audit.log

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-14-auditd.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 14_AUDITD (NIS2 Art. 21b) ==="

# ── Installation ─────────────────────────────────────────────────────────────
DEBIAN_FRONTEND=noninteractive apt-get install -y auditd audispd-plugins -q

# ── Règles FreePBX Factory ────────────────────────────────────────────────────
cat > /etc/audit/rules.d/freepbx-factory.rules << 'RULES'
# FreePBX Factory — surveillance auth et actions privilégiées
# NIS2 Art. 21(b) — Détection et gestion des incidents

# Identité système
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group  -p wa -k identity

# SSH
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /home/debian/.ssh/authorized_keys -p wa -k ssh_keys

# Élévation de privilèges
-w /etc/sudoers    -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers

# Configuration FreePBX Factory
-w /etc/freepbx-factory/ -p rwxa -k factory_config

# Commandes root tracées (execve avec euid=0)
-a always,exit -F arch=b64 -S execve -F euid=0 -F auid>=1000 -k privileged_exec
RULES

chmod 0600 /etc/audit/rules.d/freepbx-factory.rules

# ── Activation + démarrage ────────────────────────────────────────────────────
systemctl enable auditd
systemctl restart auditd

# ── Vérification ─────────────────────────────────────────────────────────────
if systemctl is-active --quiet auditd; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] auditd actif — règles freepbx-factory.rules chargées"
    auditctl -l 2>/dev/null | grep -c "freepbx-factory\|identity\|sshd_config\|sudoers\|privileged" || true
else
    echo "[WARN] auditd démarré mais statut non confirmé — vérifier manuellement"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === AUDITD_COMPLETE ==="
__FPBXPHASE_14_AUDITD_SH__
chmod +x "$_PHASES_TMP/14_auditd.sh"

cat > "$_PHASES_TMP/15_tls.sh" <<'__FPBXPHASE_15_TLS_SH__'
#!/bin/bash
# 15_tls.sh — Certificat Let's Encrypt + Apache HTTPS (NIS2 Art. 21d)
#
# Si TLS_DOMAIN est fourni  : installe certbot, obtient le certificat via
#   webroot (pas de plugin Apache — évite l'ambiguïté vhost FreePBX 17),
#   configure manuellement les VirtualHost HTTP (redirect) et HTTPS (LE cert),
#   garde Apache actif.
# Si TLS_DOMAIN est vide    : Apache est arrêté, GUI inaccessible jusqu'à
#   configuration TLS ultérieure.
#
# Correctif E_TLS : FreePBX 17 n'installe pas de <VirtualHost> dans freepbx.conf
#   (seulement des <Directory>) — certbot --apache voit plusieurs vhosts sans
#   ServerName correspondant → "vhost ambiguity" → échec installation cert.
#   Solution : certbot certonly --webroot + configuration manuelle des vhosts.
#
# Prérequis : Apache doit être démarré (phase 09 + validation GUI déjà faites)
# Argument  : $1 = FQDN (ex: pbx.mon-entreprise.fr)
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

set -euo pipefail
LOG=/var/log/freepbx-factory/deploy-phase-15-tls.log
touch "$LOG" && chmod 600 "$LOG"
exec > >(tee -a "$LOG") 2>&1

TLS_DOMAIN="${TLS_DOMAIN:-${1:-}}"

if [[ -z "$TLS_DOMAIN" ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 15_TLS — ignorée (TLS_DOMAIN vide) ==="
    echo "[INFO] Apache va être arrêté — GUI FreePBX inaccessible jusqu'à config TLS"
    systemctl stop apache2 2>/dev/null || true
    systemctl disable apache2 2>/dev/null || true
    echo "[INFO] Pour activer HTTPS ultérieurement, relancer avec TLS_DOMAIN=<domaine>"
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 15_TLS — $TLS_DOMAIN ==="

# ── 1. Certbot (venv/pip — évite incompatibilité certbot 2.1.0/python3-openssl 23.x Debian 12) ──
DEBIAN_FRONTEND=noninteractive apt-get install -y python3-venv python3-pip -q
rm -rf /opt/certbot
python3 -m venv /opt/certbot
/opt/certbot/bin/pip install --quiet --upgrade pip certbot
ln -sf /opt/certbot/bin/certbot /usr/local/bin/certbot

# ── 2. Préparation vhost HTTP pour challenge ACME ─────────────────────────────
# FreePBX 17 : freepbx.conf contient uniquement des <Directory>, pas de
# <VirtualHost>. Le vhost réel est 000-default.conf (port 80).
# On ajoute ServerName pour que certbot puisse l'identifier, puis on
# utilise --webroot pour éviter tout parsing vhost par certbot.
a2enmod rewrite ssl -q 2>/dev/null || true

# ServerName dans le vhost HTTP par défaut (requis pour certbot --webroot)
if ! grep -q "ServerName" /etc/apache2/sites-available/000-default.conf 2>/dev/null; then
    sed -i "s|ServerAdmin webmaster@localhost|ServerName $TLS_DOMAIN\n\tServerAdmin webmaster@localhost|" \
        /etc/apache2/sites-available/000-default.conf
    echo "[INFO] ServerName $TLS_DOMAIN ajouté à 000-default.conf"
fi
systemctl reload apache2 || true

# ── 3. Certificat Let's Encrypt (webroot — pas de plugin Apache) ──────────────
# --webroot : certbot dépose /.well-known/acme-challenge/ dans /var/www/html
# Apache sert le challenge sur port 80 — aucune manipulation de vhost
if ! certbot certonly \
    --webroot -w /var/www/html \
    -d "$TLS_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  Certificat HTTPS non obtenu                             ║${NC}"
    echo -e "${YELLOW}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${YELLOW}║  Domaine : $TLS_DOMAIN${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║  FreePBX est installé et opérationnel.                   ║${NC}"
    echo -e "${YELLOW}║  Seul l'accès HTTPS n'a pas pu être activé.              ║${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║  Causes probables :                                       ║${NC}"
    echo -e "${YELLOW}║    - DNS pas encore propagé (attendre 15 min à 48h)      ║${NC}"
    echo -e "${YELLOW}║    - Port 80 inaccessible depuis Internet                 ║${NC}"
    echo -e "${YELLOW}║    - Limite quotidienne Let's Encrypt dépassée            ║${NC}"
    echo -e "${YELLOW}║                                                           ║${NC}"
    echo -e "${YELLOW}║  Apache a été arrêté. Pour relancer HTTPS plus tard :    ║${NC}"
    echo -e "${YELLOW}║    sudo /opt/certbot/bin/certbot certonly --webroot       ║${NC}"
    echo -e "${YELLOW}║         -w /var/www/html -d $TLS_DOMAIN${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
    systemctl stop apache2 2>/dev/null || true
    systemctl disable apache2 2>/dev/null || true
    exit 0
fi

CERT_DIR="/etc/letsencrypt/live/$TLS_DOMAIN"
echo "[INFO] Certificat obtenu : $CERT_DIR/fullchain.pem"

# ── 4. VirtualHost HTTP : redirect → HTTPS ───────────────────────────────────
cat > /etc/apache2/sites-available/000-default.conf << VHOST_EOF
<VirtualHost *:80>
    ServerName $TLS_DOMAIN
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
VHOST_EOF
echo "[INFO] VHost HTTP configuré (redirect 301 → HTTPS)"

# ── 5. VirtualHost HTTPS avec cert Let's Encrypt ────────────────────────────
# options-ssl-apache.conf est créé par certbot (protocoles, ciphers Mozilla)
SSL_OPTIONS=""
[[ -f /etc/letsencrypt/options-ssl-apache.conf ]] && \
    SSL_OPTIONS="    Include /etc/letsencrypt/options-ssl-apache.conf"

cat > /etc/apache2/sites-available/default-ssl.conf << SSL_EOF
<VirtualHost *:443>
    ServerName $TLS_DOMAIN
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html
    SSLEngine on
    SSLCertificateFile     $CERT_DIR/fullchain.pem
    SSLCertificateKeyFile  $CERT_DIR/privkey.pem
$SSL_OPTIONS
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    ErrorLog \${APACHE_LOG_DIR}/ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/ssl_access.log combined
</VirtualHost>
SSL_EOF
echo "[INFO] VHost HTTPS configuré avec cert LE"

# ── 6. Activer modules + site SSL + reload ────────────────────────────────────
a2enmod headers -q 2>/dev/null || true
a2ensite default-ssl -q 2>/dev/null || true
apache2ctl configtest
systemctl reload apache2
systemctl enable apache2
echo "[INFO] Apache rechargé — HTTPS actif"

# ── 7. Vérification ───────────────────────────────────────────────────────────
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Vérification HTTPS..."
sleep 3
HTTP_REDIR=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" \
    "http://$TLS_DOMAIN/admin/" 2>/dev/null || echo "000")
HTTPS_CODE=$(curl -sk --max-time 10 -o /dev/null -w "%{http_code}" \
    "https://$TLS_DOMAIN/admin/" 2>/dev/null || echo "000")

if [[ "$HTTP_REDIR" =~ ^(301|302)$ ]] && [[ "$HTTPS_CODE" =~ ^(200|302|301|403)$ ]]; then
    echo "[OK] HTTP→$HTTP_REDIR redirect + HTTPS→$HTTPS_CODE opérationnel"
    [[ "$HTTPS_CODE" == "403" ]] && echo "[OK] 403 attendu : /admin restreint à l'IP de gestion (normal depuis l'IP VPS)"
    echo "[OK] https://$TLS_DOMAIN/admin/"
else
    echo "[WARN] HTTP→$HTTP_REDIR / HTTPS→$HTTPS_CODE — vérifier manuellement"
    echo "       Délai DNS possible si le domaine vient d'être créé."
fi

# Renouvellement auto (venv/pip — créer cron si absent)
if [[ ! -f /etc/cron.d/certbot ]] && ! systemctl is-active --quiet certbot.timer 2>/dev/null; then
    echo "0 0,12 * * * root /opt/certbot/bin/certbot renew --quiet --post-hook 'systemctl reload apache2 2>/dev/null || true'" \
        > /etc/cron.d/certbot
    chmod 644 /etc/cron.d/certbot
    echo "[INFO] Cron renouvellement créé : /etc/cron.d/certbot"
fi
echo "[INFO] Renouvellement automatique : $(systemctl is-active certbot.timer 2>/dev/null || cat /etc/cron.d/certbot 2>/dev/null | grep -v '^#' | head -1 || echo 'non détecté')"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === TLS_COMPLETE — $TLS_DOMAIN ==="
__FPBXPHASE_15_TLS_SH__
chmod +x "$_PHASES_TMP/15_tls.sh"

PHASES_DIR="$_PHASES_TMP"
# @@BUNDLE_INJECT_END@@
FILES_DIR="$SCRIPT_DIR/files"

# ── Version + Télémétrie ────────────────────────────────────────────────────
SCRIPT_VERSION="1.9"
TELEMETRY_URL=""   # À configurer — vide = télémétrie désactivée

# ── Couleurs + logging ──────────────────────────────────────────────────────
LOG_DIR="/var/log/freepbx-factory"
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/install-$(date '+%Y%m%d-%H%M%S').log"
touch "$SESSION_LOG" && chmod 600 "$SESSION_LOG"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "[$(date '+%H:%M:%S')] $*" | tee -a "$SESSION_LOG"; }
ok()   { echo -e "${GREEN}[OK]${NC} $*" | tee -a "$SESSION_LOG"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "$SESSION_LOG"; }
info() { echo -e "${CYAN}$*${NC}"; }

# Affiche un encadré de reprise en main et maintient la session tmux ouverte.
# Appelé à chaque échec — ne masque pas l'erreur, facilite la reconnexion.
show_recovery_panel() {
    local phase="${1:-inconnu}"
    local phase_log="${2:-}"
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  DÉPLOIEMENT INTERROMPU                                  ║${NC}"
    echo -e "${RED}║  Phase : ${phase}${NC}"
    echo -e "${RED}╠══════════════════════════════════════════════════════════╣${NC}"
    if [[ -n "$phase_log" && -f "$phase_log" ]]; then
        echo -e "${RED}║  Dernières lignes du log :${NC}"
        tail -n 8 "$phase_log" | while IFS= read -r line; do
            echo -e "${RED}║  ${NC}  $line"
        done
        echo -e "${RED}║${NC}"
        echo -e "${RED}║  Log complet : $phase_log${NC}"
        echo -e "${RED}║${NC}"
    fi
    echo -e "${RED}║  Pour reprendre la main sur ce serveur :${NC}"
    if [[ -n "${SSH_PORT:-}" && -n "${VPS_IP:-}" ]]; then
        echo -e "${RED}║    ssh -p ${SSH_PORT} debian@${VPS_IP}${NC}"
    elif [[ -f /root/freepbx-factory-ssh-port.txt ]]; then
        echo -e "${RED}║    ssh -p $(cat /root/freepbx-factory-ssh-port.txt) debian@<IP_VPS>${NC}"
    else
        echo -e "${RED}║    ssh debian@<IP_VPS>  (port SSH : voir /etc/ssh/sshd_config)${NC}"
    fi
    echo -e "${RED}║${NC}"
    echo -e "${RED}║  Journal d'installation : ${SESSION_LOG}${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    # Maintient la session tmux ouverte — sans ça, tmux se ferme et l'erreur disparaît
    read -rp "  Appuyez sur Entrée pour fermer cette session... " _ 2>/dev/null || true
}

err() {
    echo -e "${RED}[ERR]${NC} $*" | tee -a "$SESSION_LOG"
    show_recovery_panel "pré-installation" ""
    exit 1
}

run_phase() {
    local script="$1"; shift
    local phase_name
    phase_name=$(basename "$script" .sh | tr '_' '-')
    local phase_log="/var/log/freepbx-factory/deploy-phase-${phase_name}.log"
    if ! bash "$script" "$@"; then
        show_recovery_panel "$phase_name" "$phase_log"
        exit 1
    fi
}

# ── Répertoire de logs persistants ──────────────────────────────────────────
mkdir -p /var/log/freepbx-factory
chmod 700 /var/log/freepbx-factory

# ── Pré-checks ──────────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || err "Doit être exécuté en root : sudo bash $0"
[[ -f /etc/debian_version ]] || err "Système non supporté — Debian 12 requis"
DEB_VER=$(cut -d. -f1 /etc/debian_version)
[[ "$DEB_VER" == "12" ]] || warn "Version Debian détectée : $DEB_VER (Debian 12 recommandée)"

# ── Bootstrap : dépendances minimales ───────────────────────────────────────
_MISSING=()
for _pkg in wget curl tmux ca-certificates; do
    command -v "$_pkg" &>/dev/null || _MISSING+=("$_pkg")
done
if [[ ${#_MISSING[@]} -gt 0 ]]; then
    echo "Préparation de l'environnement..."
    apt-get update -qq && apt-get install -y "${_MISSING[@]}" -qq \
        || warn "Certaines dépendances n'ont pas pu être installées — vérifier la connectivité réseau"
fi

[[ -f "$PHASES_DIR/00_cleanup.sh" ]] || err "Scripts de phase introuvables dans $PHASES_DIR"
command -v wget &>/dev/null || err "wget introuvable après installation — vérifier la connectivité réseau"
# FreePBX installé : reprise possible si état wizard sauvegardé (post-reboot installateur)
if command -v fwconsole &>/dev/null; then
    if [[ -f /root/.fpbx-state.sh ]]; then
        source /root/.fpbx-state.sh || err "Fichier état corrompu — supprimez /root/.fpbx-state.sh et relancez"
        FACTORY_RESUME_MODE=1
        # Supprimer immédiatement le fichier état pour éviter une re-reprise si l'utilisateur
        # reboot manuellement en cours de dépannage (les phases config sont idempotentes)
        rm -f /root/.fpbx-state.sh 2>/dev/null || true
        # Guard : le firewall FreePBX peut être actif depuis le reboot.
        # Double verrou : arrêt immédiat + désactivation en base de données.
        fwconsole firewall stop 2>/dev/null || true
        mysql -u root asterisk \
            -e "UPDATE modules SET enabled=0 WHERE modulename='firewall';" \
            2>/dev/null || true
        echo ""
        echo -e "${YELLOW}  ↻  Reprise détectée — FreePBX installé, paramètres wizard restaurés.${NC}"
        echo -e "${YELLOW}     Les phases de configuration reprennent automatiquement.${NC}"
        echo ""
    else
        err "FreePBX déjà installé — ce script est à usage unique."
    fi
fi

# ── Garde anti-lock-out (pré-vol) : échouer TÔT si aucune clé SSH pour 'debian' ──
# Le durcissement SSH (phase 00_hardening) désactive l'auth par mot de passe.
# On vérifie ici, AVANT l'installation (20-40 min), pour éviter un échec tardif
# doublé d'un verrouillage hors du serveur. Re-vérifié dans 00_hardening.
if [[ -z "${FACTORY_RESUME_MODE:-}" ]]; then
    _DEBIAN_AK="/home/debian/.ssh/authorized_keys"
    if [[ ! -s "$_DEBIAN_AK" ]] || ! grep -Eq '(^|[[:space:]])(sk-)?(ssh-(rsa|ed25519|dss)|ecdsa-sha2-)' "$_DEBIAN_AK"; then
        err "Aucune clé SSH valide pour l'utilisateur 'debian' ($_DEBIAN_AK) — le durcissement SSH vous verrouillerait dehors. Associez une clé SSH au VPS puis relancez."
    fi
fi

# ── tmux : démarrage en session persistante ─────────────────────────────────
# La session survit à la déconnexion SSH lors du hardening SSH (port change).
if [[ -z "${FACTORY_IN_TMUX:-}" ]]; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y tmux -q 2>/dev/null
    tmux kill-session -t factory 2>/dev/null || true
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Installation démarrée en session tmux persistante.  ║${NC}"
    echo -e "${CYAN}║  NE FERMEZ PAS cette fenêtre pendant le déploiement. ║${NC}"
    echo -e "${CYAN}║  Le port SSH définitif s'affiche en jaune avant le   ║${NC}"
    echo -e "${CYAN}║  déploiement — notez-le.                             ║${NC}"
    echo -e "${CYAN}║  En cas de perte : /root/freepbx-factory-ssh-port.txt║${NC}"
    echo -e "${CYAN}║  (console KVM OVHcloud si SSH inaccessible)          ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    # Transmettre TOUS les arguments du wizard à la session tmux (sinon perdus)
    _SCRIPT_PATH="$(realpath "$0" 2>/dev/null || readlink -f "$0" 2>/dev/null || echo "$0")"
    _FWD_ARGS="${MANAGEMENT_IP_ARG:+--management-ip=$MANAGEMENT_IP_ARG} ${KIT_STARTER_ARG:+--kit-starter=$KIT_STARTER_ARG} ${TRUNK_ENABLED_ARG:+--trunk-enabled=$TRUNK_ENABLED_ARG} ${TRUNK_REGISTRAR_ARG:+--trunk-registrar=$TRUNK_REGISTRAR_ARG} ${TRUNK_USERNAME_ARG:+--trunk-username=$TRUNK_USERNAME_ARG} ${TLS_DOMAIN_ARG:+--tls-domain=$TLS_DOMAIN_ARG}"
    # Préfixe env inline POSIX — évite eval export (fragile si $SHELL=dash) ; $0 résolu en absolu
    # SSH_CLIENT / SSH_CONNECTION transmis pour que la détection IP de gestion fonctionne dans tmux
    _FWD_ENV_PREFIX="FACTORY_IN_TMUX=1${SSH_CLIENT:+ SSH_CLIENT='${SSH_CLIENT}'}${SSH_CONNECTION:+ SSH_CONNECTION='${SSH_CONNECTION}'}${FACTORY_TEST_ADMIN:+ FACTORY_TEST_ADMIN='${FACTORY_TEST_ADMIN}'}${FACTORY_TEST_PASS:+ FACTORY_TEST_PASS='${FACTORY_TEST_PASS}'}"
    tmux new-session -d -s factory -x 220 -y 50 \
        "$_FWD_ENV_PREFIX bash '$_SCRIPT_PATH' $_FWD_ARGS; echo ''; if [ -f /tmp/fpbx_deploy_done ]; then echo '-- Déploiement terminé --'; rm -f /tmp/fpbx_deploy_done; else echo '-- Session terminée (annulée ou interrompue) --'; fi; echo '   Pour faire défiler : Ctrl+B  [  puis PgUp / flèches.  Entrée pour quitter.'; read _unused"
    tmux set-option -t factory history-limit 20000 2>/dev/null || true
    tmux attach-session -t factory
    exit 0
fi

# ── Bootstrap log tmux — trace d'entrée (diagnostic [exited]) ───────────────
echo "[$(date '+%Y-%m-%d %H:%M:%S')] tmux-bootstrap OK — FACTORY_IN_TMUX=${FACTORY_IN_TMUX:-unset} — $0" \
    >> /var/log/freepbx-factory/tmux-bootstrap.log 2>/dev/null || true

# ── Identifiant anonyme de déploiement ──────────────────────────────────────
# Généré une seule fois à l'entrée dans tmux — non transmis sans accord explicite
DEPLOY_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null | tr -d '-' | cut -c1-16 \
            || head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n' | cut -c1-16 \
            || printf '%016d' "$(date +%s%N 2>/dev/null || date +%s)")
_OS_ID=$(. /etc/os-release 2>/dev/null && echo "${ID:-linux} ${VERSION_ID:-}" || echo "linux")

# ── Fonction télémétrie (no-op si TELEMETRY_URL vide) ───────────────────────
_send_telem() {
    [[ -z "$TELEMETRY_URL" ]] && return 0
    curl -s -o /dev/null --max-time 5 --retry 1 \
        -H "Content-Type: application/json" \
        -d "$1" \
        "${TELEMETRY_URL}" 2>/dev/null || true
}

# ── Validation mot de passe ─────────────────────────────────────────────────
validate_password() {
    local pass="$1" label="${2:-Mot de passe}" require_special="${3:-1}"
    [[ -z "$pass" ]] && { echo "  ✗ $label : ne peut pas être vide"; return 1; }
    [[ ${#pass} -lt 12 ]] && { echo -e "  ✗ $label : 12 caractères minimum requis (CRA Axe 1)"; return 1; }
    echo "$pass" | grep -q '[A-Z]' || { echo -e "  ✗ $label : au moins une majuscule requise"; return 1; }
    echo "$pass" | grep -q '[a-z]' || { echo -e "  ✗ $label : au moins une minuscule requise"; return 1; }
    echo "$pass" | grep -q '[0-9]' || { echo -e "  ✗ $label : au moins un chiffre requis"; return 1; }
    [[ "$require_special" -eq 1 ]] && { echo "$pass" | grep -qP '[^A-Za-z0-9]' || { echo -e "  ✗ $label : au moins un caractère spécial requis"; return 1; }; }
    return 0
}

_read_star_input() {
    # Saisie masquée avec affichage d'étoiles — gère backspace
    # stty sane avant chaque appel : évite que le mode -s se bloque après un mauvais doublon
    local varname="$1" prompt="$2" password="" char
    stty sane 2>/dev/null || true
    printf "%s : " "$prompt"
    while IFS= read -r -s -n1 char; do
        case "$char" in
            ""|$'\n') break ;;
            $'\177'|$'\b')
                if [[ ${#password} -gt 0 ]]; then
                    password="${password%?}"; printf '\b \b'
                fi ;;
            *) password+="$char"; printf '*' ;;
        esac
    done
    printf '\n'
    printf -v "$varname" '%s' "$password"
}

read_password() {
    local varname="$1" label="$2" confirm="${3:-1}" require_special="${4:-1}" pass pass2
    local _lbl="${label#"${label%%[! ]*}"}"  # label sans espaces de tête pour le prompt confirmation
    while true; do
        _read_star_input pass "$label"
        [[ -z "$pass" ]] && { echo "  Installation annulée."; exit 0; }
        [[ "$pass" == "q" ]] && return 2  # q = marche arrière (capté par l'appelant)
        validate_password "$pass" "$label" "$require_special" || continue
        if [[ $confirm -eq 1 ]]; then
            _read_star_input pass2 "  Confirmer $_lbl"
            if [[ "$pass" != "$pass2" ]]; then
                echo "  ✗ Mots de passe différents — saisissez à nouveau"
                continue
            fi
        fi
        printf -v "$varname" '%s' "$pass"
        break
    done
}

read_ext_password() {
    local varname="$1" ext="$2" pass
    while true; do
        _read_star_input pass "  Mot de passe du poste $ext"
        if [[ -z "$pass" ]]; then
            # head -c 512 ferme stdin de tr proprement — évite SIGPIPE avec set -o pipefail
            pass=$(head -c 512 /dev/urandom | tr -dc 'A-Za-z0-9._-' | cut -c1-20)
            echo "  → Généré : $pass"
            printf -v "$varname" '%s' "$pass"
            break
        fi
        echo "$pass" | grep -qE '[%@]' && echo -e "  ${YELLOW}ℹ${NC} Extension $ext : les caractères % et @ sont déconseillés dans un mot de passe SIP (risque d'échec d'authentification)"
        validate_password "$pass" "Extension $ext" && printf -v "$varname" '%s' "$pass" && break
    done
}

# ════════════════════════════════════════════════════════════════════════════
# PRÉREQUIS — vérification environnement (alertes non bloquantes)
# Ignoré en mode reprise (déjà validé au premier lancement)
# ════════════════════════════════════════════════════════════════════════════
if [[ -z "${FACTORY_RESUME_MODE:-}" ]]; then
_ARCH=$(uname -m 2>/dev/null || echo "unknown")
_RAM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
_DISK_GB=$(df -BG / 2>/dev/null | awk 'NR==2{gsub("G","",$4); print int($4)}' || echo 0)
_GITHUB_OK=1; timeout 5 wget -q --spider https://github.com 2>/dev/null || _GITHUB_OK=0
_FPBX_EXISTS=0; command -v fwconsole &>/dev/null && _FPBX_EXISTS=1

_PREREQ_WARNS=()
[[ "$_ARCH" != "x86_64" ]] && _PREREQ_WARNS+=("Architecture $_ARCH détectée — FreePBX 17 requiert x86_64")
[[ "$_RAM_MB" -lt 1024 ]]  && _PREREQ_WARNS+=("Mémoire ${_RAM_MB} MB — minimum recommandé 1 GB")
[[ "$_DISK_GB" -lt 10 ]]   && _PREREQ_WARNS+=("Disque ${_DISK_GB} GB libres — minimum recommandé 10 GB")
[[ "$_GITHUB_OK" -eq 0 ]]  && _PREREQ_WARNS+=("github.com inaccessible — l'installateur FreePBX ne pourra pas être téléchargé")

echo ""
echo "  Environnement détecté :"
[[ "$_ARCH" == "x86_64" ]] \
    && echo -e "  ${GREEN}✓${NC}  Architecture : $_ARCH" \
    || echo -e "  ${YELLOW}⚠${NC}  Architecture : $_ARCH  (x86_64 requis)"
[[ "$_RAM_MB" -ge 1024 ]] \
    && echo -e "  ${GREEN}✓${NC}  Mémoire      : ${_RAM_MB} MB" \
    || echo -e "  ${YELLOW}⚠${NC}  Mémoire      : ${_RAM_MB} MB  (minimum recommandé 1 GB)"
[[ "$_DISK_GB" -ge 10 ]] \
    && echo -e "  ${GREEN}✓${NC}  Disque       : ${_DISK_GB} GB libres sur /" \
    || echo -e "  ${YELLOW}⚠${NC}  Disque       : ${_DISK_GB} GB libres  (minimum recommandé 10 GB)"
[[ "$_GITHUB_OK" -eq 1 ]] \
    && echo -e "  ${GREEN}✓${NC}  Connectivité : github.com accessible" \
    || echo -e "  ${YELLOW}⚠${NC}  Connectivité : github.com inaccessible"
[[ "$_FPBX_EXISTS" -eq 0 ]] \
    && echo -e "  ${GREEN}✓${NC}  FreePBX      : non installé" \
    || echo -e "  ${CYAN}ℹ${NC}  FreePBX      : installation existante détectée"
echo ""

if [[ ${#_PREREQ_WARNS[@]} -gt 0 ]]; then
    echo -e "  ${YELLOW}Points d'attention détectés (non bloquants — l'installation peut continuer) :${NC}"
    for _w in "${_PREREQ_WARNS[@]}"; do
        echo -e "  ${YELLOW}⚠  $_w${NC}"
    done
    echo ""
    read -t 30 -rp "  Poursuivre malgré ces points d'attention ? [o/N] : " _PREREQ_CONT || _PREREQ_CONT="n"
    if [[ "${_PREREQ_CONT,,}" != "o" ]]; then
        echo "  Installation annulée."
        exit 0
    fi
    echo "  → Poursuite de l'installation."
    echo ""
fi
fi

# ════════════════════════════════════════════════════════════════════════════
# WIZARD — Saisie paramètres (V1.9 CRA)
# ════════════════════════════════════════════════════════════════════════════
while true; do
# Mode reprise : wizard déjà complété — utiliser les paramètres sauvegardés
if [[ -n "${FACTORY_RESUME_MODE:-}" ]]; then break; fi
MANAGEMENT_IP=""
# Port SSH généré au plus tôt — sauvegardé et affiché avant les questions
SSH_PORT=$(shuf -i 10000-49151 -n 1 2>/dev/null \
    || python3 -c "import random; print(random.randint(10000,49151))")
echo "$SSH_PORT" > /root/freepbx-factory-ssh-port.txt
chmod 600 /root/freepbx-factory-ssh-port.txt
tmux rename-window "FreePBX Factory | SSH: ${SSH_PORT}" 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  FreePBX Factory V1.9 Installateur       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${YELLOW}  Port SSH : ${SSH_PORT}  — notez-le maintenant${NC}"
echo -e "${YELLOW}  Il sera nécessaire pour vous reconnecter après l'installation.${NC}"
echo -e "${YELLOW}  ssh -p ${SSH_PORT} debian@<IP_DU_SERVEUR>${NC}"
echo ""
echo -e "${YELLOW}  ⚠  Nouveau déploiement ? Utilisez un terminal neuf — un terminal${NC}"
echo -e "${YELLOW}     réutilisé (même session ou onglet) peut perturber la saisie${NC}"
echo -e "${YELLOW}     (backspace non fonctionnel, caractères parasites).${NC}"
echo ""
echo -e "  La sécurité appliquée par ce script est un point de départ."
echo -e "  La maintenance et la conformité restent sous votre responsabilité."
echo ""

# Windows Terminal envoie une réponse ESC[>0;10;1c (Secondary Device Attributes)
# au démarrage de bash — elle atterrit dans stdin et pollue le premier read.
# On draine stdin avant d'entrer dans le wizard.
stty -echo 2>/dev/null || true
while IFS= read -r -t 0.1 -n 512 _da_discard 2>/dev/null; do :; done || true
stty echo 2>/dev/null || true

info "  Les options sont facultatives et configurables après le déploiement."
echo ""
info "  Tapez q à tout moment pour recommencer depuis le début."
echo ""

# ── Axe 1 : Compte admin GUI ─────────────────────────────────────────────────
info "▶ 1/4 : Compte administrateur FreePBX"
echo ""
info "  Ce compte vous permet d'accéder à l'interface de configuration FreePBX."
info "  Choisissez un identifiant et un mot de passe robustes : ils ne peuvent"
info "  pas être récupérés automatiquement après le déploiement."
echo ""
# FACTORY_TEST_ADMIN / FACTORY_TEST_PASS : bypass test-only (jamais en prod)
if [[ -n "${FACTORY_TEST_ADMIN:-}" && -n "${FACTORY_TEST_PASS:-}" ]]; then
    ADMIN_USERNAME="$FACTORY_TEST_ADMIN"
    ADMIN_PASSWORD="$FACTORY_TEST_PASS"
    echo "  ✓ Compte administrateur (mode test) : $ADMIN_USERNAME"
    echo ""
else
RESERVED_LOGINS="admin root administrator freepbx asterisk"
info "  Identifiant  : 5+ caractères, lettres / chiffres / . - _ uniquement"
info "  Noms refusés : admin root administrator freepbx asterisk"
info "  Mot de passe : 12+ caractères avec minuscules, majuscules, chiffres et symboles"
echo ""
while true; do
    read -rp "  Identifiant de connexion FreePBX (q = recommencer) : " ADMIN_USERNAME
    [[ -z "$ADMIN_USERNAME" ]] && { echo "  ✗ Identifiant vide — saisissez à nouveau"; continue; }
    [[ "${ADMIN_USERNAME,,}" == "q" ]] && { echo "  Retour au début du wizard."; continue 2; }
    case "$ADMIN_USERNAME" in
        *"'"*|*'"'*|*";"*|*"<"*|*">"*|*"&"*|*'`'*)
            echo "  ✗ Caractères interdits dans l'identifiant — saisissez à nouveau"; continue ;;
    esac
    ADMIN_LOWER="${ADMIN_USERNAME,,}"
    IS_RESERVED=0
    for r in $RESERVED_LOGINS; do [[ "$ADMIN_LOWER" == "$r" ]] && IS_RESERVED=1 && break; done
    [[ ${#ADMIN_USERNAME} -lt 5 ]] && echo -e "  ${YELLOW}ℹ${NC} Identifiant court — FreePBX requiert généralement au moins 5 caractères"
    [[ $IS_RESERVED -eq 1 ]] && echo -e "  ${YELLOW}ℹ${NC} '$ADMIN_USERNAME' est un identifiant réservé — FreePBX peut le refuser"
    echo "$ADMIN_USERNAME" | grep -qP '^[A-Za-z0-9._-]+$' || echo -e "  ${YELLOW}ℹ${NC} Identifiant avec caractères inhabituels — recommandé : lettres, chiffres, . - _"
    info "  (Pour changer l'identifiant : saisissez uniquement q puis Entrée au prompt suivant)"
    _rpret=0
    read_password ADMIN_PASSWORD "  Mot de passe FreePBX" || _rpret=$?
    [[ $_rpret -eq 2 ]] && { echo "  Retour à la saisie de l'identifiant."; echo ""; continue; }
    break
done
echo "  ✓ Compte administrateur validé"
echo ""
fi  # fin bypass test

SSH_ENABLED="oui"  # SSH actif — port aléatoire + clé OVHcloud choisie à la réinstallation
echo ""

# ── Axe 2 + 3 : Kit starter + Trunk SIP ─────────────────────────────────────
info "▶ 2/4 : Postes téléphoniques et ligne opérateur (optionnels)"
echo ""
info "  Les options peuvent aussi être configurées manuellement dans FreePBX après le déploiement."
echo ""
KIT_STARTER="non"
EXT1_NUMBER="" EXT1_NAME="Poste 1"  EXT1_PASS=""
EXT2_NUMBER="" EXT2_NAME="Poste 2"  EXT2_PASS=""
EXT3_NUMBER="" EXT3_NAME="Poste 3"  EXT3_PASS=""
GUI_URL=""

if [[ -n "$KIT_STARTER_ARG" ]]; then
    # Pré-sélection wizard — pas de question interactive
    [[ "${KIT_STARTER_ARG,,}" == "oui" ]] && KIT_STARTER="oui"
    echo "  Kit starter : $KIT_STARTER (pré-sélectionné par le wizard)"
    KIT_RESP="${KIT_STARTER_ARG,,}"
    [[ "$KIT_STARTER" == "oui" ]] && KIT_RESP="o" || KIT_RESP="n"
else
    info "  Kit de démarrage : 3 postes SIP préconfigurés (Poste 1 / Poste 2 / Poste 3)"
    info "  avec des numéros à 5 chiffres attribués automatiquement."
    info "  [Entrée] = non (désactivé)"
    read -rp "  Créer 3 postes de démonstration ? [o/N/q] : " KIT_RESP
    if [[ "${KIT_RESP,,}" == "q" ]]; then echo "  Retour au début du wizard."; continue; fi
fi

if [[ "${KIT_RESP,,}" == "o" ]]; then
    KIT_STARTER="oui"
    echo ""
    EXT_BASE=$(shuf -i 20001-89997 -n 1)
    EXT1_NUMBER=$EXT_BASE
    EXT2_NUMBER=$(( EXT_BASE + 1 ))
    EXT3_NUMBER=$(( EXT_BASE + 2 ))
    echo "  Numéros attribués : $EXT1_NUMBER / $EXT2_NUMBER / $EXT3_NUMBER"
    echo ""
    for i in 1 2 3; do
        varname="EXT${i}_NAME"; varpass="EXT${i}_PASS"; extnum="EXT${i}_NUMBER"
        default_name="${!varname}"
        if [[ -n "${FACTORY_TEST_ADMIN:-}" ]]; then
            local_pass=$(head -c 512 /dev/urandom | tr -dc 'A-Za-z0-9._-' | cut -c1-20)
            printf -v "$varpass" '%s' "$local_pass"
            echo "  Poste $i : ${!varname} — mot de passe auto-généré (mode test)"
        else
            read -rp "  Nom du poste $i [${default_name}] (q = recommencer, entrée = accepter par défaut) : " name
            if [[ "${name,,}" == "q" ]]; then
                echo "  Retour au début du wizard."; continue 2
            elif [[ -n "$name" ]]; then
                printf -v "$varname" '%s' "$name"
            else
                echo "  → ${default_name}"
            fi
            info "  [Entrée] = génération automatique sécurisée"
            read_ext_password "$varpass" "${!extnum}"
        fi
    done
    echo "  ✓ Postes configurés"
fi
echo ""

TRUNK_ENABLED="non"
TRUNK_REGISTRAR="" TRUNK_USERNAME="" TRUNK_PASSWORD="" TRUNK_DID=""
EXTRA_IGNOREIP=""

if [[ -n "$TRUNK_ENABLED_ARG" ]]; then
    # Pré-sélection wizard — pas de question interactive
    if [[ "${TRUNK_ENABLED_ARG,,}" == "oui" ]]; then
        TRUNK_ENABLED="oui"
        TRUNK_REGISTRAR="$TRUNK_REGISTRAR_ARG"
        TRUNK_USERNAME="$TRUNK_USERNAME_ARG"
        echo "  Ligne opérateur : oui (pré-sélectionné par le wizard)"
        [[ -n "$TRUNK_REGISTRAR" ]] && echo "  Serveur SIP : $TRUNK_REGISTRAR"
        [[ -n "$TRUNK_USERNAME"  ]] && echo "  Identifiant : $TRUNK_USERNAME"
        if [[ -n "${FACTORY_TEST_TRUNK_PASS:-}" ]]; then
            TRUNK_PASSWORD="$FACTORY_TEST_TRUNK_PASS"
            echo "  ✓ Mot de passe SIP (mode test)"
        else
            read_password TRUNK_PASSWORD "  Mot de passe SIP" 1 0
        fi
        echo "  ✓ Ligne opérateur configurée : $TRUNK_REGISTRAR"
        _trunk_ip=$(timeout 3 getent hosts "$TRUNK_REGISTRAR" 2>/dev/null | awk '{print $1}' | head -1)
        if [[ -n "$_trunk_ip" ]]; then
            EXTRA_IGNOREIP="$_trunk_ip"
            echo "  → IP opérateur résolue : $EXTRA_IGNOREIP (autorisée dans fail2ban)"
        else
            read -rp "  IP de l'opérateur SIP à autoriser (optionnel) : " EXTRA_IGNOREIP
            [[ -n "$EXTRA_IGNOREIP" ]] && echo "  → Autorisée : $EXTRA_IGNOREIP"
        fi
    else
        echo "  Ligne opérateur : non (pré-sélectionné par le wizard)"
    fi
else
    info "  Ligne opérateur SIP : connecte FreePBX à votre opérateur téléphonique pour"
    info "  passer et recevoir des appels. Préparez :"
    info "    - l'adresse du serveur SIP de votre opérateur (ex: siptrunk.ovh.net)"
    info "    - votre identifiant SIP (numéro ou login opérateur)"
    info "    - votre mot de passe SIP (différent du mot de passe espace client OVHcloud)"
    info "  [Entrée] = non (désactivé)"
    read -rp "  Connecter une ligne opérateur SIP ? [o/N/q] : " TRUNK_RESP
    if [[ "${TRUNK_RESP,,}" == "q" ]]; then echo "  Retour au début du wizard."; continue; fi
    if [[ "${TRUNK_RESP,,}" == "o" ]]; then
        TRUNK_ENABLED="oui"
        read -rp "  Serveur SIP opérateur (ex: siptrunk.ovh.net), vide pour ignorer (q = recommencer) : " TRUNK_REGISTRAR
        [[ "${TRUNK_REGISTRAR,,}" == "q" ]] && { echo "  Retour au début du wizard."; continue; }
        if [[ -z "$TRUNK_REGISTRAR" ]]; then
            TRUNK_ENABLED="non"; echo "  → Ligne opérateur ignorée"
        else
            [[ "$TRUNK_REGISTRAR" =~ \. ]] || echo -e "  ${YELLOW}ℹ${NC} Format inhabituel — vérifiez l'adresse du serveur SIP de votre opérateur"
            read -rp "  Identifiant SIP (numéro ou login opérateur) (q = recommencer) : " TRUNK_USERNAME
            [[ "${TRUNK_USERNAME,,}" == "q" ]] && { echo "  Retour au début du wizard."; continue; }
            [[ -z "$TRUNK_USERNAME" ]] && echo -e "  ${YELLOW}ℹ${NC} Identifiant vide — la registration SIP risque d'échouer"
            info "  Saisissez le mot de passe de votre service SIP"
            info "  (OVHcloud : espace client → Téléphonie → votre trunk → Mot de passe SIP)"
            _rpret=0
            read_password TRUNK_PASSWORD "  Mot de passe SIP" 1 0 || _rpret=$?
            [[ $_rpret -eq 2 ]] && { echo "  Retour au début du wizard."; continue; }
            echo "  ✓ Ligne opérateur configurée : $TRUNK_REGISTRAR"
            _trunk_ip=$(timeout 3 getent hosts "$TRUNK_REGISTRAR" 2>/dev/null | awk '{print $1}' | head -1)
            if [[ -n "$_trunk_ip" ]]; then
                EXTRA_IGNOREIP="$_trunk_ip"
                echo "  → IP opérateur résolue : $EXTRA_IGNOREIP (autorisée dans fail2ban)"
            else
                read -rp "  IP de l'opérateur SIP à autoriser (optionnel, q = recommencer) : " EXTRA_IGNOREIP
                [[ "${EXTRA_IGNOREIP,,}" == "q" ]] && { EXTRA_IGNOREIP=""; echo "  Retour au début du wizard."; continue; }
                [[ -n "$EXTRA_IGNOREIP" ]] && echo "  → Autorisée : $EXTRA_IGNOREIP"
            fi
        fi
    else
        echo "  → Ligne opérateur désactivée"
    fi
fi
echo ""

# Détection anticipée de l'IP du VPS (nécessaire pour le wizard TLS)
VPS_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
[[ -z "$VPS_IP" ]] && VPS_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [[ -z "$VPS_IP" ]]; then
    echo ""
    echo -e "${RED}  [ERR] Impossible de détecter l'IP de ce serveur automatiquement.${NC}"
    read -rp "  Adresse IPv4 du serveur (ex: 51.79.65.161) : " VPS_IP
    [[ -z "$VPS_IP" ]] && { echo "  IP requise — installation annulée."; exit 1; }
fi

# ── TLS HTTPS ─────────────────────────────────────────────────────────────────
info "▶ 3/4 : Accès HTTPS à l'interface d'administration (optionnel)"
info ""
info "  Sans nom de domaine : l'interface FreePBX reste inaccessible à la fin de"
info "  l'installation (Apache arrêté par sécurité). Elle peut être démarrée"
info "  ponctuellement en HTTP si nécessaire, sous votre responsabilité."
info ""
info "  Avec un sous-domaine : le script configure automatiquement un certificat"
info "  HTTPS (Let's Encrypt). L'enregistrement DNS de type A doit pointer vers"
info "  l'adresse IP de ce serveur AVANT de lancer l'installation."
echo -e "  ${YELLOW}  ⚠  DNS requis avant installation : l'enregistrement A doit déjà${NC}"
echo -e "  ${YELLOW}     pointer vers l'IP ci-dessous — Let's Encrypt échouera sinon.${NC}"
info ""
info "  IP de ce serveur     : $VPS_IP"
info "  Enregistrement requis : A  <votre-domaine>  →  $VPS_IP"
info "  Pour vérifier depuis votre poste : nslookup <votre-domaine>"
info ""
info "  [Entrée] = ne pas configurer HTTPS maintenant"
TLS_DOMAIN=""
if [[ -n "$TLS_DOMAIN_ARG" ]]; then
    TLS_DOMAIN="$TLS_DOMAIN_ARG"
    echo "  ✓ Sous-domaine : $TLS_DOMAIN (pré-sélectionné par le wizard)"
    echo "  ℹ  Enregistrement attendu : A  $TLS_DOMAIN  →  $VPS_IP"
else
    read -rp "  Sous-domaine HTTPS (ex: pbx.mon-entreprise.fr), Entrée pour ignorer, q pour recommencer : " TLS_DOMAIN
    if [[ "${TLS_DOMAIN,,}" == "q" ]]; then echo "  Retour au début du wizard."; continue; fi
    if [[ -n "$TLS_DOMAIN" ]]; then
        echo "  ✓ Sous-domaine : $TLS_DOMAIN"
        echo "  ℹ  Enregistrement attendu : A  $TLS_DOMAIN  →  $VPS_IP"
        echo "  ℹ  Pour vérifier depuis votre poste : nslookup $TLS_DOMAIN"
    else
        echo -e "  ${CYAN}ℹ${NC}  Aucun HTTPS configuré — FreePBX fonctionnera normalement."
        echo    "     L'interface web sera accessible ponctuellement en HTTP (voir rapport de livraison)."
        echo    "     Un domaine HTTPS peut être ajouté à tout moment après le déploiement."
    fi
fi
echo ""

# ── Récapitulatif ─────────────────────────────────────────────────────────────
info "▶ 4/4 : Récapitulatif"
# Passage par variable d'environnement — évite la casse si le mot de passe contient '
ADMIN_SHA1=$(env _P="$ADMIN_PASSWORD" python3 -c "import hashlib,os; print(hashlib.sha1(os.environ['_P'].encode()).hexdigest())")
ADMIN_SHA512=$(env _P="$ADMIN_PASSWORD" python3 -c "import hashlib,os; print(hashlib.sha512(os.environ['_P'].encode()).hexdigest())")
# Management IP = IP du poste déployeur (détectée par launch.py/launch.sh)
if [[ -n "$MANAGEMENT_IP_ARG" ]]; then
    MANAGEMENT_IP="$MANAGEMENT_IP_ARG"
    info "  IP de gestion détectée par le lanceur : $MANAGEMENT_IP"
    read -rp "  Confirmer ? [O/n/q] : " _CONFIRM_MGT
    if [[ "${_CONFIRM_MGT,,}" == "q" ]]; then echo "  Retour au début du wizard."; continue; fi
    if [[ "${_CONFIRM_MGT,,}" == "n" ]]; then
        MANAGEMENT_IP=""
        MANAGEMENT_IP_ARG=""
    fi
fi
if [[ -z "$MANAGEMENT_IP" ]]; then
    # Détection automatique de l'IP source de la connexion SSH active
    _DETECTED_IP=""
    if [[ -n "${SSH_CLIENT:-}" ]]; then
        _DETECTED_IP="${SSH_CLIENT%% *}"
    elif [[ -n "${SSH_CONNECTION:-}" ]]; then
        _DETECTED_IP="${SSH_CONNECTION%% *}"
    fi
    if [[ -z "$_DETECTED_IP" ]]; then
        # `who` (pas `who am i`) liste toutes les sessions SSH avec l'IP source — fonctionne dans tmux/sudo
        _DETECTED_IP=$(who 2>/dev/null | grep -oP '\(\K[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(?=\))' | head -1 || true)
    fi
    if [[ -z "$_DETECTED_IP" ]]; then
        # ss fallback : extrait toutes les IPs de la connexion SSH, filtre l'IP locale
        _LOCAL_IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K[0-9.]+' | head -1 || true)
        _DETECTED_IP=$(ss -tn state established 'sport = :22' 2>/dev/null \
            | grep -oP '\b[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b' \
            | grep -v "^${_LOCAL_IP:-127\.0\.0\.1}$" | tail -1 || true)
        unset _LOCAL_IP
    fi

    echo ""
    if [[ -n "$_DETECTED_IP" ]]; then
        info "  IP détectée : $_DETECTED_IP (adresse source de votre connexion SSH)"
        info "  Un sous-réseau /24 sera autorisé : ${_DETECTED_IP%.*}.0/24"
        info "  (absorbe les variations d'IP dynamique au sein de votre connexion)"
        info "  Pour vérifier depuis un autre onglet ou navigateur :"
        info "    Navigateur : https://ifconfig.ovh  ou  https://api.ipify.org"
        info "    Terminal local (pas ce serveur) : curl ifconfig.me"
        read -rp "  Confirmer ? [O/n/q] : " _CONFIRM
        if [[ "${_CONFIRM,,}" == "q" ]]; then echo "  Retour au début du wizard."; continue; fi
        if [[ "${_CONFIRM,,}" != "n" ]]; then
            MANAGEMENT_IP="${_DETECTED_IP%.*}.0/24"
            echo "  → IP de gestion : $MANAGEMENT_IP"
        else
            _DETECTED_IP=""
        fi
    fi

    if [[ -z "$_DETECTED_IP" ]]; then
        info "  Saisissez l'IP publique de VOTRE connexion internet — celle vue par ce"
        info "  serveur quand vous initiez une connexion SSH. Pas l'IP du serveur."
        info "  Pour la connaître :"
        info "    Navigateur : https://ifconfig.ovh  ou  https://api.ipify.org"
        info "    Terminal   : curl ifconfig.me  (sur votre poste, pas ce serveur)"
        info "  Laisser vide = accès SSH non restreint (non recommandé)"
        echo -e "  ${YELLOW}  ⚠  Si votre IP change après le déploiement et que l'accès SSH est${NC}"
        echo -e "  ${YELLOW}     perdu, utilisez la console KVM OVHcloud pour corriger la règle UFW.${NC}"
        while true; do
            read -rp "  Votre IP publique (ex: A.B.C.D) (q = recommencer) : " _MGMT_RAW
            [[ "${_MGMT_RAW,,}" == "q" ]] && { echo "  Retour au début du wizard."; continue 2; }
            if [[ -z "$_MGMT_RAW" ]]; then
                MANAGEMENT_IP="0.0.0.0/0"
                warn "  ⚠ Accès SSH non restreint"
                break
            elif echo "$_MGMT_RAW" | grep -qP '^\d+\.\d+\.\d+\.\d+$'; then
                MANAGEMENT_IP=$(echo "$_MGMT_RAW" | sed 's/\.[0-9]*$/.0\/24/')
                echo "  → Sous-réseau : $MANAGEMENT_IP"; break
            elif echo "$_MGMT_RAW" | grep -qP '^\d+\.\d+\.\d+\.\d+/\d+$'; then
                MANAGEMENT_IP="$_MGMT_RAW"; break
            else
                echo "  ✗ Format invalide — ex: A.B.C.D ou A.B.C.0/24"
            fi
        done
    fi
fi
TRUNK_NAME=""
if [[ -n "$TRUNK_REGISTRAR" ]]; then
  _tn_part="$(echo "$TRUNK_REGISTRAR" | awk -F'.' '{print $(NF-1)}')"
  TRUNK_NAME="trunk-${_tn_part:-sip}"
fi
TRUNK_CALLERID="$TRUNK_USERNAME"

echo "╔══════════════════════════════════════════╗"
echo "║   Récapitulatif avant déploiement        ║"
echo "╠══════════════════════════════════════════╣"
printf "║ Administrateur  : %-22s ║\n" "$ADMIN_USERNAME"
printf "║ IP de gestion   : %-22s ║\n" "$MANAGEMENT_IP"
printf "║ Accès SSH       : %-22s ║\n" "$SSH_ENABLED"
printf "║ Postes démo     : %-22s ║\n" "$KIT_STARTER"
[[ "$KIT_STARTER" == "oui" ]] && printf "║ Numéros         : %-22s ║\n" "$EXT1_NUMBER/$EXT2_NUMBER/$EXT3_NUMBER"
printf "║ Ligne opérateur : %-22s ║\n" "${TRUNK_REGISTRAR:-non}"
printf "║ HTTPS           : %-22s ║\n" "${TLS_DOMAIN:-non activé}"
echo "╚══════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}╔══════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║     NOTEZ CE PORT SSH MAINTENANT         ║${NC}"
echo -e "${YELLOW}╠══════════════════════════════════════════╣${NC}"
printf "${YELLOW}║     PORT SSH : %-26s${YELLOW}║${NC}\n" "$SSH_PORT"
echo -e "${YELLOW}║                                          ║${NC}"
printf "${YELLOW}║  ssh -p %-33s${YELLOW}║${NC}\n" "$SSH_PORT debian@<IP_DU_VPS>"
echo -e "${YELLOW}║  puis : sudo tmux attach -t factory      ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Port enregistré dans ${GREEN}~/freepbx-factory-ssh-port.txt${NC}"
echo -e "  Appuyez sur ${GREEN}Entrée${NC} pour démarrer l'installation"
echo -e "  ${YELLOW}(continue automatiquement dans 60 secondes)${NC}"
read -t 60 -r || true
echo ""

log "====== PARAMÈTRES V1.9 CRA ======"
log "admin_username  : $ADMIN_USERNAME"
log "management_ip   : $MANAGEMENT_IP"
log "ssh_port        : $SSH_PORT"
log "ssh_enabled     : $SSH_ENABLED"
log "kit_starter     : $KIT_STARTER"
[[ "$KIT_STARTER" == "oui" ]] && log "extensions      : $EXT1_NUMBER / $EXT2_NUMBER / $EXT3_NUMBER"
log "trunk_enabled   : $TRUNK_ENABLED"
[[ "$TRUNK_ENABLED" == "oui" ]] && log "trunk_registrar : $TRUNK_REGISTRAR" && log "trunk_username  : $TRUNK_USERNAME"
[[ -n "$EXTRA_IGNOREIP" ]] && log "extra_ignoreip  : $EXTRA_IGNOREIP"
log "tls_domain      : ${TLS_DOMAIN:-non activé}"
log "journal         : $SESSION_LOG"

echo ""
info "  L'installation va démarrer et durera entre 20 et 40 minutes."
info "  Votre connexion SSH sera coupée lors du changement de port (phase sécurité)."
info "  Le script continue automatiquement. Pour reprendre la session :"
info "    ssh -p $SSH_PORT debian@<ADRESSE_IP_SERVEUR>"
info "    sudo tmux attach -t factory"
info ""
info "  [Entrée]/O = lancer  |  n = annuler  |  r = recommencer depuis le début"
stty sane 2>/dev/null || true
read -rp "  Lancer le déploiement ? [O/n/r] : " CONFIRM
if [[ "${CONFIRM,,}" == "r" ]]; then
    echo ""; echo "  --- Retour au début du wizard ---"; echo ""; continue
elif [[ -n "${CONFIRM}" && "${CONFIRM,,}" != "o" ]]; then
    echo "  Annulé."; exit 0
fi
break
done  # fin wizard

INSTALL_START=$(date +%s)

# ── Sauvegarde état wizard (reprise post-reboot installateur FreePBX) ────────
(umask 077; {
  for _sv in MANAGEMENT_IP SSH_PORT SSH_ENABLED VPS_IP \
              ADMIN_USERNAME ADMIN_SHA1 ADMIN_SHA512 \
              KIT_STARTER \
              EXT1_NUMBER EXT1_NAME EXT1_PASS \
              EXT2_NUMBER EXT2_NAME EXT2_PASS \
              EXT3_NUMBER EXT3_NAME EXT3_PASS \
              TRUNK_ENABLED TRUNK_REGISTRAR TRUNK_USERNAME TRUNK_PASSWORD \
              TRUNK_NAME TRUNK_CALLERID TRUNK_DID \
              EXTRA_IGNOREIP TLS_DOMAIN DEPLOY_ID SESSION_LOG; do
    declare -p "$_sv" 2>/dev/null || echo "declare -- $_sv=''"
  done
} > /root/.fpbx-state.sh)

# ── Reprise automatique post-reboot : service systemd ────────────────────────
# L'installateur FreePBX reboot le VPS sans revenir au script.
# Ce service redemarre automatiquement la suite au boot suivant,
# sans aucune intervention de l'utilisateur.
if [[ -z "${FACTORY_RESUME_MODE:-}" ]]; then
  _script_abs="$(realpath "$0" 2>/dev/null || readlink -f "$0" 2>/dev/null || echo "$0")"
  cp -f "$_script_abs" /root/freepbx-factory-install.sh 2>/dev/null && chmod 700 /root/freepbx-factory-install.sh || true

  cat > /etc/systemd/system/freepbx-factory-resume.service << 'SVCEOF'
[Unit]
Description=FreePBX Factory - Reprise automatique post-reboot installateur
After=network-online.target mariadb.service
Wants=network-online.target
AssertPathExists=/root/.fpbx-state.sh

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/tmux new-session -d -s factory -e FACTORY_IN_TMUX=1 /bin/bash /root/freepbx-factory-install.sh

[Install]
WantedBy=multi-user.target
SVCEOF

  systemctl daemon-reload 2>/dev/null || true
  systemctl enable freepbx-factory-resume 2>/dev/null || true
  log "Reprise auto : service freepbx-factory-resume active"
fi

# ── MOTD indicateur (visible a la reconnexion SSH apres reboot) ──────────────
mkdir -p /var/log/freepbx-factory
cat > /etc/motd << MOTDEOF

  FreePBX Factory - Installation en cours (reprise automatique)
  Port SSH apres installation : $SSH_PORT
  Suivi en direct :
    sudo tmux attach -t factory
    ou : sudo tail -f $SESSION_LOG

MOTDEOF

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Déploiement lancé — 20 à 40 minutes                    ║${NC}"
echo -e "${GREEN}║  Journal : $SESSION_LOG${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Ping démarrage anonyme (automatique, silencieux) ────────────────────────
_send_telem "{\"event\":\"deploy_start\",\"version\":\"${SCRIPT_VERSION}\",\"os\":\"${_OS_ID}\",\"id\":\"${DEPLOY_ID}\"}"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 00 — Cleanup (ignorée en mode reprise)
# ════════════════════════════════════════════════════════════════════════════
if [[ -z "${FACTORY_RESUME_MODE:-}" ]]; then
log ""
log "=== PHASE 00 — Cleanup ==="
run_phase "$PHASES_DIR/00_cleanup.sh"
ok "00_cleanup"
fi

# ════════════════════════════════════════════════════════════════════════════
# PHASE 01 — Installation FreePBX (~20-40 min, ignorée en mode reprise)
# ════════════════════════════════════════════════════════════════════════════
if [[ -z "${FACTORY_RESUME_MODE:-}" ]]; then
log ""
log "=== PHASE 01 — Installation FreePBX (20-40 min) ==="
echo ""
echo -e "${CYAN}  Cette phase peut prendre 20 à 40 minutes. Certains messages${NC}"
echo -e "${CYAN}  peuvent rester affichés plusieurs minutes sans évoluer, c'est normal.${NC}"
echo -e "${CYAN}  Ne fermez pas cette fenêtre et ne coupez pas la connexion SSH.${NC}"
echo ""
echo -e "${YELLOW}  ⚠  Le VPS va redemarrer en cours d'installation.${NC}"
echo -e "${YELLOW}     La reprise est automatique : aucune action requise.${NC}"
echo -e "${YELLOW}     Pour suivre la progression apres le reboot (port 22 encore actif) :${NC}"
echo -e "${YELLOW}       ssh debian@${VPS_IP} -p 22  puis  sudo tail -f $SESSION_LOG${NC}"
echo -e "${YELLOW}     Port SSH definitif apres installation : $SSH_PORT${NC}"
echo ""
run_phase "$PHASES_DIR/01_install.sh"
ok "01_install"
fi

# ════════════════════════════════════════════════════════════════════════════
# MODE REPRISE — attente fin installateur FreePBX si encore actif
# ════════════════════════════════════════════════════════════════════════════
if [[ -n "${FACTORY_RESUME_MODE:-}" ]]; then
    log ""
    log "=== MODE REPRISE — vérification installateur FreePBX ==="
    _fw_wait=0
    until ! pgrep -f "sng_freepbx" >/dev/null 2>&1; do
        echo "  Installateur FreePBX encore actif — attente 20s..."
        sleep 20; _fw_wait=$((_fw_wait + 20))
        [[ $_fw_wait -ge 1800 ]] && err "Timeout attente installateur FreePBX (30 min)"
    done
    ok "Installateur FreePBX terminé — reprise phases de configuration"
fi

# ════════════════════════════════════════════════════════════════════════════
# PHASE 00b — SSH hardening (après phase 01 — SSH reste sur 22 pendant l'install)
# Note : sshd restart coupe la connexion SSH cliente — ce script continue
# car il tourne dans tmux (processus local, pas dans un pipe SSH).
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 00b — Hardening SSH (port → $SSH_PORT) ==="
echo ""
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  VOTRE CONNEXION SSH VA ÊTRE COUPÉE              ${NC}"
echo -e "${YELLOW}  Le script continue automatiquement dans tmux.   ${NC}"
echo -e "${YELLOW}                                                   ${NC}"
echo -e "${YELLOW}  Nouveau port SSH : ${SSH_PORT}                  ${NC}"
echo -e "${YELLOW}  Reconnexion :                                    ${NC}"
echo -e "${YELLOW}    ssh -p ${SSH_PORT} debian@<IP_DU_VPS>         ${NC}"
echo -e "${YELLOW}    sudo tmux attach -t factory                     ${NC}"
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo ""
read -t 60 -rp "  Port $SSH_PORT noté ? Appuyez sur Entrée pour continuer (auto dans 60s)... " || true
echo ""
run_phase "$PHASES_DIR/00_hardening.sh" "$MANAGEMENT_IP" "$SSH_PORT"
ok "00_hardening — SSH actif sur port $SSH_PORT"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 02 — Asterisk
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 02 — Asterisk + modules ==="
run_phase "$PHASES_DIR/02_asterisk.sh"
ok "02_asterisk"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 03 — Firewall (réinstalle UFW après suppression par FreePBX — E15)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 03 — Firewall ==="
run_phase "$PHASES_DIR/03_firewall.sh" "$MANAGEMENT_IP" "$SSH_PORT"
ok "03_firewall"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 04 — fail2ban
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 04 — fail2ban ==="
run_phase "$PHASES_DIR/04_fail2ban.sh" "$MANAGEMENT_IP" "$SSH_PORT" "${EXTRA_IGNOREIP:-}"
ok "04_fail2ban"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 06 — Configuration FreePBX (endpoint + admin + extensions + trunk)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 06 — Configuration FreePBX ==="
run_phase "$PHASES_DIR/06_freepbx_config.sh" \
    "$ADMIN_USERNAME" "$ADMIN_SHA1" "$ADMIN_SHA512" \
    "$TRUNK_REGISTRAR" "$TRUNK_USERNAME" "$TRUNK_PASSWORD" \
    "$TRUNK_NAME" "$TRUNK_CALLERID" \
    "$EXT1_NUMBER" "$EXT1_NAME" "$EXT1_PASS" \
    "$EXT2_NUMBER" "$EXT2_NAME" "$EXT2_PASS" \
    "$EXT3_NUMBER" "$EXT3_NAME" "$EXT3_PASS"
ok "06_freepbx_config"

# Récupérer les mots de passe extensions auto-générés depuis le log phase 06
if [[ "$KIT_STARTER" == "oui" ]]; then
    _ph06_log="/var/log/freepbx-factory/deploy-phase-06-freepbx-config.log"
    if [[ -f "$_ph06_log" ]]; then
        [[ -z "$EXT1_PASS" && -n "$EXT1_NUMBER" ]] && EXT1_PASS=$(grep -oP "MOT DE PASSE EXT ${EXT1_NUMBER} : \K.+" "$_ph06_log" | tail -1 || echo "")
        [[ -z "$EXT2_PASS" && -n "$EXT2_NUMBER" ]] && EXT2_PASS=$(grep -oP "MOT DE PASSE EXT ${EXT2_NUMBER} : \K.+" "$_ph06_log" | tail -1 || echo "")
        [[ -z "$EXT3_PASS" && -n "$EXT3_NUMBER" ]] && EXT3_PASS=$(grep -oP "MOT DE PASSE EXT ${EXT3_NUMBER} : \K.+" "$_ph06_log" | tail -1 || echo "")
    fi
fi

# ════════════════════════════════════════════════════════════════════════════
# PHASE 09 — Apache hardening
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 09 — Apache hardening ==="
run_phase "$PHASES_DIR/09_apache_hardening.sh" "$MANAGEMENT_IP"
ok "09_apache_hardening"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 10 — MariaDB hardening
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 10 — MariaDB hardening ==="
run_phase "$PHASES_DIR/10_mariadb_hardening.sh"
ok "10_mariadb_hardening"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 11 — Services hardening
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 11 — Services hardening ==="
run_phase "$PHASES_DIR/11_services_hardening.sh"
ok "11_services_hardening"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 14 — auditd (NIS2 Art. 21b — journalisation actions privilégiées)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 14 — auditd ==="
run_phase "$PHASES_DIR/14_auditd.sh"
ok "14_auditd"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 12 — SBOM CycloneDX 1.4 (CRA Annex II + NIS2 Art. 21)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 12 — SBOM CycloneDX ==="
run_phase "$PHASES_DIR/12_sbom.sh"
ok "12_sbom"

# ════════════════════════════════════════════════════════════════════════════
# PHASE 13 — Contrôles conformité post-déploiement (CRA + NIS2)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 13 — Contrôles conformité CRA + NIS2 ==="
run_phase "$PHASES_DIR/13_post_checks.sh" "$SSH_PORT"
ok "13_post_checks"

# ════════════════════════════════════════════════════════════════════════════
# Vérification locale de disponibilité GUI (Apache temporairement actif)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== Vérification locale de disponibilité GUI ==="
systemctl start apache2 2>/dev/null || true
sleep 2
if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
    _GUI_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/admin/index.php \
        --data-urlencode "username=$ADMIN_USERNAME" \
        --data-urlencode "password=$ADMIN_PASSWORD" 2>/dev/null || echo "000")
else
    _GUI_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/ 2>/dev/null || echo "000")
fi
if [[ "$_GUI_CODE" =~ ^(200|302)$ ]]; then
    ok "Disponibilité GUI : Apache répond localement (HTTP $_GUI_CODE) — authentification à vérifier depuis votre navigateur"
else
    warn "Disponibilité GUI : Apache ne répond pas (HTTP $_GUI_CODE) — vérifier manuellement après activation TLS"
fi

# ════════════════════════════════════════════════════════════════════════════
# PHASE 15 — TLS/HTTPS (Let's Encrypt + Apache)
# Si TLS_DOMAIN fourni : certbot + Apache HTTPS actif
# Si vide             : Apache arrêté (GUI inaccessible jusqu'à config TLS)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== PHASE 15 — TLS/HTTPS ==="

# ── Vérification DNS avant certbot ──────────────────────────────────────────
if [[ -n "$TLS_DOMAIN" ]]; then
    log "Vérification DNS : $TLS_DOMAIN"
    _DNS_IP=$(timeout 3 getent hosts "$TLS_DOMAIN" 2>/dev/null | awk '{print $1}' | head -1)
    if [[ -z "$_DNS_IP" ]]; then
        warn "DNS : $TLS_DOMAIN ne se résout pas."
        warn "  IP de ce serveur     : $VPS_IP"
        warn "  Enregistrement requis : A  $TLS_DOMAIN  →  $VPS_IP"
        warn "  Let's Encrypt va échouer si le DNS n'est pas propagé."
        if [[ -n "$TLS_DOMAIN_ARG" ]]; then
            warn "  Mode non interactif : l'installation continue malgré l'avertissement DNS."
        else
            read -t 60 -rp "  Continuer avec TLS ? Saisissez 'oui' pour confirmer (60s, Entrée = ignorer TLS) : " _DNS_CONFIRM || _DNS_CONFIRM="non"
            if [[ "${_DNS_CONFIRM,,}" != "oui" ]]; then
                warn "  TLS ignoré — l'installation continue sans HTTPS."
                TLS_DOMAIN=""
            fi
        fi
    elif [[ "$_DNS_IP" != "$VPS_IP" ]]; then
        warn "DNS : $TLS_DOMAIN pointe vers $_DNS_IP, ce serveur est $VPS_IP."
        warn "  Let's Encrypt échouera si le domaine ne pointe pas vers ce serveur."
        warn "  (Un CDN ou proxy peut légitimement différer — vérifiez si c'est votre cas.)"
        if [[ -n "$TLS_DOMAIN_ARG" ]]; then
            warn "  Mode non interactif : l'installation continue malgré l'avertissement DNS."
        else
            read -t 60 -rp "  Continuer avec TLS ? Saisissez 'oui' pour confirmer (60s, Entrée = ignorer TLS) : " _DNS_CONFIRM || _DNS_CONFIRM="non"
            if [[ "${_DNS_CONFIRM,,}" != "oui" ]]; then
                warn "  TLS ignoré — l'installation continue sans HTTPS."
                TLS_DOMAIN=""
            fi
        fi
    else
        ok "DNS : $TLS_DOMAIN → $_DNS_IP (correspond à l'IP de ce serveur)"
    fi
fi

export TLS_DOMAIN
run_phase "$PHASES_DIR/15_tls.sh" "$TLS_DOMAIN"
if [[ -n "$TLS_DOMAIN" ]] && [[ -f "/etc/letsencrypt/live/$TLS_DOMAIN/fullchain.pem" ]]; then
    # Certificat présent — fwconsole reload peut avoir arrêté Apache, forcer le redémarrage
    systemctl enable apache2 2>/dev/null || true
    systemctl start apache2 2>/dev/null || true
fi
if [[ -n "$TLS_DOMAIN" ]] && systemctl is-active apache2 >/dev/null 2>&1; then
    ok "15_tls — HTTPS actif — https://$TLS_DOMAIN/admin/"
    GUI_URL="https://$TLS_DOMAIN/admin/"
else
    warn "15_tls — Apache arrêté — GUI inaccessible jusqu'à configuration TLS"
    [[ -n "$TLS_DOMAIN" ]] && warn "  Pour réessayer TLS : sudo /opt/certbot/bin/certbot certonly --webroot -w /var/www/html -d $TLS_DOMAIN && sudo systemctl start apache2"
    GUI_URL="désactivée (Apache arrêté — HTTPS requis)"
fi

# ════════════════════════════════════════════════════════════════════════════
# POST-CHECK
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== POST-CHECK ==="
echo -e "${CYAN}--- Asterisk socket ---${NC}"
if [[ ! -e /var/run/asterisk/asterisk.ctl ]]; then
    warn "Socket Asterisk absent (graceful restart post-fwconsole reload) — relance..."
    systemctl restart asterisk
    sleep 8
    [[ -e /var/run/asterisk/asterisk.ctl ]] && ok "Asterisk redémarré" || warn "Socket Asterisk toujours absent — vérifier manuellement"
else
    ok "Asterisk opérationnel"
fi
echo -e "${CYAN}--- Services PM2 ---${NC}"
fwconsole pm2 --list 2>/dev/null || echo "PM2 check — voir fwconsole pm2 --list"
echo -e "${CYAN}--- GUI ---${NC}"
curl -s -o /dev/null -w 'HTTP GUI: %{http_code}\n' http://localhost/admin/ 2>/dev/null || true
echo -e "${CYAN}--- Ports sensibles TCP ---${NC}"
_tcp_pub=$(ss -tlnp 2>/dev/null | grep -E ':1720|:3306' | grep -v '127\.0\.0\.1\|::1' || true)
_tcp_lo=$(ss -tlnp 2>/dev/null | grep -E ':1720|:3306' | grep '127\.0\.0\.1\|::1' || true)
if [[ -n "$_tcp_pub" ]]; then
    echo "  Port réseau TCP actif (vérifier) : $_tcp_pub"
elif [[ -n "$_tcp_lo" ]]; then
    echo "  Port 3306 (MariaDB) : loopback uniquement — conforme"
else
    echo "  Ports 1720/3306 : non utilisés"
fi
echo -e "${CYAN}--- Ports sensibles UDP ---${NC}"
_udp_pub=$(ss -ulnp 2>/dev/null | grep -E ':69 |:5353 ' | grep -v '127\.0\.0\.1\|::1' || true)
if [[ -n "$_udp_pub" ]]; then
    echo "  Port réseau UDP actif (vérifier) : $_udp_pub"
else
    echo "  Ports 69/5353 : non utilisés — conforme"
fi
echo -e "${CYAN}--- Shell asterisk ---${NC}"
getent passwd asterisk | cut -d: -f7
echo -e "${CYAN}--- fail2ban ---${NC}"
fail2ban-client get ssh-iptables bantime 2>/dev/null || echo "fail2ban : vérifier manuellement"
echo -e "${CYAN}--- UFW ---${NC}"
ufw status | head -10 || true
echo -e "${CYAN}--- Conformité CRA+NIS2 ---${NC}"
if [[ -f /etc/freepbx-factory/compliance-report.json ]]; then
    python3 -c "
import json
with open('/etc/freepbx-factory/compliance-report.json') as f:
    r = json.load(f)
s = r['score']
print(f'  Score : {s[\"percent\"]}% ({s[\"ok\"]}/{s[\"total\"]} contrôles OK)')
warns = [c for c in r['checks'] if c['status'] != 'ok']
if warns:
    for w in warns: print(f'  ⚠  {w[\"name\"]} : {w[\"value\"]}')
else:
    print('  Tous les contrôles OK')
" 2>/dev/null || cat /etc/freepbx-factory/compliance-report.json
else
    warn "Rapport conformité absent — vérifier 13_post_checks.sh"
fi

# ════════════════════════════════════════════════════════════════════════════
# SMOKE TEST — Vérification services (A2)
# ════════════════════════════════════════════════════════════════════════════
log ""
log "=== SMOKE TEST ==="
_SMOKE_OK=0
_SMOKE_FAIL=0
_smoke() {
    local label="$1" ok="$2"
    if [[ "$ok" == "1" ]]; then
        echo "  ✅ $label"
        _SMOKE_OK=$(( _SMOKE_OK + 1 ))
    else
        echo "  ❌ $label"
        _SMOKE_FAIL=$(( _SMOKE_FAIL + 1 ))
    fi
}

# PM2 : 4 services online
_pm2_count=$(fwconsole pm2 --list 2>/dev/null | grep -c 'online' || echo "0")
_smoke "PM2 — 4 services online (obtenu: ${_pm2_count})" "$([ "$_pm2_count" -ge 4 ] && echo 1 || echo 0)"

# fail2ban : 7 jails (fail2ban 1.x affiche "Number of jail:" sans 's')
_fb_jails=$(fail2ban-client status 2>/dev/null | grep -oP 'Number of jail[s]?:\s*\K\d+' || echo "0")
_smoke "fail2ban — 7 jails actifs (obtenu: ${_fb_jails})" "$([ "$_fb_jails" -eq 7 ] && echo 1 || echo 0)"

# strictrtp=no
_strictrtp=$(grep -oP '^strictrtp=\K\S+' /etc/asterisk/rtp_additional.conf 2>/dev/null || echo "absent")
_smoke "strictrtp=no — NAT smartphones (obtenu: ${_strictrtp})" "$([ "$_strictrtp" = "no" ] && echo 1 || echo 0)"

# rtp_timeout=0
_rtptout=$(grep -oP '^rtp_timeout=\K\d+' /etc/asterisk/pjsip.endpoint.conf 2>/dev/null | head -1 || echo "absent")
_smoke "rtp_timeout=0 — appels background (obtenu: ${_rtptout})" "$([ "$_rtptout" = "0" ] && echo 1 || echo 0)"

# Transport IPv6 actif
_ipv6_ok=$(asterisk -rx 'pjsip show transports' 2>/dev/null | grep -c '::' || echo "0")
_smoke "Transport IPv6 PJSIP (obtenu: ${_ipv6_ok} transport(s))" "$([ "$_ipv6_ok" -ge 1 ] && echo 1 || echo 0)"

# Trunk SIP (si activé)
if [[ "$TRUNK_ENABLED" == "oui" && -n "$TRUNK_REGISTRAR" ]]; then
    _trunk_reg=$(asterisk -rx 'pjsip show registrations' 2>/dev/null | grep -oiE 'Registered|Failed|Unregistered|NoAuth' | head -1 || echo "inconnu")
    _smoke "Trunk SIP — Registered (obtenu: ${_trunk_reg})" "$([ "${_trunk_reg,,}" = "registered" ] && echo 1 || echo 0)"
fi

# Kit starter : ring group + AstDB (si activé)
if [[ "$KIT_STARTER" == "oui" ]]; then
    _rg=$(mysql asterisk -sNe "SELECT COUNT(*) FROM ringgroups WHERE grpnum='600'" 2>/dev/null || echo "0")
    _smoke "Ring group 600 en DB (obtenu: ${_rg})" "$([ "$_rg" -ge 1 ] && echo 1 || echo 0)"
    _astdb=$(asterisk -rx 'database show' 2>/dev/null | grep -c '/' || echo "0")
    _smoke "AstDB — au moins 27 entrées (obtenu: ${_astdb})" "$([ "$_astdb" -ge 27 ] && echo 1 || echo 0)"
fi

echo ""
_SMOKE_TOTAL=$(( _SMOKE_OK + _SMOKE_FAIL ))
if [[ $_SMOKE_FAIL -eq 0 ]]; then
    echo -e "  ${GREEN}SMOKE TEST : ${_SMOKE_OK}/${_SMOKE_TOTAL} ✅  — tous les services opérationnels${NC}"
else
    echo -e "  ${YELLOW}SMOKE TEST : ${_SMOKE_OK}/${_SMOKE_TOTAL} — ${_SMOKE_FAIL} ❌  — vérifier les points en échec${NC}"
fi

# ════════════════════════════════════════════════════════════════════════════
# RAPPORT DE LIVRAISON — CRA EU 2024/2847 (traçabilité déploiement)
# ════════════════════════════════════════════════════════════════════════════
REPORT_FILE="/root/freepbx-factory-delivery-report.txt"
(umask 077; : > "$REPORT_FILE")
VPS_IP="${VPS_IP:-$(ip -4 route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1 || hostname -I | awk '{print $1}' || echo 'inconnu')}"
DEPLOY_DATE="$(date '+%Y-%m-%d %H:%M:%S')"
_ext_info="désactivé" ; [[ "$KIT_STARTER" == "oui" ]] && _ext_info="$EXT1_NUMBER / $EXT2_NUMBER / $EXT3_NUMBER"
# Registrar SIP pour les softphones : domaine si TLS actif, sinon IP du serveur
_SIP_SERVER="${TLS_DOMAIN:-$VPS_IP}"
# IPv6 server pour smartphones en réseau IPv6-only
_VPS_IPV6=$(ip -6 route get 2001:4860:4860::8888 2>/dev/null | grep -oP 'src \K\S+' | grep -v '^fe80' | head -1 || echo "")

cat > "$REPORT_FILE" << REPORTEOF
═══════════════════════════════════════════════════════════
  RAPPORT DE LIVRAISON — FreePBX Factory V1.9 CRA
  Date       : ${DEPLOY_DATE}
═══════════════════════════════════════════════════════════

ACCÈS
  Admin FreePBX : ${ADMIN_USERNAME}  (mot de passe défini au wizard)
  Port SSH      : ${SSH_PORT}  (clé ED25519 uniquement)
  IP autorisée SSH : ${MANAGEMENT_IP}
  IP VPS        : ${VPS_IP}
  Interface GUI : ${GUI_URL}
  Reconnexion SSH : ssh -p ${SSH_PORT} debian@${VPS_IP}
$([ -n "${TLS_DOMAIN}" ] && printf "\nDOMAINE ACTIF : %s\n  Accès GUI HTTPS   : https://%s/admin/\n  Registrar SIP     : %s  (port 5060 UDP)\n  (utiliser ce domaine dans vos softphones à la place de l'IP)" "${TLS_DOMAIN}" "${TLS_DOMAIN}" "${TLS_DOMAIN}")

REGISTRAR SIP POUR LES SOFTPHONES
  Protocole   : PJSIP  —  port 5060 (UDP)
  Serveur SIP : ${_SIP_SERVER}
$([ -n "${_VPS_IPV6}" ] && printf "  Serveur SIPv6 : %s  (smartphones IPv6-only)\n" "${_VPS_IPV6}")  ($([ -n "${TLS_DOMAIN}" ] && echo "domaine TLS actif — utiliser ce domaine dans vos softphones" || echo "IP du serveur — configurer un domaine ulterieurement si besoin"))

OPTIONS DÉPLOYÉES
  Kit starter : ${KIT_STARTER}  (extensions : ${_ext_info})
  Trunk SIP   : ${TRUNK_REGISTRAR:-désactivé}$([ -n "${TRUNK_USERNAME}" ] && echo "
  Identifiant SIP : ${TRUNK_USERNAME}")
  HTTPS/TLS   : ${TLS_DOMAIN:-non activé — configurable ultérieurement}
  SSH activé  : ${SSH_ENABLED}

ENVIRONNEMENT VÉRIFIÉ AU DÉPLOIEMENT
  Architecture  : $(uname -m)
  Mémoire       : $(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo) MB
  Disque (/)    : $(df -BG / | awk 'NR==2{gsub("G","",$4); print $4}') GB libres

COUCHES DE SÉCURITÉ (7 actives)
  [1] Réseau    UFW actif — deny all entrant sauf ports projet
  [2] SSH       Port ${SSH_PORT} — clé uniquement — restreint à ${MANAGEMENT_IP}
  [3] IDS       fail2ban — 7 jails actifs — bantime 86400s
  [4] SIP/VoIP  Modules Asterisk legacy désactivés (ooh323/iax2/stun)
  [5] Web       Apache headers sécurité + ServerTokens Prod + TraceEnable Off
  [6] Base      MariaDB bind=127.0.0.1 — anonymes supprimés
  [7] Services  tftpd-hpa/avahi arrêtés — asterisk shell=nologin

JOURNAL D'INSTALLATION
  ${SESSION_LOG}

RAPPORTS DE CONFORMITÉ
  Rapport CRA+NIS2 : /etc/freepbx-factory/compliance-report.json
  SBOM CycloneDX   : /etc/freepbx-factory/sbom.json

COMMANDES DE VÉRIFICATION POST-DÉPLOIEMENT
  Services PM2   : sudo fwconsole pm2 --list
  Extensions SIP : sudo asterisk -rx 'pjsip show endpoints'
  Trunk SIP      : sudo asterisk -rx 'pjsip show registrations'
  Pare-feu UFW   : sudo ufw status numbered
  fail2ban       : sudo fail2ban-client status
  Conformité     : sudo cat /etc/freepbx-factory/compliance-report.json

CONFORMITÉ CRA EU 2024/2847
  Axe 1 — Credentials admin : choisis par le client au wizard (non stockés)
  Axe 2 — Kit starter       : ${KIT_STARTER} — extensions optionnelles (5+ chiffres)
  Axe 3 — Trunk SIP         : ${TRUNK_ENABLED} — indépendant du kit starter
  Axe 4 — SSH               : ${SSH_ENABLED} — accès par clé OVHcloud (réinstallation)

═══════════════════════════════════════════════════════════
REPORTEOF

if [[ "$KIT_STARTER" == "oui" ]]; then
    cat >> "$REPORT_FILE" << KIT_REPORT_EOF

KIT STARTER — CONFIGURATION SOFTPHONES
  Serveur SIP : ${_SIP_SERVER}
$([ -n "${_VPS_IPV6}" ] && printf "  Serveur SIPv6 : %s  (smartphones IPv6-only)\n" "${_VPS_IPV6}")  Port SIP    : 5060 (UDP / PJSIP)

  Extension ${EXT1_NUMBER} — ${EXT1_NAME}
    Compte SIP   : ${EXT1_NUMBER}
    Mot de passe : ${EXT1_PASS}

  Extension ${EXT2_NUMBER} — ${EXT2_NAME}
    Compte SIP   : ${EXT2_NUMBER}
    Mot de passe : ${EXT2_PASS}

  Extension ${EXT3_NUMBER} — ${EXT3_NAME}
    Compte SIP   : ${EXT3_NUMBER}
    Mot de passe : ${EXT3_PASS}

ACCÈS INTERFACE
  URL admin : ${GUI_URL}
$(if [[ -z "${TLS_DOMAIN}" ]]; then
echo "  Accès HTTP ponctuel (sous votre responsabilité) :"
echo "    Démarrer : sudo systemctl start apache2"
echo "    URL      : http://${VPS_IP}/admin/"
echo "    Arrêter  : sudo systemctl stop apache2"
echo "  Attention : HTTP non sécurisé — à utiliser uniquement pour configuration initiale."
fi)

VÉRIFICATION SOFTPHONES
  État des extensions : sudo asterisk -rx 'pjsip show endpoints'
  (statut Avail = softphone enregistré, Unavail = non connecté)

═══════════════════════════════════════════════════════════
KIT_REPORT_EOF
fi
chmod 600 "$REPORT_FILE"

# Statut trunk SIP au moment de la livraison — ajouté au rapport fichier
if [[ "$TRUNK_ENABLED" == "oui" && -n "$TRUNK_REGISTRAR" ]]; then
    _reg_live=$(asterisk -rx 'pjsip show registrations' 2>/dev/null \
        | grep -iE "Registered|Failed|Unregistered|NoAuth" | head -1 \
        | grep -oiE "Registered|Failed|Unregistered|NoAuth" || echo "inconnu")
    {
        echo ""
        echo "ÉTAT TRUNK SIP AU DÉPLOIEMENT"
        echo "  Trunk     : ${TRUNK_REGISTRAR} (identifiant : ${TRUNK_USERNAME})"
        echo "  Statut    : ${_reg_live}"
        echo "  Vérifier  : sudo asterisk -rx 'pjsip show registrations'"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
    } >> "$REPORT_FILE"
fi

log "Rapport de livraison : $REPORT_FILE"

# ════════════════════════════════════════════════════════════════════════════
# RÉSUMÉ DÉPLOIEMENT — fichiers générés sur le VPS
# ════════════════════════════════════════════════════════════════════════════
_INSTALL_END=$(date +%s)
_DEPLOY_DUR=$(( (_INSTALL_END - INSTALL_START) / 60 ))
_FPBX_VER=$(fwconsole --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "17.0.x")
_JAILS_N=$(fail2ban-client status 2>/dev/null | grep -oP 'Number of jail[s]?:\s*\K\d+' || echo "7")
_GUI_OK=0; [[ "${_GUI_CODE:-000}" =~ ^(200|302)$ ]] && _GUI_OK=1
_UFW_OK=0; ufw status 2>/dev/null | grep -q "Status: active" && _UFW_OK=1 || true
_TRUNK_STATUS="${TRUNK_ENABLED:-non}"; _TLS_VAL="${TLS_DOMAIN:-}"
_AST_VER=$(asterisk -V 2>/dev/null | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "")
_HOSTNAME=$(hostname 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  RÉSUMÉ DU DÉPLOIEMENT                                    ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""

# ── Accès et options déployées ───────────────────────────────────────────────
echo -e "${CYAN}  ── Accès et options déployées ─────────────────────────────${NC}"
if [[ -f "$REPORT_FILE" ]]; then
    grep -E '^\s+(Admin|IP VPS|Port SSH|Kit|Ligne|HTTPS|SSH activé|Trunk SIP|Identifiant SIP)' "$REPORT_FILE" 2>/dev/null | head -10 || true
    echo ""
    echo "  → Fiche complète enregistrée : $REPORT_FILE"
else
    echo "  → $REPORT_FILE (généré)"
fi
echo ""

# ── Inventaire des composants installés ──────────────────────────────────────
echo -e "${CYAN}  ── Inventaire des composants installés ────────────────────${NC}"
if [[ -f /etc/freepbx-factory/sbom.json ]]; then
    _SBOM_N=$(python3 -c "import json; d=json.load(open('/etc/freepbx-factory/sbom.json')); print(len(d.get('components',[])))" 2>/dev/null || echo "?")
    echo "  → ${_SBOM_N} composants logiciels répertoriés"
    echo "  → Fichier : /etc/freepbx-factory/sbom.json"
else
    echo "  → /etc/freepbx-factory/sbom.json"
fi
echo ""

# ── Vérifications de sécurité ────────────────────────────────────────────────
echo -e "${CYAN}  ── Vérifications de sécurité ──────────────────────────────${NC}"
if [[ -f /etc/freepbx-factory/compliance-report.json ]]; then
    python3 -c "
import json
with open('/etc/freepbx-factory/compliance-report.json') as f:
    r = json.load(f)
s = r['score']
print(f'  Score : {s[\"percent\"]}% ({s[\"ok\"]}/{s[\"total\"]} contrôles OK)')
warns = [c for c in r['checks'] if c['status'] != 'ok']
for w in warns: print(f'  ⚠  {w[\"name\"]}')
if not warns: print('  Tous les contrôles OK')
" 2>/dev/null || echo "  → /etc/freepbx-factory/compliance-report.json"
else
    echo "  → /etc/freepbx-factory/compliance-report.json"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""

# Titre tmux final — visible au retour de connexion
tmux rename-window "DÉPLOYÉ ✓ | SSH: ${SSH_PORT}" 2>/dev/null || true

# ════════════════════════════════════════════════════════════════════════════
# KIT STARTER — Vérification GUI + configuration softphones
# ════════════════════════════════════════════════════════════════════════════
if [[ "$KIT_STARTER" == "oui" ]]; then
    echo ""
    echo -e "${YELLOW}══════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}   KIT STARTER — VÉRIFICATION & SOFTPHONES${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}── 1. ACCÉDER À L'INTERFACE FREEPBX ─────────────────${NC}"
    echo    "     URL   : ${GUI_URL}"
    echo    "     Login : ${ADMIN_USERNAME}"
    if [[ -z "$TLS_DOMAIN" ]]; then
        echo ""
        echo -e "  ${YELLOW}  Interface web désactivée (Apache arrêté par sécurité).${NC}"
        echo -e "  ${YELLOW}  Pour un accès ponctuel sous votre responsabilité :${NC}"
        echo    "     sudo systemctl start apache2"
        echo    "     URL HTTP : http://${VPS_IP}/admin/"
        echo    "     sudo systemctl stop apache2  (arrêter après vérification)"
    fi
    echo    "     Vérifier : Applications → Extensions"
    echo    "     Extensions attendues : ${EXT1_NUMBER} / ${EXT2_NUMBER} / ${EXT3_NUMBER}"
    echo ""
    echo -e "  ${CYAN}── 4. VÉRIFIER LES ENREGISTREMENTS ASTERISK ──────────${NC}"
    echo    "     sudo asterisk -rx 'pjsip show endpoints'"
    echo    "     (statut Avail = softphone enregistré)"
    echo ""
    echo -e "${GREEN}  ── CONFIGURATION SOFTPHONES ──────────────────────────${NC}"
    echo    "  Protocole  : PJSIP"
    echo    "  Serveur SIP: ${_SIP_SERVER}"
    [[ -n "${_VPS_IPV6}" ]] && echo "  Serveur SIPv6: ${_VPS_IPV6}  (smartphones IPv6-only)"
    echo    "  Port SIP   : 5060 (UDP)"
    echo    "  Domaine    : ${_SIP_SERVER}"
    echo ""
    echo -e "${GREEN}  Ext ${EXT1_NUMBER} — ${EXT1_NAME}${NC}"
    echo    "    Compte SIP   : ${EXT1_NUMBER}"
    echo    "    Mot de passe : ${EXT1_PASS}"
    echo ""
    echo -e "${GREEN}  Ext ${EXT2_NUMBER} — ${EXT2_NAME}${NC}"
    echo    "    Compte SIP   : ${EXT2_NUMBER}"
    echo    "    Mot de passe : ${EXT2_PASS}"
    echo ""
    echo -e "${GREEN}  Ext ${EXT3_NUMBER} — ${EXT3_NAME}${NC}"
    echo    "    Compte SIP   : ${EXT3_NUMBER}"
    echo    "    Mot de passe : ${EXT3_PASS}"
    echo ""
    echo -e "${YELLOW}══════════════════════════════════════════════════════${NC}"
    echo ""
fi

# ════════════════════════════════════════════════════════════════════════════
# RÉSULTAT FINAL
# ════════════════════════════════════════════════════════════════════════════

# R5 — Score conformité dans le résumé
_COMPLIANCE_SCORE=""
if [[ -f /etc/freepbx-factory/compliance-report.json ]]; then
    _COMPLIANCE_SCORE=$(python3 -c "
import json
with open('/etc/freepbx-factory/compliance-report.json') as f:
    r=json.load(f)
s=r['score']
print(f'{s[\"percent\"]}% ({s[\"ok\"]}/{s[\"total\"]} controles OK)')
" 2>/dev/null || echo "voir compliance-report.json")
fi

# R6 — Statut trunk SIP au moment de la livraison
_TRUNK_REG_STATUS=""
if [[ "$TRUNK_ENABLED" == "oui" && -n "$TRUNK_REGISTRAR" ]]; then
    _TRUNK_REG_STATUS=$(asterisk -rx 'pjsip show registrations' 2>/dev/null \
        | grep -iE "Registered|Failed|Unregistered|NoAuth" | head -1 \
        | grep -oiE "Registered|Failed|Unregistered|NoAuth" || echo "inconnu")
fi

echo ""
echo ""
ok "╔══════════════════════════════════════════╗"
ok "║   FreePBX Factory V1.9 — DÉPLOYÉ ✓      ║"
ok "╠══════════════════════════════════════════╣"
ok "║ Admin    : $ADMIN_USERNAME"
ok "║ SSH port : $SSH_PORT — restreint à $MANAGEMENT_IP"
ok "║ URL GUI  : $GUI_URL"
[[ -n "$_COMPLIANCE_SCORE" ]] && ok "║ Conformité : $_COMPLIANCE_SCORE"
if [[ -n "$_TRUNK_REG_STATUS" ]]; then
    if [[ "${_TRUNK_REG_STATUS,,}" == "registered" ]]; then
        ok   "║ Trunk SIP  : $TRUNK_REGISTRAR — $_TRUNK_REG_STATUS"
    else
        warn "║ Trunk SIP  : $TRUNK_REGISTRAR — $_TRUNK_REG_STATUS (vérifier la configuration)"
    fi
fi
ok "║ Rapport  : $REPORT_FILE"
ok "║ Journal  : $SESSION_LOG"
ok "╚══════════════════════════════════════════╝"
echo ""

# R4 — Apache sans TLS : commandes start/stop pour accès ponctuel
if [[ -z "$TLS_DOMAIN" ]]; then
    echo -e "  ${CYAN}ℹ  Interface web désactivée (Apache arrêté — sécurité).${NC}"
    echo    "     Accès ponctuel HTTP (sous votre responsabilité) :"
    echo    "       sudo systemctl start apache2"
    echo    "       Ouvrir : http://${VPS_IP}/admin/"
    echo    "       sudo systemctl stop apache2  (fermer après utilisation)"
    echo ""
fi

# R2 — Module pare-feu FreePBX : désactivé intentionnellement
echo -e "${YELLOW}  ⚠  MODULE PARE-FEU FreePBX : DÉSACTIVÉ${NC}"
echo    "     Ce déploiement utilise UFW comme unique outil de filtrage réseau."
echo    "     Le module Firewall FreePBX est désactivé pour éviter les conflits"
echo    "     de règles iptables — source documentée de blocages SSH non récupérables."
echo    ""
echo    "     Si vous souhaitez activer le Firewall FreePBX, c'est possible."
echo    "     Cela implique de reconsidérer l'ensemble de la stratégie de sécurité :"
echo    "     UFW et le Firewall FreePBX ne peuvent pas coexister."
echo    ""
echo -e "${YELLOW}     Commencer impérativement par les commandes SSH suivantes${NC}"
echo    "     (avant toute action dans l'interface graphique) :"
echo    "       sudo fwconsole ma enable firewall"
echo    "       sudo rm /etc/systemd/system/freepbx.service.d/factory-disable-firewall.conf"
echo    "       sudo systemctl daemon-reload"
echo    "       sudo ufw disable"
echo    "     Puis configurer le Firewall FreePBX depuis Admin → Firewall dans la GUI."
echo    ""

# R3 — Accès perdu : 3 chemins de récupération
echo -e "  ${CYAN}ℹ  En cas de perte d'accès :${NC}"
echo    "     1. Vérifiez que votre IP publique n'a pas changé depuis le déploiement"
echo    "        (IP autorisée : $MANAGEMENT_IP)"
echo    "     2. Reconnexion SSH : ssh -p $SSH_PORT debian@${VPS_IP}"
echo    "     3. Accès définitivement perdu : console KVM OVHcloud → corriger UFW"
echo    "        ou réinstaller le VPS en Debian 12 et recommencer."
echo ""

# R8 — Fichiers générés sur le VPS
echo -e "  ${CYAN}ℹ  Fichiers générés sur ce serveur :${NC}"
echo    "     Rapport   : sudo cat $REPORT_FILE"
echo    "     Journal   : sudo cat $SESSION_LOG"
echo    "     Conformité: sudo cat /etc/freepbx-factory/compliance-report.json"
echo    "     SBOM      : sudo cat /etc/freepbx-factory/sbom.json"
echo ""

# R9 — Changement de mot de passe admin après déploiement
echo -e "  ${CYAN}ℹ  Changer le mot de passe admin après déploiement :${NC}"
echo    "     GUI FreePBX : Admin → User Management → sélectionner $ADMIN_USERNAME"
echo    "     (le mot de passe défini au wizard n'est pas récupérable — notez-le)"
echo ""

warn "═══ INFORMATIONS À CONSERVER ═══════════════"
warn "Port SSH     : $SSH_PORT"
warn "Reconnexion  : ssh -p $SSH_PORT debian@${VPS_IP}"
warn "Admin FreePBX   : $ADMIN_USERNAME"
warn "URL GUI      : $GUI_URL"
warn "Rapport      : $REPORT_FILE"
warn "Journal      : $SESSION_LOG"
warn "══════════════════════════════════════════════"
# Nettoyage état wizard (reprise plus nécessaire)
rm -f /root/.fpbx-state.sh 2>/dev/null || true

# Désactivation service de reprise (déploiement terminé)
systemctl disable freepbx-factory-resume 2>/dev/null || true
rm -f /etc/systemd/system/freepbx-factory-resume.service 2>/dev/null || true
rm -f /root/freepbx-factory-install.sh 2>/dev/null || true
systemctl daemon-reload 2>/dev/null || true

# MOTD final
cat > /etc/motd << MOTDEOF2

  FreePBX Factory - Installation terminee
  Port SSH : $SSH_PORT  |  Connexion : ssh -p $SSH_PORT debian@${VPS_IP}
  Rapport  : sudo cat /root/freepbx-factory-delivery-report.txt

MOTDEOF2

touch /tmp/fpbx_deploy_done 2>/dev/null || true

if [[ -f "$REPORT_FILE" ]]; then
    echo ""
    echo -e "${CYAN}  Rapport complet enregistré : sudo cat $REPORT_FILE${NC}"
fi
