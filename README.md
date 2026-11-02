# Bulgarian Phonetic Keyboard

Type Bulgarian on a US keyboard: traditional phonetic, with В on V and Ж on W,
in a web page (keyboard.pdfjet.com, not set up yet). The design is the
owner's, of 1 November 2026 (~/Projects/bulgarian-keyboard.png).

- layout.js: the layout, one table; the page types with it and draws its
  picture from it.
- keyboard.js: the page: the text box types Cyrillic as the keys are pressed,
  Esc switches to English and back, the picture's keys type when tapped, the
  text is kept in the browser alone.
- index.html: the page. No network: its policy has connect-src 'none'.
- test.js: `node test.js` checks the layout against the owner's picture.

To try it: `python3 -m http.server` here, then http://127.0.0.1:8000/ (the
policy allows scripts of the page's own address only, not of file://).
