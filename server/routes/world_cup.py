"""世界杯赛程与分析接口。"""
from __future__ import annotations

from typing import Any


def world_cup_schedule(api_football, date: str | None = None) -> list[dict[str, Any]]:
    """获取世界杯赛程。"""
    if not api_football:
        return []
    raw = api_football.world_cup_fixtures(date=date)
    if not raw or not raw.get("response"):
        return []
    return raw["response"]
