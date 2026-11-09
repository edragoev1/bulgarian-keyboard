// The page: the text box types with the layout (layout.js), as the keys are
// pressed, so the text is edited in Cyrillic; the buttons Bulgarian and
// English switch; the picture is drawn from the same table, and its keys
// type when tapped, for a phone. The text is kept in this browser alone.
"use strict";

const text = document.getElementById("text");
const bulgarianButton = document.getElementById("bulgarian");
const englishButton = document.getElementById("english");
const STORE = "bulgarian-keyboard-text";
let bulgarian = true;
let shiftOnce = false;
// The picture's AltGr, for the next key tapped
let altOnce = false;
// The right Alt held, which is AltGr where the system does not say so
let rightAlt = false;

// The text of the last visit
try {
    text.value = localStorage.getItem(STORE) || "";
} catch {
    // Storage refused: the page works without it
}
text.addEventListener("input", () => {
    try {
        localStorage.setItem(STORE, text.value);
    } catch {
        // As above
    }
});

// insert puts the text at the caret, as typing does, so that undo takes it
// back
function insert(s) {
    text.focus();
    if (!document.execCommand("insertText", false, s)) {
        text.setRangeText(s, text.selectionStart, text.selectionEnd, "end");
        text.dispatchEvent(new Event("input"));
    }
}

// A character typed: what the layout makes of it. A Cyrillic character, as
// insert's own, is not on the US keyboard, and goes through as it is.
text.addEventListener("beforeinput", (e) => {
    if (!bulgarian || e.inputType !== "insertText" || !e.data) {
        return;
    }
    const typed = cyrillic(e.data);
    if (typed !== e.data) {
        e.preventDefault();
        insert(typed);
    }
});

// AltGr with a key: the quotes, the dash and the euro (ALTGR), in Bulgarian.
// The key is known by its place (e.code), as AltGr changes what it types.
const KEY_OF_CODE = { Comma: ",", Period: ".", Minus: "-", Digit5: "5", KeyE: "e" };
document.addEventListener("keydown", (e) => {
    if (e.code === "AltRight") {
        rightAlt = true;
        return;
    }
    const altGr = (e.getModifierState && e.getModifierState("AltGraph")) || (e.ctrlKey && e.altKey) || rightAlt;
    if (!bulgarian || !altGr || document.activeElement !== text) {
        return;
    }
    const made = ALTGR.get(KEY_OF_CODE[e.code]);
    if (made) {
        e.preventDefault();
        insert(made);
    }
});
document.addEventListener("keyup", (e) => {
    if (e.code === "AltRight") {
        rightAlt = false;
    }
});
window.addEventListener("blur", () => {
    rightAlt = false;
});

// Bulgarian or English: two buttons, the one in use pressed (the owner: no
// switching with Esc, 2 November 2026)
function setMode(on) {
    bulgarian = on;
    bulgarianButton.setAttribute("aria-pressed", String(on));
    englishButton.setAttribute("aria-pressed", String(!on));
    text.focus();
}
bulgarianButton.addEventListener("click", () => setMode(true));
englishButton.addEventListener("click", () => setMode(false));

// Italic was removed (the owner, 2 November 2026): what it copied depended on
// where it was pasted. Its old setting is cleared.
try {
    localStorage.removeItem("bulgarian-keyboard-italic");
} catch {
    // Storage refused
}

// Hide keyboard: the picture out of the way, for those who type without
// looking (the owner, 2 November 2026); kept for the next visit
const hide = document.getElementById("hide");
const HIDE = "bulgarian-keyboard-hide";
try {
    hide.checked = localStorage.getItem(HIDE) === "1";
} catch {
    // Storage refused
}
// The text box then takes the picture's place, so the buttons do not move
// (the owner, 2 November 2026)
function showKeyboard() {
    document.getElementById("keyboard").toggleAttribute("hidden", hide.checked);
    document.body.classList.toggle("bare", hide.checked);
}
showKeyboard();
hide.addEventListener("change", () => {
    showKeyboard();
    try {
        localStorage.setItem(HIDE, hide.checked ? "1" : "0");
    } catch {
        // As above
    }
    text.focus();
});

document.getElementById("copy").addEventListener("click", async (e) => {
    const button = e.currentTarget;
    try {
        await navigator.clipboard.writeText(text.value);
        button.textContent = "Copied";
    } catch {
        text.select();
        button.textContent = "Press Ctrl+C";
    }
    setTimeout(() => {
        button.textContent = "Copy";
    }, 1500);
});
document.getElementById("clear").addEventListener("click", () => {
    text.focus();
    text.select();
    insert("");
});

// The picture, from the table: a unit is one key; each row begins after the
// key on its left, as on a real keyboard
const SVG = "http://www.w3.org/2000/svg";
const keyboard = document.getElementById("keyboard");
const U = 64;
const GAP = 4;
const LEFT = [0, 1.5, 1.75, 2.25];
const RIGHT = [["Backspace", 2], null, ["Enter", 2.25], ["Shift", 2.75]];
const LEFT_NAMES = [null, "Tab", "Caps Lock", "Shift"];

function el(name, attributes, parent) {
    const node = document.createElementNS(SVG, name);
    for (const [k, v] of Object.entries(attributes)) {
        node.setAttribute(k, v);
    }
    parent.appendChild(node);
    return node;
}

function label(g, x, y, cls, s, anchor = "start") {
    el("text", { x, y, class: cls, "text-anchor": anchor }, g).textContent = s;
}

const shiftKeys = [];
const altKeys = [];

// The keys of the picture that are not characters: Shift for the next key,
// and the three that edit. Caps Lock is shown, and plainly disabled, as the
// bottom row's: browsers do not all say when the real one is on, so it could
// not work everywhere (the owner, 3 November 2026: "gray out the caps lock
// and focus on the other keys to work 100%"); Shift types the capitals.
function modifier(x, y, w, name) {
    if (name === "Caps Lock") {
        const off = el("g", { class: "k off", role: "button", "aria-label": name, "aria-disabled": "true" }, keyboard);
        el("rect", { x, y, width: w * U - GAP, height: U - GAP, rx: 7 }, off);
        label(off, x + (w * U - GAP) / 2, y + U / 2 + 4, "label", name, "middle");
        // The text box keeps the caret, and nothing happens
        off.addEventListener("pointerdown", (e) => e.preventDefault());
        return;
    }
    const g = el("g", { class: "k mod", role: "button" }, keyboard);
    el("rect", { x, y, width: w * U - GAP, height: U - GAP, rx: 7 }, g);
    label(g, x + (w * U - GAP) / 2, y + U / 2 + 4, "label", name, "middle");
    g.setAttribute("aria-label", name);
    if (name === "Shift") {
        shiftKeys.push(g);
        g.setAttribute("aria-label", "Shift for the next key");
    }
    g.addEventListener("pointerdown", (e) => {
        // The text box keeps the caret
        e.preventDefault();
        switch (name) {
            case "Shift":
                shiftOnce = !shiftOnce;
                shiftKeys.forEach((s) => s.classList.toggle("on", shiftOnce));
                break;
            case "Enter":
                insert("\n");
                break;
            case "Tab":
                insert("\t");
                break;
            case "Backspace":
                text.focus();
                if (!document.execCommand("delete")) {
                    const start = text.selectionStart;
                    const end = text.selectionEnd;
                    if (start !== end || start > 0) {
                        text.setRangeText("", start === end ? start - 1 : start, end, "end");
                        text.dispatchEvent(new Event("input"));
                    }
                }
                break;
        }
    });
}

ROWS.forEach((row, r) => {
    const y = r * U + 6;
    let x = 6;
    if (LEFT_NAMES[r]) {
        modifier(x, y, LEFT[r], LEFT_NAMES[r]);
    }
    x += LEFT[r] * U;
    for (const [us, usShift, bg, bgShift] of row) {
        const letter = bg.toUpperCase() === bgShift && bg !== bgShift;
        const g = el("g", { class: "k", role: "button" }, keyboard);
        g.setAttribute("aria-label", letter ? bg : bg + ", with Shift " + bgShift);
        // The key of \\ is wider, as on a keyboard, and ends its row
        const w = us === "\\" ? 1.5 * U : U;
        el("rect", { x, y, width: w - GAP, height: U - GAP, rx: 7 }, g);
        // The US key as printed on it: a letter as a capital
        label(g, x + 6, y + 16, "us", /[a-z]/.test(us) ? us.toUpperCase() : us);
        if (letter) {
            label(g, x + (w - GAP) / 2, y + 47, "bg", bgShift, "middle");
        } else if (/\p{L}/u.test(bgShift)) {
            // Two letters, as ь and ѝ on X: both in the letters' font and size
            label(g, x + (w - GAP) / 2 + 8, y + 31, "bg", bgShift, "middle");
            label(g, x + (w - GAP) / 2 + 8, y + 53, "bg", bg, "middle");
        } else {
            label(g, x + (w - GAP) / 2 + 8, y + 26, "sh", bgShift, "middle");
            label(g, x + (w - GAP) / 2 + 8, y + 50, "bg", bg, "middle");
        }
        // AltGr's character small at the bottom left, under the US key's,
        // where the key has room beside its own characters
        const alt = ALTGR.get(us);
        if (alt) {
            g.setAttribute("aria-label", g.getAttribute("aria-label") + ", with AltGr " + alt);
            label(g, x + 6, y + U - GAP - 7, "ag", alt);
        }
        g.addEventListener("pointerdown", (e) => {
            // The text box keeps the caret
            e.preventDefault();
            if (altOnce) {
                // The picture's AltGr: the key's AltGr character, or the
                // key's own where it has none
                insert(alt || bg);
                altOnce = false;
                altKeys.forEach((a) => a.classList.remove("on"));
                return;
            }
            // Shift types the capital or the second character; the real
            // Shift held while clicking counts as the picture's own does (the
            // owner: Shift held and the key of ѝ gave ь)
            const shift = shiftOnce || e.shiftKey;
            insert(shift ? bgShift : bg);
            if (shiftOnce) {
                shiftOnce = false;
                shiftKeys.forEach((s) => s.classList.remove("on"));
            }
        });
        x += w;
    }
    if (RIGHT[r]) {
        modifier(x, y, RIGHT[r][1], RIGHT[r][0]);
    }
});
// The bottom row: the space bar, and the keys a page cannot use, shown so that
// the picture is a whole keyboard, and plainly disabled (the owner, 2 November
// 2026)
// The right Alt is AltGr, tapped for the next key, as Shift is
const BOTTOM = [["Ctrl", 1.5], ["Super", 1.25], ["Alt", 1.25], [" ", 6], ["AltGr", 1.25], ["Super", 1.25], ["Menu", 1.25], ["Ctrl", 1.25]];
let bottomX = 6;
const bottomY = 4 * U + 6;
for (const [name, w] of BOTTOM) {
    if (name === "AltGr") {
        const g = el("g", { class: "k mod", role: "button", "aria-label": "AltGr for the next key" }, keyboard);
        el("rect", { x: bottomX, y: bottomY, width: w * U - GAP, height: U - GAP, rx: 7 }, g);
        label(g, bottomX + (w * U - GAP) / 2, bottomY + U / 2 + 4, "label", name, "middle");
        altKeys.push(g);
        g.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            altOnce = !altOnce;
            altKeys.forEach((a) => a.classList.toggle("on", altOnce));
        });
    } else if (name === " ") {
        const space = el("g", { class: "k", role: "button", "aria-label": "Space" }, keyboard);
        el("rect", { x: bottomX, y: bottomY, width: w * U - GAP, height: U - GAP, rx: 7 }, space);
        space.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            insert(" ");
        });
    } else {
        const g = el("g", { class: "k off", role: "button", "aria-label": name, "aria-disabled": "true" }, keyboard);
        el("rect", { x: bottomX, y: bottomY, width: w * U - GAP, height: U - GAP, rx: 7 }, g);
        label(g, bottomX + (w * U - GAP) / 2, bottomY + U / 2 + 4, "label", name, "middle");
        // The text box keeps the caret, and nothing happens
        g.addEventListener("pointerdown", (e) => e.preventDefault());
    }
    bottomX += w * U;
}

// Ready to type at once, after the text of the last visit (the owner, 2
// November 2026); not on a touch screen, where the focus would open the
// phone's own keyboard over the picture
if (!window.matchMedia("(pointer: coarse)").matches) {
    text.focus();
    text.setSelectionRange(text.value.length, text.value.length);
}
