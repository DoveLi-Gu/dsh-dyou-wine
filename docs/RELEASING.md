# GitHub 与 npm 发布

当前 Alpha 为 `0.1.0-alpha.13`，正式名「D友の酒 · Dyou Wine」。本版将媒体拆为包内独立资源，通过 WebServer 提供，并将真实分发入口加入 Git；双效果、曲线和完整音轨保留。历史 tag 不移动。已公开 `DoveLi-Gu/dsh-dyou-wine` 的源码、tag、GitHub 发行附件及 npm 确切版本，并设置发现 topics；npm 账号已核对为既有 dsh-showcase 维护者 `doveli`。

## 上传 GitHub

1. 审阅源码、MIT 许可与 `.gitignore`，确认不提交 `node_modules`、`.qa`、DSH profile、临时下载、测试报告、日志、`.env` 或凭据。Alpha.13 起明确提交四份构建分发文件：`lib/host.js`、`lib/client.js` 及 `lib/assets` 的原 PNG／MP3；每次构建与 Git 中产物比对，保证入口可被源码市场读取。其余临时构建文件仍忽略。指定 MP3 应与 [素材说明](ASSETS.md) 一并审阅；音乐权利不由代码 MIT 许可覆盖。源仓库提交 `package-lock.json`，CI 通过 `npm ci` 重现依赖。
2. `package.json` 已按经核对账号填写计划仓库的 `repository`、`homepage`、`bugs`；创建远程仓库时使用相同归属与名称。推荐公开源码，以便建立包的 provenance。若改用其他仓库，先同步这三个字段及工作流身份断言。
3. 配置真实 remote，再提交并推送。CI 会在 Ubuntu／Windows 的 Node 24 执行检查并上传 tarball；未运行的 workflow 不能当作测试结果。
4. 给仓库设置 `dsh-plugin`、`deepseek-harness`、`desktop-pet`、`animation` topics，便于发现。确认测试记录及兼容矩阵后，提交并创建 `v0.1.0-alpha.13` tag，指向已审查提交。GitHub Release 使用 [本版公告](RELEASE-NOTES.md) 与经过检查的 tarball。

市场设置还可使用源码中的 `marketplace/github-topics.json`；它是 GitHub API 请求体，已用于本仓库，GitHub 不会自动读取本文件。按 [市场状态](MARKETPLACE.md) 核查自动扫描和独立投稿，保留每个平台的实际收录状态。预发布使用 `alpha`，不为市场检索主动提升为 latest；首次发包后应读取实际 dist-tags，不能只凭命令参数推断。`screenshots.json` 与 PNG／GIF 展示图只放入源码，不进入 npm 包。

不建议直接分发未构建的源码压缩包。优先将经过检查的 `.tgz` 作为 GitHub Release 附件；如直接安装 GitHub spec，使用固定 tag／提交并按 README 处理 pnpm `allowBuilds`。

## 本地发布前检查

```sh
npm ci
npx playwright install chromium
npm run check
npm pack --ignore-scripts
npm publish ./dsh-dyou-wine-0.1.0-alpha.13.tgz --dry-run --access public --tag alpha --ignore-scripts --registry=https://registry.npmjs.org
```

`pack:check` 使用 `npm pack --dry-run --ignore-scripts --json` 检查包内容白名单、入口、bundle 补丁和客户端声明。它不上传文件。`files` 仅包含编译产物、patch、许可证、README／变更记录与必要运行说明；测试夹具、原策划案和开发配置不进入 npm 包。

Alpha.10 已通过干净副本安装与独立构建、47 项单元测试、36 项浏览器测试、18 文件包检查、真实隔离 DSH 验收及 60 秒关闭／60 秒开启动效的性能对照；该历史结论和证据保留在 TESTING.md／COMPATIBILITY.md。Alpha.11 的实际检查结果以 TESTING.md 的对应版本记录为准，不能把历史结果直接当成本版重新通过。公开前核对最终包的版本、哈希和相应记录，并审看演示 GIF 是否来自隔离测试会话、文档图片和宣传链接是否正确。

运行验收应检查两个独立效果、固定节奏、既有候选覆盖与交互保护、320 px 简洁面板，以及内置 BGM 的解码、来源链接、无 iframe／平台网络请求、暂停继续、循环、醒酒归零与卸载释放。资源成功加载不能直接标记为已监听物理扬声器。

本版内置由用户指定原投稿 `BV1hXbN6VEKV` 导出的 MP3，录音以独立文件放入包内 `lib/assets`，随 tarball 提供。设置与声明中的来源链接是署名，不能写成已经取得原权利人许可。录音、词曲和合成声库不适用项目代码 MIT；GitHub 与 npm 的公开发布记录保留 [素材说明](ASSETS.md) 中的来源及独立权利范围。

确认 registry 中该名称和版本的实际归属。此前得到 E404 仅表示当时未查到；不是名称预留，也不能保证账号具有发布权限。

## 首次 npm 发布

2026-10-18，维护者完成 npm 登录与安全密钥验证后，使用原已验收的 Alpha.13 tarball 执行 `npm publish ./dsh-dyou-wine-0.1.0-alpha.13.tgz --access public --tag alpha --ignore-scripts --registry=https://registry.npmjs.org/`。公开 Registry 已确认版本、21 文件及与原包一致的 SRI／SHA1；此后文档更新没有重打包或覆盖该版本。包内文档保留发布前快照，当前状态以仓库为准。

首次发包仍自动出现 `latest`，当前 `alpha` 与 `latest` 均指向 Alpha.13；移除 `latest` 需再次完成 npm 安全密钥验证，维护者暂待处理，不能宣称只剩 alpha。安装时固定 `@0.1.0-alpha.13`。后续预发布继续使用 `--tag alpha`，发布后核查公开 Registry 的实际 dist-tags 和完整性值；CLI 接受请求不代表 Registry 已可读取。同一 `name@version` 无法覆盖重发。

本次标签清理请求最后返回 HTTP 400，未完成删除；待维护者方便时重新发起验证与清理，再读取公开 dist-tags 确认结果。该请求失败不影响已公开的确切版本。

## 后续 OIDC 发布

提供的 `.github/workflows/publish.yml` 仅由手动 dispatch 触发，校验输入版本、相应 Git tag 和实际仓库元数据，重新运行完整检查，再发布已检查的 tarball。它固定 `alpha` tag，不使用长期 `NPM_TOKEN`。

配置步骤：

1. 在 GitHub 创建名为 **`npm`** 的 Environment，启用适合该仓库的 required reviewers 与 tag 保护；工作流引用环境本身不会自动配置保护规则。
2. 首次手动发布创建包后，在 npm 包设置的 Trusted Publisher 中填写 **`DoveLi-Gu`、`dsh-dyou-wine`、`publish.yml` 和环境名 `npm`**。当前新建配置默认只允许 `npm stage publish`，本工作流使用 `npm publish`，须明确允许直接发布。新连接需在创建后两天内首次成功发布；未建立或过期的信任关系会导致工作流失败。
3. 确保 `package.json.repository.url` 精确匹配实际创建的 `git+https://github.com/DoveLi-Gu/dsh-dyou-wine.git`。
4. 推送已审核 tag，通过 Actions 手动运行，输入完整包版本。工作流以该 tag 检出；保护环境审核通过后才会进入发布步骤。

工作流使用 GitHub 托管 runner、Node 24 和固定 npm 版本，授予 `id-token: write`。OIDC 要求 npm ≥11.5.1，且可信发布身份必须与仓库／工作流／环境完全一致；来源证明在可信发布时自动生成。详见 [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/) 和 [npm provenance](https://docs.npmjs.com/generating-provenance-statements/)。

若改包名、仓库、工作流文件名或环境名，先同步对应的 npm Trusted Publisher 配置。不要通过禁用版本校验、添加虚构 repository 或在仓库写入 token 解决发布失败。
