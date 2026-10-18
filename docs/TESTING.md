# 测试与验收记录

当前发布候选：`0.1.0-alpha.13`，正式名「D友の酒 · Dyou Wine」。本版将 PNG／MP3 拆为包内独立资源，Host 提供同源静态路径，真实编译入口和媒体加入 Git。以下各版本分别记录实际执行范围。

## Alpha.13 静态媒体与 dsh.pub 入口检验

2026-10-18，`npm run check` 通过：类型检查、69 项测试（含新增 22 项真实 HTTP／Cordis 生命周期测试）、构建、37 项浏览器测试、市场资料检查及 21 文件包检查。日志 `.qa/release-alpha13/check.log`。新增浏览器用例验证媒体 HTTP 加载失败时显示错误，界面与玩偶仍按原固定时钟运行。

- `lib/client.js` 从 6,919,317 bytes 降至 **80,268 bytes**，包含完整业务代码和 ModuleLoader 注册；PNG／MP3 原字节放入 `lib/assets`。Host 同样小于 1,000,000 bytes。四个真实分发文件纳入 Git，并在自检中对比重建字节与版本记录，避免只提交空入口或遗留旧产物。
- Host 测试覆盖固定两路 GET／HEAD、Content-Type／Length、闭合／开放／后缀 Range、206／416、If-Range、缓存校验、405、读取错误、注入激活、路由回滚及卸载终止活动流；请求参数不会变成用户磁盘路径。
- 真实 DSH `0.2.0-rc.2` 安装本版 tarball 后验收通过：client 80,268 bytes、SHA256 `e2475884598461b03ad60ded541efd55f70d6fab1e32db9b1e86a2f42df7f82d`。玩偶 PNG 解码、飞行反射、双效果固定周期和清理通过，零 pageerror；报告 `.qa/release-alpha13/dsh-host-report.json`。
- 两份媒体的同源 HTTP GET／HEAD 均 200，32 字节 Range 为 206，越界为 416；Content-Type、Length、Content-Range 和完整资源 SHA256 与源文件相同。原生音乐解码 187.370667 秒，readyState 4、volume 0.5、循环，进度、暂停继续和 Escape 归零通过，无 iframe／视频或 B 站媒体请求。物理扬声器输出未监听。
- 使用固定上游 dsh.pub commit `d93c8bf289c5fb045ccad77ea4610cce0d895b97` 的原投稿与 Topic 检查逻辑，传输替换为本地文件读取；工作树候选通过，边界 1,000,000 bytes 接受、1,000,001 bytes 拒绝。最终提交后从实际 Git blob 重跑的结果保存于 `.qa/release-alpha13/dshpub-git-admission.json`。这验证本地分发闭包，不代表远程市场已收录。

完整资源 HTTP、隔离 Host、录制及最终文件哈希证据集中于 `.qa/release-alpha13/`；本机日常更新与内置浏览器预览独立记录于 `.qa/deployment/static-alpha13/installation.json`，不由隔离测试推断。未重新运行 60 秒性能对照或干净副本构建；旧版本结果单列。GitHub／npm 与收录申请仍未公开执行。

## Alpha.12 市场发现准备检验

2026-10-18，`npm run check` 通过：类型检查、47 项单元测试（7 文件）、构建、36 项浏览器测试、新增市场资料自检，以及 19 文件 npm 包检查。证据 `.qa/release-alpha12/check.log`；最终打包、发布演练与归档哈希保存在同目录。

- 校验 npm `dsh-plugin` 关键词、`dsh.bundle`、`dsh.marketplace` 的 Web／重启／安装步骤声明、保持不变的 `engines.dsh` 和 `alpha` 发布标签。
- 检查 9 个待设置的 GitHub topics、3 个仓库截图路径的实际 PNG／GIF 文件头与安全路径、3 份投稿稿件的名称、版本、来源、分类及未审核状态。两张 PNG 经独立视觉复核，只包含 Alpha.11 的隔离验收会话，没有私人聊天。
- ydhrdh JSON 草案另与当日保存的上游 JSON Schema 静态比对，无错误；未运行上游 CI、发起上游 PR、填写站点表单或提交候选。新自检属于本地资料一致性检查，不是第三方市场的准入证明。
- 包白名单新增 `docs/MARKETPLACE.md`，共 19 文件；`screenshots.json`、展示 PNG／GIF、赞助 Logo、`marketplace/` 草案、开发脚本及测试资料不进入 npm 包。
- 生产客户端 SHA256 仍为 `a125b3e497712b67eea08cb51773e956a43a2386c64716daadb2ecd731bbaf4e`，Host SHA256 仍为 `141aa312603caa693062d2157bc6de7b096d28f590af095f3d3ade79aeb9782d`。未改 `src/`，本轮未重新执行真实 DSH 录制、性能对照或干净副本构建，历史证据单列于下文。

自检如实报告 dsh.pub 未满足：Git 源码树没有提交 `lib/host.js`／`lib/client.js`，且 client 为 6,919,317 bytes，超过对方 1,000,000 bytes 限制。GitHub／npm 尚未公开、topics 尚未远程设置、各市场均待发布后扫描或审核；不能将本地检查通过记为“加入所有市场”。详见 [市场准备](MARKETPLACE.md)。日常 DSH profile 未修改。

## Alpha.11 演示与发布材料检验

2026-10-18，实际执行 `npm run check`，类型检查、47 项单元测试（7 文件）、构建、36 项浏览器测试和 18 文件包检查全部通过；日志 `.qa/demo/check-alpha11.log`。测试发现范围显式限定当前 `tests/`，不把 `.qa/` 中的干净副本重复计入。

- 使用本版 tarball 在新建隔离 DSH home 中安装，打开真实 DSH Web 和预置确定性测试会话；界面与飞行玩偶同时运行，「上头」档、固定 500 ms 周期。原速录制 12 秒，采样验证两个方向均有边界反射、无越界、界面与玩偶相位误差 0 ms、零 pageerror。过程未替换宿主 DOM 或动画时钟；未使用日常 profile、私人会话或真实模型请求。
- 导出 `docs/assets/demo.gif`：800 × 500、15 fps、180 帧、12 秒，无声循环。完整飞行片段与首秒形变分别抽帧审看，并由独立审阅复核。原录屏、控制面板截图、联系图与实际版本／客户端哈希／采样报告保存在 `.qa/demo/`。
- README 顶部嵌入演示，末尾加入与既有 dsh-showcase 一致的鸽子中转站标识及接入推广。官网、注册、价格、订阅与文档入口经过访问核对；模型、价格和权益不作静态承诺。管理员状态页未列为公开宣传入口。
- npm 包仍为 18 个白名单文件，展示 GIF、赞助 Logo、录制脚本、测试夹具、日志与 profile 不进入安装包；README 使用 GitHub 原始图片地址，远程仓库上传后可显示。
- 生产客户端 SHA256 仍为 `a125b3e497712b67eea08cb51773e956a43a2386c64716daadb2ecd731bbaf4e`。没有重做 Alpha.10 的干净副本构建、60 秒性能对照和完整真实宿主 BGM 生命周期检查；本版浏览器媒体用例随 36 项检查执行，演示录制时 BGM 关闭，GIF 不包含声音。

本版发布包、源码归档、Git 提交／tag、GIF 和客户端哈希记录在 `.qa/release-alpha11/release-manifest.json`；本地发布演练的输出存于同目录。当前仍未创建远程仓库、推送、公开 GitHub Release 或发布 npm。日常 DSH profile 未修改。

## Alpha.10 最终发布检验

2026-10-18，本轮干净安装、完整自动化、性能对照和真实隔离 DSH 检验通过，证据集中于 `.qa/release-final/`。GitHub Actions、远程仓库创建和实际 npm 发布尚未执行。

| 检查 | 本版结果与证据 |
| --- | --- |
| 干净副本安装 | 独立目录从源码及锁文件执行 `npm ci`，含 prepare；没有复制 node_modules 或 lib，安装、类型检查、47 单测、构建、18 文件包检查全通过；`clean-build.json` |
| 完整本机检查 | `npm run check` 通过：47 单测、36 浏览器、类型检查、Host／client 构建、18 个公开文件；`check.log` |
| 依赖与分发边界 | `npm audit` 为 0 已知漏洞；源码凭据模式检查未命中；仅发布白名单文件，客户端音轨字节与声明来源哈希相同；不将这些检查称为安全审计 |
| 真实隔离安装 | DSH 0.2.0-rc.2、Chromium 156.0.8078.4，27 根动画，五类有效覆盖 6／5／2／132／4，零 pageerror；`dsh-host-report.json` 的 passed、combinedPassed、petPassed、bundledMusicPassed 均 true |
| 双效果与飞行 | 共同运行采样 1261 帧，相位时间差 0 ms、无越界；宠物单开 1501 帧，横向反射 1 次、纵向 2 次，节奏稳定；固定周期 500 ms |
| 内置录音 | 实际解码 187.370667 秒，readyState 4、未静音、volume 0.5、循环，进度 0.124560→0.776855；暂停保留 0.822359，续播后推进，Escape 归零，无 iframe／视频／B站媒体请求；不代表已监听物理扬声器 |
| 发布演练与最终哈希 | 对最终 tarball 执行 `npm publish --dry-run --ignore-scripts --tag alpha`；实际退出码与文件清单保存于 `npm-publish-dry-run.json`／日志。最终源码归档、tarball 和哈希记录在外置 `release-manifest.json`，避免把自身哈希写入包内形成循环 |
| 本机日常实例 | 继续使用已交付 Alpha.9，客户端 SHA256 与候选相同；本轮发布准备未改其 profile；安装证据仍为 `.qa/deployment/bundled-alpha9/installation.json` |

干净构建、候选构建及真实隔离宿主安装的客户端 SHA256 均为 `a125b3e497712b67eea08cb51773e956a43a2386c64716daadb2ecd731bbaf4e`。生产客户端未改；此次修复针对验收脚本、发现元数据和发布材料。

本轮还独立运行了 60 秒关闭／60 秒开启动效的性能对照：302 条消息、123,376 字符、1920×1080、devicePixelRatio 1、Windows 11／Ryzen 7 7800X3D／RTX 4060／32 GiB。关闭与开启动效的 rAF 间隔 p95 均约 3.4 ms，插件回调 p95 为 0.10 ms，10 个可见动画根，停止至下一 rAF 约 2.1 ms、剩余动画 0。证据 `benchmark-60s.json`。这是 headless 合成场景，不能换算为物理显示器 FPS，也不能证明 120 个活动目标或 Windows IME／真实模型流式已通过；本次性能对照与其他自动化任务分开运行。首次与浏览器检查重叠的尝试已取消，不作为性能证据。

正式名、英文名与安装包名分别为 D友の酒、Dyou Wine、`dsh-dyou-wine`。计划发布至 `DoveLi-Gu/dsh-dyou-wine`，GitHub 账号通过当前连接与既有 dsh-showcase 项目核对；repository 元数据记录该计划目标，不代表已建仓。npm 公开名称查询未找到该包，不代表已预留名称。

## Alpha.9 已交付版本

当前版本：`0.1.0-alpha.9`。本版将原梗 BGM 从在线 iframe 改为内置 MP3，移除左下角视频，保留可跳转音频来源链接。两个独立效果、固定 120 BPM 与飞行反弹沿用 Alpha.8。Alpha.8 及更早计数、哈希、截图和性能样本均为历史，不能视作本版通过证据。

## Alpha.9 验收记录

2026-10-18，`npm run check` 完整通过：类型检查、42 项单元测试、36 项浏览器测试、Host／client 构建和 14 个公开文件的包内容检查。日志 `.qa/alpha.9/check.log`。本版 tarball 的真实隔离 DSH 验收通过；日常安装以交付记录为准。GitHub CI 未运行，未公开发布。

| 检查 | 当前状态与所需证据 |
| --- | --- |
| 类型检查、单元测试、构建、浏览器与包内容 | `npm run check` 全部通过：42 单测、36 浏览器、14 个公开文件 |
| 内置音轨技术检查 | 通过：187.370667 秒、48 kHz 双声道 MP3，FFmpeg 完整解码 exit 0；构建客户端内嵌字节与源文件 SHA256 一致，参数见 ASSETS.md |
| 音乐默认与来源标识 | 通过：默认关闭、设置来源链接可跳转、无 iframe／B 站网络媒体请求 |
| 音乐生命周期 | 通过实际内置 MP3：固定音量 0.5、循环、暂停／后台暂停保留进度、恢复继续、醒酒归零、卸载释放；异步播放拒绝显示错误且不停止视觉效果 |
| 双效果与交互回归 | 模拟宿主回归通过：固定 500 ms 周期、共享相位、音乐启停不重置视觉实例、飞行反弹及交互保护；真实宿主另行记录 |
| 真实隔离 DSH | DSH 0.2.0-rc.2 + Chromium 156.0.8078.4 通过，27 根、五类有效覆盖 6／5／2／132／4，双效果及内置音乐检查通过，零 pageerror；证据 `.qa/alpha.9/dsh-host-report.json` |
| 日常 profile 与内置浏览器 | 以 `.qa/deployment/bundled-alpha9/installation.json` 的实际安装哈希、媒体进度和 `preview.png` 为准；本节隔离验收不代替日常更新，物理扬声器输出与媒体状态分别说明 |

隔离宿主报告的 `passed`、`combinedPassed`、`petPassed`、`bundledMusicPassed` 均为 true。双效果连续采样 1261 帧，固定 500 ms 周期、相位误差 0 ms、越界样本 0；高频自动化采样数量不代表物理显示器刷新率。

实际内置媒体时长 187.370667 秒，`readyState=4`、音量 0.5、循环开启、未静音；播放进度从 0.128028 增至 0.781806 秒。暂停时进度保持 0.837163 秒，恢复后推进到 1.508333 秒；Escape 后归零。B 站网络请求为空，内嵌音频 SHA256 与源文件一致。此为浏览器媒体状态验证，没有监听物理扬声器。安装客户端 SHA256：`a125b3e497712b67eea08cb51773e956a43a2386c64716daadb2ecd731bbaf4e`。

复现：`npm run check` → `npm pack --ignore-scripts` → `node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.9.tgz`。不宣称歌曲每拍精确同步，媒体时间推进不等于已监听物理扬声器。Windows 原生 IME、真实模型流式、物理性能与 Desktop 壳未专项验证，不能由本次音乐改动验收外推。

## Alpha.8 历史记录

2026-10-18，`npm run check` 完整通过：类型检查、37 项单元测试、35 项浏览器测试、Host／client 编译和 14 个公开文件的包内容检查。GitHub CI 未运行，未公开发布。此处结果均来自 Alpha.8 当前构建。

| 检查 | 当前状态与所需证据 |
| --- | --- |
| 类型检查、单元测试、构建、浏览器与包白名单 | `npm run check` 全部通过：37 单测、35 浏览器、14 个公开文件 |
| 新增候选与安全边界 | 通过：普通 div／span、页头、侧栏文字、行内 img／svg 有效覆盖；父子不叠加，输入／合成 IME／选区／审批／滚动根／冲突保护回归通过；证据 `.qa/alpha.8/expanded-interface-coverage.json` |
| 精简设置与迁移 | 通过：320 px 面板仅三个复选框、三档预设和启停；无已移除高级控件，保留预设与效果开关、恢复高级项默认；持久化不自动激活 |
| 双效果连续运行 | 通过：固定 500 ms 周期、共享相位、独立开关互不重启、双轴反射、缩放、点击穿透与清理回归；证据 `.qa/alpha.8/combined-native-rhythm.json` |
| 在线 BGM 生命周期 | 通过模拟官方 iframe：默认无请求；勾选且运行才请求，关闭／暂停／醒酒／Escape／隐藏／卸载移除，恢复重载；开启音乐不重启已有视觉动画。此项没有实际播放远程音频 |
| BGM 实际媒体播放 | 以 `.qa/deployment/simple-alpha8/installation.json` 及实际播放器截图为准；iframe 创建或 load 成功不等于已播放音轨。不承诺循环、私有控制或精确跟拍 |
| 真实隔离 DSH | DSH 0.2.0-rc.2 + Chromium 156.0.8078.4 安装通过，27 根，五类有效覆盖 6／5／2／132／4，零 pageerror；停止后自有动画 0；证据 `.qa/alpha.8/dsh-host-report.json` |
| 日常 profile 与内置浏览器 | 以 `.qa/deployment/simple-alpha8/installation.json`、最终运行截图及安装客户端哈希比对为准，隔离检查不能代替日常更新 |

隔离宿主双效果连续采样 1260 帧，固定 500 ms 周期，相位误差 0 ms，原生动画对象、曲线与起始时间稳定。桌宠单开采样 1500 帧，水平方向反射 1 次、垂直 3 次，完整精灵无越界；暂停冻结、停止清理通过。实际安装客户端 SHA256 为 `f87532e6f9a2d0cc338765a5555d07de53644f33e0116b97ae26e65b6aa328de`。采样帧数不代表物理刷新率；无模型请求，原生 Windows IME、真实模型流式、实机性能和其他宿主版本仍未专项验证。

复现：`npm run check` → `npm pack --ignore-scripts` → `node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.8.tgz`。60 秒性能对照须单独执行，不属于未运行就可宣称完成的检查。Windows 原生 IME、真实模型流式、物理输入延迟、审批交互、Desktop 壳与其他插件组合仍需分别记录。原梗歌曲录音不进入 tarball 或源码分发。

## Alpha.7 历史记录

2026-10-18，本机 `npm run check` 完整通过：类型检查、37 项单元测试、31 项浏览器测试、Host／client 编译和 14 个公开文件的包白名单检查。

专项回归通过：`pageEnabled`／`petEnabled` 默认值和旧 `mode` 迁移，明确布尔值优先；整页单开、桌宠单开、同时开启和全关；启动只运行已勾选效果；运行中切换一者时另一者保持既有动画和时基；共享 BPM／相位／强度；共同暂停冻结、恢复、醒酒／Escape／卸载清理；桌宠既有匀速边界反射、点击穿透与缩放约束；整页覆盖和交互保护。合成场景的连续原生时间轴证据归档为 `.qa/alpha.7/combined-native-rhythm.json`，整页与桌宠起始时基相同，桌宠子树只有一根自有 Q 弹动画。素材沿用 Alpha.6，旧版互斥模式测试不作为本版独立开关通过依据。

最终编译 tarball 在全新隔离 DSH `0.2.0-rc.2` + Chromium `156.0.8078.4` 中安装检查通过。两效果同时运行采样 605 帧，原生周期为 500 ms，最大相位时间差为 0 ms，20 个整页动画与 1 个桌宠动画保持稳定；桌宠无越界。关闭整页后桌宠继续运行、关闭桌宠后整页继续运行，以及共同停止清理均通过。报告的 `passed`、`referencePassed`、`petPassed` 与 `combinedPassed` 均为 true，证据归档为 `.qa/alpha.7/dsh-host-report.json`。安装客户端 SHA256 为 `4cc911df52cc14c3f7956c2110c827cfdc282b92ef66bb6a5dd6fc3023b51fb5`。高频 headless 采样帧数不代表物理屏幕刷新率。

复现真实宿主检查：`node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.7.tgz`。隔离会话不调用模型；Windows 原生 IME、真实模型流式、物理性能、Desktop 壳和未指定第三方组合仍需专项验证。日常 profile 更新及内置浏览器预览的结果以 `.qa/deployment/independent-alpha7/installation.json` 与预览截图为准，隔离安装结果不能代替日常更新验收。GitHub CI 未运行，npm／GitHub 未公开发布。

## Alpha.6 历史记录

2026-10-18，使用用户提供的角色参考生成最终毛绒玩偶后，`npm run check` 完整通过：类型检查、27 项单元测试、28 项浏览器测试、Host／client 编译和 14 个公开文件的包内容检查。首次回归发现暂停测试在原生 WAAPI 暂停任务确认前采样，时间值跨了一帧；测试改为等待 `Animation.ready` 确认暂停后，仍严格比较 650 ms 期间的位置及动画时间完全不变，完整回归再次通过。旋转为用户明确允许省略的可选项，本版没有三维转身。

最终素材 SHA256：`7940942281c4988a60dd6c2c17998767f7faf99fefc9aa9b98248ae6ee40fddc`。最终编译客户端 SHA256：`bac1fc70840cb254bd7468f12341191d68f85f3e6cdfb240a78969e30190d3fa`。图片 RGBA 真透明并内嵌为客户端 data URL，用户提供的参考原图不进入 npm 包。

最终编译 tarball 在全新隔离 DSH `0.2.0-rc.2` + Chromium `156.0.8078.4` 中实际安装检查通过：5 秒 290 帧采样，水平反射 2 次、垂直反射 6 次，精灵无越界；500 ms 原生 Q 弹动画实例、曲线与起始时间保持不变，纵向比例 0.790758–1.15464，X／Y 显著同向形变样本为 0。宿主元素自有动画为 0，暂停冻结、停止清理和无页面异常检查通过。整页模式回归也通过，23 根，五类有效覆盖 6／5／2／83／4。已审看实际宿主毛绒角色截图。证据 `.qa/alpha.6/dsh-host-report.json`、`.qa/alpha.6/dsh-host-pet.png`、`.qa/alpha.6/pet-native-flight.json`。此验收没有调用模型，不代表 Windows 原生 IME、物理帧率或三维桌宠已验证。

日常 profile 安装和内置浏览器展示于本次交付完成；代码校验以交付记录为准。GitHub CI 未运行，npm／GitHub 未公开发布。

## Alpha.5 历史记录

2026-10-18，本机 `npm run check` 完整通过：类型检查、27 项单元测试、28 项浏览器测试、Host／client 编译、14 个公开文件的包白名单检查。将角色替换为最终毛绒玩偶透明 PNG 后，重新构建、检查打包内容并通过全部 6 项桌宠专项浏览器测试。素材 SHA256 为 `2d7464319a483fa1e165f365b50bb4069f81917e73a4dd3d75c1824758498173`；素材以 data URL 内嵌在客户端，无远端素材请求。

桌宠浏览器专项通过：固定 500 ms 原生 WAAPI 周期连续播放 8 拍，碰墙时 Animation 对象、起始时间与关键帧不变；600 px/s 飞行，多次双轴反射不越界；透明通道、真实像素点击穿透、宿主输入与静止、暂停／恢复、缩放到 260×220、设置持久化、两种模式互斥、后台暂停、Escape 和卸载清理。物理单元检查 30／60／144 Hz 等时间轨迹一致，并检查长延迟帧的多次反射和精确边界。相关证据：`.qa/pet-native-flight.json`。

最终 tarball 在全新隔离 DSH home 中安装验收通过：DSH `0.2.0-rc.2`、Chromium `156.0.8078.4`，无模型请求，页面错误为 0。真实宿主 1000×700 视口中连续 5 秒、1501 个样本：水平反射 3 次，垂直反射 5 次，无越界；形变周期、原生动画实例和起始时间全程稳定，纵向比例 0.790816–1.15464，同向 X／Y 形变样本为 0。宿主元素自有动效为 0；暂停冻结与停止移除通过。已审看明暗主题下的毛绒角色截图 `.qa/dsh-host-pet.png` 和 `.qa/dsh-host-pet-dark.png`。高频 headless 样本数量不代表物理屏幕刷新率。

整页模式真实宿主回归通过：23 个独立动画根，有效覆盖消息 6、正文 5、输入区 2、侧栏 83、工具／代码 4；原有节奏和清理断言全部通过。报告 `.qa/dsh-host-report.json` 的 `passed`、`referencePassed` 与 `petPassed` 均为 true。实际安装客户端 SHA256 为 `fb9eb46501a02e54d54baa457dbcc0400774e3a45cd7be474790e113e2174724`，与最终构建一致。

日常 profile 更新与内置浏览器展示正在执行；完成后以本次交付记录为准。GitHub CI 未上传运行，npm／GitHub 未公开发布。

飞行桌宠专项验收范围：固定设置下的连续 Q 弹周期重复；匀速与按实际时间推进；左右／上下边界反射和窗口缩放后的边界约束；碰墙不重置形变相位；尺寸与速度参数；点击穿透；暂停同时冻结位置与形变；醒酒／Escape／卸载后节点、动画与监听器清理；整页模式回归。角色图片需确认透明通道与客户端内嵌，不发起额外素材 HTTP 请求。

复现真实宿主检查：`node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.5.tgz`。隔离测试会话不调用模型；原生 Windows IME、真实模型流式、物理输入延迟、Desktop 壳与未指定第三方组合仍需分别验收。页面桌宠不能外推为操作系统桌宠通过。

## Alpha.4 历史记录

2026-10-17，`npm run check` 完整通过：类型检查、20 项单元测试、22 项浏览器测试、Host／client 编译和 14 个公开文件的包白名单检查。浏览器实际采样 8 个连续原生周期，共 1197 帧，四个区域共用相位，底边稳定；同一根的 Animation 对象、关键帧和起始时间保持不变。证据：`.qa/periodic-reference-trajectory.json`。

针对性回归覆盖：注入性能遥测使等级 0→3，活动数量依次为 120／80／48／28，保留动画的波形、500 ms 周期和起始时间不变；280 ms 主线程长任务前后，动画时间同样增加 280 ms，没有逐帧 `currentTime` 写入；形变引起的静止指针边界事件不打断动画，真实指针移动和焦点仍触发保护。模拟源时钟 seek、1710 ms 非整拍循环、BPM／相位变更后的全组重新对齐通过。对应证据为 `.qa/fixed-period-performance-levels.json`、`.qa/native-timeline-long-task.json`、`.qa/stationary-pointer-rhythm.json` 和 `.qa/native-source-clock-alignment.json`。其余输入、合成 IME、选区、原生 Chromium 复制、流式 DOM、宿主变换、30 次启停、长历史和音频资源回归通过。

真实 DSH `0.2.0-rc.2` + Chromium `156.0.8078.4` 隔离安装检查通过，记录为 `.qa/dsh-host-report.json`。4.2 秒采样得到每组 1241 帧：消息纵向比例 0.778795–1.18105，侧栏 0.856217–1.11768；底边漂移、平移、旋转、错相、父子叠加、非运行状态及中途修改波形的样本均为 0。相对原生时间轴的最大计时误差约 `1.82e-12 ms`。此处高频 headless 样本不代表物理屏幕帧率，也未观察长任务执行期间的每个物理呈现帧。

实际独立动画根 23；有效覆盖消息 6、正文 5、输入区 2、侧栏 83、工具／代码 4。代码外框继承形变 1、内部滚动区自有动画 0、醒酒控件自有动画 0；停止后动画 0，pageerror 0。已检查真实宿主截图；录屏 `.qa/dsh-host.webm` 为 VP9、1600×1000、25 fps、10.92 秒、无音轨。实际安装代码 `lib/client.js` SHA256 为 `4829d18987660a90fb2a07917ed242374ea1f667a43053f6d3356e4b044d4ad4`，最终构建再次核对一致。

复现真实宿主检查：`node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.4.tgz`。本轮未调用模型；Windows 原生 IME、真实模型流式、Desktop 壳、其他插件组合及新版 60 秒性能对照仍未专项验证。本版不新增歌曲下载、识曲或音乐预设；没有测得参考视频歌曲的准确 BPM，不能将手动 BPM 网格称为已经匹配原曲。

## Alpha.3 历史记录

2026-10-17，`npm run check` 完整通过：类型检查、20 项单元测试、18 项浏览器测试、Host／client 编译及 14 个公开文件的包白名单检查。浏览器用例采样 8 拍、每拍 16 个相位、四个动画根；相同相位的尺寸逐拍重复，跨区域同相位，每轮仅一次拉高和压矮，底边位移为 0 px。另检查父子只有一个动画根、关闭父范围后子区域接管、交互保护解除后在中性拍界重新加入、宿主变换保护、输入／选区／复制／流式文字、启停清理与长历史。轨迹证据：`.qa/alpha.3/periodic-reference-trajectory.json`。

真实 DSH `0.2.0-rc.2` + Chromium `156.0.8078.4` 的隔离安装检查通过，记录为 `.qa/alpha.3/dsh-host-report.json`。4.2 秒实际 computed CSS 采样得到每组 323 帧：消息纵向比例 0.778973–1.18123，侧栏 0.856333–1.1178；两组平移、旋转、底边漂移均为 0，反相缩放异常、跨区域方向错相、父子动画叠加样本均为 0。

该宿主有 23 个独立动画根。按自身或祖先继承形变统计，有效覆盖消息 6、正文 5、输入区 2、侧栏 83、工具／代码 4；这些覆盖数不可与旧版自有动画计数直接比较。代码外框继承形变 1、内部滚动区自有动画 0、醒酒控件自有动画 0，停止后动画 0，pageerror 0。已检查真实宿主截图；录屏 `.qa/alpha.3/dsh-host.webm` 为 VP9、1600×1000、25 fps、10.92 秒、无音轨。隔离宿主安装的 `lib/client.js` SHA256 为 `fd00fdbcfe4c214a071b0b1d85f329519f3c731e1e7f7e55150062cf2cb5e942`。

复现命令：`node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.3.tgz`。本轮未请求模型；Windows 原生 IME、真实模型流式、Desktop 壳、其他插件组合及新版 60 秒性能对照未专项验证。参考视频仅做定性观察，未测其准确 BPM 或逐帧曲线；以上结构检查不等同于原梗逐帧复刻或用户主观观感验收，详见 [参考说明](MOTION-REFERENCE.md)。

用户后续实机预览反馈：循环节奏仍会自行变化。以上结构检查曾通过，但不能据此认定连续播放的固定节奏和观感已达成；Alpha.4 针对此问题另行修正与回归。

## Alpha.2 历史记录

2026-10-17 在同一本机环境完成 `npm run check`：类型检查、24 项单元测试、18 项浏览器测试、构建和 13 个公开文件的包白名单检查全部通过。新增回归检查完整 500 ms 节拍中的起跳、落地挤压、正反超调收敛、X/Y 反向形变、错相目标自身拍界与宿主 transform-origin／强度 0 的恢复。

真实 DSH `0.2.0-rc.2` + Chromium `156.0.8078.4` 隔离安装记录 `.qa/alpha.2/dsh-host-report.json` 为 `passed=true`。2.2 秒实际 computed CSS 采样（147 帧）得到：消息上跳 22.16 px，纵向比例 0.8794–1.0867；侧栏上跳 14.41 px，纵向比例 0.9216–1.0563。两组旋转均为 0，显著同向缩放样本为 0；面积相对 1 的最大偏差分别约 0.85% 和 0.35%。倒数补偿在关键姿态精确成立；浏览器逐分量插值只近似保持面积，反相判定容许 `(sx-1)*(sy-1) <= 0.0001` 的微量插值误差。

实际覆盖消息 6、正文 5、输入区 2、侧栏 8、工具/代码 3，45 个自有动画；代码外框 1、内部滚动区 0、固定醒酒控件 0，停止后自有动画 0，pageerror 0。安装代码的 `lib/client.js` SHA256 为 `7f1e43fdec10a551ec8cfd40ba62a96991381c8a60fe2652ecc42d28560a084c`，最终交付和日常安装时再次核对代码哈希。检查了该版真实宿主截图；操作录屏 `.qa/alpha.2/dsh-host.webm` 为 VP9、1600×1000、25 fps、9.44 秒、无音轨。

合成场景的完整单拍逐帧数据保存在 `.qa/alpha.2/bounce-trajectory.json`，验证停止后位置和尺寸恢复。真实宿主测试会话是确定性测试数据，不请求模型。上述数值不能代替用户对 Q 弹质感的主观验收，也不外推到真实模型流式、原生 Windows IME、Desktop 壳或实机输入延迟；Alpha.1 的 60 秒性能样本未在本次波形上重跑。

新版可复现安装检查：`node scripts/dsh-smoke.mjs --tarball ./dsh-dyou-wine-0.1.0-alpha.2.tgz`。在本机 PowerShell 中直接调用 Node 可避开 npm 包装器吞掉 `--tarball` 的情况。

## Alpha.1 历史记录

记录日期：2026-10-17；版本：`0.1.0-alpha.1`。本机 Windows 11（10.0.22631）、Node 24.16.0、npm 11.15.0、DSH 0.2.0-rc.2、Chromium 156.0.8078.4。以下各节均属于 Alpha.1。自动化与真实宿主证据分别记录；未执行项目保持「待验证」。

## 自动化与编译

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `npm run typecheck` | 通过 |
| 单元测试 | `npm test` | 19/19 通过：节拍、强弱拍、预算、降级、设置、音频资源和异步启停竞态 |
| Host／client 构建 | `npm run build` | 通过；宿主 React 外置，客户端封装为 DSH ModuleLoader factory |
| 模拟宿主浏览器交互 | `npm run test:browser` | 15/15 通过；独立目标、120 个同时可见目标预算、焦点/合成 IME、选区/原生剪贴板、流式文本、冲突、审批、启停、可见性、减少动态、本地 WAV、长历史、深色 |
| 包内容与公开契约 | `npm run pack:check` | 通过；仅 13 个公开文件，无源码测试、profile、日志、凭据、歌曲或 node_modules |
| tarball 安装及真实 DSH 启动 | `npm run test:dsh`，隔离 `DSH_HOME`、Web profile、随机回环端口 | 通过；实际安装包经 CLI 加载，五类覆盖、代码卡、醒酒清理和零 pageerror 通过 |
| GitHub Actions Ubuntu／Windows | `.github/workflows/ci.yml` | 已提供工作流；未上传并运行前不得标为通过 |

`npm run check` 已在本机完整通过。`npm audit` 检查开发及运行依赖均为 0 已知漏洞；这不是安全审计结论。测试证据保存在被 Git 与 npm 排除的 `.qa/`，不公开隔离 profile 或本地访问凭证。

## 可复现检查

```sh
npm ci
npx playwright install chromium
npm run check
npm pack --ignore-scripts
npm run test:dsh -- --tarball ./dsh-dyou-wine-0.1.0-alpha.1.tgz
npm run benchmark
```

`test:dsh` 需要本机安装 `@deepseek-ai/dsh@0.2.0-rc.2`，每次创建新的 `.test-dsh-home/<UUID>` 并通过 CLI 安装 tarball。`tests/host` 是测试专用私有 bundle，用公开 Session API 创建确定性测试数据；不提交 prompt、不执行工具，也不替换 DSH 的 DOM 渲染器。首次预览说明仅在此隔离环境中确认。

最终真实宿主安装的 `lib/client.js` SHA256 为 `f8d324daa2f75e966c7745d71fd72046bf6a53f5e01dd8ea91264570f9cebb79`，与 Alpha.1 交付构建一致。`.qa/alpha.1/dsh-host-report.json` 的 `passed=true`：46 个自有动画；实际覆盖消息 6、正文 5、输入区 2、侧栏 9、工具/代码 3。代码卡外框自有动画 1，内部滚动区自有动画 0；醒酒按钮自有动画 0；停止后 150 ms 检查自有动画 0；页面未捕获错误。

已查看 `.qa/alpha.1/dsh-host.png`、`.qa/alpha.1/dsh-host-expanded.png`、`.qa/alpha.1/dsh-host-dark.png`，确认真实宿主明暗配色与面板显示正常；深色来自浏览器系统配色偏好模拟。`.qa/alpha.1/dsh-host.webm` 是同一隔离宿主的操作录屏，VP9、1600×1000、25 fps、7.4 秒、无音轨（ffprobe 核对）。视频是验收记录，所示内容为明确标记的确定性测试会话。

本地模拟页地址为 `http://127.0.0.1:4179/tests/fixture/`，明确标注为合成场景。合成的 composition 事件与文字内容检查不能代替 Windows 输入法候选窗验收；Chromium 中通过真实 Ctrl+C 和 clipboard.readText 比较代码的关闭/开启结果，包含 Windows CRLF，但不外推到所有系统剪贴板路径。

## 已测 60 秒对照（合成场景）

`npm run benchmark` 把测试页与当前源码冻结成静态 bundle，以免开发热重载打断计时。证据 `.qa/benchmark-60s.json`，快照 SHA256 `3152125477f386a45a6322e421b53e5ac68031ca14cb6cd488fa3f7fc5bbae1c`。

环境为 Ryzen 7 7800X3D（16 线程）、32 GiB RAM、Windows 11、ANGLE/NVIDIA RTX 4060、Chromium 156.0.8078.4 headless，1920×1080、devicePixelRatio=1。页面含 302 条消息、123,376 字符，发现 619 个目标，稳态有 19 个活动可见目标。另一个独立浏览器用例创建 180 个同时可见按钮，验证活动目标封顶 120 且五类区域继续覆盖。

| 指标 | 观测结果 |
| --- | --- |
| 关闭效果 60 秒 rAF 间隔 p95 | 3.4 ms；17,957 样本 |
| 开启效果 60 秒 rAF 间隔 p95 | 13.3 ms；9,547 样本 |
| 开启结束时的滚动窗口帧间隔 p95 | 13.3 ms |
| 插件回调滚动窗口 p95 | 0.20 ms |
| 自动性能保护 | 本次结束时为正常预算；降级算法另有单元测试覆盖 |
| 醒酒至下一 rAF，且动画归零 | 2.0 ms；剩余自有动画 0 |

这些是 headless 的回调间隔，不等于物理显示器 FPS。关闭状态可超出显示刷新率，不能由此推算实机流畅度；未测 OS 输入至像素延迟、屏幕缩放和 GPU 利用率。长历史样本只有 19 个活动可见目标，不能用它宣称 120 个目标的 60 秒实机性能已达标。真实 DSH 长会话、物理输入延迟和原生中文输入法仍需专项验收。

## 真实宿主验收

| 编号 | 需要留下的证据 | 状态 |
| --- | --- | --- |
| V01 | 消息、正文、工具卡、输入区和侧栏同屏局部动效截图／运行记录 | 真实 DSH + 确定性会话通过；五类计数均非零，截图/录屏已检查 |
| V02 | 真实流式回答无丢字、重复或停止生成回归 | 合成流式 DOM 回归通过；真实模型流式和停止生成待验证 |
| V03 | Windows 中英文及中文 IME 候选、光标、发送 | 待人工验证 |
| V04 | 段落和代码的真实选区／复制结果与关闭状态一致 | 合成场景的原生 Chromium 剪贴板对照通过；真实宿主复制待专项验证 |
| V05 | 滚动、折叠、窗口缩放及至少 30 次切换会话 | 真实工具组展开及模拟历史滚动通过；30 次真实会话切换/缩放待验证 |
| V06 | 菜单与真实审批弹窗稳定、醒酒始终可点 | 模拟审批保护通过；真实宿主醒酒静止/停止清理通过；真实审批待验证 |
| V07 | 手动节拍与本地音频暂停／循环／跳转后对齐 | 浏览器本地生成 WAV 的播放/暂停/跳转/循环通过；真实宿主手动节拍启停通过 |
| V08 | 300 条消息／约 10 万字符，60 秒关闭及开启动画 trace | 合成场景 60 秒对照完成（见上）；真实宿主 trace、物理输入延迟待测 |
| V09 | 启停 30 次，卸载／热重载后的动画、节点、监听器与媒体清理 | 模拟 30 次启停/卸载回归及音频竞态测试通过；真实宿主停止归零；Host 热重载/堆快照待测 |
| V10 | 明暗主题与指定第三方插件共存 | 真实宿主明暗主题显示通过；指定第三方插件组合未验证 |
| V11 | 未知版本、特殊内容、缺失能力时可读提示与正常聊天 | 待验证 |
| V12 | 真实系统减少动态效果偏好及主动预览退出 | Chromium 偏好模拟的默认静止/主动预览/Escape 退出通过；Windows 原生设置待测 |

模拟页可以回归状态机、DOM 变化、合成的 composition／pointer／selection 事件和清理路径。它不证明真实 IME、真实流式模型、其他插件、系统缩放或 Desktop 壳行为。无模型调用的启动检查也不证明实时对话通过。

## 性能记录要求

记录 CPU、GPU、内存、OS、屏幕缩放与刷新率、浏览器／DSH 版本及启用的插件；同一会话分别记录关闭与开启的 60 秒样本。报告帧间隔 p95、插件回调 p95、输入／点击延迟相对增量、停止恢复耗时与降级轨迹。策划目标为帧间隔 p95 ≤20 ms、插件回调 p95 <3 ms、交互增量 p95 <20 ms、停止 ≤100 ms。这些是待测指标，不是本表自动承诺的结果。

连续启停和切换会话各 30 次后检查活跃目标、自有 Animation、观察器、媒体 URL 与堆引用；仅凭对象数稳定不能替代浏览器堆快照的泄漏分析。
