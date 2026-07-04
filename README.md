# 足球分析模型 App

React Native + Expo 手机 App MVP，配套 Python 本地数据代理 API。

## 功能

- 今日比赛列表（支持联赛筛选、球队/联赛搜索）
- 比赛详情
- 综合模型分析：胜平负、大小球、比分区间、风险等级、关键因素
- 公开足球数据：支持 `sports-skills` 或 API-Football
- 赛前推送提醒
- 历史预测与复盘统计
- APK 构建脚本

## 目录

```text
app/                              Expo Router 页面
src/model/football-analysis.ts    模型算法
src/services/data-providers/     数据源适配
src/services/notifications.ts    推送通知
src/types/football.ts            核心类型
server/football_api.py           本地数据代理 API
server/providers/api_football.py  API-Football 适配器
server/.cache/                    数据缓存
```

## 1. 配置环境变量

复制示例文件：

```bash
cp .env.example .env
```

编辑 `.env`：

```bash
API_FOOTBALL_KEY=your_api_football_key_here  # 可选
EXPO_PUBLIC_API_URL=http://127.0.0.1:8787
```

## 2. 启动数据 API

```bash
python server\football_api.py
```

或双击：

```text
start-api.bat
```

首次启动会自动预热缓存，可能需要 30-60 秒。

## 3. 启动手机 App

```bash
npm run start
```

或双击：

```text
start-web.bat     # Web 预览
start-mobile.bat  # 手机 Expo Go 预览
```

## 4. 真机访问 API

手机和电脑需在同一局域网。

在 `.env` 中修改：

```bash
EXPO_PUBLIC_API_URL=http://你的电脑局域网IP:8787
```

## 5. 构建 APK

### 方式一：EAS Build（推荐）

1. 注册 Expo 账号：https://expo.dev/signup
2. 登录：

```bash
npx eas login
```

3. 运行构建脚本：

```bash
.\build-apk.bat
```

构建完成后会返回 APK 下载链接。

### 方式二：本地构建

需要安装 JDK 17 和 Android SDK，详见 `docs/build-apk-guide.md`。

## 6. 数据源

### 默认：sports-skills（免费 CLI）

- 赛程、赔率、近期战绩、xG、伤停
- 部分数据较慢，已加缓存

### 增强：API-Football（推荐）

- 更稳定、更快速
- 支持更多联赛和数据

接入步骤：

1. 到 https://www.api-football.com 注册
2. 复制 `.env.example` 为 `.env`
3. 填入 `API_FOOTBALL_KEY`
4. 重启后端 API

## 7. 通知权限

App 首次启动时会请求通知权限。用户可以点击比赛卡片的“设置赛前提醒”，在赛前 10 分钟收到提醒。
