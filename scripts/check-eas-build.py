#!/usr/bin/env python3
"""自动检查 EAS 构建状态，完成后更新下载页并重新发布。"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import urllib.request

PROJECT_DIR = Path(__file__).resolve().parent.parent

# 从环境变量读取或读取 .env
API_KEY = None

def load_env() -> None:
    global API_KEY
    env_file = PROJECT_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.strip() and "=" in line and not line.strip().startswith("#"):
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())


def find_npx() -> str | None:
    """查找 npx 可执行文件路径。"""
    for path in os.environ.get("PATH", "").split(os.pathsep):
        npx_path = Path(path) / "npx.cmd"
        if npx_path.exists():
            return str(npx_path)
    # 常见安装位置
    localappdata = os.environ.get("LOCALAPPDATA", "")
    if localappdata:
        candidate = Path(localappdata) / "nodejs" / "npx.cmd"
        if candidate.exists():
            return str(candidate)
    return None


def run_eas_command(args: list[str]) -> dict | list:
    """运行 EAS CLI 命令并返回 JSON。"""
    npx_path = find_npx()
    if not npx_path:
        print("npx not found")
        return {}
    env = os.environ.copy()
    env["EAS_NO_VCS"] = "1"
    result = subprocess.run(
        [npx_path, "eas"] + args,
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
    )
    if result.returncode != 0:
        print(f"EAS command failed: {result.stderr}")
        return {}
    # npx may output warnings mixed with JSON; try to find JSON array/object
    text = result.stdout.strip()
    # Find the first JSON array/object in output
    start_idx = None
    for ch in ["[", "{"]:
        idx = text.find(ch)
        if idx != -1 and (start_idx is None or idx < start_idx):
            start_idx = idx
    if start_idx is not None:
        try:
            return json.loads(text[start_idx:])
        except json.JSONDecodeError:
            pass
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        print(f"DEBUG failed to parse JSON. stdout: {text[:500]}")
        return {}


def get_latest_build() -> dict:
    builds = run_eas_command(["build:list", "--platform", "android", "--limit", "3", "--json"])
    if builds and isinstance(builds, list):
        return builds[0]
    return {}


def update_download_page(apk_url: str) -> None:
    """更新下载页中的 APK 下载链接。"""
    download_html = PROJECT_DIR / "public" / "download.html"
    content = download_html.read_text(encoding="utf-8")
    content = content.replace(
        'const APK_DOWNLOAD_URL = ""; // 留空则显示"APK 构建中..."',
        f"const APK_DOWNLOAD_URL = \"{apk_url}\";",
    )
    download_html.write_text(content, encoding="utf-8")
    print(f"Updated download.html with APK URL: {apk_url}")


def find_expo() -> str | None:
    """查找 expo 可执行文件路径。"""
    for path in os.environ.get("PATH", "").split(os.pathsep):
        expo_path = Path(path) / "expo.cmd"
        if expo_path.exists():
            return str(expo_path)
    localappdata = os.environ.get("LOCALAPPDATA", "")
    if localappdata:
        candidate = Path(localappdata) / "nodejs" / "expo.cmd"
        if candidate.exists():
            return str(candidate)
    return None


def export_web() -> None:
    """导出 Web 版本。"""
    expo_path = find_expo()
    if not expo_path:
        raise RuntimeError("expo CLI not found")
    env = os.environ.copy()
    subprocess.run(
        [expo_path, "export", "--platform", "web"],
        cwd=PROJECT_DIR,
        check=True,
        env=env,
    )
    # 同步 public 资源到 dist
    for file in ["download.html", "manifest.json", "icon.svg"]:
        src = PROJECT_DIR / "public" / file
        dst = PROJECT_DIR / "dist" / file
        if src.exists():
            dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    print("Web exported to dist/")


def publish_to_shippage() -> str:
    """发布到 shippage.ai，返回公开 URL。"""
    download_html = PROJECT_DIR / "dist" / "download.html"
    html = download_html.read_text(encoding="utf-8")
    payload = json.dumps({"html": html, "title": "足球分析模型 - 下载"}).encode("utf-8")
    req = urllib.request.Request(
        "https://shippage.ai/v1/publish",
        data=payload,
        headers={"Content-Type": "application/json", "X-Skill-Version": "1.2.0"},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=60)
    data = json.loads(resp.read().decode("utf-8"))
    return data.get("url", "")


def main() -> int:
    load_env()
    print("Checking EAS build status...")
    build = get_latest_build()
    if not build:
        print("No builds found.")
        return 1

    build_id = build.get("id")
    status = build.get("status")
    print(f"Build {build_id}: {status}")

    if status == "IN_QUEUE":
        print("Build is still in queue, will check later.")
        return 2
    if status == "IN_PROGRESS":
        print("Build is in progress, will check later.")
        return 2
    if status not in ("FINISHED", "ERRORED", "CANCELED"):
        print(f"Build status: {status}, will check later.")
        return 2

    if status == "ERRORED":
        print(f"Build failed: {build}")
        return 1
    if status == "CANCELED":
        print("Build was canceled.")
        return 1

    # FINISHED
    artifacts = build.get("artifacts", {})
    apk_url = artifacts.get("buildUrl") or artifacts.get("url")
    if not apk_url:
        print(f"Build finished but no APK URL: {artifacts}")
        return 1

    print(f"Build finished. APK URL: {apk_url}")
    update_download_page(apk_url)
    export_web()
    url = publish_to_shippage()
    print(f"Published to: {url}")

    # 保存结果到文件
    result_file = PROJECT_DIR / "dist" / "build-result.json"
    result_file.write_text(json.dumps({"apkUrl": apk_url, "pageUrl": url}, ensure_ascii=False), encoding="utf-8")

    return 0


if __name__ == "__main__":
    sys.exit(main())
