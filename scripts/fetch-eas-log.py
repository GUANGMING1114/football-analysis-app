#!/usr/bin/env python3
"""下载 EAS build 完整日志并提取关键错误信息。"""
import json
import re
import sys
import urllib.request

BUILD_ID = sys.argv[1] if len(sys.argv) > 1 else "41f275c0-3a2e-4cd3-8ac4-197e7fe17f63"
LOG_URL = f"https://storage.googleapis.com/eas-workflows-production/logs/7e758a73-f6df-4792-8e72-762b5b891af5/{BUILD_ID}/log-file.json?format=txt"

req = urllib.request.Request(LOG_URL, headers={"User-Agent": "openclaw"})
resp = urllib.request.urlopen(req, timeout=60)
log_text = resp.read().decode("utf-8", errors="replace")

print(f"Log length: {len(log_text)} chars")

# 查找关键错误
keywords = [
    "FAILURE:",
    "BUILD FAILED",
    "error:",
    "Error:",
    "Exception",
    "could not",
    "Cannot",
    "Caused by:",
]

lines = log_text.splitlines()
for i, line in enumerate(lines):
    for keyword in keywords:
        if keyword.lower() in line.lower() and len(line) < 500:
            # 打印前后 3 行
            start = max(0, i - 2)
            end = min(len(lines), i + 3)
            print("\n--- context ---")
            for j in range(start, end):
                print(f"{j}: {lines[j]}")
            break

# 也保存日志
out_path = f"eas-log-{BUILD_ID}.txt"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(log_text)
print(f"\nFull log saved to: {out_path}")
