#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$nodeDir = Join-Path $env:LOCALAPPDATA "nodejs"
if (Test-Path $nodeDir) { $env:PATH = "$nodeDir;$env:PATH" }

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "错误：找不到 npx。请先安装 Node.js。" -ForegroundColor Red
    exit 1
}

# 自动加载 .env 文件
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)\s*=\s*(.+)\s*$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}
if (-not $env:EXPO_PUBLIC_API_URL) { $env:EXPO_PUBLIC_API_URL = "http://127.0.0.1:8787" }

# 检查 Expo 登录状态
Write-Host "检查 Expo 登录状态..." -ForegroundColor Cyan
$whoami = & npx eas whoami 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($whoami)) {
    Write-Host "尚未登录 Expo 账号，请先运行：npx eas login" -ForegroundColor Yellow
    & npx eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "登录失败，请重试。" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "当前已登录 Expo：$whoami" -ForegroundColor Green
}

Write-Host "开始构建 Android APK..." -ForegroundColor Cyan
Write-Host "API 地址：$env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray

& npx eas build --platform android --profile preview --non-interactive
