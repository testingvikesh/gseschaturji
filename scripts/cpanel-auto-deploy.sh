#!/usr/bin/env bash
# Optional cron on server (cPanel → Cron Jobs, every 5 min):
# */5 * * * * /bin/bash /home/gsescha/public_html/scripts/cpanel-auto-deploy.sh >> /home/gsescha/logs/deploy.log 2>&1
set -euo pipefail

REPO_ROOT="/home/gsescha/public_html"
UAPI="/usr/local/cpanel/bin/uapi"

cd "$REPO_ROOT"
"${UAPI}" VersionControl update repository_root="${REPO_ROOT}" branch=main
"${UAPI}" VersionControlDeployment create repository_root="${REPO_ROOT}"
