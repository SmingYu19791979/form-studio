# GitHub 开发同步

目标账号：SmingYu19791979。私有仓库：https://github.com/SmingYu19791979/form-studio 。GitHub main 分支与本地提交是源码版本依据；当前工作台自动保存的新布景需再次提交和推送。

仓库根目录就是完整工作台源码，可直接运行 `python3 launch.py`。Mac/Windows 启动说明见 README.md。

包含应用、离线 Three.js 和 PBR 素材、产品研究资料、回归检查，以及当前 runtime/current-project.json 布景。排除生成任务日志、账户配置、凭证和发行 ZIP。

在另一台电脑上继续开发时，先登录同一 GitHub 账号并克隆私有仓库，再读 AGENTS.md、DEVELOPMENT_HANDOFF.md、README.md。编辑已有克隆前先检查本地修改并获取远端最新提交；不要用强制推送覆盖历史。

GitHub 仓库与此前 Sites 私有项目分别同步。GitHub 推送不等于 Sites 部署，Sites 历史状态见 DEVELOPMENT_HANDOFF.md。

克隆：`git clone https://github.com/SmingYu19791979/form-studio.git`

继续编辑后：检查 `git status`，提交需要同步的源码和布景，再运行 `git push`。账户配置、凭证和任务日志始终不纳入版本库。
