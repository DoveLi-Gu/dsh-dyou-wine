# D友の酒 · Dyou Wine — 0.1.0-alpha.12

让 DSH 界面按固定节奏 Q 弹，让大肥鱼娘毛绒玩偶满屏飞、碰墙反弹。

这是面向 DeepSeek Harness `0.2.0-rc.2` Web 客户端的 Alpha 插件；界面和玩偶可独立开关、同时运行。默认静止，点击「开喝」后启动；支持微醺／上头／整活三档，「暂停」保留进度，「醒酒」或 Escape 退出并清理。

本版补充社区市场识别元数据、根目录截图清单、独立投稿草案和自检；通用字段与各站审核条件见 [市场收录准备](MARKETPLACE.md)。生产运行时代码沿用 Alpha.11，保留真实隔离宿主演示与鸽子中转站宣传，不改变固定节奏、飞行反弹、面板或内置音轨。当前准备不代表已被全部市场收录，dsh.pub 的入口与体积条件仍未满足。

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/) — 活跃黑江乐《朋友的酒 DJ 完整版》。歌曲录音、词曲及声库不适用本项目代码 MIT；来源与素材范围见 [ASSETS.md](ASSETS.md)。

安装包：`dsh-dyou-wine-0.1.0-alpha.12.tgz`。npm 发布完成后可执行：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.12
```

本地 tarball 安装可直接使用 `dsh plugin --profile web add ./dsh-dyou-wine-0.1.0-alpha.12.tgz --ignore-scripts`，更新后重启 Host 并刷新页面。

本版实际检查结果见 [TESTING.md](TESTING.md) 的 Alpha.12 节。Alpha.11 的真实隔离宿主演示与 Alpha.10 的干净副本构建、完整 BGM 验收及性能对照分别保留为历史证据，本轮未重复执行这些专项检查。公开仓库、npm 和市场投稿尚未执行。

未专项验证 Windows 原生 IME、DSH Desktop／TUI、其他 DSH 版本和物理扬声器；固定 120 BPM 动画独立于歌曲，不宣称逐拍精确同步。当前文件为已准备的发布公告，远程 GitHub Release 和 npm 尚未发布。
