#!/usr/bin/env python3
"""发布下载页到 ShipPage（无 Authorization，触发自动注册）。"""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = ROOT / "dist" / "download.html"

html = HTML_PATH.read_text(encoding="utf-8")

payload = {
    "html": html,
    "title": "足球分析模型 - 下载",
    "slug": "football-analysis-download",
}

headers = {
    "Content-Type": "application/json",
    "X-Skill-Version": "1.2.0",
}

req = urllib.request.Request(
    "https://shippage.ai/v1/publish",
    data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    headers=headers,
    method="POST",
)

resp = urllib.request.urlopen(req, timeout=60)
body = resp.read().decode("utf-8")
print(body)

# 如果响应包含 _registration，保存凭据
try:
    data = json.loads(body)
    if "_registration" in data:
        creds_path = Path.home() / ".shippage" / "credentials.json"
        creds_path.parent.mkdir(parents=True, exist_ok=True)
        creds_path.write_text(json.dumps(data["_registration"], indent=2, ensure_ascii=False), encoding="utf-8")
        print("Credentials saved.")
except Exception as e:
    print("Failed to save credentials:", e)
