# D友の酒 · Dyou Wine

状态：待公开发布的投稿草案。不要把“准备完成”写成“已收录”或“已获授权”。

- 仓库：`https://github.com/DoveLi-Gu/dsh-dyou-wine`
- npm 包：`dsh-dyou-wine`；当前候选 `0.1.0-alpha.12`，计划使用 `alpha` 标签。
- 类别：界面增强／娱乐／桌宠；仅 DSH Web。
- 中文简介：让 DSH 界面与蓝白鲸鱼娘毛绒玩偶按固定节奏 Q 弹；界面和玩偶可独立开关，玩偶满屏飞行、碰墙反弹。
- English: Fixed-rhythm squash-and-stretch motion for the DSH web interface, plus a flying whale-girl plush that reflects off the viewport edges. Both effects have independent switches.
- 已验收环境：Windows、DSH `0.2.0-rc.2`、桌面 Chromium Web；不宣称支持新版 DSH、Desktop、TUI 或移动端。
- 效果：固定 120 BPM／500 ms，微醺／上头／整活三档；支持暂停、醒酒与 Escape 清理。不会调用模型或发送聊天内容。
- 截图：仓库根 `screenshots.json` 明确列出真实测试会话画面和无声演示 GIF，不将宣传 Logo 当作插件截图。
- 音乐：内置用户指定原投稿 `https://www.bilibili.com/video/BV1hXbN6VEKV/` 的音轨，默认关闭；录音、词曲与合成声库不由代码 MIT 许可覆盖，署名不等于取得公开分发授权。完整权利范围见仓库 `docs/ASSETS.md`。
- 代码许可：MIT；请结合上述独立素材范围阅读。

以下命令**仅在对应发行源公开并核对可用后**用于投稿：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.12 --ignore-scripts
```

或下载已核对的 Release 附件 `dsh-dyou-wine-0.1.0-alpha.12.tgz`，按 README 安装。需要 Git spec 的表单可填 `github:DoveLi-Gu/dsh-dyou-wine#v0.1.0-alpha.12`；这个源码来源需要构建，不能宣称无脚本一键安装。

可用投稿入口（提交本身尚未执行）：

- DSH Marketplace：<https://dshmarketplace.dev/submit>，公开仓库表单；精选榜另投其 Awesome 仓库。
- DSH Plugin Hub：<https://dshpluginhub.dev/zh/submit>，公开预检后登录 GitHub 加入候选，审核前不入公开市场。
- DSHPlugin.io：<https://github.com/tjsdyy/dshplugin/issues/new?labels=plugin-submission>，附简介、仓库、安装目标及演示。
- Awesome 目录：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md>，使用同目录 YAML 草案。
- ydhrdh 市场：<https://github.com/ydhrdh/dsh-marketplace/blob/main/CONTRIBUTING.md>，使用同目录 JSON 草案。

不要为通过收录填写 `verified:true`、虚构 Star 数、扩大兼容范围，或将 Alpha 冒充稳定版。当前记录的是本地验证范围；CI 未实际运行，第三方审核尚未执行。
