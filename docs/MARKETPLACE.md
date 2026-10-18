# 插件市场发现与投稿准备

核查日期：2026-10-18。候选版本：`0.1.0-alpha.12`；仓库：`DoveLi-Gu/dsh-dyou-wine`；npm：`dsh-dyou-wine`。

当前完成的是发布元数据、展示材料和投稿草稿。GitHub 仓库与 npm 包尚未公开，以下入口一律为 **pending（待发布、待扫描或待审核）**，没有提交外部 PR、表单或候选，也不代表已经被任何市场收录。本表覆盖本次找到并核对的入口，不声称穷尽全网。

## 三种信息分别负责什么

- `package.json` 的 `dsh.bundle.patch` 与实际 patch／入口使包可被 DSH 安装；`engines.dsh` 继续只声明已验证的 `0.2.0-rc.2`，不为扩大曝光虚增兼容范围。
- npm `keywords` 中的 `dsh-plugin` 与 GitHub 仓库的 `dsh-plugin` topic 负责被搜索发现；两者是独立配置。写在本地 JSON／README 中不会替远程仓库设置 topic。
- `dsh.marketplace` 是部分社区扫描器识别的补充元数据，**不是官方统一注册字段**。本项目声明 `profiles: ["web"]`、`requiresRestart: true`、`manualSteps: false`；不声明 `requiresBuildApproval`，让扫描器根据 Git／npm 实际来源判断构建需求。静态声明不能替代入口、产物或安装验证。[YELEBAI 规则](https://github.com/YELEBAI/dsh-plugin-marketplace#registry-如何工作)

## 入口与数据来源

| 市场／入口 | 发现或收录规则 | 本项目的下一步与当前边界 |
| --- | --- | --- |
| 官方新版 Discover／`plugin_market` | 读取用户配置的 `indexes`；实验 bundle 默认关闭、默认索引为 `[]`，不是全网自动注册。 | 向目标索引运营方申请收录；本机已验证的 `0.2.0-rc.2` 没有该新版入口，未为此升级宿主。[官方读取器](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/boot/plugin-market/README.md)、[索引格式](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/util/plugin-market-index/README.md) |
| Awesome DSH Plugin／`awesome-dsh-plugin.com` | 人工策展：PR 新增 `data/plugins/<owner>__<repo>.yml`；仓库创建满 1 天、真实代码、bundle、topic 均需满足。 | 公开后提交准备好的单条 YAML，分类 `fun`；CI 通过仍需维护者阅读代码。[投稿原文](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md) |
| `dsh-market/dsh-market`／`dshmarket` | 消费上一行的同一策展目录，不在市场应用仓库单独收条目。 | Awesome 上游合并后等待市场同步；不重复向应用仓库投稿。[数据源与投稿](https://github.com/dsh-market/dsh-market#submit-your-plugin) |
| `awesome-dsh-plugin/dsh-find-plugin` | 实时 GitHub `dsh-plugin` topic 搜索，5 分钟缓存；策展目录补充双语描述，并用于限流／离线回退。 | 设置远程 topic 即可参与搜索，策展补全仍取决于上游收录。[发现机制](https://github.com/awesome-dsh-plugin/dsh-find-plugin#how-it-works) |
| DSH Marketplace／`dshmarketplace.dev` | 自动同步 GitHub `dsh-plugin` topic；缺失条目可走提交表单，提交后人工审核。 | 先等待 topic 同步，再用表单补漏；名称、许可、README、真实公开安装来源应完整。[官方提交页](https://dshmarketplace.dev/submit) |
| `DshMarketPlace/dsh-plugins-store`、其 CLI／Python／Radar | 与上一行共用 `dshmarketplace.dev` API，不是几个独立目录。 | 网站收录后核查同源客户端；不重复投稿。[同源客户端代码](https://github.com/DshMarketPlace/dsh-plugins-store/blob/main/src/catalog.js) |
| `DshMarketPlace/awesome-dsh-plugin` 精选榜 | 独立于 `awesome-dsh-plugin/awesome-dsh-plugin`；PR 修改该组织的 `data/curated.yml`，要求两个 topics。 | 公开后独立投精选条目；完整目录出现不等于进入精选。[精选指南入口](https://dshmarketplace.dev/submit) |
| `dshplugin.io`／`tjsdyy/dshplugin` | 同步 Awesome 上游并补充 `dshhub.org` 新条目，失败时保留本地快照；有独立 issue 投稿入口。 | 不能保证上游合并即实时出现；准备 `plugin-submission` issue，公开后核查实际同步。[同步源码](https://github.com/tjsdyy/dshplugin/blob/main/scripts/sync-plugins.mjs)、[投稿](https://github.com/tjsdyy/dshplugin/issues/new?labels=plugin-submission) |
| YELEBAI／`dsh-plugin-marketplace` | 定时扫描 `topic:dsh-plugin archived:false`，验证后写入中心 Registry；topic 本身不等于收录。 | 公开后等待扫描，优先给出精确 npm 包／版本；源码缺少 `lib` 且需要 `prepare`，仍可能属于引导安装。[Registry 规则](https://github.com/YELEBAI/dsh-plugin-marketplace#registry-如何工作) |
| w2112515／`dsh-plugin-marketplace` | 每日 topic 扫描并静态验证；`dsh-category-ui` 可显式归类；一键安装要求固定 commit 内存在加载产物。 | 设置 topic；本项目不提交 `lib` 到源码，Git 路径可能需要逐次脚本审阅，不声称已经满足其一键安装条件。[作者规则](https://github.com/w2112515/dsh-plugin-marketplace#for-plugin-authors) |
| ydhrdh／`dsh-marketplace` | 独立 PR，新增 `registry/plugins/<id>/plugin.json`，由维护者授予 verified 状态。 | 草稿使用固定 Git tag，`verified: false`；该市场额外 validator 的 npm spec 检查只接受纯包名，不把带 alpha 版本的 spec 塞入错误字段。[贡献指南](https://github.com/ydhrdh/dsh-marketplace/blob/main/CONTRIBUTING.md)、[校验器](https://github.com/ydhrdh/dsh-marketplace/blob/main/scripts/validate-registry.mjs) |
| `dsh.pub` | 独立 GitHub PR 提交公开仓库，验证分发闭包；topic 发现同样需通过其分发检查。 | 当前有两个明确阻碍，见下文；只准备 submission 草稿，尚不能声称准入通过。[提交页](https://dsh.pub/en/submit/)、[校验源码](https://github.com/dsh-pub/dsh-pub/blob/d93c8bf289c5fb045ccad77ea4610cce0d895b97/scripts/lib/plugin-submission.mjs) |
| `dshplugin.online` | 自站说明为 GitHub 仓库加 `dsh-plugin` topic 后进入目录。 | 公开后设置 topic，等待并核查搜索；不保证该站的扫描时效。[第一方说明](https://dshplugin.online/) |
| Fufan Studio Plugin Center | npm `keywords:dsh-plugin` 搜索，读取确切 npm 版本的 bundle；精确包名查询默认取 latest。 | 保留关键词和明确 alpha 版本安装说明；不保证仅 alpha 包会进入普通搜索，不为了曝光改用 latest。[目录源码](https://github.com/fufankeji/deepseek-harness-studio/blob/main/apps/desktop/src/plugin-center/npm-ecosystem-catalog.ts) |
| `dsh.deepseek404.com` | 自站页脚声明从 GitHub 公开项目自动聚合、未经人工审核，并链接 GitHub topic。 | 公开后等待扫描；没有把自动聚合表述为审核通过。[第一方入口](https://dsh.deepseek404.com/) |
| DSH Plugin Hub／`dshpluginhub.dev` | npm 包／GitHub 仓库／安装命令可公开预检；GitHub 登录后才能交候选，审核前不进入市场搜索或排行榜。 | 公开后预检并提交候选；本轮只阅读规则，未登录提交，也未做站点端到端验证。[候选入口](https://dshpluginhub.dev/zh/submit) |

`dsh.market`、`dshx.io`、`deepseekdsh.com` 等相关入口还需逐个确认其真实数据源与当前投稿规则；本轮不编造提交地址，也不把入口存在记作收录完成。本机直接访问其中部分入口发生 TLS 或读取超时，不能据此断定它们永久失效。

`DshMarketPlace/awesome-dsh-plugin` 的贡献指南还列出 topic 目录准入的提交数要求，和另一组织 Awesome 的“仓库满一天”规则不同；不能为满足条件制造无意义提交。[独立贡献规则](https://github.com/DshMarketPlace/awesome-dsh-plugin/blob/main/CONTRIBUTING.md)

## dsh.pub 当前阻碍

1. 它会在 GitHub 默认分支检查被 bundle 加载的运行文件。本项目有意让 `lib` 由构建生成，未提交到源码；仅提供 npm tarball 不会自动满足它对源码树的检查。
2. 当前 `lib/client.js` 为 **6,919,317 bytes**，超过该检查器 `getFile` 的 **1,000,000 bytes** 上限；客户端内嵌玩偶与 MP3 是主要体积来源。检查入口可见 [投稿验证](https://github.com/dsh-pub/dsh-pub/blob/d93c8bf289c5fb045ccad77ea4610cce0d895b97/scripts/lib/plugin-submission.mjs) 与 [topic 扫描](https://github.com/dsh-pub/dsh-pub/blob/d93c8bf289c5fb045ccad77ea4610cce0d895b97/scripts/lib/topic-catalog-sync.mjs)。

后续可以评估通过 DSH 标准 `webServer` 静态资源路径拆出素材，并设计可校验的构建产物分发，但这会改变资源加载方式，必须重新验证图片、BGM、部署路径及真实宿主。本轮不为单一市场阈值重构运行时，不删音乐或伪造小体积文件，也不宣称已适配该市场。

## 发布元数据与展示

远程公开仓库创建后，再由有权限的维护者执行以下设置；这不是本轮已经执行的操作：

```sh
gh repo edit DoveLi-Gu/dsh-dyou-wine --add-topic dsh-plugin --add-topic deepseek-harness --add-topic dsh-category-ui --add-topic desktop-pet --add-topic animation
```

`dsh-category-ui` 是 w211 市场的分类约定；Awesome 的条目仍按实际用途选择 `fun`。不要添加 `dsh-plugin-pack`、`dsh-skill-pack` 等不符合本项目用途的标签。

`screenshots.json` 放在本仓库 `package.json` 旁，列出 1–8 个真实图片相对路径。本项目按运行 PNG、控制面板 PNG、演示 GIF 排序。路径不能以 `/` 开头或包含 `..`；绝对 URL 须为 HTTPS GitHub 图床。当前 Awesome 探测器没有图片后缀／字节限制，但 GIF 较大，用 PNG 作首图更利于加载；这不代表所有下游都使用相同限制。[截图 schema 与存活探测](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/scripts/probe-screenshots.mjs)

npm 包的 `repository` 必须指回真实公开仓库，Awesome 才能自动关联；不要在其 YAML 条目手写 `npm:`，该字段会被拒绝。预发布始终使用 `--tag alpha`，保留精确 `@0.1.0-alpha.12` 或固定 Release tag 的安装来源。Awesome 的 npm 版本展示取 `dist-tags.latest`；官方新版 Discover 则按其索引内兼容版本选默认项，不以 npm latest 作为统一规则。[npm 映射源码](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/scripts/probe-npm.mjs)

## 公开后的执行顺序

1. 先通过构建、测试与包检查，核对版本、哈希、许可和素材声明，公开真实 GitHub 仓库、相应 tag、Release tarball 与 npm alpha 版本；这些操作尚待执行。
2. 设置 GitHub topics，核对 npm 关键词及 repository。分别记录每个自动发现入口的扫描结果，不能用一个目录的结果替另一个验收。
3. 仓库满 1 天后向 Awesome 提单条 YAML PR；DshMarketPlace 精选、ydhrdh、dsh.pub 是各自独立的 PR，不与其混同。`marketplace/` 保存本地投稿草稿，提交前再按上游当日 schema 核对。
4. 对自动目录的遗漏，使用各自确认存在的表单／issue／候选入口；需审核的条目持续记为 pending，保留 PR／候选链接，审核通过后再记录实际目录 URL。
5. 官方 Discover 需先确定用户采用哪个索引，再按该索引的运营规则提交；不擅自给用户的 DSH 安装市场或添加远程索引。
6. dsh.pub 的两个阻碍解决并重新验证前，保留为 pending；其他市场的“发现”“收录”“可安装”“运行兼容”也分别记录，不能互相替代。

所有市场描述和投稿简介只说明插件功能。中转站宣传保留在项目 README，不塞进第三方目录的功能说明；不把代码 MIT 许可或来源署名写成第三方音乐／形象的授权证明。
