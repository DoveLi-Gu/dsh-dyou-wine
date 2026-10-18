# D友の酒 · Dyou Wine — 0.1.0-alpha.11

让 DSH 界面按固定节奏 Q 弹，让大肥鱼娘毛绒玩偶满屏飞、碰墙反弹。

这是面向 DeepSeek Harness `0.2.0-rc.2` Web 客户端的 Alpha 插件；界面和玩偶可独立开关、同时运行。默认静止，点击「开喝」后启动；支持微醺／上头／整活三档，「暂停」保留进度，「醒酒」或 Escape 退出并清理。

本版补充真实隔离 DSH 宿主演示 GIF、可复现的录制脚本，以及 README 中鸽子中转站的宣传与接入链接。演示使用测试会话，不录制日常 profile 中的私人对话。生产运行时代码沿用 Alpha.10，不改变固定节奏、飞行反弹、面板或内置音轨；此前整理的命名、插件发现信息和发布工作流继续保留。

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/) — 活跃黑江乐《朋友的酒 DJ 完整版》。歌曲录音、词曲及声库不适用本项目代码 MIT；来源与素材范围见 [ASSETS.md](ASSETS.md)。

安装包：`dsh-dyou-wine-0.1.0-alpha.11.tgz`。npm 发布完成后可执行：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.11
```

本地 tarball 安装可直接使用 `dsh plugin --profile web add ./dsh-dyou-wine-0.1.0-alpha.11.tgz --ignore-scripts`，更新后重启 Host 并刷新页面。

Alpha.11 已通过类型检查、47 项单元测试、构建、36 项浏览器测试与 18 文件包检查；使用本版 tarball 在真实隔离 DSH 中录制并验证双效果固定节奏、两轴反弹、无越界和零 pageerror。详细范围见 [TESTING.md](TESTING.md)。Alpha.10 的干净副本构建、完整真实宿主 BGM 验收及 60 秒性能对照另保留为历史证据，本轮未重复执行这些专项检查。

未专项验证 Windows 原生 IME、DSH Desktop／TUI、其他 DSH 版本和物理扬声器；固定 120 BPM 动画独立于歌曲，不宣称逐拍精确同步。当前文件为已准备的发布公告，远程 GitHub Release 和 npm 尚未发布。
