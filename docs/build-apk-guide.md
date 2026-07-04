# 构建 APK 测试包指南

## 快速开始

已为你准备好一键构建脚本：

```text
build-apk.bat
```

或 PowerShell：

```powershell
.\build-apk.ps1
```

脚本会自动：

1. 检查 `.env` 文件并加载环境变量
2. 检测 Expo 登录状态
3. 未登录则自动执行 `npx eas login`
4. 运行 EAS Build 生成 APK

构建完成后，EAS 会提供一个下载链接，用浏览器打开即可下载 APK。

## 前置条件

1. 注册 Expo 账号：https://expo.dev/signup
2. 确保 Node.js 和 npm/npx 可用

## 详细步骤

### 1. 注册 Expo 账号

打开浏览器访问：

```text
https://expo.dev/signup
```

按提示完成：

- 输入邮箱
- 设置密码
- 验证邮箱

### 2. 运行构建脚本

```powershell
.\build-apk.ps1
```

首次运行会提示登录 Expo 账号，输入刚刚注册的邮箱和密码即可。

### 3. 等待构建完成

EAS Build 云端构建 APK 通常需要 5-15 分钟。

构建完成后，终端会显示类似：

```text
✅ Build successful
🔗 https://expo.dev/accounts/你的用户名/projects/football-analysis-app/builds/xxx
```

打开链接，点击 **Download** 即可下载 APK。

### 4. 安装到手机

- 把下载的 APK 传到手机
- 在手机上点击安装
- 如果提示「未知来源」，请在设置中允许安装

### 5. 真机测试

手机需要和电脑在同一局域网，否则 App 无法访问本地 API。

修改 `.env` 文件：

```bash
EXPO_PUBLIC_API_URL=http://你的电脑局域网IP:8787
```

例如：

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.8:8787
```

然后重新运行构建脚本。

同时，确保电脑上的后端 API 已启动：

```bash
.\start-api.bat
```

## 配置说明

构建配置文件：`eas.json`

当前包含三个 profile：

| profile | 输出格式 | 用途 |
|---------|----------|------|
| preview | APK | 内部测试 |
| preview-apk | APK | 对外分发 |
| production | AAB | Google Play 上架 |

默认脚本使用 `preview` profile，输出 APK。

## 方案二：本地构建（需要 Android 环境）

### 前置条件

1. 安装 JDK 17
   - https://www.oracle.com/java/technologies/downloads/#jdk17-windows
   - 或 OpenJDK：https://adoptium.net
2. 安装 Android Studio：https://developer.android.com/studio
3. 在 Android Studio 中安装 Android SDK
4. 设置环境变量：
   - `ANDROID_HOME`
   - `JAVA_HOME`
   - 把 `platform-tools` 加入 PATH

### 步骤

```bash
# 生成 Android 项目
npx expo prebuild --platform android

# 进入 Android 目录
cd android

# 构建 release APK
.\gradlew assembleRelease
```

APK 输出位置：

```text
android/app/build/outputs/apk/release/app-release.apk
```

## 方案三：Expo Go 直接预览

如果只是测试，不需要构建 APK，直接用手机 Expo Go 扫码即可。

```bash
npx expo start
```

注意：手机需要能访问电脑的局域网 IP 和 API 服务。

## 常见问题

### Q：EAS Build 提示未登录

A：运行 `npx eas login`，输入 Expo 账号邮箱和密码。

### Q：构建失败提示 `Invalid username`

A：可能是项目没有正确关联 Expo 项目。运行：

```bash
npx eas init
```

按提示选择项目名称。

### Q：APK 安装后无法访问数据

A：检查 `.env` 中的 `EXPO_PUBLIC_API_URL` 是否使用了电脑局域网 IP，而不是 `127.0.0.1`。同时确保手机和电脑在同一 Wi-Fi 下。

## 当前环境说明

当前机器缺少 JDK 和 Android SDK，所以推荐使用 EAS Build（方案一）。
