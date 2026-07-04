# 后端公网部署指南（Railway）

## 前提

- Railway 账号（已注册）
- GitHub 账号（可选，用于代码同步）

## 步骤

### 1. 创建 GitHub 仓库并上传代码

1. 访问 https://github.com/new
2. 仓库名填 `football-analysis-app`
3. 选择 Public 或 Private
4. 点击 Create repository
5. 上传项目代码（除了 `node_modules`、`.expo`、`dist`、`server/.cache`）

如果没有 git，可以手动打包上传：
- 把 `app/`、`src/`、`server/`、`public/`、`Dockerfile`、`railway.json`、`package.json`、`tsconfig.json`、`eas.json`、`app.json` 等文件打包成 zip
- 在 GitHub 仓库页面点击 "Add file" → "Upload files"
- 上传 zip 并解压（或逐个文件夹上传）

### 2. 在 Railway 创建项目

1. 访问 https://railway.app/dashboard
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `football-analysis-app` 仓库
5. 点击 "Add Variables"，添加环境变量：
   - `PORT`: `8787`
   - `API_FOOTBALL_KEY`: 你的 API-Football 密钥（可选）
6. 点击 "Deploy"

### 3. 获取公网地址

1. 等待部署完成（通常 2-3 分钟）
2. 在项目页面点击服务名
3. 找到 "Domains" 或 "Public URL"
4. 复制类似 `https://football-analysis-api.up.railway.app` 的地址

### 4. 更新 App 的 API 地址

把下面文件里的 `EXPO_PUBLIC_API_URL` 替换为 Railway 地址：

`eas.json`：
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://football-analysis-api.up.railway.app"
      }
    }
  }
}
```

`.env.example`：
```
EXPO_PUBLIC_API_URL=https://football-analysis-api.up.railway.app
```

### 5. 重新构建 APK

```bash
npx eas build --platform android --profile preview --non-interactive
```

构建完成后，更新 `public/download.html` 里的 APK 链接，重新发布下载页。

## 注意事项

- Railway 免费额度有限，适合测试和小流量使用
- 如果需要真实数据，建议配置 `API_FOOTBALL_KEY` 环境变量
