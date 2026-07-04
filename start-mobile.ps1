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

Write-Host "启动 Expo 手机 App 开发服务器..." -ForegroundColor Cyan
Write-Host "请用 Expo Go 扫描终端中显示的二维码。" -ForegroundColor Gray
npx expo start
