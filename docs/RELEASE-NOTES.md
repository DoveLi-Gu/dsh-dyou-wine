# D友の酒 · Dyou Wine — 0.1.0-alpha.14

让 DSH 界面按固定节奏 Q 弹，让大肥鱼娘毛绒玩偶满屏飞、碰墙反弹。

这是面向 DeepSeek Harness `0.2.0-rc.2` Web 客户端的 Alpha 插件；界面和玩偶可独立开关、同时运行。默认静止，点击「开喝」后启动；支持微醺／上头／整活三档，「暂停」保留进度，「醒酒」或 Escape 退出并清理。

本版将最新趣味 README 随新版本同步到 npm：用大肥鱼娘、开喝和醒酒串起玩法，前置安装与操作，保留顶部作者支持入口和底部完整介绍；设置、源码安装与开发细节收进折叠区。兼容范围、真实演示、音频署名与素材范围继续明确列出。

仅更新文档和包版本，业务源码、原完整音轨、角色、固定节奏、飞行反弹及面板不变。host／client 和两份媒体与 Alpha.13 基线逐字节一致；本版类型检查、69 项单元测试、构建、37 项浏览器测试、市场元数据与 21 文件包白名单检查均通过。Alpha.13 的媒体拆分、同源静态路径及 Range／HEAD／缓存／卸载清理设计保留。

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/) — 活跃黑江乐《朋友的酒 DJ 完整版》。歌曲录音、词曲及声库不适用本项目代码 MIT；来源与素材范围见 [ASSETS.md](ASSETS.md)。

本版安装包名：`dsh-dyou-wine-0.1.0-alpha.14.tgz`。公开可用状态与完整性值以 [npm 确切版本](https://www.npmjs.com/package/dsh-dyou-wine/v/0.1.0-alpha.14) 和 [GitHub Releases](https://github.com/DoveLi-Gu/dsh-dyou-wine/releases) 的实际记录为准。安装命令：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.14 --ignore-scripts
```

本地 tarball 安装命令：`dsh plugin --profile web add ./dsh-dyou-wine-0.1.0-alpha.14.tgz --ignore-scripts`；更新后重启 Host 并刷新页面。本次未更新用户日常 DSH。

本版检查及字节比对证据见 [TESTING.md](TESTING.md) 的 Alpha.14 节；CI 以 [Actions](https://github.com/DoveLi-Gu/dsh-dyou-wine/actions) 相应提交的实际结果为准。Alpha.13 的包、tag 和发行附件保留；本版发布配置使用 `alpha` 标签，发布后读取实际 dist-tags 与完整性值。Alpha.13 首发时出现 `alpha`／`latest` 双标签，验证成功后删除 `latest` 仍被 Registry 以 HTTP 400 拒绝；该历史不代表本版实际标签，不承诺只存在 alpha。

既有七项市场投稿仍是两个 PR、三个 Issue 和两个网页表单：[dsh.pub 已在线收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，来源标记为社区投稿；其余待审核、检测或运营处理。它们不代表 Alpha.14 已重新投稿或通过审核，详见 [市场状态](MARKETPLACE.md)。

DSH Plugin Hub 登录已恢复，已登录预检仍提示“检查服务暂时不可用，请稍后重试。”；官网维护者已确认收到人工收录请求，正式候选待提交。该反馈不计入上述七项市场投稿。

本次未重跑真实 DSH、60 秒性能对照或物理扬声器验收；因运行入口和媒体逐字节相同，真实宿主功能证据沿用单列的 Alpha.13 历史，不称为本版新实测。Windows 原生 IME、DSH Desktop／TUI 和其他 DSH 版本仍未专项验证；固定 120 BPM 动画独立于歌曲，不宣称逐拍精确同步。Alpha.13 的原验收 tarball 不覆盖重发；Alpha.14 使用独立版本携带当前 README。
