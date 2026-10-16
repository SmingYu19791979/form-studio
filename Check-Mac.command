#!/bin/zsh
cd -- "${0:A:h}" || exit 1
./Start-Mac.command --check
read '?检查结束，按回车关闭。'
