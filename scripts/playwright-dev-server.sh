#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
TMP_DIR=/tmp/qony-fe-playwright

mkdir -p "$TMP_DIR"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude '.next' --exclude 'node_modules' "$ROOT_DIR/" "$TMP_DIR/"
else
  tar -C "$ROOT_DIR" --exclude='.next' --exclude='node_modules' -cf - . | tar -C "$TMP_DIR" -xf -
fi

ln -sfn "$ROOT_DIR/node_modules" "$TMP_DIR/node_modules"

cd "$TMP_DIR"
QONY_API_MODE=mock NEXT_PUBLIC_QONY_API_MODE=mock npm run dev -- --hostname 127.0.0.1 --port 3010 --webpack
