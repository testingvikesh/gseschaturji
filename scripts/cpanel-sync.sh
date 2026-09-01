#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOYPATH="${DEPLOYPATH:-/home/${USER}/public_html}"

mkdir -p "${DEPLOYPATH}/public/uploads"

if command -v rsync >/dev/null 2>&1; then
  rsync -av --delete \
    --exclude '.git/' \
    --exclude '.github/' \
    --exclude 'node_modules/' \
    --exclude 'config.json' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude 'public/uploads/' \
    --exclude 'output/' \
    "${SOURCE_DIR}/" "${DEPLOYPATH}/"
else
  for item in api lib public sql scripts; do
    if [ -d "${SOURCE_DIR}/${item}" ]; then
      /bin/cp -R "${SOURCE_DIR}/${item}" "${DEPLOYPATH}/"
    fi
  done

  /bin/cp "${SOURCE_DIR}/index.php" "${SOURCE_DIR}/view.php" "${DEPLOYPATH}/"
  /bin/cp "${SOURCE_DIR}/.htaccess" "${SOURCE_DIR}/php.ini" "${SOURCE_DIR}/.user.ini" "${DEPLOYPATH}/" 2>/dev/null || true
  /bin/cp "${SOURCE_DIR}"/*.php "${SOURCE_DIR}"/*.js "${SOURCE_DIR}"/*.json "${DEPLOYPATH}/" 2>/dev/null || true
fi

chmod 755 "${DEPLOYPATH}/public/uploads"

if command -v npm >/dev/null 2>&1 && [ -f "${DEPLOYPATH}/package.json" ]; then
  (cd "${DEPLOYPATH}" && npm ci --omit=dev --no-audit --no-fund)
fi

echo "Synced to ${DEPLOYPATH}"
