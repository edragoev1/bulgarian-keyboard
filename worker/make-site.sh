#!/bin/bash
# The files of keyboard.pdfjet.com in ./site, as ../build-zip.sh puts them
# in the zip for IONOS: index.html with each script named with ?v= and the
# first characters of its SHA-256, the two scripts and the fonts. Not
# .htaccess: the Worker sets its headers. Run before `npx wrangler deploy`.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
cd "$here/.."
rm -rf "$here/site"
mkdir "$here/site"
cp -p layout.js keyboard.js "$here/site/"
cp -pr fonts "$here/site/"
html=$(cat index.html)
for js in layout.js keyboard.js; do
    v=$(sha256sum "$js" | cut -c1-10)
    grep -q "src=\"$js\"" index.html || { echo "index.html has no src=\"$js\"" >&2; exit 1; }
    html=${html//src=\"$js\"/src=\"$js?v=$v\"}
done
printf '%s\n' "$html" > "$here/site/index.html"
touch -r index.html "$here/site/index.html"
