# Bulgarian Phonetic Keyboard

Type Bulgarian on a US keyboard: traditional phonetic, with В on V and Ж on W,
in a web page (https://keyboard.pdfjet.com/, live since 2 November 2026).

Why this keyboard:

- В is on V. It sounds like the English V, so V is the key anyone who learned
  English first reaches for. The traditional phonetic layout puts В on W; here
  the two are swapped, Ж on W, and every other key is where the traditional
  layout has it.
- With AltGr (the right Alt, or Ctrl+Alt as on Windows, or the picture's
  AltGr tapped): the Bulgarian quotes „ and “ on comma and period, the dash
  – on minus, and € on 5 and E, shown at the keys' bottom left. Shift with
  comma, period and minus types < > _, as Microsoft's layout has them.
- You type on your own keyboard, and each key becomes a Cyrillic letter as
  you press it: nothing to install, no system layout to switch, no text to
  convert afterward.
- Editing works as anywhere else: Shift, Caps Lock, Backspace, typing in the
  middle of a word, Ctrl+Z undo.
- The picture above the text box shows where every letter is, and its keys
  type when tapped.
- Copy puts the text on the clipboard as plain text, ready for an
  email or a document.
- The text stays in your browser for the next visit; nothing is ever sent
  anywhere.
- The letters are drawn in IBM Plex Sans, in the standard Cyrillic forms, as
  PDFjet Write and its PDFs draw them; the text is marked Bulgarian, so that
  screen readers read it in Bulgarian.

- layout.js: the layout, one table; the page types with it and draws its
  picture from it.
- keyboard.js: the page: the text box types Cyrillic as the keys are pressed,
  the picture's keys type when tapped, the
  text is kept in the browser alone.
- Phones: the page is made for computers; a phone (touch only, no hover)
  gets a short note in place of the keyboard, pointing to the phone's own
  Bulgarian keyboard. A tablet with a trackpad or mouse keeps the page. An
  on-screen alphabet keyboard for phones was tried and set aside: branch
  phone-alphabet.
- index.html: the page. No network: its policy has connect-src 'none'.
- test.js: `node test.js` checks the layout, key by key.
- test-browser.mjs: the page in a headless Chrome, typed into key by key.
- check.sh: both; exit 0 when all pass.
- make-fonts.sh: fonts/, IBM Plex Sans Regular and SemiBold trimmed
  to Latin and Cyrillic, about 30 KB each (SIL Open Font License,
  fonts/license.txt).
- build-zip.sh: ~/Projects/keyboard-update.zip, to unzip at the web space
  root (the site's folder is /keyboard); the scripts named with ?v= and
  their hash, as Cloudflare keeps .js files 4 hours in a browser.

To try it: `python3 -m http.server` here, then http://127.0.0.1:8000/ (the
policy allows scripts of the page's own address only, not of file://).
