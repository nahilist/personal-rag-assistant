#!/usr/bin/env bash
# Render Build Script
set -e

echo "=== Upgrading pip ==="
python -m pip install --upgrade pip

echo "=== Installing dependencies ==="
pip install -r requirements.txt

echo "=== Build finished successfully ==="
