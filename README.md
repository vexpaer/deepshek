# Deepshek

基于 React、TypeScript 与 Capacitor 的 Android 聊天客户端，支持个人 API 密钥与本地聊天记录。

## 0.1.2

首页输入区采用更紧凑的按钮。在设置的「偏好设置」中可切换原生风格和 Material Design 3、控制震动反馈，以及启用跨对话记忆。发送「记住我喜欢简短的回答」即可保存，下次对话会使用这条偏好。可在记忆页直接编辑或删除。关闭开关后，应用停止保存和发送记忆。

Android 的「检查更新」显示已安装版本，检测到新版后可以下载 APK，校验完成后由系统安装程序确认安装。网页端提供新版 APK 下载。

## 0.1.1 移动端重构

参照 DeepSeek 手机端截图重做首页、输入框、附件面板及设置：

- 新对话居中标题、双横线菜单、蓝色鲸鱼及单行问候语，采用接近纯黑的聊天背景。
- 大圆角输入框；深度思考、智能搜索横向滚动按钮；附件入口与语音入口；输入后切换为发送按钮，生成中切换为停止按钮。
- 内联展开拍照、相册、文件三项入口；图片预览与删除、文件大小展示；每条消息最多 6 个附件，单个最大 20 MB。
- Android 使用相机和系统语音识别；浏览器使用文件选择与 Web Speech API（取决于浏览器支持）。输入区支持长按启动、上滑取消语音，亦可点击语音按钮启动。
- 设置主页使用账户、应用、关于分组。API 密钥、地址、协议与模型放在账号管理；数据管理包含导入、导出和清空记录；语言、外观、字体大小为独立子页。
- Android 返回键与 Escape 逐层关闭弹层、设置子页与侧栏；新建/切换对话重置输入草稿。
- Android 导出调用系统分享面板，可选择保存位置；网页端下载文件。ZIP 导入合并已有记录，同 ID 保留较新版本。
- 保留流式回复、推理折叠、Markdown/公式/代码/Mermaid、历史搜索、分支编辑和重新生成。

## 开发

Node.js 20+，Android 构建需要 JDK 17、Android SDK 34。

```bash
npm ci
npm run dev
npm run typecheck
npm run build
npm run cap:build
cd android
./gradlew assembleDebug
```

APK：`android/app/build/outputs/apk/debug/app-debug.apk`。

```bash
# 手机尺寸交互检查与截图；先在另一个终端运行 npm run dev
npx playwright-core install chromium
npm run test:mobile
# 使用本机 Chromium 时可设置 CHROMIUM_PATH
```

GitHub Actions 在 PR / main / codex 分支推送时执行生产构建、移动端流程检查和 Android APK 编译，上传截图与 APK。版本标签触发 Release 工作流。

## API 与数据

侧栏 → 设置 → 账号管理：填写个人 API 密钥，选择协议、模型与 API 地址，再测试连接并保存。模型列表可从服务端 `/models` 获取。具体模型、搜索和附件能力由所选服务与协议决定；界面的开关不会为服务端增加能力。

无密钥且开启演示模式时，回复由本地预设内容生成；模拟搜索与引用用于展示界面。关闭演示模式后须配置密钥。

对话保存于 IndexedDB，设置保存于浏览器本地存储 / Capacitor Preferences。请求直连配置的 API 服务。ZIP 备份包含对话与附件，不包含 API 密钥。退出登录清除本机密钥，保留对话。

## 素材与许可

鲸鱼矢量标记来自 [Lobe Icons 的 DeepSeek 图标](https://github.com/lobehub/lobe-icons/blob/master/packages/static-svg/icons/deepseek.svg)；品牌标记归其权利人所有。本项目为独立客户端。

代码使用 [MIT](LICENSE) 许可。
