#!/bin/zsh
cd -- "${0:A:h}" || exit 1
export PYTHONUTF8=1
for studio_python in /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
  if command -v "$studio_python" >/dev/null 2>&1 && "$studio_python" -c 'import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)' 2>/dev/null; then
    "$studio_python" launch.py "$@"
    studio_result=$?
    if (( studio_result != 0 )); then read '?启动未完成，请查看上方提示。按回车关闭。'; fi
    exit $studio_result
  fi
done
print '请先安装 Python 3.11 或更新版本：https://www.python.org/downloads/'
read '?安装后重新双击此文件。按回车关闭。'
exit 1
