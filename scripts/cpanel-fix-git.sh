#!/usr/bin/env bash
# Run on the server: bash scripts/cpanel-fix-git.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "Repo: $REPO_DIR"
echo "Before:"
git status --short || true

git fetch origin main
git rm --cached -f php.ini .user.ini .htaccess 2>/dev/null || true
git reset --hard origin/main
git clean -fd

echo ""
echo "After:"
git status --short
if [ -z "$(git status --porcelain)" ]; then
  echo "Working tree clean — refresh cPanel Pull or Deploy tab."
else
  echo "Still dirty — run: git status"
fi
