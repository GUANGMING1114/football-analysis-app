# 后端公网部署指南（Render）

## 前提

- 一个 GitHub 账号
- 一个 Render 账号（https://render.com，免费）

## 步骤

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名填 `football-analysis-app`
3. 选择 Public 或 Private 都行
4. 点击 Create repository

### 2. 上传代码

由于本机没有 git，可以手动在 GitHub 网页上传：

1. 进入新建的仓库
2. 点击 "Add file" → "Upload files"
3. 把本项目的所有文件（除了 `node_modules`、`.expo`、`dist`、`server/.cache`）打包上传
4. 点击 "Commit changes"

或者找一台有 git 的电脑执行：

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/football-analysis-app.git
git push -u origin main
```

### 3. 在 Render 部署后端

1. 访问 https://dashboard.render.com
2. 点击 "New" → "Web Service"
3. 选择你的 GitHub 仓库
4. 配置：
   - Name: `football-analysis-api`
   - Runtime: `Docker`
   - Root Directory: 留空（默认根目录）
   - Docker Command: 留空
5. 点击 "Create Web Service"
6. 等待部署完成，会获得一个类似 `https://football-analysis-api-xxx.onrender.com` 的地址

### 4. 更新 App 的 API 地址

拿到 Render 地址后，把下面文件里的地址替换：

`eas.json`：
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://football-analysis-api-xxx.onrender.com"
      }
    }
  }
}
```

`.env.example`：
```
EXPO_PUBLIC_API_URL=https://football-analysis-api-xxx.onrender.com
```

### 5. 重新构建 APK

```bash
npx eas build --platform android --profile preview --non-interactive
```

构建完成后，更新 `public/download.html` 里的 APK 链接，重新发布下载页。

## 注意事项

- Render 免费实例会在 15 分钟不活动后休眠，首次访问可能需要等待 30 秒启动
- 如果需要实时数据，需要配置 `API_FOOTBALL_KEY` 环境变量（可选）
