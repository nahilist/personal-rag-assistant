#!/usr/bin/env bash
# Render Build Script
set -e

echo "=== Upgrading pip ==="
python -m pip install --upgrade pip

echo "=== Installing dependencies ==="
pip install -r requirements.txt
if [ -f "apps/api/requirements.txt" ]; then
  pip install -r apps/api/requirements.txt
fi

echo "=== Build finished successfully ==="

