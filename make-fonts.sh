#!/bin/bash
# Makes fonts/: IBM Plex Sans Regular and SemiBold as woff2, trimmed
# to Latin, Cyrillic and the page's punctuation, in the standard Cyrillic
# forms: the font's Bulgarian letter forms (its locl feature for cyrl/BGR)
# left out, so that the text is marked Bulgarian (lang="bg", for screen
# readers) and drawn as PDFjet Write and the PDFs draw it (the owner, 9
# November 2026). From the pdfjet repository's copy of the fonts (SIL Open
# Font License, fonts/license.txt).
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
    # The Bulgarian language entry taken out of the font's tables, and with
    # it the Bulgarian letter forms: text marked Bulgarian is drawn as all
    # Cyrillic is, in the standard forms (pyftsubset keeps locl whatever
    # --layout-features- says, with '*')
    python3 - "fonts/IBMPlexSans-$face.woff2" <<'PY'
import sys
from fontTools.ttLib import TTFont
path = sys.argv[1]
font = TTFont(path)
for table in ("GSUB", "GPOS"):
    if table in font:
        for script in font[table].table.ScriptList.ScriptRecord:
            records = script.Script.LangSysRecord
            script.Script.LangSysRecord = [r for r in records if r.LangSysTag.strip() != "BGR"]
            script.Script.LangSysCount = len(script.Script.LangSysRecord)
font.save(path)
PY
done
ls -l fonts
