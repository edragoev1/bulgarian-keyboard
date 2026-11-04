// Types into the page in a headless Chrome, key by key, and checks the text.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const url = process.argv[2];
const shot = process.argv[3];
const PORT = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kb-"));
const chrome = spawn("google-chrome", ["--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`, "--window-size=1100,900", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list;
for (let i = 0; i < 50; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(200); }
}
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") errors.push(msg.params.entry.text);
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;

await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
await send("Page.navigate", { url });
await sleep(1500);
// Loaded with a text kept from the last visit: the text box has the focus,
// the caret after the text (the owner, 2 November 2026)
await evaluate("localStorage.setItem('bulgarian-keyboard-text', 'Здравей'); true");
await send("Page.reload");
await sleep(1500);
const focusOnLoad = await evaluate("(() => { const t=document.getElementById('text'); return [document.activeElement===t, t.selectionStart, t.selectionEnd].join(); })()");
await evaluate("localStorage.clear(); document.getElementById('text').value=''; document.getElementById('text').focus(); true");

// A key as the US keyboard sends it: its character, with Shift for capitals and symbols
async function key(ch) {
    const shifted = /[A-Z~!@#$%^&*()_+{}|:"<>?]/.test(ch);
    await send("Input.dispatchKeyEvent", { type: "keyDown", text: ch, unmodifiedText: ch, key: ch, modifiers: shifted ? 8 : 0 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: ch, modifiers: shifted ? 8 : 0 });
}
async function typeText(s) { for (const ch of s) await key(ch); }
const value = () => evaluate("document.getElementById('text').value");
let fail = 0;
const check = (got, want, what) => { if (got !== want) { fail++; console.log(`FAIL ${what}: ${JSON.stringify(got)} want ${JSON.stringify(want)}`); } else console.log(`PASS ${what}`); };

check(focusOnLoad, "true,7,7", "the focus in the text box on load, the caret at the end");

await typeText("Vasil `ete [opska");
check(await value(), "Васил чете шопска", "typing in Bulgarian");
await typeText(" <Zdravej!>");
check(await value(), "Васил чете шопска „Здравей!“", "Shift symbols");
// Esc no longer switches (the owner); the buttons do
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await typeText(" ");
await evaluate("document.getElementById('english').click(); true");
await typeText("PDFjet");
await evaluate("document.getElementById('bulgarian').click(); true");
await typeText(" wena");
check(await value(), "Васил чете шопска „Здравей!“ PDFjet жена", "English and Bulgarian buttons; Esc does nothing");
// Edit in the middle: caret after "Васил", type a letter
await evaluate("const t=document.getElementById('text'); t.setSelectionRange(5,5); true");
await typeText("a");
check(await value(), "Василa чете шопска „Здравей!“ PDFjet жена".replace("Василa", "Васила"), "typing in the middle");
// Undo takes the last letter back
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "z", code: "KeyZ", modifiers: 2, windowsVirtualKeyCode: 90, commands: ["undo"] });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "z", code: "KeyZ", modifiers: 2, windowsVirtualKeyCode: 90 });
check(await value(), "Васил чете шопска „Здравей!“ PDFjet жена", "undo");
// Tapping the picture: Shift, then the key of X, then the key of [
await evaluate(`(() => { const t=document.getElementById('text'); t.value=''; t.focus();
  const keys=[...document.querySelectorAll('#keyboard g.k')];
  const tap=(g)=>g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
  tap(keys.find(g=>g.textContent==='Shift'));
  tap(keys.find(g=>g.getAttribute('aria-label')==='ь, with Shift ѝ'));
  tap(keys.find(g=>g.getAttribute('aria-label')==='ш'));
  return true; })()`);
check(await value(), "ѝш", "tapping the keys, Shift once");
// Kept for the next visit
check(await evaluate("localStorage.getItem('bulgarian-keyboard-text')"), "ѝш", "kept in the browser");
// The keys of the picture that are not characters
await evaluate(`(() => { const t=document.getElementById('text'); t.value=''; t.focus();
  const keys=[...document.querySelectorAll('#keyboard g.k')];
  const by=(name)=>keys.find(g=>g.getAttribute('aria-label')===name);
  const tap=(g)=>g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
  tap(by('Caps Lock')); tap(by('а')); tap(by('б'));
  tap(by('Shift for the next key')); tap(by('в')); tap(by('г'));
  tap(by('1, with Shift !'));
  tap(by('Enter')); tap(by('д')); tap(by('е'));
  tap(by('Backspace'));
  tap(by('Tab'));
  return true; })()`);
check(await value(), "абВг1\nд\t", "Caps Lock disabled; Shift, Enter, Backspace, Tab tapped");
check(await evaluate("[...document.querySelectorAll('#keyboard g.k.off')].some(g => g.getAttribute('aria-label') === 'Caps Lock')"), true, "Caps Lock shown disabled");
// The real Caps Lock: the browser sends the capital, which types the Cyrillic capital
await evaluate("(() => { const t=document.getElementById('text'); t.value=''; t.focus(); return true; })()");
await send("Input.dispatchKeyEvent", { type: "keyDown", text: "Q", unmodifiedText: "Q", key: "Q", modifiers: 0 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Q" });
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r", unmodifiedText: "\r" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await typeText("w");
check(await value(), "Я\nж", "the real Caps Lock and Enter");
await evaluate("document.getElementById('text').value='Васил чете шопска салата. „Здравей!“'; true");
const shotData = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(shot, Buffer.from(shotData.result.data, "base64"));
check(await evaluate("[...document.querySelectorAll('.bar button')].map(b => b.getBoundingClientRect().width).join(',')"), "112,112,112,112", "the four buttons one width");
check(await evaluate("document.getElementById('bulgarian').getAttribute('aria-pressed') + document.getElementById('english').getAttribute('aria-pressed')"), "truefalse", "Bulgarian pressed, English not");
// A key of the picture clicked with the real Shift held
await evaluate(`(() => { const t=document.getElementById('text'); t.value=''; t.focus();
  const keys=[...document.querySelectorAll('#keyboard g.k')];
  const by=(name)=>keys.find(g=>g.getAttribute('aria-label')===name);
  const tap=(g, shift)=>g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,shiftKey:shift}));
  tap(by('ь, with Shift ѝ'), true); tap(by('ь, with Shift ѝ'), false); tap(by('а'), true); tap(by('3, with Shift №'), true);
  return true; })()`);
check(await value(), "ѝьА№", "clicking with the real Shift held");
// The disabled keys of the bottom row type nothing
await evaluate(`(() => { const t=document.getElementById('text'); t.value='x'; t.focus();
  for (const g of document.querySelectorAll('#keyboard g.k.off')) g.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
  return true; })()`);
check(await value(), "x", "the disabled keys type nothing");
check(await evaluate("document.querySelectorAll('#keyboard g.k[aria-disabled=true]').length"), 8, "eight disabled keys: the bottom row's seven and Caps Lock");
// Copy: plain text alone
await send("Browser.grantPermissions", { origin: new URL(url).origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
await evaluate("document.getElementById('text').value='Пиши <ми>\\nдве'; document.getElementById('copy').click(); true");
await sleep(500);
check(await evaluate(`(async () => { const item=(await navigator.clipboard.read())[0]; return item.types.join(',') + '|' + await (await item.getType('text/plain')).text(); })()`), "text/plain|Пиши <ми>\nдве", "Copy: plain text alone");
check(await evaluate("[document.getElementById('italic'), localStorage.getItem('bulgarian-keyboard-italic')].join()"), ",", "no Italic, its old setting cleared");
// Five rows fit without a scroll bar; a sixth needs one
check(await evaluate("(() => { const t=document.getElementById('text'); t.value='1\\n2\\n3\\n4\\n5'; const five = t.scrollHeight <= t.clientHeight; t.value += '\\n6'; return five + ',' + (t.scrollHeight > t.clientHeight); })()"), "true,true", "five rows fit, six do not");
// Hide keyboard at the left edge of the text box, the buttons ending at its right edge
check(await evaluate("(() => { const t=document.getElementById('text').getBoundingClientRect(); const c=document.getElementById('hide').getBoundingClientRect(); const b=document.getElementById('copy').getBoundingClientRect(); return Math.round(c.left - t.left) + ',' + Math.round(t.right - b.right); })()"), "0,0", "Hide keyboard left, buttons right, edges aligned");
check(await evaluate("[...document.querySelectorAll('.bar button')].map(b => b.id).join(',')"), "bulgarian,english,clear,copy", "the order of the buttons");
// Hide keyboard: the picture gone, the text box in its place, the buttons
// not moved; kept; and back
const barAt = "Math.round(document.querySelector('.bar').getBoundingClientRect().top * 10) / 10";
check(await evaluate(`(() => { const k=document.getElementById('keyboard'); const t=document.getElementById('text'); const top=t.getBoundingClientRect().top; const bar=${barAt};
  document.getElementById('hide').click(); const gone=k.getBoundingClientRect().height===0 && t.getBoundingClientRect().top < top - 200;
  const same=${barAt}===bar; const kept=localStorage.getItem('bulgarian-keyboard-hide'); const focused=document.activeElement===t;
  document.getElementById('hide').click(); return [gone, same, kept, focused, k.getBoundingClientRect().height > 200, t.getBoundingClientRect().top===top, ${barAt}===bar, localStorage.getItem('bulgarian-keyboard-hide')].join(); })()`),
  "true,true,1,true,true,true,true,0", "Hide keyboard: hidden, the buttons not moved, kept, focus; shown again");
// The same in a narrow window, where the picture is smaller
await send("Emulation.setDeviceMetricsOverride", { width: 640, height: 700, deviceScaleFactor: 1, mobile: false });
await sleep(200);
check(await evaluate(`(() => { const bar=${barAt}; document.getElementById('hide').click(); const after=${barAt}; document.getElementById('hide').click(); return [bar===after, ${barAt}===bar].join(); })()`), "true,true", "the buttons not moved in a narrow window");
await send("Emulation.clearDeviceMetricsOverride");
await sleep(200);
// Kept for the next visit: hidden after a reload
await evaluate("localStorage.setItem('bulgarian-keyboard-hide', '1'); true");
await send("Page.reload");
await sleep(1500);
check(await evaluate("[document.getElementById('hide').checked, document.getElementById('keyboard').getBoundingClientRect().height].join()"), "true,0", "Hide keyboard kept after a reload");
const hiddenShot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(shot.replace(/\.png$/, "-hidden.png"), Buffer.from(hiddenShot.result.data, "base64"));
await evaluate("localStorage.removeItem('bulgarian-keyboard-hide'); true");
// A phone: the note in place of the keyboard, the text box and the buttons;
// no sideways scrolling; at 375 and 320 pixels
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" });
for (const width of [375, 320]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 740, deviceScaleFactor: 2, mobile: true });
    await send("Page.reload");
    await sleep(1500);
    check(await evaluate(`(() => { const h=(sel)=>Math.round(document.querySelector(sel).getBoundingClientRect().height);
      return [h('.phone-note')>40, h('#keyboard'), h('#text'), h('.bar'), h('.lead'), h('footer')>0, document.documentElement.scrollWidth<=innerWidth].join(); })()`),
      "true,0,0,0,0,true,true", `a phone, ${width} px: the note, no keyboard, text box or buttons`);
    if (width === 375) {
        const phoneShot = await send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(shot.replace(/\.png$/, "-phone.png"), Buffer.from(phoneShot.result.data, "base64"));
    }
}
await send("Emulation.clearDeviceMetricsOverride");
await send("Emulation.setTouchEmulationEnabled", { enabled: false });
await send("Emulation.setEmitTouchEventsForMouse", { enabled: false });
await send("Page.reload");
await sleep(1500);
// The desktop: no note
check(await evaluate("Math.round(document.querySelector('.phone-note').getBoundingClientRect().height)"), 0, "the desktop: no phone note");
// IBM Plex Sans loaded, and drawing the Bulgarian forms: the same letters
// are a different width with lang="bg" than with lang="ru"
check(await evaluate(`(async () => { await document.fonts.ready; 
  const span=(lang, style)=>{ const e=document.createElement('span'); e.lang=lang; e.style.cssText='font: 40px Plex; position: absolute; white-space: pre;' + style; e.textContent='вгджзиклптцшщъью'; document.body.appendChild(e); const w=e.getBoundingClientRect().width; e.remove(); return w; };
  return [document.fonts.check('16px Plex'), document.fonts.check('600 16px Plex'),
    span('bg','') !== span('ru',''), getComputedStyle(document.getElementById('text')).fontFamily.startsWith('Plex')].join(); })()`),
  "true,true,true,true", "Plex Sans loaded, with the Bulgarian letter forms");
check(errors.join(" | "), "", "no errors in the console");
ws.close(); chrome.kill();
console.log(fail ? `${fail} failed` : "All pass.");
process.exit(fail ? 1 : 0);
