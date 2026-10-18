# 市场投稿资料

这里保存市场投稿资料；是否收录以各市场实际记录为准。GitHub 仓库、Alpha.13 tag、发行附件与 npm 确切版本已公开，远程 Topics 已设置；已提交两个 PR 与两个 Issue，其中 dsh.pub PR 已合并、目录已生成并提交，网站部署待确认。各市场链接、核对结果与限制见 [市场状态](../docs/MARKETPLACE.md)。

| 文件 | 发布后用途 |
| --- | --- |
| `github-topics.json` | 给真实 GitHub 仓库设置 Topics；这是 GitHub API 的请求体，GitHub 不会自动读取本文件 |
| `awesome-dsh-plugin/data/plugins/DoveLi-Gu__dsh-dyou-wine.yml` | 待仓库创建满一天：最早北京时间 2026-10-19 13:44:36 才可提交单文件 PR；由对方审查 |
| `ydhrdh/registry/plugins/dsh-dyou-wine/plugin.json` | 已提交 [PR #17](https://github.com/ydhrdh/dsh-marketplace/pull/17)；保持 `verified:false`，远程 fork CI 与审核待维护者批准 |
| `dsh-pub/submissions/doveli-gu--dsh-dyou-wine.json` | 已提交 [PR #144](https://github.com/dsh-pub/dsh-pub/pull/144)，远程验证通过且已合并；[目录已生成并提交](https://github.com/dsh-pub/dsh-pub/commit/4113d9e47a2fe66a1d027b3c550a0db61a405c1e)，网站部署待确认 |
| `submission-copy.md` | 各网站表单／Issue 的统一介绍、安装目标及真实验证边界 |

远程 Topics 已按本目录 JSON 设置；后续可用有管理权限且已登录的 GitHub CLI 更新（命令会修改远程仓库）：

```sh
gh api --method PUT repos/DoveLi-Gu/dsh-dyou-wine/topics --input marketplace/github-topics.json
```

`dsh-market` 使用 Awesome 上游目录，`dsh-find-plugin` 直接搜索 Topic；无需向同源的每个界面重复投稿。`DshMarketPlace/awesome-dsh-plugin` 是另一份精选列表，应按它的贡献指南编辑分类并运行其检查，不能把上述 YAML 当作通用格式。

Alpha.13 将真实 `lib/host.js`、`lib/client.js` 与 `lib/assets/` 中的玩偶／音轨一并纳入 Git 发布源。客户端约 80 KB，媒体通过本机 DSH `webServer` 固定路由加载，媒体原文件仍随包分发；并非空壳入口或远程执行代码。最终 commit 后须再次从 Git blob 核对文件存在和内容，工作树候选通过不能替代远程默认分支检查。

远程 `v0.1.0-alpha.13`、Release tarball 与 npm 确切版本均已公开核对；npm 使用原验收 tarball，安装命令见 `submission-copy.md`。Git 来源仍有 `prepare`，构建审批须遵循宿主和市场规则，不能仅因提交了产物就宣传免审一键安装。首次发包自动创建的 `latest` 待 npm 二次验证后移除；投稿时固定 Alpha 版本，不以 dist-tag 代替版本。

官方新版 Discover 使用各运营方提供的 format 1 索引。发行源已公开，但尚未指定目标索引，未擅自为用户安装市场或添加索引。向索引运营方登记时使用真实版本、源 commit、发布时间及 `engines.dsh`。
