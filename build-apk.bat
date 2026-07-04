@echo off
chcp 65001 >nul
setlocal

set NODE_DIR=%LOCALAPPDATA%\nodejs
if exist "%NODE_DIR%" set PATH=%NODE_DIR%;%PATH%

where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：找不到 npx。
    exit /b 1
)

if exist ".env" (
    for /f "usebackq delims=" %%a in (".env") do (
        for /f "tokens=1,2 delims==" %%b in ("%%a") do (
            set "%%b=%%c"
        )
    )
)
if "%EXPO_PUBLIC_API_URL%"=="" set EXPO_PUBLIC_API_URL=http://127.0.0.1:8787

echo 检查 Expo 登录状态...
npx eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 尚未登录 Expo 账号，请先登录...
    npx eas login
    if %errorlevel% neq 0 (
        echo 登录失败，请重试。
        exit /b 1
    )
)

echo 开始构建 Android APK...
echo API 地址：%EXPO_PUBLIC_API_URL%

npx eas build --platform android --profile preview --non-interactive
