# 插件市场发现与投稿状态

核查日期：2026-10-18。已发布版本：`0.1.0-alpha.14`；仓库：`DoveLi-Gu/dsh-dyou-wine`；npm：`dsh-dyou-wine`。

Alpha.14 已在 [npm](https://www.npmjs.com/package/dsh-dyou-wine/v/0.1.0-alpha.14) 和 [GitHub Release](https://github.com/DoveLi-Gu/dsh-dyou-wine/releases/tag/v0.1.0-alpha.14) 公开，tag 指向 `611f4e7d8e8d71f22c60e9cfa4b374c97bc20c56`；公开 `alpha`／`latest` 均指向 Alpha.14，版本仍是 Alpha。Alpha.13 的包和 tag 保留。以下目录分别记录实际版本与来源快照，不能把 npm 更新当作所有市场已同步。

累计完成 **八项正式投稿：三个 PR、三个 Issue、两个网页表单**。本轮新增 Britneycode 补漏 PR，并将原三个 Issue 与 ydhrdh PR 的安装资料更新至 Alpha.14；未重复创建原回执。dsh.pub、w211 与 dshplugin.online 已能查到 Alpha.13 目录快照，dsh-find-plugin 的实时 Community 搜索也返回目标。其余投稿、候选与自动同步情况见下表；Hub 维护者反馈不计为正式候选。投稿、合并、网站展示与运行兼容分别核对，不把一个结果替代其他结果。本表覆盖本次找到并核对的入口，不声称穷尽全网。

## 三种信息分别负责什么

- `package.json` 的 `dsh.bundle.patch` 与实际 patch／入口使包可被 DSH 安装；`engines.dsh` 继续只声明已验证的 `0.2.0-rc.2`，不为扩大曝光虚增兼容范围。
- npm `keywords` 中的 `dsh-plugin` 与 GitHub 仓库的 `dsh-plugin` topic 负责被搜索发现；两者是独立配置。写在本地 JSON／README 中不会替远程仓库设置 topic。
- `dsh.marketplace` 是部分社区扫描器识别的补充元数据，**不是官方统一注册字段**。本项目声明 `profiles: ["web"]`、`requiresRestart: true`、`manualSteps: false`；不声明 `requiresBuildApproval`，让扫描器根据 Git／npm 实际来源判断构建需求。静态声明不能替代入口、产物或安装验证。[YELEBAI 规则](https://github.com/YELEBAI/dsh-plugin-marketplace#registry-如何工作)

## 入口与数据来源

| 市场／入口 | 发现或收录规则 | 本项目的下一步与当前边界 |
| --- | --- | --- |
| 官方新版 Discover／`plugin_market` | 读取用户配置的 `indexes`；实验 bundle 默认关闭、默认索引为 `[]`，不是全网自动注册。 | 向目标索引运营方申请收录；本机已验证的 `0.2.0-rc.2` 没有该新版入口，未为此升级宿主。[官方读取器](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/boot/plugin-market/README.md)、[索引格式](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/util/plugin-market-index/README.md) |
| Awesome DSH Plugin／`awesome-dsh-plugin.com` | 人工策展：PR 新增 `data/plugins/<owner>__<repo>.yml`；仓库创建满 1 天、真实代码、bundle、topic 均需满足。 | 草稿已备，尚未提交：本仓库最早于北京时间 **2026-10-19 13:44:36** 满一天。分类 `fun`；CI 通过仍需维护者阅读代码。[投稿原文](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/53b303576470bc9547e6cb4e4b922904d32edfbf/contributing.md) |
| `dsh-market/dsh-market`／`dshmarket` | 消费上一行的同一策展目录，不在市场应用仓库单独收条目。 | Awesome 上游合并后等待市场同步；不重复向应用仓库投稿。[数据源与投稿](https://github.com/dsh-market/dsh-market#submit-your-plugin) |
| `awesome-dsh-plugin/dsh-find-plugin` | 实时 GitHub `dsh-plugin` topic 搜索，5 分钟缓存；策展目录补充双语描述，并用于限流／离线回退。 | 使用未修改的上游 `searchGitHub` 函数搜索包名，实际返回目标 1 条，证明实时 Community 可发现；不是 Awesome 策展收录或应用 UI 验收。[发现机制](https://github.com/awesome-dsh-plugin/dsh-find-plugin#how-it-works) |
| DSH Marketplace／`dshmarketplace.dev` | 自动同步 GitHub `dsh-plugin` topic；缺失条目可走提交表单，提交后人工审核。 | 原表单已确认入队，待人工审核；本轮[官网精确搜索](https://dshmarketplace.dev/plugins?q=dsh-dyou-wine) 仍为 0 条，不重复提交。备注已列 Web 兼容、代码 MIT 与第三方素材范围，并请维护者核对 `No licence` 误报。[官方提交页](https://dshmarketplace.dev/submit) |
| `DshMarketPlace/dsh-plugins-store`、其 CLI／Python／Radar | 与上一行共用 `dshmarketplace.dev` API，不是几个独立目录。 | 网站收录后核查同源客户端；不重复投稿。[同源客户端代码](https://github.com/DshMarketPlace/dsh-plugins-store/blob/main/src/catalog.js) |
| `DshMarketPlace/awesome-dsh-plugin` 精选榜 | 独立于 `awesome-dsh-plugin/awesome-dsh-plugin`；PR 修改该组织的 `data/curated.yml`，须已有可安装目录条目，topic 目录准入要求至少 10 次正常提交。 | 审计时已有 11 次真实提交，提交数门槛已满足；官网精确搜索仍为 0，缺少主目录可安装条目，因此尚不能投精选。主目录表单已排队；不制造无意义提交或重复 PR。[贡献规则](https://github.com/DshMarketPlace/awesome-dsh-plugin/blob/ea92dcf85549e8e5dd84d04b15e91cc8a69c3e5c/CONTRIBUTING.md) |
| `dshplugin.io`／`tjsdyy/dshplugin` | 同步 Awesome 上游并补充 `dshhub.org` 新条目，失败时保留本地快照；有独立 issue 投稿入口。 | [Issue #36](https://github.com/tjsdyy/dshplugin/issues/36) 正文已更新 Alpha.14，仍 OPEN、待审核；[官方生成目录](https://github.com/tjsdyy/dshplugin/blob/main/app/plugins.json) 3,729 条中未找到目标。该仓库尚无 `plugin-submission` 标签，未自行创建。[同步源码](https://github.com/tjsdyy/dshplugin/blob/main/scripts/sync-plugins.mjs) |
| YELEBAI／`dsh-plugin-marketplace` | 定时扫描 `topic:dsh-plugin archived:false`，验证后写入中心 Registry；topic 本身不等于收录。 | 当前 Registry 未含目标，生成于 `2026-10-18T04:51:45Z`，早于本仓库创建；未进入拒绝或引导名单，等待正常扫描，不视为准入拒绝。未发现独立必要投稿入口。[Registry 规则](https://github.com/YELEBAI/dsh-plugin-marketplace#registry-如何工作) |
| w2112515／`dsh-plugin-marketplace` | 每日 topic 扫描并静态验证；`dsh-category-ui` 可显式归类；一键安装要求固定 commit 内存在加载产物。 | [实际目录](https://w2112515.github.io/dsh-plugin-marketplace/plugin-marketplace/catalog-v1.json) 已收录 Alpha.13，固定源 `274be54595aa6d024d52efe282712be50e1b2fc8`，标记 `valid-bundle`／`one-click-eligible`；兼容性仍为 `unknown`，保留 `prepare`／生命周期脚本风险。Alpha.14 未同步，不是新版实机验收。[作者规则](https://github.com/w2112515/dsh-plugin-marketplace#for-plugin-authors) |
| ydhrdh／`dsh-marketplace` | 独立 PR，新增 `registry/plugins/<id>/plugin.json`，由维护者授予 verified 状态。 | 原 [PR #17](https://github.com/ydhrdh/dsh-marketplace/pull/17) 已更新固定 Alpha.14 tag，保留 `verified: false`；上游本地 8／8 条目校验与构建通过。[远程 fork CI](https://github.com/ydhrdh/dsh-marketplace/actions/runs/39120791457) 为 `action_required`，待维护者批准与审核。[贡献指南](https://github.com/ydhrdh/dsh-marketplace/blob/main/CONTRIBUTING.md) |
| `dsh.pub` | 独立 GitHub PR 提交公开仓库，静态验证 bundle 与已提交入口；topic 发现同样需通过其检查。 | [PR #144](https://github.com/dsh-pub/dsh-pub/pull/144) 已合并；远程验证通过，[目录已提交](https://github.com/dsh-pub/dsh-pub/commit/4113d9e47a2fe66a1d027b3c550a0db61a405c1e)。官方搜索 API 已确认收录并返回[详情入口](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，条目为 `community-submitted`、`installable: true`。Alpha.13 完整 client 入口为 80,268 bytes。[验证运行](https://github.com/dsh-pub/dsh-pub/actions/runs/39107411742)、[校验源码](https://github.com/dsh-pub/dsh-pub/blob/d93c8bf289c5fb045ccad77ea4610cce0d895b97/scripts/lib/plugin-submission.mjs) |
| `dshplugin.online` | 自站说明为 GitHub 仓库加 `dsh-plugin` topic 后进入目录。 | 已在真实网页确认[详情条目](https://dshplugin.online/plugins/doveli-gu--dsh-dyou-wine)，目前为 Alpha.13、5 次提交及旧 README 快照，Alpha.14 与最新文案未同步。[第一方说明](https://dshplugin.online/) |
| Fufan Studio Plugin Center | npm `keywords:dsh-plugin` 搜索，读取确切 npm 版本的 bundle；精确包名查询默认取 latest。 | 精确 npm 包名路线已可读取 Alpha.14 与 bundle 元数据，`alpha`／`latest` 均为本版；关键词搜索响应未含目标，未启动 Plugin Center UI，不宣称界面已列出。[目录源码](https://github.com/fufankeji/deepseek-harness-studio/blob/main/apps/desktop/src/plugin-center/npm-ecosystem-catalog.ts) |
| `dsh.deepseek404.com` | 自站页脚声明从 GitHub 公开项目自动聚合、未经人工审核，并链接 GitHub topic。 | 本轮通过官网 GET 搜索表单查询包名，结果为 0，等待聚合同步；未发现独立必要投稿入口，不把自动聚合表述为审核通过。[搜索入口](https://dsh.deepseek404.com/index.php?q=dsh-dyou-wine) |
| bradeGithub／`DSH-Plugins-Marketplace` | `dsh-plugin` topic 扫描，再按 `dsh` 对象或宿主依赖等能力信号识别插件。 | 当前 Registry 未含目标，生成于 `2026-10-18T04:05:08Z`，早于本仓库创建，等待自动同步；不是已确认拒绝，无需另加虚构识别字段。[作者标准](https://github.com/bradeGithub/DSH-Plugins-Marketplace/blob/main/STANDARD.md)、[实际识别器](https://github.com/bradeGithub/DSH-Plugins-Marketplace/blob/main/lib/domain/validation.js) |
| `dsh.market`／`2BingLing/dsh-market` | 扫描 `dsh-plugin`、`dsh` 等 topics，随后检测 `cordis.patch.yml` 等真实插件标记；另支持 Issue 投稿。 | 原 [Issue #255](https://github.com/2BingLing/dsh-market/issues/255) 已更新 Alpha.14，仍 OPEN、`submission` 标签，仅有自动回执；[官方目录](https://github.com/2BingLing/dsh-market/blob/master/web/public/plugins.json) 12,603 条中未含目标，生成于 `2026-10-17T21:32:09Z`，待刷新处理。[第一方规则](https://github.com/2BingLing/dsh-market#收录机制) |
| `dsh-plugin.org` | 扫描公开仓库的 `dsh-plugin` topic，读取根 `package.json`、README 安装命令和 `apply(ctx)`；网站 topic 索引与应用内 npm 插件中心不同。 | 原 [Issue #281](https://github.com/dshplugin/dsh-plugin-hub/issues/281) 已更新 Alpha.14，仍 OPEN、待审核；[官方 npm 目录](https://api.dsh-plugin.org/plugins.en.json) 4,677 条中未找到目标。更大的网站 topic 索引因网络失败无法确认，不能据此说整站未收录。[收录要求](https://dsh-plugin.org/zh/submit) |
| Britneycode／`dsh-update-center` | topic 搜索、npm 关键词及 repository 映射；自动搜索有 Star 前 500 的窗口，另将维护者 extras 合入目录。 | 旧 976 条目录未含目标；已补投 [PR #1](https://github.com/Britneycode/dsh-update-center/pull/1)，仅追加真实仓库元数据至 `data/extra-plugins.json`，21 项相关测试通过，OPEN／MERGEABLE，待合并刷新。[第一方说明](https://github.com/Britneycode/dsh-update-center#插件市场) |
| DSH Plugin Hub／`dshpluginhub.dev` | npm 包／GitHub 仓库／安装命令可公开预检；GitHub 登录后才能交候选，审核前不进入市场搜索或排行榜。 | 登录正常，使用 Alpha.14 npm 源预检仍提示“检查服务暂时不可用，请稍后重试。”，公开搜索 0 条；旧维护者反馈已收到，不重复反馈，正式候选待提交且不计入八项回执。[候选入口](https://dshpluginhub.dev/zh/submit) |
| `dshx.io` | 独立网站投稿，进入运营队列后处理。 | 原表单已确认进入下一轮运营队列；本轮官方 WebMCP 搜索返回 `total: 0`，待运营收录，不重复投稿。[目录入口](https://dshx.io/zh/plugins) |
| `deepseekdsh.com` | 共享 Awesome 的 `plugins.json` 及 YELEBAI 的 `install-review.json`，缓存 1 小时。 | 未发现独立必要投稿，随相应上游目录更新；不把共享数据的多个界面当成独立审核。[目录入口](https://deepseekdsh.com/plugins/explore)、[Awesome 数据](https://awesome-dsh-plugin.com/plugins.json) |

本次 dshx 表单回执截图保存在忽略目录 `.qa/verification-followup/dshx-submitted.png`；进入运营队列不等于已在目录展示。

2026-10-18 再次核查，未发现本插件遗漏的自动发现必填字段。两个额外可选声明不作为入场条件添加：brade 标准的顶层 `disclosure` 用于数据行为说明，但其当前构建器的披露徽章来自聚合目录，没有直接读取每个候选包；YELEBAI 的 `dsh-plugin.json` 仅用于 Community/TUI v0.15 预检，本插件未声明该载体兼容。[brade 构建器](https://github.com/bradeGithub/DSH-Plugins-Marketplace/blob/main/scripts/build-registry.mjs)、[YELEBAI 校验器](https://github.com/YELEBAI/dsh-plugin-marketplace/blob/main/scripts/registry-core.mjs)

`DshMarketPlace/awesome-dsh-plugin` 的贡献指南还列出 topic 目录准入的提交数要求，和另一组织 Awesome 的“仓库满一天”规则不同；不能为满足条件制造无意义提交。[独立贡献规则](https://github.com/DshMarketPlace/awesome-dsh-plugin/blob/main/CONTRIBUTING.md)

## dsh.pub 的 1 MB 适配与验证边界

Alpha.12 曾有两个阻碍：`lib` 未提交到 Git，且内嵌 PNG／MP3 的 `lib/client.js` 达 **6,919,317 bytes**。Alpha.13 改用正常的包内静态资源分发：

1. 客户端仍由全部功能源码编译为真实 ModuleLoader 入口，当前 `lib/client.js` 为 **80,268 bytes**；`lib/host.js` 也低于 **1,000,000 bytes**。没有用空入口、远程脚本或删功能绕过检查。
2. 玩偶和音轨原样保留在 `lib/assets/whale-girl.png` 与 `lib/assets/BV1hXbN6VEKV.mp3`，随 npm 包及 Git 发布源提供。Host 通过 DSH 标准 `webServer` 的两个固定路径供给本机资源，客户端不再把媒体编码进 JS，也不需要第三方图床或音乐 CDN。
3. 将构建后的 `lib/host.js`、`lib/client.js` 和两份素材纳入版本管理；最终发布 commit 必须实际包含这些文件，公开默认分支才能满足对已提交文件的检查。`prepare` 仍保留供源码重建，Git 安装的脚本审批继续遵循宿主和市场规则。

上游固定版本为 `d93c8bf289c5fb045ccad77ea4610cce0d895b97`。其 **1,000,000 bytes（含上限）** 限制作用于读取的 manifest、patch、host／client、README 和 LICENSE 等单文件，不是 npm 包总大小限制；它没有递归读取上述媒体或分析 JS 依赖、注入依赖和资源 URL。媒体拆分是正常分发方式，功能完整性仍需由本项目的包检查和真实宿主测试验证。[投稿验证](https://github.com/dsh-pub/dsh-pub/blob/d93c8bf289c5fb045ccad77ea4610cce0d895b97/scripts/lib/plugin-submission.mjs)、[topic 扫描](https://github.com/dsh-pub/dsh-pub/blob/d93c8bf289c5fb045ccad77ea4610cce0d895b97/scripts/lib/topic-catalog-sync.mjs)

最终 Alpha.13 commit `61b2df26e02125023b6fa793adf18c707a47c15d` 已从实际 Git blob 通过固定上游源码的投稿检查和 Topic 检查，报告保存在忽略目录 `.qa/release-alpha13/dshpub-git-admission.json`。该 commit 已随 tag 公开；随后 dsh.pub 远程投稿验证通过、PR #144 合并，[集成工作流](https://github.com/dsh-pub/dsh-pub/actions/runs/39107948038) 成功生成并提交目录。生成条目来源为 `f12d7d0c836829d06d10a0f08a7b5f3b58a654d2`，版本 Alpha.13，`installable: true`；其 `community-submitted` 标记表示社区投稿来源，不是人工审核，线上状态徽章已确认 listed。npm 发布已公开验证；本地与远程静态通过均不代表运行兼容、安全审计或维护者背书。

PR 的通用 [Quality 运行](https://github.com/dsh-pub/dsh-pub/actions/runs/39107411756) 曾因“需要批准，但批准前已过期”而没有运行任何 job，触发 GitHub 失败邮件；这不是插件测试失败。专用投稿工作流已成功，合并后的 main [Quality](https://github.com/dsh-pub/dsh-pub/actions/runs/39107948001) 也已通过。

已从线上 [dsh.pub 状态徽章](https://dsh.pub/api/badges/DoveLi-Gu/dsh-dyou-wine.svg) 确认 GET 200，SVG 的 title 与 aria-label 均为 `dsh.pub registry status: listed`；证据 `.qa/marketplace-submit/followup/dshpub-live-badge.svg`。这确认线上收录状态与自动契约检查结果，不表示人工审核。

官方 [搜索 API](https://dsh.pub/api/plugins?q=dsh-dyou-wine&limit=5) 另返回 HTTP 200、`total: 1`、`installable: true`、来源 `f12d7d0` 与 `community-submitted`，并提供上述真实详情 URL；不将社区来源标记解读为人工审核。

## 发布元数据与展示

远程仓库已通过 GitHub API 设置 9 个 topics；以下命令用于后续维护，至少保留三个发现／分类主题：

```sh
gh repo edit DoveLi-Gu/dsh-dyou-wine --add-topic dsh-plugin --add-topic deepseek-harness --add-topic dsh-category-ui --add-topic desktop-pet --add-topic animation
```

`dsh-category-ui` 是 w211 市场的分类约定；Awesome 的条目仍按实际用途选择 `fun`。不要添加 `dsh-plugin-pack`、`dsh-skill-pack` 等不符合本项目用途的标签。

`screenshots.json` 放在本仓库 `package.json` 旁，列出 1–8 个真实图片相对路径。本项目按运行 PNG、控制面板 PNG、演示 GIF 排序。路径不能以 `/` 开头或包含 `..`；绝对 URL 须为 HTTPS GitHub 图床。当前 Awesome 探测器没有图片后缀／字节限制，但 GIF 较大，用 PNG 作首图更利于加载；这不代表所有下游都使用相同限制。[截图 schema 与存活探测](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/scripts/probe-screenshots.mjs)

npm 包的 `repository` 必须指回真实公开仓库，Awesome 才能自动关联；不要在其 YAML 条目手写 `npm:`，该字段会被拒绝。Alpha.13 首次使用 `--tag alpha` 发布后，Registry 同时出现 `alpha` 和 `latest`；维护者当次验证已成功，但删除 `latest` 仍被 HTTP 400 拒绝，实测与参考见 [发布记录](RELEASING.md)。后续标签读取实际 Registry，安装固定确切版本；旧回执的 `@0.1.0-alpha.13` 或 Release tag 不因此改写。Awesome 的 npm 版本展示取 `dist-tags.latest`；官方新版 Discover 则按其索引内兼容版本选默认项，不以 npm latest 作为统一规则。[npm 映射源码](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/scripts/probe-npm.mjs)

## 后续处理

1. Alpha.14 的 npm 版本与 GitHub Release 已公开；公开 `alpha`／`latest` 均指向 Alpha.14。版本仍是 Alpha，推荐精确版本安装；Alpha.13 首次发包的删除标签 HTTP 400 记录保留为历史。
2. GitHub topics 已设置，npm 关键词及 repository 已核对。后续分别记录每个自动发现入口的扫描结果，不能用一个目录的结果替另一个验收。
3. 到北京时间 2026-10-19 13:44:36 仓库满一天后才可向 Awesome 提单条 YAML PR；DshMarketPlace 的 10 次正常提交门槛已满足，仍须先有主目录可安装条目。ydhrdh、dsh.pub 与 Britneycode 已各自提交，不重复发 PR；继续处理前按上游当日规则复核。
4. 对自动目录的遗漏，使用各自确认存在的表单／issue／候选入口；需审核的条目持续记为 pending，保留 PR／候选链接，审核通过后再记录实际目录 URL。
5. 官方 Discover 需先确定用户采用哪个索引，再按该索引的运营规则提交；不擅自给用户的 DSH 安装市场或添加远程索引。
6. dsh.pub、w211、dshplugin.online 已显示 Alpha.13 快照，等待后续版本同步；dsh-find-plugin 已可实时发现。其他市场的“发现”“收录”“可安装”“运行兼容”分别记录，不能互相替代。

本轮原始回执、网页搜索和静态目录证据保存在忽略目录 `.qa/marketplace-audit-20261018/`。ydhrdh 的 8 条目校验／构建、Britneycode 的 21 项相关测试均针对第三方目录材料，不是本插件重新编译或真实 DSH 重测；本次只更新 GitHub 状态文档，不重发 npm。

所有市场描述和投稿简介只说明插件功能。中转站宣传保留在项目 README，不塞进第三方目录的功能说明；不把代码 MIT 许可或来源署名写成第三方音乐／形象的授权证明。
