#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[instafake] Node.js не найден. Установите Node.js 20 или новее: https://nodejs.org" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[instafake] npm не найден. Установите Node.js 20 или новее: https://nodejs.org" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[instafake] Устанавливаю зависимости..."
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

echo "[instafake] Запускаю приложение на http://127.0.0.1:5173"
echo "[instafake] Остановить: Ctrl+C"

args=(run dev -- --host 127.0.0.1)
if [ "${NO_OPEN:-0}" != "1" ]; then
  args+=(--open)
fi
exec npm "${args[@]}"
