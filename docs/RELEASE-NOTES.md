# D友の酒 · Dyou Wine — 0.1.0-alpha.10

让 DSH 界面按固定节奏 Q 弹，让大肥鱼娘毛绒玩偶满屏飞、碰墙反弹。

这是面向 DeepSeek Harness `0.2.0-rc.2` Web 客户端的 Alpha 插件；界面和玩偶可独立开关、同时运行。默认静止，点击「开喝」后启动；支持微醺／上头／整活三档，「暂停」保留进度，「醒酒」或 Escape 退出并清理。

本版整理首次公开发布所需的命名、维护者与仓库元数据、蓝鲸图标、中英文发现信息和预发布工作流，修复性能测试与跨平台 CLI 发现。延续 Alpha.9 的本地循环 BGM，移除视频窗口；播放错误不打断视觉效果。

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/) — 活跃黑江乐《朋友的酒 DJ 完整版》。歌曲录音、词曲及声库不适用本项目代码 MIT；来源与素材范围见 [ASSETS.md](ASSETS.md)。

安装包：`dsh-dyou-wine-0.1.0-alpha.10.tgz`。npm 发布完成后可执行：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.10
```

本地 tarball 安装可直接使用 `dsh plugin --profile web add ./dsh-dyou-wine-0.1.0-alpha.10.tgz --ignore-scripts`，更新后重启 Host 并刷新页面。

已通过干净安装与独立构建、47 项单元测试、36 项浏览器测试、包检查和真实 DSH 安装验收，另完成 60 秒关闭／60 秒开启动效的性能对照；详见 [TESTING.md](TESTING.md)。未专项验证 Windows 原生 IME、DSH Desktop／TUI、其他 DSH 版本和物理扬声器；固定 120 BPM 动画独立于歌曲，不宣称逐拍精确同步。当前文件为已准备的发布公告，远程 GitHub Release 和 npm 尚未发布。
