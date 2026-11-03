#!/bin/bash
# Makes fonts/: IBM Plex Sans Regular and SemiBold as woff2, trimmed
# to Latin, Cyrillic and the page's punctuation, keeping the Bulgarian letter
# forms (the font's locl feature for cyrl/BGR): the phone's own fonts show
# Russian forms (the owner's iPhone, 2 November 2026). From the pdfjet
# repository's copy of the fonts (SIL Open Font License, fonts/license.txt).
set -euo pipefail
cd "$(dirname "$0")"
src="${PLEX:-$HOME/Projects/pdfjet/resources/fonts/IBMPlexSans}"
mkdir -p fonts
cp "$src/license.txt" fonts/license.txt
for face in Regular SemiBold; do
    pyftsubset "$src/IBMPlexSans-$face.ttf" \
        --unicodes="U+0020-007E,U+00A0-00FF,U+0400-045F,U+2010-2027,U+2030-203A,U+20AC,U+2116" \
        --layout-features='*' --flavor=woff2 \
        --output-file="fonts/IBMPlexSans-$face.woff2"
done
ls -l fonts
