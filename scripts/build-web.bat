@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0.."

set NODE_DIR=%LOCALAPPDATA%\nodejs
if exist "%NODE_DIR%" set PATH=%NODE_DIR%;%PATH%

where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：找不到 npx。
    exit /b 1
)

echo 正在导出 Web 版本...
npx expo export --platform web
if %errorlevel% neq 0 (
    echo Web 导出失败。
    exit /b 1
)

echo 正在同步下载页资源到 dist...
copy /Y "public\download.html" "dist\" >nul
copy /Y "public\manifest.json" "dist\" >nul
copy /Y "public\icon.svg" "dist\" >nul

echo 完成。输出目录：dist
