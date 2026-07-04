# 足球分析 App 数据源优化路线图

## 当前状态

公开数据源通过 `sports-skills` 获取：

- `get_daily_schedule`：赛程与赔率 ✅
- `get_team_schedule`：球队近期战绩 ⚠️ 慢
- `get_event_xg`：预期进球 ⚠️ 慢
- `get_missing_players`：伤停 ⚠️ 英超限定

问题：

1. CLI 请求慢，偶发超时
2. Top 5 联赛外无 xG
3. 伤停仅英超
4. 无实时阵容/首发

## 阶段一：继续优化公开数据（已完成 + 进行中）

- ✅ 文件缓存
- ✅ 内存缓存
- ✅ 后台异步预热
- ✅ 后台定时刷新
- ✅ 优先返回缓存，不阻塞用户

下一步：

- 对 `get_team_schedule` 增加批量并发 + 失败重试
- 对 `get_event_xg` 仅对 Top 5 联赛调用，其他联赛跳过
- 对 `get_missing_players` 仅英超调用
- 增加缓存过期策略：赛程 5 分钟，战绩 1 小时，xG/伤停 30 分钟

## 阶段二：接入更稳定的公开 HTTP API

### 推荐候选

| 数据源 | 内容 | 费用 | 备注 |
|---|---|---|---|
| Football-Data.org | 赛程、积分榜、球队 | 免费 tier | 需注册 API Key |
| API-Football | 赛程、统计、伤停、阵容 | 免费 tier | RapidAPI 上稳定 |
| OpenLigaDB | 欧洲主流联赛赛程 | 免费 | 无 key |
| Sports Open Data | 赛程、比分 | 免费 | 数据量一般 |
| ESPN API | 赛程、比分、统计 | 非官方 | 可直接访问但非官方接口 |

建议：

1. 注册 **API-Football** 免费 tier
2. 封装 `ApiFootballProvider` 作为新的数据源适配器
3. 保留现有 `sports-skills` 作为 fallback

### API-Football 接入方案

```python
# server/providers/api_football.py
import os
import requests

API_KEY = os.environ.get("API_FOOTBALL_KEY")
BASE_URL = "https://v3.football.api-sports.io"

def fixtures(**params):
    return requests.get(f"{BASE_URL}/fixtures", headers={"x-apisports-key": API_KEY}, params=params).json()

def team_statistics(team_id, league_id, season):
    return requests.get(
        f"{BASE_URL}/teams/statistics",
        headers={"x-apisports-key": API_KEY},
        params={"team": team_id, "league": league_id, "season": season}
    ).json()

def injuries(team_id, fixture_id):
    return requests.get(
        f"{BASE_URL}/injuries",
        headers={"x-apisports-key": API_KEY},
        params={"team": team_id, "fixture": fixture_id}
    ).json()
```

## 阶段三：商业数据源（付费）

适合严肃用户和付费版：

| 供应商 | 覆盖 | 优点 | 缺点 |
|---|---|---|---|
| Sportradar | 全球 | 官方、实时、完整 | 贵 |
| Opta | 全球 | 专业统计、事件 | 贵、门槛高 |
| Genius Sports | 全球 | 官方、实时赔率 | 贵 |
| FeedConstruct | 欧洲/亚洲 | 稳定 | 需商务 |
| 7Sport / 雷速 | 亚洲/中超 | 中文、及时 | 授权复杂 |

建议：

- MVP 阶段：公开数据 + 手动补录
- 付费版：接入 **Sportradar** 或 **API-Football 付费 tier**
- 中文版：考虑 **雷速、懂球帝、虎扑** 等国内数据合作

## 阶段四：自建爬虫（备选）

对公开网站做定向抓取：

- 懂球帝、虎扑：中文伤停、阵容
- 雷速：实时比分、赔率
- 虎扑/直播吧：赛前首发

风险：网站结构变化、IP 限流、法律风险
建议：仅在无稳定 API 时小范围使用

## 推荐实施顺序

1. 立刻注册 API-Football 免费账号
2. 封装 ApiFootballDataProvider，替代部分 sports-skills 接口
3. 保留 sports-skills 作为免费 fallback
4. 用户付费后接入 Sportradar / Opta
5. 中文市场接入雷速/懂球帝

## 当前 App 的数据源切换方式

修改文件：

- `src/services/data-providers/api-provider.ts`
- `server/football_api.py`

新增 provider 后，在 `api-provider.ts` 中切换 baseURL 即可。
