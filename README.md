# D友の酒 · Dyou Wine

**代码在跑，大肥鱼娘也在跑。**

给 DeepSeek Harness（DSH）Web 加一点快乐：界面按固定节奏 Q 弹，蓝白鲸鱼娘毛绒玩偶满屏巡航，碰到墙就弹回来。两个效果独立开关，也能一起蹦。

默认清醒。点「开喝」开始整活，按 `Escape` 随时醒酒。

`0.1.0-alpha.13` · [npm](https://www.npmjs.com/package/dsh-dyou-wine/v/0.1.0-alpha.13) · [测试记录](docs/TESTING.md) · [兼容矩阵](docs/COMPATIBILITY.md)

> **给作者续一杯 · [鸽子中转站](https://api.doveli.top/)**<br>
> OpenAI 兼容 API，给常用 AI 编程工具接个入口。[查看接入文档](https://www.doveli.top/docs/)

## 效果演示

![真实 DSH 界面与大肥鱼娘一起固定节奏 Q 弹，玩偶满屏飞行并碰墙反弹](https://raw.githubusercontent.com/DoveLi-Gu/dsh-dyou-wine/main/docs/assets/demo.gif)

真实 DSH Web 录屏，12 秒原速无声循环。「上头」档，固定 120 BPM，界面与玩偶一起蹦；玩偶继续匀速飞行、碰墙反弹。画面来自隔离测试会话，没有私人聊天或真实模型请求。

| 开关 | 打开以后 |
| --- | --- |
| 界面律动 | 文字、卡片和可安全处理的界面区域一起 Q 弹，横向撑开、纵向压扁，再弹回来。 |
| 飞行玩偶 | 大肥鱼娘在 DSH 页面里到处飞，撞墙掉头——有点像 DVD 屏保，只是这次长了鲸鱼尾巴。 |

两个都开，就是界面和鱼一起上头。它们共用固定节拍，碰墙或切换其中一项，都不会把另一项带跑拍。

## 安装

开喝条件：**DSH `0.2.0-rc.2` 的 Web 客户端、桌面 Chromium 浏览器**，Node.js `^22.19.0 || >=24.0.0`。当前是 Alpha；Desktop、TUI、移动端和其他 DSH 版本尚未承诺兼容。

把大肥鱼娘请进你的 Web profile：

```sh
dsh plugin --profile web add dsh-dyou-wine@0.1.0-alpha.13 --ignore-scripts
```

**重启 DSH Host，再刷新页面。** 这是确切版本安装命令，请保留版本号。已有其他 Web profile 的话，把 `web` 换成你使用的 profile。

也可以从 [Alpha.13 Release](https://github.com/DoveLi-Gu/dsh-dyou-wine/releases/tag/v0.1.0-alpha.13) 下载已编译的 `.tgz` 安装；源码构建和隔离试用步骤在下方折叠区。

## 操作：三步开喝

1. **选谁蹦。** 展开「D友の酒」，勾选「界面律动」「飞行玩偶」，可以两个都选。默认只勾界面律动，安装后不会自动开蹦。
2. **选酒量。** 微醺／上头／整活，改变形变幅度；节奏始终是固定的 **120 BPM**。选好后点「开喝」。
3. **叫上气氛组。** 想听原梗音乐就勾选 BGM，再点「开喝」。BGM 默认关闭，开启后以 50% 音量循环播放。

| 控制 | 实际效果 |
| --- | --- |
| 开喝 | 按所选开关开始或继续；勾上谁，谁上场。 |
| 暂停 | 冻结界面和玩偶，音乐也暂停，再开喝从原进度继续。 |
| 醒酒 / `Escape` | 停止效果、收走玩偶，音乐回到开头。 |

切到后台会暂停，回到前台按原运行状态恢复。浏览器若拦住了有声播放，面板会给出提示，点「开喝」重试。

## 鱼可以上头，操作得清醒

- **巡航范围是 DSH 页面可视区，包含侧栏。** 玩偶点击穿透；浏览器工具栏、其他应用和 Windows 桌面不在巡航范围内。当前使用透明 PNG 玩偶，没有三维转身。
- **输入和审批优先。** 焦点、中文组合输入、选区、正在操作的控件与审批区域保持局部稳定；控制面板和醒酒入口也保持稳定。
- **覆盖范围有边界。** 可处理的父区域会带着子区域一起动；跨域 iframe、封闭 Shadow DOM、Canvas 内部，以及部分滚动／定位／变换冲突区域可能无法参与。
- **浏览器偏好照顾到。** 尊重减少动态效果设置，后台暂停；性能保护减少同时参与的目标数量，保留目标的节奏和幅度照常。
- **不额外烧模型 Token。** 插件不接入模型或工具调用链，不上传聊天正文或文件。设置留在当前浏览器，刷新后不会自动恢复开喝。

具体通过的版本、交互和测试边界见 [兼容矩阵](docs/COMPATIBILITY.md) 与 [测试记录](docs/TESTING.md)。

## BGM：气氛组在这里

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/)

来源为活跃黑江乐的《朋友的酒 DJ 完整版》，原投稿说明基于 Synthesizer V 夢ノ結唱 HALO。内置音轨由用户指定投稿导出，约 3.23 MiB、187.37 秒；图片和音乐都由 DSH Host 从插件包内同源提供，播放不创建视频窗口或 iframe，也不请求 B 站播放器或媒体服务器。面板内的音频署名可以跳回原投稿。

界面和玩偶沿用固定 120 BPM 时钟，播放音乐不重置动画；**不宣称与原曲每一拍精确同步**。

项目代码采用 MIT 许可。歌曲录音、词曲和合成声库不适用本项目代码的 MIT 许可；来源署名不表示已取得原权利人的公开分发许可。GitHub 源码、发行附件与 npm 包包含该录音，来源记录、生成玩偶的说明及各素材的独立范围见 [素材说明](docs/ASSETS.md)。

## 认真一点的部分，折起来放

<details>
<summary><strong>设置、动画和演示细节</strong></summary>

面板保持 320 px 的简洁布局，只提供两个效果开关、三个档位、原梗 BGM，以及开喝／暂停／醒酒。不提供本地音频上传或高级参数编辑入口。

启动控制器时保留预设和三个开关，并将高级参数恢复默认：BPM 120、相位 0、强度 65、玩偶 180 px 与 180 px/s、所有区域开启、后台不播放、Escape 停止、循环 true。旧的范围关闭或强度为零设置不会让效果继续消失；底层设置校验和音频资源路径保留，供兼容 API 与测试使用。

设置保存在 `localStorage` 的 `dsh-dyou-wine.settings.v1`，同一浏览器源下的 profile 共用设置。清除这一条即可恢复默认参数。`pageEnabled`／`petEnabled` 独立，`musicEnabled` 默认 false；旧 `mode: 'pet'` 迁移为界面关／玩偶开，旧 `mode: 'page'` 迁移为界面开／玩偶关，明确布尔值优先。

玩偶沿用 Alpha.6 的蓝白鲸鱼娘毛绒形象：深蓝长卷发、浅蓝发梢、鲸鳍耳、蓝色大眼与白围裙鲸纹，通过 imagegen 生成，不宣称官方角色素材。外层匀速推进位置，左右碰撞反转水平速度，上下碰撞反转垂直速度；内层按固定周期反向缩放 X／Y。界面每拍平滑压矮、拉高并复位，底部固定，不逐帧随机变速、错相或改幅度。

文字按块参与，不拆字、不重建宿主 React DOM。父级参与时带动子区域，避免叠加形变；被父级带动不等于每个子节点都有独立动画。Alpha.8 扩充了普通 `div`／`span`、页头与侧栏文字、行内图片和 SVG 等候选，仍只对可见且能安全处理的目标生效。交互保护解除后按统一相位重新加入，未知宿主版本或缺少必要标记会提示兼容问题，无法保证所有第三方插件都被覆盖。120 个目标是工程预算，不能替代真实物理性能、Windows IME、模型流式、审批交互与 Desktop 壳的分别验收。

暂停与后台暂停保留音乐进度，醒酒／Escape 回到开头，卸载释放媒体资源。Alpha.9 移除了左下角视频；Alpha.13 将媒体拆为包内独立文件，音乐支持字节 Range 请求，不占据客户端 JavaScript 入口。

演示 GIF 为 800 × 500、15 fps、12 秒原速无声循环，源码路径 `docs/assets/demo.gif`。npm README 使用同一 GitHub 图片地址；GIF 和赞助 Logo 仅在 GitHub 源码中，npm 安装包不携带这两张展示图片。

</details>

<details>
<summary><strong>发行包、源码构建、隔离试用与卸载</strong></summary>

从 [Alpha.13 Release](https://github.com/DoveLi-Gu/dsh-dyou-wine/releases/tag/v0.1.0-alpha.13) 下载 `dsh-dyou-wine-0.1.0-alpha.13.tgz`：

```sh
dsh plugin --profile web add ./dsh-dyou-wine-0.1.0-alpha.13.tgz --ignore-scripts
```

安装后重启 Host 并刷新页面。已有 Web profile 可用 `dsh plugin --profile 你的profile add 安装包绝对路径` 更新，这会影响该 profile 的全部会话。

从源码构建：

```sh
npm ci
npx playwright install chromium
npm run check
npm pack --ignore-scripts
```

生成 `dsh-dyou-wine-0.1.0-alpha.13.tgz`。推荐在独立 DSH home 和 Web profile 先试用；下面是 PowerShell 示例：

```powershell
$env:DSH_HOME = Join-Path $PWD '.qa/dsh-home'
dsh --version
dsh --profile dyou-wine-test --from-default-profile web --dump-config
$wineTarball = Join-Path $PWD 'dsh-dyou-wine-0.1.0-alpha.13.tgz'
dsh plugin --profile dyou-wine-test add $wineTarball --ignore-scripts
dsh --profile dyou-wine-test --dump-config
dsh --profile dyou-wine-test --no-open --host 127.0.0.1 --port 0
```

按 Host 日志打开 Web 地址，依该 profile 的认证提示登录。`DSH_HOME` 只影响当前终端及其子进程。CLI 安装依赖并注册 bundle；修改后没有宿主 HMR 时，重启 DSH 并刷新浏览器。

卸载前点击「醒酒」，然后执行，并在需要时重启 Host、刷新页面：

```sh
dsh plugin --profile dyou-wine-test remove dsh-dyou-wine
```

直接安装 GitHub spec 时应固定审查过的 tag／提交。DSH 使用 pnpm，源码包的 `prepare` 需要开发依赖和构建脚本；pnpm 10/11 可能拦截构建。仅在审核来源后，在目标 profile 的 `pnpm-workspace.yaml` 中保留原设置并允许确切包：

```yaml
allowBuilds:
  dsh-dyou-wine: true
```

[DSH 官方发布流程](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/user/develop/basic/publish.md) · [本项目发布指南](docs/RELEASING.md)

</details>

<details>
<summary><strong>发布状态、市场收录与开发验收</strong></summary>

公开 Registry 已确认 `dsh-dyou-wine@0.1.0-alpha.13`，`alpha`／`latest` 均指向本版；维护者验证成功后，Registry 仍以 HTTP 400 拒绝删除 `latest`，暂保留双标签。版本仍为 Alpha，请固定版本安装。

npm 使用原已验收的 GitHub Release tarball，公开完整性值与原包一致，未因发布或文案更新重打包。包内文档保留发布前快照；当前状态以仓库和 [更新公告](CHANGELOG.md) 为准。GitHub main README 更新不会同步改写已发布 npm 包内的 README。

市场发现保留 `dsh-plugin` npm 关键词、`dsh.bundle`、已验证的 `engines.dsh`、中英文名称说明和图标；根 `screenshots.json` 指向真实画面。远程已设置 `dsh-plugin` Topic 与另外 8 个相关主题。

累计完成两个 PR、三个 Issue 和两个网页表单投稿：[dsh.pub 已收录](https://dsh.pub/zh/plugins/dsh-dyou-wine/)，标记为社区投稿；[ydhrdh PR #17](https://github.com/ydhrdh/dsh-marketplace/pull/17)、[DSHPlugin.io Issue #36](https://github.com/tjsdyy/dshplugin/issues/36)、[dsh-plugin.org Issue #281](https://github.com/dshplugin/dsh-plugin-hub/issues/281)、[dsh.market Issue #255](https://github.com/2BingLing/dsh-market/issues/255) 和 DSH Marketplace／dshx 表单待审核、检测或运营处理。其他入口、Hub 维护者反馈与准入条件见 [市场状态](docs/MARKETPLACE.md)；社区投稿和自动契约检查不等于人工审核。

开发命令：

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run pack:check
```

`npm run check` 依次运行类型检查、单元测试、构建、浏览器测试、市场资料与包白名单检查。修改运行时代码后先构建，将 `lib/host.js`、`lib/client.js` 与两份 `lib/assets` 资源加入同一待提交变更；市场自检比较 Git 暂存区与构建内容，CI 验证已提交产物。Linux 首次可运行 `npx playwright install --with-deps chromium`。

模拟页：`http://127.0.0.1:4179/tests/fixture/`，并非实际 DSH。真实隔离宿主检查：`node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.13.tgz`，CLI 自动发现本地或全局安装，特殊布局可加 `--dsh-bin /absolute/path/to/dsh/lib/bin.js`；60 秒对照单独运行 `npm run benchmark`。[测试记录](docs/TESTING.md) 分别记载模拟页、真实宿主及其他验收边界。

复现演示需要 DSH、Playwright Chromium 和 PATH 中的 FFmpeg：构建、打包后运行 `npm run demo:record -- ./dsh-dyou-wine-0.1.0-alpha.13.tgz`。脚本创建新的隔离 DSH home 和测试会话，录制原速双效果及两个方向的反弹，导出 `docs/assets/demo.gif`；原录屏和采样报告留在忽略提交的 `.qa/demo/`。

客户端由宿主 ModuleLoader 加载，使用宿主 React，以独立 id 注册 `shell.overlay`。DOM 版本适配不依赖构建后 CSS 哈希。[GitHub Actions](https://github.com/DoveLi-Gu/dsh-dyou-wine/actions) 在 Ubuntu／Windows Node 24 运行检查；npm 工作流仅手动触发，上传代码或 tag 不会自动发布 npm。

需求和设计：[PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md)。完整原策划案保存在源码仓库，不进入 npm 安装包。

</details>

## 给作者续一杯

<div align="center">
  <a href="https://api.doveli.top/">
    <img src="https://raw.githubusercontent.com/DoveLi-Gu/dsh-dyou-wine/main/docs/assets/pigeon-logo-512.png" alt="鸽子中转站 Logo" width="144">
  </a>
  <h3><a href="https://api.doveli.top/">鸽子中转站 · Pigeon API Relay</a></h3>
  <p><strong>大肥鱼娘蹦完了，代码还得继续写。</strong></p>
</div>

如果这只鱼让你会心一笑，欢迎顺路看看作者维护的 **鸽子中转站**：提供 OpenAI 兼容 API、密钥管理和用量记录，在已有客户端中配置自己的 API 地址与密钥即可接入。

[接入文档](https://www.doveli.top/docs/) 提供 OpenCode、Hermes、Codex++ 与 CC Switch 等工具的配置步骤。平台也有余额与订阅入口，可在[模型与价格](https://api.doveli.top/model-pricing/)页面查看模型与分组计费；线路、价格和套餐权益以站内实时信息为准。

D友の酒本身无需中转站账号，这里是作者项目的介绍。

<p align="center">
  <a href="https://api.doveli.top/register"><strong>创建账户</strong></a>
  · <a href="https://api.doveli.top/">进入控制台</a>
  · <a href="https://api.doveli.top/model-pricing/">模型与价格</a>
  · <a href="https://api.doveli.top/subscriptions">订阅套餐</a>
  · <a href="https://www.doveli.top/docs/">接入文档</a>
</p>
