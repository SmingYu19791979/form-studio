#!/bin/zsh
cd -- "${0:A:h}" || exit 1
exec python3 server/studio_server.py --port 8765
