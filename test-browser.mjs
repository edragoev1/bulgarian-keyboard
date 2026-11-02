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
  tap(by('Shift for the next key')); tap(by('в'));
  tap(by('1, with Shift !'));
  tap(by('Caps Lock')); tap(by('г'));
  tap(by('Enter')); tap(by('д')); tap(by('е'));
  tap(by('Backspace'));
  tap(by('Tab'));
  return true; })()`);
check(await value(), "АБв1г\nд\t", "Caps Lock, Shift with it, Enter, Backspace, Tab tapped");
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
check(errors.join(" | "), "", "no errors in the console");
ws.close(); chrome.kill();
console.log(fail ? `${fail} failed` : "All pass.");
process.exit(fail ? 1 : 0);
