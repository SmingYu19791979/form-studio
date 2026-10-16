# FORM · 开发交接（2026-10-16）

## 用户此刻真正要做的事

把这个项目保存在云端，回家后在另一台电脑上继续让 Codex 修改、调试和优化代码。此前下载页偏重“使用现有版本”，没有传达开发接续的入口。本文件用来接续项目目标与技术上下文，不是原始聊天记录的完整同步。

## 2026-10-16 · 1.2.0 真实材质与节日场景（最新本地版，云端未同步）

- 新增 dist/scene-themes.js、camera-framing.js 与 qa/scene-surfaces.test.mjs。618、双十一、圣诞、新年四套主题，每套5个可编辑三维装饰；切换替换主题自身对象，复制的装饰转为个人道具。
- 大理石改为 ambientCG Marble012，木纹/混凝土/亚麻来自 Poly Haven。1K 独立颜色、OpenGL 法线、粗糙度贴图随包离线提供。颜色sRGB，其余线性；调节50–2500mm覆盖宽度、方向、粗糙度、细节与染色。来源/CC0/哈希见 dist/assets/materials/sources.json。大理石700mm是艺术推荐值，非实测扫描尺寸。
- 异步材质加载使用请求序号，防止旧贴图覆盖新选择；纹理失败明确提示，PNG等待当前纹理就绪。地面扩展到2000场景单位，纹理尺度跟随实际平面宽度。保留25mm/单位。
- 修复整体缩放破坏独立宽高比例；接触阴影范围跟随对象；长焦与竖幅使用投影包围盒计算取景距离。字体插件仅将bare import改为本地Three.js路径，便于浏览器与Node统一验证。
- sceneTheme包含首次应用前的settings/camera，跟随快照、JSON和自动保存。移除主题还原环境与相机，同时保留用户最新产品编辑。30对象容量校验在任何删除前完成。
- 验证：26项Node +16项Python回归全部通过。本轮浏览器自动化可用，已实测四个主题、材质切换、刷新后新年主题恢复、撤销/重做、移除主题恢复、实际PNG导出；浏览器error/warn为空。未重新执行真实新品研究生成。
- 8个原有产品/手动道具的UID及变换矩阵与本轮浏览器测试前快照一致（误差<1e-9）。当前开发场景保存用户正在选择的主题（原有8对象加5个主题装饰）；通过“移除主题·恢复原布景”可回到原有8对象。用户在开发期间对两个面霜的摆放作过修改，保留其最新修改，不回滚到更早备份。
- 便携包1.2.0依然独立端口8768、默认一个面霜，不含个人布景。开发源码包含最新当前布景；不含runtime/jobs、账户文件或凭证。
- 再次原生查询确认同一私有Sites项目仍为第2版。此前官方source helper隐藏stdin被自动审批拒绝，根仓库仍未恢复。本轮不绕过审批、不伪造commit、不新建Site；云端保存尚未完成。恢复官方源码同步后将本应用合入原仓库studio-source/，更新根开发包后推送与私有发布。

## 2026-10-16 · 地面材质与基础道具（本地实现，待云端保存）

- 本轮基于用户下载的完整工作台源码包开发；目录本身对应云端仓库中的 studio-source/。尚未恢复云端根目录 .openai/hosting.json 与 tools/refresh_development_bundle.py，不能声称此下载副本是 Git 远端最新 HEAD。
- 新增 dist/stage-props.js：9 类有实体几何的布景道具，保持共享毫米比例，支持颜色与三个方向独立尺寸，普通 ObjectLoader 即可保存恢复。
- 新增 dist/ground-materials.js：6 类程序生成的地面材质、纹理大小、材质缓存和本地纹理；地面参数由现有 settings 保存。
- dist/app.js、index.html、style.css 接入顶部道具入口、场景面板道具库/材质选择和道具属性。保留现有产品建模与研究流程。
- 验证结果：18 项 Node、16 项 Python 回归全部通过。用户在重新打开本地工作台后，确认顶部道具入口、添加方块/飘带及地面材质均可正常显示。浏览器自动化被 URL 安全策略拦截，此项为用户手动验收；不冒充自动化验收或真实新品研究验证。
- 下载包的源码已包含本轮修改；原 Sites 项目身份仍为 appgprj_6ad080eb807c819183df4c4dd78b65ed，必须接回同一仓库，不能新建 Site 或覆盖为下载页应用。
- 当前会话的源码 helper 隐藏 stdin 被自动审批拒绝，原项目云端保存尚未完成。网络许可已获得，但没有绕过该审批限制或写出凭证。之后可使用支持该官方流程的会话恢复原仓库，将应用修改合入 studio-source/，更新根交接文档及开发包后再推送、保存与私有发布。

## 从另一台电脑继续

用同一账号在支持 Sites 的桌面会话中请求恢复现有项目源码：

> 使用 Sites 恢复这个现有私有项目的最新源码，继续开发 FORM 产品布景平台：https://laneige-gold-angle-studio.pastelhippo128.chatgpt.site 。先读根目录 AGENTS.md、DEVELOPMENT_HANDOFF.md 和 studio-source/README.md。我要优化的是 studio-source 中的工作台代码，请先检查现状再按我的新需求修改；不要只启动现成版本，不要只改下载页，不要新建 Site。完成后验证并保存回同一个私有云端项目。

源码恢复应使用 Sites 官方既有项目流程：get_site → create_source_repository_write_credential → source helper 打开最新源码；凭证只能保存在会话内并从隐藏 stdin 传给 helper。保留根目录 `.openai/hosting.json` 的身份。应用主体不是根目录 `dist/`，而是 `studio-source/`。

若这台电脑不能使用 Sites 源码恢复，则从云端页下载完整可编辑源码包，解压后将 `FORM-Studio-Project` 文件夹作为本地 Codex 项目打开，先读其中的本文件与 AGENTS.md，再继续改代码。下载是开发源码的备用获取方式。

## 需求沿革与已接受方向

- 最初以兰芝致美面霜 50ml 的正面图及高清斜角图重建；用户接受此种 Three.js 多部件几何、金属/塑料材质、独立印刷与完整三维旋转效果。
- 后加入雪纱隔离乳 No.40 30ml，要求同等还原质量。未知背面、顶部等要查实际参考资料，材质也要还原。
- 从单品展示改为通用工作台：图片导入不同产品、数量、自由摆放、物体角度、灯光/阴影、相机与透视均可调整，不需要营销介绍栏。
- 任意新品不能只在弹窗中下载一堆资料；研究与建模完成后必须直接出现在当前三维场景。继续沿用 Three.js，先找参考再建模。用户曾多次反馈“新产品不能添加”，以后要用未登记原图做端到端验证。
- 用户同意使用本机已登录 Codex 作为研究建模代理，输出数据配方，由 Three.js 构建；不执行代理生成的任意 JavaScript。
- 各产品要有正确相对尺寸，容量用于识别版本，外尺寸用毫米资料或明确估算；不能按最长边统一归一化。
- Mac 和 Windows 都要支持；便携版仅放一个产品示意，附大概使用说明。

## 当前代码结构

| 路径（相对 studio-source） | 用途 |
| --- | --- |
| dist/app.js、index.html、style.css | 工作台 UI、场景、控制、保存与导出 |
| dist/laneige.js、skin-veil.js、water-bank-foam.js | 已研究产品的手工 Three.js 创建器 |
| dist/product-catalog.js、product-specs.js、product-scale.js | 产品注册、毫米尺度和相对尺寸 |
| dist/product-import.js、photo-flow.js、modeling-client.js | 图片识别/任务提交/进度/生成入场 |
| dist/generated-model.js、packaging-model.js | 数据配方驱动的独立部件与 PBR 材质 |
| server/studio_server.py | 仅监听本机的 API、Codex 队列、任务恢复和场景备份 |
| server/modeling-prompt.txt、recipe-schema.json、recipe_schema.py | 研究建模约束、数据格式与验证 |
| server/platform_runtime.py、launch.py | 跨平台运行、Codex 解析与启动 |
| research/、dist/assets/ | 产品资料、已保存参考图片、Three.js 本地依赖 |
| qa/ | Python 和 Node 回归检查 |
| tools/build_portable.py | 白名单打包，独立存储/8768端口/单面霜示意/快速说明 |
| runtime/current-project.json | 当前 6 个对象的完整工作布景，含动态配方与贴图 |

## 当前状态与验证边界

- 应用无 npm 构建步骤，Three.js 等依赖已在 assets 中；Python 3.11+，本地登录 Codex 用于联网新品研究。Node 用于已有 JS 回归检查，不是使用工作台的前提。
- 本轮在云端恢复的源码中重新执行了 16 个 Python、14 个 Node 回归，全部通过。迁移测试原先依赖未打包的 output 文件，现已把去掉贴图的历史几何布景固定为 qa/fixtures/legacy-scene.json，确保另一台电脑也能运行该回归。新品薄片/泵嘴局部圆角过大与金属纹理变灰曾修复；具体最新验证以 qa 输出为准，不能假定所有新品都已通过真实生成。
- 当前布景：致美面霜、致美面霜2、基础瓶型、150ml 致美精华爽肤水、20g 草莓蛋糕睡眠唇膜、50ml 蓝玻尿酸精华液。浏览器已有其他缓存时可手动“打开布景”恢复 runtime/current-project.json。
- 主源码 dev 配置使用8765、历史工作场景；便携包1.0.1使用8768及独立IndexedDB，仅一个面霜示意。不要混为同一份启动状态。
- Mac 便携包有本机启动验证；Windows 有脚本/路径/环境验证，尚无真实 Windows 主机端到端验收。
- 单图+公开资料是近似重建，不是扫描。部分背面、底部、尺寸与材质为推断。已有研究笔记标注来源与不确定项。
- 云端 Sites 当前部署是开发交接页。完整源码保存在同一 Sites 源码仓库 studio-source/，未把 Python/Codex 服务部署为云端运行服务，也没有创建 Codex Cloud 环境。

## 下一轮优化如何开始

先问清用户这轮要改的具体体验，或执行用户给出的新要求。技术审查可优先关注：未登记新品的识别/检索/几何/材质质量、不同净含量版本与外尺寸、生成失败反馈及恢复、Mac/Windows真实验证。它们是后续可优化方向，不表示所有这些点当前都故障。

## 保存开发成果

在同一 Sites 源码 checkout 内修改和检查，保持工作场景数据，更新本交接文档，使用 Sites 官方 source helper 提交/推送源码，再保存/发布该精确版本。云端发布页提供的完整源码 ZIP 也应随源码更新，避免用户拿到旧代码；ZIP 不含凭证、Git 元数据与任务日志。根目录运行 `python3 tools/refresh_development_bundle.py` 可白名单更新交接副本、源码 ZIP 与下载校验清单（此工具位于云端仓库根目录，不在应用主体内）。

这不是自动实时同步：另一台电脑开始前先恢复最新源码，一轮开发结束后明确保存云端版本。不要承诺本地正在运行的进程或这段本地聊天已经跨电脑迁移。
