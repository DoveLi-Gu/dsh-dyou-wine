# D友の酒 · Dyou Wine

DeepSeek Harness（DSH）Web 娱乐插件：让界面按固定节奏 Q 弹，让蓝白鲸鱼娘毛绒玩偶满屏飞、碰墙反弹。两项效果独立开关，可同时运行；默认静止，点击「开喝」才启动。

正式名：**D友の酒**；英文名：**Dyou Wine**；npm 包名与仓库名：`dsh-dyou-wine`。当前候选版本：`0.1.0-alpha.13`。计划仓库为 `DoveLi-Gu/dsh-dyou-wine`，维护者沿用 dsh-showcase；**尚未创建该远程仓库或发布至 npm**。检验结果见 [测试记录](docs/TESTING.md)。

## 效果演示

![真实 DSH 界面与大肥鱼娘一起固定节奏 Q 弹，玩偶满屏飞行并碰墙反弹](https://raw.githubusercontent.com/DoveLi-Gu/dsh-dyou-wine/main/docs/assets/demo.gif)

真实 DSH Web 录屏：界面与飞行玩偶同时开启，使用「上头」档、固定 120 BPM；玩偶在可视区匀速飞行，碰墙反弹。GIF 为 12 秒、800 × 500、15 fps 的无声循环片段，未加速。画面使用隔离测试会话，没有私人聊天或真实模型请求。完整素材位于源码的 `docs/assets/demo.gif`；图片在仓库上传后显示，npm README 也使用相同的 GitHub 图片地址。

Alpha.9 将原梗 BGM 改为内置音频，移除左下角视频。设置沿用 320 px 简洁面板：两个效果开关、微醺／上头／整活三档、原梗 BGM，以及开喝／暂停／醒酒；面板保留可跳转的音频来源链接。固定节奏为 120 BPM；启动控制器时保留预设和三个开关，将已移除的高级参数恢复默认，避免旧范围关闭或强度为零导致看不到动效。界面和玩偶共用固定时钟，碰墙或切换其中一项不会让另一项重新起拍。

## 插件市场收录准备

已保留 npm 的 `dsh-plugin` 关键词、`dsh.bundle`、经过验证的 `engines.dsh`、图标与中英文名称说明，并补充 Web profile／重启／安装步骤的社区市场声明。根目录 `screenshots.json` 指向真实演示画面，供支持它的市场读取。

GitHub 仓库公开后还需设置 **`dsh-plugin` Topic**；本地关键词不能代替远程仓库主题。查到的各市场发现规则、独立投稿草案、Alpha 限制与尚未满足的准入条件见 [市场收录准备](docs/MARKETPLACE.md) 和 [投稿资料](https://github.com/DoveLi-Gu/dsh-dyou-wine/tree/main/marketplace)。元数据齐全不代表已被所有市场审核收录；当前没有执行任何市场提交。

## 使用条件

- DSH **`0.2.0-rc.2`**，Web 客户端，桌面 Chromium 浏览器。
- Node.js `^22.19.0 || >=24.0.0`；开发和 CI 使用 Node.js 24。
- 这是 Alpha，Desktop、TUI、移动端和其他 DSH 版本未承诺兼容。实际通过情况见 [兼容矩阵](docs/COMPATIBILITY.md)。

## 安装本地 tarball

```sh
npm ci
npx playwright install chromium
npm run check
npm pack --ignore-scripts
```

生成 `dsh-dyou-wine-0.1.0-alpha.13.tgz`。推荐先在独立 DSH home 和 Web profile 试用，以下为 PowerShell 示例：

```powershell
$env:DSH_HOME = Join-Path $PWD '.qa/dsh-home'
dsh --version
dsh --profile dyou-wine-test --from-default-profile web --dump-config
$wineTarball = Join-Path $PWD 'dsh-dyou-wine-0.1.0-alpha.13.tgz'
dsh plugin --profile dyou-wine-test add $wineTarball --ignore-scripts
dsh --profile dyou-wine-test --dump-config
dsh --profile dyou-wine-test --no-open --host 127.0.0.1 --port 0
```

按 Host 日志打开 Web 地址，依该 profile 的认证提示登录。CLI 会安装依赖并注册 bundle；修改后若没有宿主 HMR，重启 DSH 并刷新浏览器。已有 Web profile 可用 `dsh plugin --profile 你的profile add 安装包绝对路径` 更新，这会影响该 profile 的全部会话。示例的 `DSH_HOME` 只影响当前终端及其子进程。

卸载前点击「醒酒」，然后执行并在需要时重启 Host、刷新页面：

```sh
dsh plugin --profile dyou-wine-test remove dsh-dyou-wine
```

## 操作

1. 展开「D友の酒」，分别勾选「界面律动」与「飞行玩偶」，可以同时勾选。默认只勾选界面律动。
2. 选择微醺／上头／整活三档，点击「开喝」。以固定 120 BPM 运行，档位改变形变幅度。运行中可独立切换效果，另一个继续原有动画和时基。
3. 如需原梗音乐，勾选 BGM 后点击「开喝」。内置音频以 50% 音量循环播放，不再显示视频，也无需连接 B 站。设置中可点击「音频：BV1hXbN6VEKV」打开原投稿；浏览器若阻止有声播放，会显示错误提示，点击「开喝」重试。
4. 「暂停」冻结两个效果并暂停音乐，恢复后从原进度继续；切到后台也暂停，回到前台后按运行状态恢复。「醒酒」停止并移除动画和玩偶、将音乐回到开头。Escape 默认执行醒酒。卸载释放媒体资源。

面板不提供本地音频上传、BPM、相位、点击测速、各区域范围、玩偶尺寸／速度或总强度的自定义入口。启动控制器时这些高级项恢复默认：BPM 120、相位 0、强度 65、玩偶 180 px 与 180 px/s、所有区域开启、后台不播放、Escape 停止、循环 true。底层设置校验和音频资源路径仍保留，供兼容 API 与测试使用。

玩偶透明图沿用 Alpha.6 的蓝白鲸鱼娘毛绒形象：深蓝长卷发、浅蓝发梢、鲸鳍耳、蓝色大眼与白围裙鲸纹。图片通过 imagegen 生成，作为插件包内独立 PNG，由 DSH Host 的同源静态路径提供，不请求外部素材服务器；不宣称官方角色素材，不提供三维转身。玩偶外层匀速推进位置，碰左右边界反转水平速度、碰上下边界反转垂直速度；内层按固定周期反向缩放 X／Y，碰撞不改变节拍。范围是包含侧栏的 DSH 页面可视区，无法飞到浏览器工具栏、其他应用或 Windows 桌面；玩偶点击穿透。

界面律动每拍平滑压矮、拉高并复位，底部固定，X／Y 缩放反向变化；不逐帧随机变速、错相或改幅度。父级参与时由父级带动子区域，避免叠加变形。Alpha.8 额外识别普通 `div`／`span`、页头与侧栏文字、行内图片和 SVG 等候选，但只对可见且能安全处理的目标生效。

## 原梗 BGM 与隐私

音频：[BV1hXbN6VEKV](https://www.bilibili.com/video/BV1hXbN6VEKV/)

来源为活跃黑江乐的《朋友的酒 DJ 完整版》，投稿说明基于 Synthesizer V 夢ノ結唱 HALO。Alpha.9 从用户指定投稿导出音轨；Alpha.13 将同一份约 3.23 MiB、187.37 秒 MP3 拆为插件包内独立文件，经 DSH Host 同源路径读取，支持音频分段请求。音乐不再占据客户端入口；播放不创建 iframe，不请求 B 站播放器或媒体服务器。音轨技术参数与来源记录见 [素材说明](docs/ASSETS.md)。

BGM 默认关闭，启用后以固定 50% 音量循环；暂停和后台暂停保留进度，醒酒／Escape 回到开头，卸载释放资源。有声播放仍受浏览器策略约束。界面和玩偶沿用本地固定 120 BPM 时钟，播放音频不重置动画，不宣称与原曲每拍精确同步。

歌曲录音、词曲和合成声库不适用本项目代码的 MIT 许可。来源署名用于标识原投稿，不表示已经取得原权利人的公开分发许可；此版本仅完成本地安装交付，未公开发布 GitHub/npm。

插件不接入模型或工具调用链，不新增模型 Token 消耗，也不上传对话正文或文件。启停状态不跨刷新自动恢复。设置保存在当前站点的浏览器 `localStorage`（`dsh-dyou-wine.settings.v1`）；同一浏览器源下的 profile 共用该设置。`pageEnabled`／`petEnabled` 为独立布尔值，`musicEnabled` 默认 false。旧 `mode: 'pet'` 迁移为界面关／玩偶开，旧 `mode: 'page'` 迁移为界面开／玩偶关，明确布尔值优先；预设和三个开关保留，控制器将高级项恢复上述默认值。清除该条存储可恢复全部默认参数。

## 覆盖与限制

- 文字按块参与，不拆字、不重建宿主 React DOM。父级带动的子区域计入覆盖，不等于每个子节点都有独立动画。
- 焦点、中文组合输入、选区、正在操作的控件及审批区域保持局部稳定；固定控制入口与醒酒按钮不参与动画。保护解除后按统一相位重新加入。
- 滚动根、固定定位冲突、已有变换冲突及原生弹层等仍可能排除。未知版本或缺少必要标记会显示兼容提示；不能保证所有第三方插件都被覆盖。
- 不能通用遍历跨域 iframe、封闭 Shadow DOM、Canvas 内部。插件面板与控制入口保持稳定，不参与界面形变。
- 尊重浏览器减少动态效果偏好，后台页面暂停。自动性能保护只减少同时参与的目标数量，不改变保留目标的节奏与幅度。
- 120 个目标是工程预算，真实物理性能、Windows IME、模型流式、审批交互与 Desktop 壳必须分别验收，模拟页通过不代表这些已通过。

## npm 与 GitHub 分发

下列 npm 命令须等该版本实际发布后才能使用：

```sh
dsh plugin --profile dyou-wine-test add dsh-dyou-wine@0.1.0-alpha.13
```

优先分发经过检查的 tarball。计划仓库地址是 `https://github.com/DoveLi-Gu/dsh-dyou-wine`，这里记录发布目标，不表示远程仓库已创建。源码路径为：克隆已发布仓库 → `npm ci` → 完整检查 → `npm pack --ignore-scripts` → 本地安装。直接安装 GitHub spec 时应固定审查过的 tag／提交；DSH 使用 pnpm，源码包的 `prepare` 需要开发依赖和构建脚本，pnpm 10/11 可能拦截构建。仅在审核来源后，在目标 profile 的 `pnpm-workspace.yaml` 中保留原设置并允许确切包：

```yaml
allowBuilds:
  dsh-dyou-wine: true
```

[DSH 官方发布流程](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/user/develop/basic/publish.md)。公开分发前还应核对素材边界与 [发布指南](docs/RELEASING.md)，代码 MIT 不替代角色参考与音乐的权利说明。

## 开发与验收

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

`npm run check` 依次执行类型检查、单元测试、构建、浏览器测试、市场资料与包白名单检查。修改运行时代码后先构建，并将 `lib/host.js`、`lib/client.js` 和两份 `lib/assets` 资源加入同一待提交变更；市场自检会比较 Git 暂存区与构建内容，CI 则验证已提交产物。Linux 首次可用 `npx playwright install --with-deps chromium`。开发模拟页为 `http://127.0.0.1:4179/tests/fixture/`，不是实际 DSH。真实隔离宿主检查使用 `node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.13.tgz`，CLI 自动发现本地或全局安装，特殊布局可加 `--dsh-bin /absolute/path/to/dsh/lib/bin.js`；60 秒对照单独运行 `npm run benchmark`，证据及边界见 [测试记录](docs/TESTING.md)。

复现演示需要已安装上述 DSH、Playwright Chromium，以及 PATH 中的 FFmpeg：先构建并打包，再执行 `npm run demo:record -- ./dsh-dyou-wine-0.1.0-alpha.13.tgz`。脚本创建新的隔离 DSH home，安装指定 tarball 和测试会话，记录原速双效果及两个方向的反弹，导出 `docs/assets/demo.gif`；原录屏与采样报告留在忽略提交的 `.qa/demo/`。演示 GIF 和赞助 Logo 仅放入 GitHub 源码，npm 安装包不携带这两张展示图片。

客户端由宿主 ModuleLoader 加载，使用宿主 React，并以独立 id 注册 `shell.overlay`。版本适配器集中维护 DOM 识别规则，不依赖构建后 CSS 哈希。CI 已准备 Ubuntu／Windows Node 24 工作流，但没有实际运行的 CI 不能计作已通过。此次开发不自动执行 GitHub 推送、建库或 npm 发布。

需求和设计见 [PRODUCT.md](PRODUCT.md) 与 [DESIGN.md](DESIGN.md)。完整原策划案保存在源码仓库，不进入 npm 安装包。

## 赞助与支持

<div align="center">
  <a href="https://api.doveli.top/">
    <img src="https://raw.githubusercontent.com/DoveLi-Gu/dsh-dyou-wine/main/docs/assets/pigeon-logo-512.png" alt="鸽子中转站 Logo" width="144">
  </a>
  <h3><a href="https://api.doveli.top/">鸽子中转站 · Pigeon API Relay</a></h3>
  <p><strong>一个入口，接入常用 AI 编程与对话工具</strong></p>
</div>

鸽子中转站提供 OpenAI 兼容 API、密钥管理和用量记录，适合在已有客户端中配置自己的 API 地址与密钥。[接入文档](https://www.doveli.top/docs/) 提供 OpenCode、Hermes、Codex++ 与 CC Switch 等工具的配置步骤，方便从第一次接入开始使用。

平台提供余额与订阅入口，可在[模型与价格](https://api.doveli.top/model-pricing/)页面比较模型及分组计费，再按自己的使用需求选择。模型、线路、价格和套餐权益以站内实时信息为准。

<p align="center">
  <a href="https://api.doveli.top/register"><strong>创建账户</strong></a>
  · <a href="https://api.doveli.top/">进入控制台</a>
  · <a href="https://api.doveli.top/model-pricing/">模型与价格</a>
  · <a href="https://api.doveli.top/subscriptions">订阅套餐</a>
  · <a href="https://www.doveli.top/docs/">接入文档</a>
</p>
