# Bulgarian Phonetic Keyboard

Type Bulgarian on a US keyboard: traditional phonetic, with В on V and Ж on W,
in a web page (https://keyboard.pdfjet.com/, live since 2 November 2026).

Why this keyboard:

- В is on V. It sounds like the English V, so V is the key anyone who learned
  English first reaches for. The traditional phonetic layout puts В on W; here
  the two are swapped, Ж on W, and every other key is where the traditional
  layout has it.
- You type on your own keyboard, and each key becomes a Cyrillic letter as
  you press it: nothing to install, no system layout to switch, no text to
  convert afterward.
- Editing works as anywhere else: Shift, Caps Lock, Backspace, typing in the
  middle of a word, Ctrl+Z undo.
- The picture above the text box shows where every letter is, and its keys
  type when tapped.
- Copy puts the text on the clipboard, in italic if you like, ready for an
  email or a document.
- The text stays in your browser for the next visit; nothing is ever sent
  anywhere.
- The letters are Bulgarian: IBM Plex Sans draws the Bulgarian forms (д, л,
  ж, the italic в, г, т, ш and others), which many phones' own fonts lack.

- layout.js: the layout, one table; the page types with it and draws its
  picture from it.
- keyboard.js: the page: the text box types Cyrillic as the keys are pressed,
  the picture's keys type when tapped, the
  text is kept in the browser alone.
- index.html: the page. No network: its policy has connect-src 'none'.
- test.js: `node test.js` checks the layout, key by key.
- test-browser.mjs: the page in a headless Chrome, typed into key by key.
- check.sh: both; exit 0 when all pass.
- make-fonts.sh: fonts/, IBM Plex Sans Regular, Italic and SemiBold trimmed
  to Latin and Cyrillic, about 30 KB each (SIL Open Font License,
  fonts/license.txt).
- build-zip.sh: ~/Projects/keyboard-update.zip, to unzip at the web space
  root (the site's folder is /keyboard); the scripts named with ?v= and
  their hash, as Cloudflare keeps .js files 4 hours in a browser.

To try it: `python3 -m http.server` here, then http://127.0.0.1:8000/ (the
policy allows scripts of the page's own address only, not of file://).
