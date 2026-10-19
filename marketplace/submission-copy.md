# D友の酒 · Dyou Wine

状态：Alpha.14 发行源已公开，累计九项正式投稿（四个 PR、三个 Issue、两个网页表单）；各入口实际状态见 `docs/MARKETPLACE.md`。不要把“已投稿”写成“已收录”或“已获授权”。

原三个 Issue 与 ydhrdh PR 的安装资料已更新 Alpha.14；10 月 19 日复核确认 DSH Market 已接受、DSH Marketplace 与 dshx 已有目录条目，不重复原投稿。dsh.pub、w211 与 dshplugin.online 保留既有来源快照，不宣称全部市场已同步新版或完成人工审核。发行源为 [npm 确切版本](https://www.npmjs.com/package/dsh-dyou-wine/v/0.1.0-alpha.14) 与 [Alpha.14 Release](https://github.com/DoveLi-Gu/dsh-dyou-wine/releases/tag/v0.1.0-alpha.14)。

- 仓库：`https://github.com/DoveLi-Gu/dsh-dyou-wine`
- npm 包：`dsh-dyou-wine`；已公开 `0.1.0-alpha.14`。公开 `alpha`／`latest` 均指向 Alpha.14；仍按 Alpha 对待，安装固定确切版本，不能把标签视为稳定性验收。
- 类别：界面增强／娱乐／桌宠；仅 DSH Web。
- 中文简介：让 DSH 界面与蓝白鲸鱼娘毛绒玩偶按固定节奏 Q 弹；界面和玩偶可独立开关，玩偶满屏飞行、碰墙反弹。
- English: Fixed-rhythm squash-and-stretch motion for the DSH web interface, plus a flying whale-girl plush that reflects off the viewport edges. Both effects have independent switches.
- 已验收环境：Windows、DSH `0.2.0-rc.2`、桌面 Chromium Web；不宣称支持新版 DSH、Desktop、TUI 或移动端。
- 效果：固定 120 BPM／500 ms，微醺／上头／整活三档；支持暂停、醒酒与 Escape 清理。不会调用模型或发送聊天内容。
- 截图：仓库根 `screenshots.json` 明确列出真实测试会话画面和无声演示 GIF，不将宣传 Logo 当作插件截图。
- 分发：真实客户端入口约 80 KB，玩偶 PNG 与 MP3 独立放入包内 `lib/assets/`，由本机 DSH `webServer` 固定路由提供，不依赖第三方图床或音乐 CDN。Alpha.14 的 host／client 与媒体和 Alpha.13 逐字节相同，真实文件已纳入公开 Git tag；各版发行包独立保留。
- 市场验证：[dsh.pub](https://dsh.pub/zh/plugins/dsh-dyou-wine/)、w211 与 [dshplugin.online](https://dshplugin.online/plugins/doveli-gu--dsh-dyou-wine) 保留既有目录快照；DSH Marketplace 已有可安装 npm 条目，dshx 显示 Alpha.14，DSH Market 已接受投稿。dsh-find-plugin 的实时 Community 来源可发现目标。社区来源或静态契约结果不代替运行兼容验收。
- 音乐：内置用户指定原投稿 `https://www.bilibili.com/video/BV1hXbN6VEKV/` 的音轨，默认关闭；录音、词曲与合成声库不由代码 MIT 许可覆盖，署名不等于取得公开分发授权。完整权利范围见仓库 `docs/ASSETS.md`。
- 代码许可：MIT；请结合上述独立素材范围阅读。

已公开并核对的 npm 确切版本安装命令：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.14 --ignore-scripts
```

或下载已公开的 Release 附件 `dsh-dyou-wine-0.1.0-alpha.14.tgz`，按 README 安装。需要 Git spec 的表单可填 `github:DoveLi-Gu/dsh-dyou-wine#v0.1.0-alpha.14`；Git 来源虽包含编译产物，但仍有 `prepare` 脚本，须遵循构建审批，不能宣称免审或无脚本一键安装。

投稿入口与本轮状态：

- DSH Marketplace：<https://dshmarketplace.dev/plugins?q=dsh-dyou-wine>，10 月 19 日已显示本插件，官方 API 确认可安装 npm 条目；`installCheck: null`，不称为安装沙箱通过。许可证 API 仍为 `NOASSERTION`，代码与素材范围以仓库声明为准。精选榜须独立 PR 审核。
- DSH Plugin Hub：<https://dshpluginhub.dev/zh/submit>，登录正常，Alpha.14 npm 源预检仍提示服务暂时不可用，公开搜索 0 条；旧维护者反馈已收到，正式候选待提交，不计入九项正式投稿且不重复反馈。
- DshMarketPlace 精选榜：<https://github.com/DshMarketPlace/awesome-dsh-plugin/pull/19>，主目录已可安装后新增投稿；仅新增本插件，官方离线测试及生成幂等通过，默认联网测试超时已说明；待上游 CI 和维护者审核，不称为已精选。
- DSHPlugin.io：<https://github.com/tjsdyy/dshplugin/issues/36> 已更新 Alpha.14，OPEN、待审核；官方生成目录中未找到目标。
- dsh-plugin.org：<https://github.com/dshplugin/dsh-plugin-hub/issues/281> 已关闭为完成，维护者说明下一轮自动扫描、无需手动操作；本插件已发布 npm，本轮目录请求失败，实际条目尚未确认。
- dsh.market：<https://github.com/2BingLing/dsh-market/issues/255> 已于 10 月 19 日接受收录并关闭，README 已加官方蓝色徽章；按机器人说明，10 月 20 日 06:00 更新后可搜索，网页同步情况尚未确认。
- dshx：10 月 19 日已在 <https://dshx.io/zh/plugins/dsh-dyou-wine> 显示 Alpha.14；网站兼容字段与 npm 可用性映射仍有偏差，安装请参考本项目确切版本命令。
- Awesome 目录：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md>，YAML 草案已备，待北京时间 2026-10-19 13:44:36 仓库满一天后再提交。
- ydhrdh 市场：<https://github.com/ydhrdh/dsh-marketplace/pull/17> 已更新固定 Alpha.14 tag，8／8 条目本地校验与构建通过；远程 fork 工作流为 `action_required`，待维护者批准与审核。
- Britneycode：<https://github.com/Britneycode/dsh-update-center/pull/1> 追加维护者 extras 数据，先前 21 项相关测试通过，本轮仍 OPEN／MERGEABLE、无修改反馈，待合并刷新。
- dsh.pub：<https://github.com/dsh-pub/dsh-pub/pull/144> 已合并，远程投稿验证通过，[已在线收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，标记社区投稿。
- DeepSeek DSH 目录：<https://deepseekdsh.com/plugins/explore> 共享 Awesome 与 YELEBAI 数据、缓存 1 小时，未发现独立必要投稿。

不要为通过收录填写 `verified:true`、虚构 Star 数、扩大兼容范围、制造无意义提交，或将 Alpha 冒充稳定版。当前验证范围见 TESTING.md；GitHub CI 以目标提交的实际结果为准，各市场状态以具体记录为准。
