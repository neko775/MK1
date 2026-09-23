@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.jsが必要です。https://nodejs.org/ からインストールしてください。
  pause
  exit /b 1
)
if not exist node_modules npm install
start "MK1 server" /b cmd /c "npm run dev"
start "" http://localhost:3000/
echo MK1 検索エンジンのサーバーを起動しました。
pause
