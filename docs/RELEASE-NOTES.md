# D友の酒 · Dyou Wine — 0.1.0-alpha.13

让 DSH 界面按固定节奏 Q 弹，让大肥鱼娘毛绒玩偶满屏飞、碰墙反弹。

这是面向 DeepSeek Harness `0.2.0-rc.2` Web 客户端的 Alpha 插件；界面和玩偶可独立开关、同时运行。默认静止，点击「开喝」后启动；支持微醺／上头／整活三档，「暂停」保留进度，「醒酒」或 Escape 退出并清理。

本版将 PNG 和 MP3 从客户端 JavaScript 拆为包内独立文件，经 DSH Host 同源固定路径加载；完整业务代码入口降至 80,268 bytes，真实编译入口与资源加入 Git，满足 dsh.pub 单文件 1,000,000 bytes 阈值。原完整音轨、角色、固定节奏、飞行反弹和面板保持原有效果，保留演示与中转站宣传。

Host 支持音频分段请求、HEAD、缓存重新验证与卸载清理。市场元数据、截图及投稿资料继续保留；dsh.pub 远程投稿验证通过、PR #144 已合并，[已在线收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，来源标记为社区投稿；其余 PR／Issue、表单与准入状态见 [市场状态](MARKETPLACE.md)。

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/) — 活跃黑江乐《朋友的酒 DJ 完整版》。歌曲录音、词曲及声库不适用本项目代码 MIT；来源与素材范围见 [ASSETS.md](ASSETS.md)。

安装包：`dsh-dyou-wine-0.1.0-alpha.13.tgz`。已在 [npm](https://www.npmjs.com/package/dsh-dyou-wine/v/0.1.0-alpha.13) 公开，可执行：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.13 --ignore-scripts
```

本地 tarball 安装可直接使用 `dsh plugin --profile web add ./dsh-dyou-wine-0.1.0-alpha.13.tgz --ignore-scripts`，更新后重启 Host 并刷新页面。

本版实际检查结果见 [TESTING.md](TESTING.md) 的 Alpha.13 节。GitHub 仓库、tag、发行附件与 npm 确切版本已公开，发现 topics 已设置；累计完成两个 PR、三个 Issue 和两个网页表单投稿，除 dsh.pub 外，ydhrdh、DSHPlugin.io、dsh-plugin.org、dsh.market、DSH Marketplace 与 dshx 均待审核、检测或运营处理。当前 `alpha`／`latest` 均指向 Alpha.13；维护者本次验证成功后，Registry 仍以 HTTP 400 拒绝删除 `latest`，暂保留双标签，版本仍为 Alpha，请固定版本安装。实际构建、HTTP 媒体、真实 DSH 与市场检查分别记录，不把其中一项替代另一项。

未专项验证 Windows 原生 IME、DSH Desktop／TUI、其他 DSH 版本和物理扬声器；固定 120 BPM 动画独立于歌曲，不宣称逐拍精确同步。GitHub 发行附件与 npm 保留原验收 tarball，公开 Registry 的完整性值已比对，未重打包；包内文档中的发布前状态反映当时记录，当前发布状态以本公告和仓库 README 为准。
