#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$nodeDir = Join-Path $env:LOCALAPPDATA "nodejs"
if (Test-Path $nodeDir) {
    $env:PATH = "$nodeDir;$env:PATH"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误：找不到 node。请先安装 Node.js 或调整 PATH。" -ForegroundColor Red
    exit 1
}

# 真机测试时，把下面改成电脑的局域网 IP
# $env:EXPO_PUBLIC_API_URL = "http://你的电脑局域网IP:8787"

Write-Host "启动 Expo Web 开发服务器..." -ForegroundColor Cyan
npx expo start --web
