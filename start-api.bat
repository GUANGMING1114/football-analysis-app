@echo off
chcp 65001 >nul
setlocal

where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo 错误：找不到 python 或 py 命令。
        exit /b 1
    )
)

echo 启动足球分析数据 API（首次启动会自动预热缓存，可能需要等待 30-60 秒）...
echo 监听 http://0.0.0.0:8787
echo 缓存目录：server/.cache
python server\football_api.py
