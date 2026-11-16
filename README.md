# Deepshek

基于 **Capacitor 6 + React 18 + TypeScript + Vite** 复刻的 DeepSeek 安卓端移动应用（`v0.1.0`），像素级还原 DeepSeek App 移动端交互体验，并支持配置 **个人 DeepSeek API Key** 直连官方模型或切换 OpenAI 兼容端点。

---

## 核心特性

### 1. DeepSeek 安卓端原生交互体验
- **双模式自适应主题**：精确复刻官方 `--dsw-*` 浅色/深色（`#151517`）语义色板，支持「跟随系统 / 浅色 / 深色」实时切换，并联动 Android 原生 `StatusBar` 与 `theme-color`。
- **深度思考与自动折叠**：支持思考模式流式渲染（流光标题动效、耗时统计），思考完成后自动折叠（可在设置中关闭），点击可随时展开/收起推理链。
- **服务端联网搜索与引用溯源**：完整适配 DeepSeek 应用协议中的 `deepseek_web_search` 与 `deepseek_read_url` 工具事件，支持搜索步骤状态条、行内可点击引用角标 `[1]` 以及 Android 底部「参考资料」弹窗卡片。
- **富文本与专业排版引擎**：基于 `mdast` + `micromark-extension-llm-math` 构建流式安全渲染管线，支持 **KaTeX** 数学公式、**PrismJS** 多语言代码高亮与一键复制、**Mermaid** 流程图「图表 / 代码」切换（自适应深浅色）及横向可滚动表格。
- **树形多分支对话与交互**：支持用户消息**编辑重发**、AI 回复**重新生成**、`1/N` 多分支版本切换、长按/点击操作栏（复制、Web Speech API / 语音朗读、点赞/点踩反馈）。
- **抽屉侧边栏与手势体验**：支持左边缘右滑打开侧边栏、历史对话实时搜索、置顶/重命名/删除与导出 Markdown、按时间分组（置顶 / 今天 / 昨天 / 7 天内 / 30 天内）。
- **移动端输入与多媒体交互**：底部悬浮圆角输入栏、语音听写波形动效、图片预览灯箱与文件附件底部弹窗；支持 Capacitor 原生 `Haptics` 震动反馈与 Android 物理返回键层级拦截。

### 2. 个人 DeepSeek API Key 配置与多协议支持
在 **「设置 -> DeepSeek API 配置（个人密钥）」** 中支持：
- **个人密钥直连**：输入 `sk-...` 开头的 DeepSeek API Key，支持密钥显隐切换。
- **一键测试连接与余额查询**：通过 `/models` 验证密钥有效性、统计网络延迟，并自动查询 `/user/balance` 账户余额。
- **多协议切换**：
  - **DeepSeek 应用协议（推荐）**：调用 `/anthropic/v1/messages`，完整支持深度思考、联网搜索 (`deepseek_web_search`)、网页阅读 (`deepseek_read_url`) 与文件解析 (`/anthropic/v1/files`)。
  - **OpenAI 兼容协议**：调用 `/chat/completions`，兼容 `reasoning_content` 推理输出及第三方兼容服务地址（自定义 Base URL）。
- **本地演示模式（Demo Mode）**：未配置 API Key 时默认开启本地演示模式，无需联网即可完整体验深度思考、联网搜索引用、Mermaid 流程图、代码高亮与数学公式渲染。
- **数据备份与迁移**：支持导入/导出 ZIP 聊天记录压缩包（兼容官方导出格式），所有配置与会话数据本地持久化存储在 `IndexedDB` 与 `Capacitor Preferences`。

---

## 技术栈

- **前端框架**：React 18 + TypeScript 5 + Vite 6 + Zustand 4 + CSS Modules
- **排版渲染**：`mdast-util-from-markdown` + `micromark-extension-llm-math` + `KaTeX` + `PrismJS` + `Mermaid`
- **本地存储**：`idb` (IndexedDB) + `fflate` (ZIP 导入/导出) + `@capacitor/preferences`
- **安卓容器**：Capacitor 6 (`@capacitor/android`, `@capacitor/app`, `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/status-bar`)

---

## 本地开发与构建

### 环境要求
- Node.js >= 20（推荐 22 LTS）
- JDK 17 + Android SDK（仅本地编译 APK 时需要；推送 Tag 时 GitHub Actions 会自动构建并发布 APK）

### 常用命令

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev

# 类型检查与生产构建
npm run typecheck
npm run build

# 同步静态资源到 Android 原生工程
npx cap sync android
```

### 本地编译 Android APK

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

编译产物位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

---

## 个人 API Key 使用指南

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 创建并复制你的个人 API Key（以 `sk-` 开头）。
2. 打开 Deepshek，点击首页顶部的 **「演示模式 · 点击配置个人 DeepSeek API Key」**，或从左上角侧边栏底部进入 **「设置」**。
3. 粘贴 API Key 后点击 **「测试连接」** 验证延迟与可用余额，然后点击 **「保存配置」** 即可开始对话。

> 隐私说明：你的个人 API Key 仅保存在本机设备本地存储中，所有模型请求均由客户端直连你在设置中配置的 API 端点，不会经过任何第三方中转服务器。

---

## 版本发布

推送语义化版本标签（如 `v0.1.0`）时，GitHub Actions 工作流（[`.github/workflows/release.yml`](.github/workflows/release.yml)）会自动完成 Web 构建、Capacitor Android 同步、Gradle APK 打包，并将 `deepshek-v0.1.0-android.apk` 上传至对应 GitHub Release。

## 开源协议

[MIT License](./LICENSE)
