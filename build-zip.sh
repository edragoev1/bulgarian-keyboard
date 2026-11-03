#!/bin/bash
# Builds ~/Projects/keyboard-update.zip, to unzip at the web space root
# (keyboard.pdfjet.com serves /keyboard). The scripts are named in index.html
# with ?v= and the first characters of their SHA-256, so that a browser takes
# a new script at once: Cloudflare sends .js files with a 4-hour cache
# whatever .htaccess says (seen 2 November 2026), while index.html is sent
# with no-cache.
set -euo pipefail
cd "$(dirname "$0")"
out="$HOME/Projects/keyboard-update.zip"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir "$work/keyboard"
cp -p layout.js keyboard.js .htaccess "$work/keyboard/"
html=$(cat index.html)
for js in layout.js keyboard.js; do
    v=$(sha256sum "$js" | cut -c1-10)
    grep -q "src=\"$js\"" index.html || { echo "index.html has no src=\"$js\"" >&2; exit 1; }
    html=${html//src=\"$js\"/src=\"$js?v=$v\"}
done
printf '%s\n' "$html" > "$work/keyboard/index.html"
touch -r index.html "$work/keyboard/index.html"
rm -f "$out"
(cd "$work" && zip -qr "$out" keyboard)
unzip -l "$out"
grep -o 'src="[^"]*"' "$work/keyboard/index.html"
