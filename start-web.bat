@echo off
chcp 65001 >nul
setlocal

set NODE_DIR=%LOCALAPPDATA%\nodejs
if exist "%NODE_DIR%" set PATH=%NODE_DIR%;%PATH%

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：找不到 node。
    exit /b 1
)

echo 启动 Expo Web 开发服务器...
npx expo start --web
