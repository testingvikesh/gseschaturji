#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"

cd "$DEPLOY_PATH"

mkdir -p public/uploads
chmod 755 public/uploads

if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
  npm ci --omit=dev --no-audit --no-fund
fi

echo "Deploy complete in ${DEPLOY_PATH}"
