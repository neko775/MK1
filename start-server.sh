#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.jsが必要です。https://nodejs.org/ からインストールしてください。"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

if curl -fsS http://localhost:3000/ >/dev/null 2>&1; then
  echo "MK1 検索エンジンはすでに起動しています。"
else
  nohup npm run dev > /tmp/myengine-server.log 2>&1 &
  echo "MK1 検索エンジンのサーバーを起動しました。ログ: /tmp/myengine-server.log"
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:3000/ >/dev/null 2>&1 &
fi
