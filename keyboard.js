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
let capsKey = null;
let capsLock = false;

// The keys of the picture that are not characters: Shift for the next key,
// Caps Lock until tapped again, and the three that edit
function modifier(x, y, w, name) {
    const g = el("g", { class: "k mod", role: "button" }, keyboard);
    el("rect", { x, y, width: w * U - GAP, height: U - GAP, rx: 7 }, g);
    label(g, x + (w * U - GAP) / 2, y + U / 2 + 4, "label", name, "middle");
    g.setAttribute("aria-label", name);
    if (name === "Shift") {
        shiftKeys.push(g);
        g.setAttribute("aria-label", "Shift for the next key");
    }
    if (name === "Caps Lock") {
        capsKey = g;
    }
    g.addEventListener("pointerdown", (e) => {
        // The text box keeps the caret
        e.preventDefault();
        switch (name) {
            case "Shift":
                shiftOnce = !shiftOnce;
                shiftKeys.forEach((s) => s.classList.toggle("on", shiftOnce));
                break;
            case "Caps Lock":
                capsLock = !capsLock;
                capsKey.classList.toggle("on", capsLock);
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
        g.addEventListener("pointerdown", (e) => {
            // The text box keeps the caret
            e.preventDefault();
            // Caps Lock makes a letter a capital, and Shift with it a small
            // one again, as on a keyboard; the other keys only Shift changes
            // The real Shift and Caps Lock held while clicking count as the
            // picture's own do (the owner: Shift held and the key of ѝ gave ь)
            const shift = shiftOnce || e.shiftKey;
            const caps = capsLock || e.getModifierState("CapsLock");
            const upper = letter && caps ? !shift : shift;
            insert(upper ? bgShift : bg);
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
const BOTTOM = [["Ctrl", 1.5], ["Super", 1.25], ["Alt", 1.25], [" ", 6], ["Alt", 1.25], ["Super", 1.25], ["Menu", 1.25], ["Ctrl", 1.25]];
let bottomX = 6;
const bottomY = 4 * U + 6;
for (const [name, w] of BOTTOM) {
    if (name === " ") {
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
