from __future__ import annotations

import json
import os
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

# 尝试导入 API-Football provider
import importlib.util
spec = importlib.util.spec_from_file_location("api_football", Path(__file__).with_name("providers") / "api_football.py")
api_football = importlib.util.module_from_spec(spec) if spec else None
if spec and api_football:
    try:
        spec.loader.exec_module(api_football)  # type: ignore
    except Exception:
        api_football = None  # type: ignore


def has_api_football() -> bool:
    return api_football is not None and hasattr(api_football, "fixtures")

CACHE_DIR = Path(__file__).with_name(".cache")
CACHE_DIR.mkdir(exist_ok=True)

REQUEST_TIMEOUT = 60
_CACHE_TTL_SECONDS = 600
_MEMORY_CACHE: dict[str, tuple[float, Any]] = {}


def _cache_file_key(key: str) -> Path:
    safe = key.replace("/", "_").replace(" ", "_")
    return CACHE_DIR / f"{safe}.json"


def load_cache(key: str) -> Any | None:
    file = _cache_file_key(key)
    if not file.exists():
        return None
    try:
        stat = file.stat()
        if time.time() - stat.st_mtime > _CACHE_TTL_SECONDS:
            return None
        with file.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None


def save_cache(key: str, data: Any) -> None:
    file = _cache_file_key(key)
    try:
        with file.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except OSError:
        pass


def run_sports_skills(*args: str) -> dict[str, Any]:
    cache_key = " ".join(args)

    now = time.time()
    mem = _MEMORY_CACHE.get(cache_key)
    if mem and now - mem[0] < _CACHE_TTL_SECONDS:
        return mem[1]

    disk = load_cache(cache_key)
    if disk is not None:
        return disk

    completed = subprocess.run(
        ["sports-skills", "football", *args],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=REQUEST_TIMEOUT,
    )
    data = json.loads(completed.stdout)
    _MEMORY_CACHE[cache_key] = (now, data)
    save_cache(cache_key, data)
    return data


def safe_run_sports_skills(*args: str) -> dict[str, Any] | None:
    try:
        return run_sports_skills(*args)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return None


def american_to_decimal(value: str | None) -> float | None:
    if not value:
        return None
    raw = value.strip()
    try:
        number = int(raw)
    except ValueError:
        return None
    if number > 0:
        return round(1 + number / 100, 3)
    return round(1 + 100 / abs(number), 3)


def pick_competitor(event: dict[str, Any], qualifier: str) -> dict[str, Any] | None:
    for competitor in event.get("competitors", []):
        if competitor.get("qualifier") == qualifier:
            return competitor
    return None


def normalize_match(event: dict[str, Any]) -> dict[str, Any] | None:
    home = pick_competitor(event, "home")
    away = pick_competitor(event, "away")
    if not home or not away:
        return None

    odds = event.get("odds") or {}
    moneyline = odds.get("moneyline") or {}
    total = odds.get("total") or {}
    over = total.get("over") or {}
    under = total.get("under") or {}

    return {
        "id": str(event.get("id")),
        "league": (event.get("competition") or {}).get("name", "Unknown"),
        "season": (event.get("season") or {}).get("id", "unknown"),
        "kickoffAt": event.get("start_time"),
        "status": map_status(event.get("status")),
        "homeTeam": normalize_team(home.get("team") or {}),
        "awayTeam": normalize_team(away.get("team") or {}),
        "score": event.get("scores"),
        "venue": event.get("venue"),
        "odds": {
            "homeWin": american_to_decimal(moneyline.get("home")),
            "draw": american_to_decimal(moneyline.get("draw")),
            "awayWin": american_to_decimal(moneyline.get("away")),
            "over25": american_to_decimal(over.get("odds")),
            "under25": american_to_decimal(under.get("odds")),
        },
    }


def normalize_team(team: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(team.get("id")),
        "name": team.get("name", "Unknown"),
        "shortName": team.get("short_name") or team.get("abbreviation"),
        "country": team.get("country"),
        "logoUrl": team.get("crest") or team.get("logo"),
    }


def map_status(status: str | None) -> str:
    if status in {"closed"}:
        return "finished"
    if status in {"live", "halftime"}:
        return "live"
    return "scheduled"


def parse_score(score: Any) -> tuple[int, int]:
    if not score:
        return 0, 0
    return int(score.get("home", 0) or 0), int(score.get("away", 0) or 0)


def get_recent_form(team_id: str, league: str) -> dict[str, Any] | None:
    raw = safe_run_sports_skills("get_team_schedule", f"--team_id={team_id}", f"--league_slug={league}")
    if not raw:
        return None

    events = (raw.get("data") or {}).get("events", [])
    finished = [
        event
        for event in events
        if event.get("status") == "closed"
    ][:6]

    wins, draws, losses = 0, 0, 0
    goals_for, goals_against = 0, 0
    xg_for, xg_against = 0.0, 0.0
    xg_count = 0

    for event in finished:
        home = pick_competitor(event, "home")
        away = pick_competitor(event, "away")
        if not home or not away:
            continue

        home_score, away_score = parse_score(event.get("scores"))
        team_is_home = str((home.get("team") or {}).get("id")) == team_id

        my_score = home_score if team_is_home else away_score
        opp_score = away_score if team_is_home else home_score
        goals_for += my_score
        goals_against += opp_score

        if my_score > opp_score:
            wins += 1
        elif my_score == opp_score:
            draws += 1
        else:
            losses += 1

        event_xg = safe_run_sports_skills("get_event_xg", f"--event_id={event.get('id')}")
        if not event_xg:
            continue
        for entry in (event_xg.get("data") or {}).get("teams", []):
            team_data = entry.get("team") or {}
            if str(team_data.get("id")) != team_id:
                continue
            xg_for += float(entry.get("xg", 0) or 0)
            xg_against += float(entry.get("xga", 0) or entry.get("xg", 0) or 0)
            xg_count += 1

    matches_played = wins + draws + losses
    if matches_played == 0:
        return None

    return {
        "teamId": team_id,
        "lastMatches": matches_played,
        "wins": wins,
        "draws": draws,
        "losses": losses,
        "goalsFor": goals_for,
        "goalsAgainst": goals_against,
        "xgFor": round(xg_for / max(1, xg_count), 2) if xg_count else None,
        "xgAgainst": round(xg_against / max(1, xg_count), 2) if xg_count else None,
    }


def get_injuries(team_id: str, season_id: str | None) -> list[str]:
    if not season_id or "premier-league" not in season_id:
        return []
    raw = safe_run_sports_skills("get_missing_players", f"--season_id={season_id}")
    if not raw:
        return []

    players: list[str] = []
    for team in (raw.get("data") or {}).get("teams", []):
        team_data = team.get("team") or {}
        if str(team_data.get("id")) != team_id:
            continue
        for player in team.get("players", []):
            status = player.get("status")
            if status in {"injured", "doubtful", "suspended", "unavailable"}:
                name = player.get("web_name") or player.get("name") or "未知"
                news = player.get("news") or ""
                players.append(f"{name}({status}): {news}".strip(" :"))
    return players


def build_context(match: dict[str, Any], season_id: str | None = None) -> dict[str, Any]:
    league = match.get("league", "")
    home_team = match["homeTeam"]
    away_team = match["awayTeam"]
    match_id = match["id"]

    # 先尝试读取后台预加载的真实深度数据
    enriched_key = f"enriched_context:{match_id}"
    enriched = load_cache(enriched_key)

    if enriched:
        home_form = enriched.get("homeForm") or (get_recent_form(home_team["id"], league) or default_form(home_team["id"], "home"))
        away_form = enriched.get("awayForm") or (get_recent_form(away_team["id"], league) or default_form(away_team["id"], "away"))
        injuries = enriched.get("injuries") or []
    else:
        home_form = default_form(home_team["id"], "home")
        away_form = default_form(away_team["id"], "away")
        injuries = []

    return {
        "matchId": match_id,
        "homeForm": home_form,
        "awayForm": away_form,
        "injuries": injuries if injuries else ["公开数据暂未提供完整伤停信息，结果需降低置信度"],
        "restDaysHome": 5,
        "restDaysAway": 5,
        "travelPressureAway": 0.15,
        "odds": match.get("odds") or {},
    }


def _normalize_api_football_fixture(item: dict[str, Any]) -> dict[str, Any] | None:
    fixture = item.get("fixture") or {}
    teams = item.get("teams") or {}
    home_team = teams.get("home") or {}
    away_team = teams.get("away") or {}
    odds = item.get("odds") or {}

    def decimal(value: Any) -> float | None:
        if value is None:
            return None
        try:
            return round(float(value), 3)
        except (TypeError, ValueError):
            return None

    return {
        "id": str(fixture.get("id")),
        "league": (item.get("league") or {}).get("name", "Unknown"),
        "season": str((item.get("league") or {}).get("season", "unknown")),
        "kickoffAt": fixture.get("date"),
        "status": map_status_api_football((fixture.get("status") or {}).get("short")),
        "homeTeam": {
            "id": str(home_team.get("id")),
            "name": home_team.get("name", "Unknown"),
            "shortName": None,
            "country": None,
            "logoUrl": (home_team.get("logo") or home_team.get("crest")),
        },
        "awayTeam": {
            "id": str(away_team.get("id")),
            "name": away_team.get("name", "Unknown"),
            "shortName": None,
            "country": None,
            "logoUrl": (away_team.get("logo") or away_team.get("crest")),
        },
        "score": item.get("score", {}).get("fulltime"),
        "venue": (fixture.get("venue") or {}).get("name"),
        "odds": {
            "homeWin": decimal(odds.get("homeWin")),
            "draw": decimal(odds.get("draw")),
            "awayWin": decimal(odds.get("awayWin")),
            "over25": decimal(odds.get("over25")),
            "under25": decimal(odds.get("under25")),
        },
    }


def map_status_api_football(status: Any) -> str:
    if status in {"FT", "PEN", "AET"}:
        return "finished"
    if status in {"1H", "HT", "2H", "ET", "P"}:
        return "live"
    return "scheduled"


def _enrich_context(match_id: str, date: str | None) -> None:
    """后台异步加载真实近期战绩、xG、伤停。"""
    try:
        matches = get_matches(date)
        match = next((item for item in matches if item["id"] == match_id), None)
        if not match:
            return
        league = match.get("league", "")
        home_team = match["homeTeam"]
        away_team = match["awayTeam"]
        season_id = match.get("season")

        home_form = get_recent_form(home_team["id"], league)
        away_form = get_recent_form(away_team["id"], league)
        injuries = get_injuries(home_team["id"], season_id) + get_injuries(away_team["id"], season_id)

        save_cache(f"enriched_context:{match_id}", {
            "homeForm": home_form,
            "awayForm": away_form,
            "injuries": injuries,
        })
    except Exception as exc:
        print(f"[enrich] {match_id} 失败: {exc}", flush=True)


def _warm_and_enrich() -> None:
    try:
        print("[warmup] 预热公开数据缓存...", flush=True)
        matches = get_matches(None)
        print("[warmup] 预热完成", flush=True)
        print("[enrich] 开始后台加载深度数据（近期战绩、xG、伤停）...", flush=True)
        for match in matches[:10]:
            threading.Thread(target=_enrich_context, args=(match["id"], None), daemon=True).start()
    except Exception as exc:
        print(f"[warmup] 预热失败: {exc}", flush=True)


def default_form(team_id: str, split: str) -> dict[str, Any]:
    return {
        "teamId": team_id,
        "lastMatches": 6,
        "wins": 3,
        "draws": 1,
        "losses": 2,
        "goalsFor": 10,
        "goalsAgainst": 8,
        "xgFor": None,
        "xgAgainst": None,
        "homeAwaySplit": split,
    }


def get_world_cup_matches(date: str | None) -> list[dict[str, Any]]:
    """获取世界杯赛程；依赖 API-Football 数据源。"""
    matches = []
    if has_api_football():
        try:
            raw = api_football.world_cup_fixtures(date=date)  # type: ignore
            if raw and raw.get("response"):
                matches = [_normalize_api_football_fixture(item) for item in raw["response"]]
        except Exception:
            pass
    return [m for m in matches if m]


def get_matches(date: str | None) -> list[dict[str, Any]]:
    # 尝试 API-Football（如果配置了 key）
    if has_api_football():
        try:
            # 默认返回近期重要赛事，包含世界杯（ID=1）
            raw = api_football.fixtures(date=date, season=date[:4] if date else None)  # type: ignore
            if raw and raw.get("response"):
                return [_normalize_api_football_fixture(item) for item in raw["response"]]
        except Exception:
            pass

    # 回退到 sports-skills
    args = ["get_daily_schedule"]
    if date:
        args.append(f"--date={date}")
    raw = run_sports_skills(*args)
    events = (raw.get("data") or {}).get("events", [])
    matches = [normalize_match(event) for event in events]
    return [match for match in matches if match]


def _normalize_api_football_fixture(item: dict[str, Any]) -> dict[str, Any] | None:
    fixture = item.get("fixture") or {}
    teams = item.get("teams") or {}
    home_team = teams.get("home") or {}
    away_team = teams.get("away") or {}
    odds = item.get("odds") or {}

    def decimal(value: Any) -> float | None:
        if value is None:
            return None
        try:
            return round(float(value), 3)
        except (TypeError, ValueError):
            return None

    return {
        "id": str(fixture.get("id")),
        "league": (item.get("league") or {}).get("name", "Unknown"),
        "season": str((item.get("league") or {}).get("season", "unknown")),
        "kickoffAt": fixture.get("date"),
        "status": map_status_api_football(fixture.get("status", {}).get("short")),
        "homeTeam": {
            "id": str(home_team.get("id")),
            "name": home_team.get("name", "Unknown"),
            "shortName": None,
            "country": None,
            "logoUrl": (home_team.get("logo") or home_team.get("crest")),
        },
        "awayTeam": {
            "id": str(away_team.get("id")),
            "name": away_team.get("name", "Unknown"),
            "shortName": None,
            "country": None,
            "logoUrl": (away_team.get("logo") or away_team.get("crest")),
        },
        "score": item.get("score", {}).get("fulltime"),
        "venue": (fixture.get("venue") or {}).get("name"),
        "odds": {
            "homeWin": decimal(odds.get("homeWin")),
            "draw": decimal(odds.get("draw")),
            "awayWin": decimal(odds.get("awayWin")),
            "over25": decimal(odds.get("over25")),
            "under25": decimal(odds.get("under25")),
        },
    }


def map_status_api_football(status: Any) -> str:
    if status in {"FT", "PEN", "AET"}:
        return "finished"
    if status in {"1H", "HT", "2H", "ET", "P"}:
        return "live"
    return "scheduled"


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        try:
            if parsed.path == "/health":
                self.respond({"ok": True, "service": "football-analysis-api"})
                return
            if parsed.path == "/api/matches":
                date = query.get("date", [None])[0]
                self.respond({"matches": get_matches(date)})
                return
            if parsed.path == "/api/world-cup":
                date = query.get("date", [None])[0]
                self.respond({"matches": get_world_cup_matches(date)})
                return
            if parsed.path.startswith("/api/matches/") and parsed.path.endswith("/context"):
                match_id = parsed.path.split("/")[3]
                date = query.get("date", [None])[0]
                matches = get_matches(date)
                match = next((item for item in matches if item["id"] == match_id), None)
                if not match:
                    self.respond({"error": "match_not_found"}, status=404)
                    return
                season_id = match.get("season")
                self.respond({"context": build_context(match, season_id)})
                return
            self.respond({"error": "not_found"}, status=404)
        except subprocess.CalledProcessError as exc:
            self.respond({"error": "sports_skills_failed", "detail": exc.stderr[-1000:]}, status=502)
        except Exception as exc:  # noqa: BLE001 - API boundary should serialize failures.
            self.respond({"error": "internal_error", "detail": str(exc)}, status=500)

    def respond(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args: Any) -> None:
        return


def _background_refresh() -> None:
    while True:
        time.sleep(_CACHE_TTL_SECONDS)
        try:
            print("[refresh] 刷新缓存...", flush=True)
            matches = get_matches(None)
            for match in matches[:10]:
                threading.Thread(target=_enrich_context, args=(match["id"], None), daemon=True).start()
            print("[refresh] 缓存刷新完成", flush=True)
        except Exception as exc:
            print(f"[refresh] 刷新失败: {exc}", flush=True)


def main() -> None:
    threading.Thread(target=_warm_and_enrich, daemon=True).start()
    threading.Thread(target=_background_refresh, daemon=True).start()
    server = ThreadingHTTPServer(("0.0.0.0", 8787), Handler)
    print("football-analysis-api listening on http://0.0.0.0:8787", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
