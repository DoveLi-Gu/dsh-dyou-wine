# 市场投稿资料

这里保存市场投稿资料；是否收录以各市场实际记录为准。Alpha.14 的 GitHub tag、发行附件与 npm 确切版本已公开，远程 Topics 已设置；公开 `alpha`／`latest` 均指向 Alpha.14，版本仍是 Alpha。累计完成八项正式投稿（三个 PR、三个 Issue、两个网页表单）；目录同步、审核和每项回执见 [市场状态](../docs/MARKETPLACE.md)。

本轮将原三个 Issue 正文与 ydhrdh PR 更新到 Alpha.14，并新增 [Britneycode 补漏 PR #1](https://github.com/Britneycode/dsh-update-center/pull/1)；没有重复创建原投稿。dsh.pub、w211 与 dshplugin.online 当前显示 Alpha.13 快照，不能把包版本更新当作目录同步或人工审核。Hub 的维护者反馈仍不计为正式候选。

| 文件 | 发布后用途 |
| --- | --- |
| `github-topics.json` | 给真实 GitHub 仓库设置 Topics；这是 GitHub API 的请求体，GitHub 不会自动读取本文件 |
| `awesome-dsh-plugin/data/plugins/DoveLi-Gu__dsh-dyou-wine.yml` | 待仓库创建满一天：最早北京时间 2026-10-19 13:44:36 才可提交单文件 PR；由对方审查 |
| `ydhrdh/registry/plugins/dsh-dyou-wine/plugin.json` | 原 [PR #17](https://github.com/ydhrdh/dsh-marketplace/pull/17) 已更新固定 Alpha.14 tag；保持 `verified:false`，8／8 条目校验与构建通过，远程 fork CI 与审核待维护者批准 |
| `dsh-pub/submissions/doveli-gu--dsh-dyou-wine.json` | [PR #144](https://github.com/dsh-pub/dsh-pub/pull/144) 已合并，远程验证通过，[已在线收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)；社区投稿标记不等于人工审核 |
| `submission-copy.md` | 各网站表单／Issue 的统一介绍、安装目标及真实验证边界 |

远程 Topics 已按本目录 JSON 设置；后续可用有管理权限且已登录的 GitHub CLI 更新（命令会修改远程仓库）：

```sh
gh api --method PUT repos/DoveLi-Gu/dsh-dyou-wine/topics --input marketplace/github-topics.json
```

`dsh-market` 使用 Awesome 上游目录，`dsh-find-plugin` 直接搜索 Topic；无需向同源的每个界面重复投稿。`DshMarketPlace/awesome-dsh-plugin` 是另一份精选列表，应按它的贡献指南编辑分类并运行其检查，不能把上述 YAML 当作通用格式。

Alpha.13 将真实 `lib/host.js`、`lib/client.js` 与 `lib/assets/` 中的玩偶／音轨一并纳入 Git 发布源。客户端约 80 KB，媒体通过本机 DSH `webServer` 固定路由加载，媒体原文件仍随包分发；并非空壳入口或远程执行代码。最终 commit 后须再次从 Git blob 核对文件存在和内容，工作树候选通过不能替代远程默认分支检查。

当前投稿安装目标使用已公开的 `dsh-dyou-wine@0.1.0-alpha.14` 或 `v0.1.0-alpha.14`；已合并的 dsh.pub 及其他目录旧快照保留原固定来源，不重复提交。Git 来源仍有 `prepare`，构建审批须遵循宿主和市场规则，不能仅因提交了产物就宣传免审一键安装。Alpha.13 首发删除 `latest` 返回 HTTP 400 的记录属于历史；当前两标签均为 Alpha.14，安装仍固定确切版本。

官方新版 Discover 使用各运营方提供的 format 1 索引。发行源已公开，但尚未指定目标索引，未擅自为用户安装市场或添加索引。向索引运营方登记时使用真实版本、源 commit、发布时间及 `engines.dsh`。
