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
QONY_API_MODE=mock \
NEXT_PUBLIC_QONY_API_MODE=mock \
QONY_BILLING_PROVIDER=mock \
QONY_APP_URL=http://127.0.0.1:3010 \
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3010 \
QONY_TRUSTED_ORIGINS=http://127.0.0.1:3010 \
QONY_AUTH_DATABASE_URL= \
QONY_AUTH_SECRET=playwright-qony-secret-with-32-char-minimum \
QONY_AUTH_AUTO_MIGRATE=false \
QONY_GOOGLE_CLIENT_ID=playwright-google-client \
QONY_GOOGLE_CLIENT_SECRET=playwright-google-secret \
npm run dev -- --hostname 127.0.0.1 --port 3010 --webpack
