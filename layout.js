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

// Shift+X types the small ѝ, the word "and her" (the owner, 2 November 2026);
// Ь has no capital on this keyboard, as words never begin with it.

// The keys that differ from traditional phonetic, marked in the picture
const CHANGED = new Set(["w", "v"]);

// What each US character types: the character itself when the key keeps it
const TYPES = new Map();
for (const row of ROWS) {
    for (const [us, usShift, bg, bgShift] of row) {
        TYPES.set(us, bg);
        TYPES.set(usShift, bgShift);
    }
}

// cyrillic returns the text typed on the US keyboard as this layout types it;
// any character not on it, a space, a line break or a Cyrillic letter, as it
// is.
function cyrillic(text) {
    let out = "";
    for (const ch of text) {
        out += TYPES.has(ch) ? TYPES.get(ch) : ch;
    }
    return out;
}

if (typeof module !== "undefined") {
    module.exports = { ROWS, CHANGED, TYPES, cyrillic };
}
