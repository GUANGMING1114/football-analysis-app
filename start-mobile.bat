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

echo 启动 Expo 手机 App 开发服务器...
echo 请用 Expo Go 扫描终端中显示的二维码。
npx expo start
