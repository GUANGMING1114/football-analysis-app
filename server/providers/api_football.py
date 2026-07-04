"""API-Football 适配器（占位）。

使用方式：
    1. 注册 https://www.api-football.com 获取 API key
    2. 设置环境变量 API_FOOTBALL_KEY
    3. 在 football_api.py 中导入并使用此 provider 替代部分 sports-skills 调用
"""
from __future__ import annotations

import os
from typing import Any

try:
    import requests  # type: ignore
except ImportError:  # type: ignore
    requests = None  # type: ignore

BASE_URL = "https://v3.football.api-sports.io"
_API_KEY = os.environ.get("API_FOOTBALL_KEY")


def _headers() -> dict[str, str]:
    if not _API_KEY:
        raise RuntimeError("API_FOOTBALL_KEY 环境变量未设置")
    return {"x-apisports-key": _API_KEY}


LEAGUE_WORLD_CUP = 1  # FIFA World Cup

def fixtures(**params: Any) -> dict[str, Any] | None:
    try:
        response = requests.get(f"{BASE_URL}/fixtures", headers=_headers(), params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception:
        return None


def world_cup_fixtures(**params: Any) -> dict[str, Any] | None:
    """查询世界杯赛程（默认最近一届/当前赛季）。"""
    # API-Football 世界杯联赛 ID 为 1
    params.setdefault("league", LEAGUE_WORLD_CUP)
    params.setdefault("season", params.pop("season", None) or _current_world_cup_season())
    return fixtures(**params)


def _current_world_cup_season() -> int:
    # 2026 世界杯为 2026 赛季
    from datetime import datetime
    return 2026 if datetime.now().year >= 2025 else 2022


def team_statistics(team_id: int | str, league_id: int | str, season: int | str) -> dict[str, Any] | None:
    try:
        response = requests.get(
            f"{BASE_URL}/teams/statistics",
            headers=_headers(),
            params={"team": team_id, "league": league_id, "season": season},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return None


def injuries(team_id: int | str, fixture_id: int | str) -> dict[str, Any] | None:
    try:
        response = requests.get(
            f"{BASE_URL}/injuries",
            headers=_headers(),
            params={"team": team_id, "fixture": fixture_id},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return None


def standings(league_id: int | str, season: int | str) -> dict[str, Any] | None:
    try:
        response = requests.get(
            f"{BASE_URL}/standings",
            headers=_headers(),
            params={"league": league_id, "season": season},
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
    except Exception:
        return None
