#!/usr/bin/env python3
"""启动 ngrok 隧道，暴露本地 8787 端口。"""
from pyngrok import ngrok

tunnel = ngrok.connect(8787, "http")
print(f"Public URL: {tunnel.public_url}")
input("Press Enter to stop...\n")
