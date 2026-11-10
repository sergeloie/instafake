@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [instafake] Node.js не найден. Установите Node.js 20 или новее: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [instafake] Устанавливаю зависимости...
    if exist "package-lock.json" (
        call npm ci
    ) else (
        call npm install
    )
    if errorlevel 1 (
        echo [instafake] Не удалось установить зависимости.
        pause
        exit /b 1
    )
)

echo [instafake] Запускаю приложение на http://127.0.0.1:5173
echo [instafake] Остановить: Ctrl+C
if "%NO_OPEN%"=="1" (
    call npm run dev -- --host 127.0.0.1
) else (
    call npm run dev -- --host 127.0.0.1 --open
)

endlocal
