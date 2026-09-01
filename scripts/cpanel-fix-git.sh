#!/usr/bin/env bash
# Run on the server: bash scripts/cpanel-fix-git.sh
# Fixes "The system cannot deploy" / missing Deployment URL in cPanel.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "Repo: $REPO_DIR"
echo "Before:"
git status --short || true

git fetch origin main
git reset --hard origin/main
git clean -fd

echo ""
echo "After:"
git status --short
echo ""
echo "Done. Refresh cPanel Git → Pull or Deploy — Deployment URL should appear."
