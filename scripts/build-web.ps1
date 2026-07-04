#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$nodeDir = Join-Path $env:LOCALAPPDATA "nodejs"
if (Test-Path $nodeDir) { $env:PATH = "$nodeDir;$env:PATH" }

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "错误：找不到 npx。" -ForegroundColor Red
    exit 1
}

Write-Host "正在导出 Web 版本..." -ForegroundColor Cyan
npx expo export --platform web
if ($LASTEXITCODE -ne 0) { throw "Web 导出失败" }

Write-Host "正在同步下载页资源到 dist..." -ForegroundColor Cyan
$publicDir = Join-Path $PSScriptRoot ".." "public"
$distDir = Join-Path $PSScriptRoot ".." "dist"
Copy-Item -Path (Join-Path $publicDir "download.html") -Destination $distDir -Force
Copy-Item -Path (Join-Path $publicDir "manifest.json") -Destination $distDir -Force
Copy-Item -Path (Join-Path $publicDir "icon.svg") -Destination $distDir -Force

Write-Host "完成。输出目录：dist" -ForegroundColor Green
