#!/bin/bash
# The checks: the layout against the owner's picture, then the page in a
# headless Chrome, typed into key by key. Exit 0 when all pass.
cd "$(dirname "$0")" || exit 1
node test.js || exit 1
python3 -m http.server 8765 --bind 127.0.0.1 > /dev/null 2>&1 &
server=$!
trap 'kill $server' EXIT
sleep 1
node test-browser.mjs http://127.0.0.1:8765/ "${TMPDIR:-/tmp}/bulgarian-keyboard.png"
