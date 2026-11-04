// The Bulgarian Phonetic Keyboard: traditional phonetic on a US keyboard,
// with one change, В on V and Ж on W (the owner, 1 November 2026). This table
// is the layout: the page types with it and draws its picture from it, so the
// two never disagree.
//
// Each key: the US character without and with Shift, and what it types
// without and with Shift. A key whose Bulgarian is the US character is
// written all the same, so that the picture has every key.
"use strict";

const ROWS = [
    [
        ["`", "~", "ч", "Ч"],
        ["1", "!", "1", "!"], ["2", "@", "2", "@"], ["3", "#", "3", "№"],
        ["4", "$", "4", "$"], ["5", "%", "5", "%"], ["6", "^", "6", "€"],
        ["7", "&", "7", "§"], ["8", "*", "8", "*"], ["9", "(", "9", "("],
        ["0", ")", "0", ")"], ["-", "_", "-", "–"], ["=", "+", "=", "+"],
    ],
    [
        ["q", "Q", "я", "Я"], ["w", "W", "ж", "Ж"], ["e", "E", "е", "Е"],
        ["r", "R", "р", "Р"], ["t", "T", "т", "Т"], ["y", "Y", "ъ", "Ъ"],
        ["u", "U", "у", "У"], ["i", "I", "и", "И"], ["o", "O", "о", "О"],
        ["p", "P", "п", "П"], ["[", "{", "ш", "Ш"], ["]", "}", "щ", "Щ"],
        ["\\", "|", "ю", "Ю"],
    ],
    [
        ["a", "A", "а", "А"], ["s", "S", "с", "С"], ["d", "D", "д", "Д"],
        ["f", "F", "ф", "Ф"], ["g", "G", "г", "Г"], ["h", "H", "х", "Х"],
        ["j", "J", "й", "Й"], ["k", "K", "к", "К"], ["l", "L", "л", "Л"],
        [";", ":", ";", ":"], ["'", "\"", "'", "\""],
    ],
    [
        ["z", "Z", "з", "З"], ["x", "X", "ь", "ѝ"], ["c", "C", "ц", "Ц"],
        ["v", "V", "в", "В"], ["b", "B", "б", "Б"], ["n", "N", "н", "Н"],
        ["m", "M", "м", "М"], [",", "<", ",", "„"], [".", ">", ".", "“"],
        ["/", "?", "/", "?"],
    ],
];

// Shift+X types the small ѝ, the word "and her" (the owner, 2 November 2026).
// With Caps Lock, X types Ь and Shift+X Ѝ, for text in capitals, as ШОФЬОР
// (the owner, 3 November 2026: Caps Lock did not work for these).

// What each US character types: the character itself when the key keeps it
const TYPES = new Map();
for (const row of ROWS) {
    for (const [us, usShift, bg, bgShift] of row) {
        TYPES.set(us, bg);
        TYPES.set(usShift, bgShift);
    }
}

// What Caps Lock changes, on the keys where the US character alone does not
// say it. The browser sends a US letter with Caps Lock applied, "X" for the
// key alone and "x" with Shift, and a punctuation key as it is. So:
// - the keys of ш щ ю ч, on punctuation, type the capital with Caps Lock and
//   the small one with Shift as well, as the other letters do;
// - the X of ь and ѝ, two letters and not a small one and its capital, types
//   the capital of each: Ь alone, Ѝ with Shift.
const CAPS = new Map();
for (const row of ROWS) {
    for (const [us, usShift, bg, bgShift] of row) {
        if (!/\p{L}/u.test(bg)) {
            continue;
        }
        const pair = bg.toUpperCase() === bgShift;
        const usLetter = /[a-z]/.test(us);
        if (pair && !usLetter) {
            CAPS.set(us, bgShift);
            CAPS.set(usShift, bg);
        } else if (!pair && usLetter) {
            CAPS.set(usShift, bg.toUpperCase());
            CAPS.set(us, bgShift.toUpperCase());
        } else if (!pair) {
            CAPS.set(us, bg.toUpperCase());
            CAPS.set(usShift, bgShift.toUpperCase());
        }
    }
}

// cyrillic returns the text typed on the US keyboard as this layout types it,
// with Caps Lock on or off; any character not on it, a space, a line break or
// a Cyrillic letter, as it is.
function cyrillic(text, capsLock = false) {
    let out = "";
    for (const ch of text) {
        if (capsLock && CAPS.has(ch)) {
            out += CAPS.get(ch);
        } else {
            out += TYPES.has(ch) ? TYPES.get(ch) : ch;
        }
    }
    return out;
}

if (typeof module !== "undefined") {
    module.exports = { ROWS, TYPES, cyrillic };
}
