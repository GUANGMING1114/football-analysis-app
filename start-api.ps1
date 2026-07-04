#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
    if (-not $python) {
        Write-Host "错误：找不到 python 或 py 命令。" -ForegroundColor Red
        exit 1
    }
}

Write-Host "启动足球分析数据 API（首次启动会自动预热缓存，可能需要等待 30-60 秒）..." -ForegroundColor Cyan
Write-Host "监听 http://0.0.0.0:8787" -ForegroundColor Gray
Write-Host "缓存目录：server/.cache" -ForegroundColor Gray

& $python.Source (Join-Path $PSScriptRoot "server\football_api.py")
