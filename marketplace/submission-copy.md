# D友の酒 · Dyou Wine

状态：发行源已公开，部分市场已投稿；各入口实际状态见 `docs/MARKETPLACE.md`。不要把“已投稿”写成“已收录”或“已获授权”。

七项既有回执及其中已核对的安装目标属于 Alpha.13。Alpha.14 为文档同步版，完整本地检查和运行入口／媒体字节比对已通过；此处保留原投稿记录，不宣称新版重新投稿。后续使用本版安装目标时，先核对 [npm 确切版本](https://www.npmjs.com/package/dsh-dyou-wine/v/0.1.0-alpha.14) 或相应 [Release](https://github.com/DoveLi-Gu/dsh-dyou-wine/releases) 的实际公开记录。

- 仓库：`https://github.com/DoveLi-Gu/dsh-dyou-wine`
- npm 包：`dsh-dyou-wine`；既有回执使用已公开 `0.1.0-alpha.13`。该版首发时 `alpha`／`latest` 均指向 Alpha.13，验证成功后删除 `latest` 仍被 Registry 以 HTTP 400 拒绝；后续版本与标签需核对 Registry，安装固定确切版本，不能把标签视为稳定性验收。
- 类别：界面增强／娱乐／桌宠；仅 DSH Web。
- 中文简介：让 DSH 界面与蓝白鲸鱼娘毛绒玩偶按固定节奏 Q 弹；界面和玩偶可独立开关，玩偶满屏飞行、碰墙反弹。
- English: Fixed-rhythm squash-and-stretch motion for the DSH web interface, plus a flying whale-girl plush that reflects off the viewport edges. Both effects have independent switches.
- 已验收环境：Windows、DSH `0.2.0-rc.2`、桌面 Chromium Web；不宣称支持新版 DSH、Desktop、TUI 或移动端。
- 效果：固定 120 BPM／500 ms，微醺／上头／整活三档；支持暂停、醒酒与 Escape 清理。不会调用模型或发送聊天内容。
- 截图：仓库根 `screenshots.json` 明确列出真实测试会话画面和无声演示 GIF，不将宣传 Logo 当作插件截图。
- 分发：Alpha.13 的真实客户端入口约 80 KB，玩偶 PNG 与 MP3 独立放入包内 `lib/assets/`，由本机 DSH `webServer` 固定路由提供；功能完整保留，不依赖第三方图床或音乐 CDN。真实 host／client 及媒体均纳入公开 Git tag；npm 使用原验收 tarball，公开完整性值已核对。
- 市场验证：累计完成两个 PR、三个 Issue 和两个网页表单投稿；[dsh.pub 已在线收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，`community-submitted` 仅表示社区投稿来源，不是人工审核。ydhrdh PR #17、三个 Issue 及两个网页表单待审核、检测或运营处理。每个入口的审核、网站展示与运行兼容分别记录。
- 音乐：内置用户指定原投稿 `https://www.bilibili.com/video/BV1hXbN6VEKV/` 的音轨，默认关闭；录音、词曲与合成声库不由代码 MIT 许可覆盖，署名不等于取得公开分发授权。完整权利范围见仓库 `docs/ASSETS.md`。
- 代码许可：MIT；请结合上述独立素材范围阅读。

已公开并核对的 npm 确切版本安装命令：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.13 --ignore-scripts
```

或下载已核对的 Release 附件 `dsh-dyou-wine-0.1.0-alpha.13.tgz`，按 README 安装。需要 Git spec 的表单可填 `github:DoveLi-Gu/dsh-dyou-wine#v0.1.0-alpha.13`；Git 来源虽包含编译产物，但仍有 `prepare` 脚本，须遵循构建审批，不能宣称免审或无脚本一键安装。

投稿入口与本轮状态：

- DSH Marketplace：<https://dshmarketplace.dev/submit>，表单已接收，页面确认仓库已排队等待人工审核；备注列明确切 npm 版本、Web 兼容、代码 MIT 与第三方素材范围，并请维护者核对 `No licence` 误报。精选榜另受已有目录条目与提交数要求限制。
- DSH Plugin Hub：<https://dshpluginhub.dev/zh/submit>，登录已恢复，预检仍提示检查服务暂时不可用；官网维护者反馈已收到，正式候选待提交。此反馈不计入七项市场投稿。
- DSHPlugin.io：已提交 <https://github.com/tjsdyy/dshplugin/issues/36>，附简介、仓库、npm 安装目标及演示，待审核。
- dsh-plugin.org：已提交 <https://github.com/dshplugin/dsh-plugin-hub/issues/281>，待审核。
- dsh.market：已提交 <https://github.com/2BingLing/dsh-market/issues/255>，OPEN、`submission` 标签，待自动候选检测。
- dshx：表单已确认“仓库已进入下一轮运营队列。”，待运营收录；目录 <https://dshx.io/zh/plugins>。
- Awesome 目录：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md>，YAML 草案已备，待北京时间 2026-10-19 13:44:36 仓库满一天后再提交。
- ydhrdh 市场：已提交 <https://github.com/ydhrdh/dsh-marketplace/pull/17>，远程 fork 工作流与审核待维护者批准。
- dsh.pub：<https://github.com/dsh-pub/dsh-pub/pull/144> 已合并，远程投稿验证通过，[已在线收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，标记社区投稿。
- DeepSeek DSH 目录：<https://deepseekdsh.com/plugins/explore> 共享 Awesome 与 YELEBAI 数据、缓存 1 小时，未发现独立必要投稿。

不要为通过收录填写 `verified:true`、虚构 Star 数、扩大兼容范围、制造无意义提交，或将 Alpha 冒充稳定版。当前验证范围见 TESTING.md；GitHub CI 以目标提交的实际结果为准，各市场状态以具体记录为准。
