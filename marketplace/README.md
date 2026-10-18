# 市场投稿草案

这里保存市场投稿资料，**不是市场已经收录的记录**。GitHub 仓库、Alpha.13 tag 与发行附件已公开，远程 Topics 已设置；npm 尚未发布，各市场尚未提交。各市场的核对结果与限制见 [收录准备](../docs/MARKETPLACE.md)。

| 文件 | 发布后用途 |
| --- | --- |
| `github-topics.json` | 给真实 GitHub 仓库设置 Topics；这是 GitHub API 的请求体，GitHub 不会自动读取本文件 |
| `awesome-dsh-plugin/data/plugins/DoveLi-Gu__dsh-dyou-wine.yml` | 向 `awesome-dsh-plugin/awesome-dsh-plugin` 的同路径提交单文件 PR；仓库创建需满一天，并由对方审查 |
| `ydhrdh/registry/plugins/dsh-dyou-wine/plugin.json` | 向 `ydhrdh/dsh-marketplace` 的同路径提交 PR；保持 `verified:false`，等待维护者核验 |
| `dsh-pub/submissions/doveli-gu--dsh-dyou-wine.json` | Alpha.13 拆分包内媒体、保留真实编译入口，本地候选已通过其 1 MB 与 bundle 契约检查；最终 Git 提交及公开远程检查后才可投稿，当前仍 pending |
| `submission-copy.md` | 各网站表单／Issue 的统一介绍、安装目标及真实验证边界 |

远程 Topics 已按本目录 JSON 设置；后续可用有管理权限且已登录的 GitHub CLI 更新（命令会修改远程仓库）：

```sh
gh api --method PUT repos/DoveLi-Gu/dsh-dyou-wine/topics --input marketplace/github-topics.json
```

`dsh-market` 使用 Awesome 上游目录，`dsh-find-plugin` 直接搜索 Topic；无需向同源的每个界面重复投稿。`DshMarketPlace/awesome-dsh-plugin` 是另一份精选列表，应按它的贡献指南编辑分类并运行其检查，不能把上述 YAML 当作通用格式。

Alpha.13 将真实 `lib/host.js`、`lib/client.js` 与 `lib/assets/` 中的玩偶／音轨一并纳入 Git 发布源。客户端约 80 KB，媒体通过本机 DSH `webServer` 固定路由加载，媒体原文件仍随包分发；并非空壳入口或远程执行代码。最终 commit 后须再次从 Git blob 核对文件存在和内容，工作树候选通过不能替代远程默认分支检查。

投稿前确认远程 `v0.1.0-alpha.13` 和相应 Release tarball 实际可访问，再使用此处带 tag 的安装目标。Git 来源仍有 `prepare`，构建审批须遵循宿主和市场规则，不能仅因提交了产物就宣传免审一键安装；只有已经公开且通过扫描器核验的精确 npm tarball 才能作为无需源码构建的安装证据。

官方新版 Discover 使用各运营方提供的 format 1 索引。GitHub 发行源已公开，但尚未指定目标索引，不生成含未发布 npm 版本的“有效索引”。向索引运营方登记时使用真实版本、源 commit、发布时间及 `engines.dsh`。
