// node test.js: the layout, checked against the owner's picture
// (~/Projects/bulgarian-keyboard.png, 1 November 2026).
"use strict";
const assert = require("node:assert/strict");
const { ROWS, TYPES, cyrillic } = require("./layout.js");

// Every key of the picture, as typed without and with Shift
const want = {
    "`": "ч", "~": "Ч", "#": "№", "^": "€", "&": "§", "_": "–",
    q: "я", w: "ж", e: "е", r: "р", t: "т", y: "ъ", u: "у", i: "и", o: "о", p: "п",
    "[": "ш", "]": "щ", "\\": "ю", "{": "Ш", "}": "Щ", "|": "Ю",
    a: "а", s: "с", d: "д", f: "ф", g: "г", h: "х", j: "й", k: "к", l: "л",
    z: "з", x: "ь", X: "ѝ", c: "ц", v: "в", b: "б", n: "н", m: "м",
    "<": "„", ">": "“", W: "Ж", V: "В",
};
for (const [us, bg] of Object.entries(want)) {
    assert.equal(cyrillic(us), bg, us);
}

// The 30 letters of the Bulgarian alphabet, each on a key, small and capital
// (Ь has no capital on the keyboard: Shift+X is the small ѝ)
const alphabet = "абвгдежзийклмнопрстуфхцчшщъьюя";
const typed = new Set(TYPES.values());
for (const letter of alphabet) {
    assert.ok(typed.has(letter), letter);
    if (letter !== "ь") {
        assert.ok(typed.has(letter.toUpperCase()), letter.toUpperCase());
    }
}

// No US character is on two keys, and no two keys type the same
const us = ROWS.flat().flatMap((k) => [k[0], k[1]]);
assert.equal(new Set(us).size, us.length);
const bg = ROWS.flat().flatMap((k) => [k[2], k[3]]);
assert.equal(new Set(bg).size, bg.length);

// Words, and text that is not on the keyboard left alone
assert.equal(cyrillic("Vasil"), "Васил");
assert.equal(cyrillic("[opska salata"), "шопска салата");
assert.equal(cyrillic("`ervena ]uka"), "червена щука");
assert.equal(cyrillic("\\nak, wena"), "юнак, жена");
assert.equal(cyrillic("<Zdravej!>"), "„Здравей!“");
assert.equal(cyrillic("Tova e тест 123."), "Това е тест 123.");
console.log("All checks pass.");
