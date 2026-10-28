const test = require("node:test");
const assert = require("node:assert");
const vm = require("node:vm");
const fs = require("node:fs");
const src = fs.readFileSync(__dirname + "/../devtools-guard.js", "utf8");

function boot(ua = "Mozilla/5.0 (Windows NT 10.0) Chrome/120") {
  const listeners = {}, wlisteners = {}, log = { go: [], clip: 0 };
  const shield = { style: {}, setAttribute() {} };
  const document = {
    readyState: "complete", hidden: false, activeElement: null,
    body: { appendChild() {} }, head: { appendChild() {} },
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    createElement: () => shield,
  };
  const window = { addEventListener: (t, f) => { (wlisteners[t] = wlisteners[t] || []).push(f); }, outerWidth: 1000, innerWidth: 1000, outerHeight: 800, innerHeight: 800 };
  const ctx = { window, document, navigator: { userAgent: ua, maxTouchPoints: 0, clipboard: { writeText: () => { log.clip++; return Promise.resolve(); } } },
    location: { pathname: "/fy", replace: (u) => log.go.push(u), set href(u) { log.go.push(u); } }, performance: { now: () => Date.now() }, setTimeout, clearTimeout, setInterval: () => 0, Image: function () {} };
  window.location = ctx.location;
  vm.runInNewContext(src, ctx);
  const key = (type, o) => { let prevented = false; const e = Object.assign({ key: "", keyCode: 0, preventDefault() { prevented = true; }, stopPropagation() {} }, o); (listeners[type] || []).forEach((f) => f(e)); return { prevented }; };
  return { key, log, shield, listeners, wlisteners };
}

test("devtools shortcuts redirect to /due (Windows + Mac variants)", () => {
  for (const o of [{ key: "F12", keyCode: 123 }, { key: "I", ctrlKey: true, shiftKey: true }, { key: "J", ctrlKey: true, shiftKey: true },
    { key: "C", metaKey: true, shiftKey: true }, { key: "i", metaKey: true, altKey: true }, { key: "u", ctrlKey: true }, { key: "s", ctrlKey: true }, { key: "p", ctrlKey: true }]) {
    const t = boot(); const r = t.key("keydown", o);
    assert.equal(r.prevented, true, JSON.stringify(o)); assert.deepEqual(t.log.go, ["/due"], JSON.stringify(o));
  }
});
test("PrintScreen / Win+Shift+S / Cmd+Shift+4 black out the page and wipe the clipboard", () => {
  for (const o of [{ key: "PrintScreen", keyCode: 44 }, { key: "s", metaKey: true, shiftKey: true }, { key: "4", metaKey: true, shiftKey: true }]) {
    const t = boot(); t.key("keydown", o);
    assert.equal(t.shield.style.display, "block", JSON.stringify(o)); assert.equal(t.log.clip, 1);
  }
  const t = boot(); t.key("keyup", { key: "PrintScreen", keyCode: 44 }); assert.equal(t.shield.style.display, "block");
});
test("normal typing is untouched; window blur hides, focus shows", () => {
  const t = boot();
  const r = t.key("keydown", { key: "a" }); assert.equal(r.prevented, false); assert.deepEqual(t.log.go, []);
  return new Promise((res) => { t.wlisteners.blur[0](); setTimeout(() => {
    assert.equal(t.shield.style.display, "block"); t.wlisteners.focus[0](); assert.equal(t.shield.style.display, "none"); res(); }, 5); });
});
test("no redirect loop on the /due page", () => {
  const t = boot(); // pathname is /fy here; emulate /due
  const src2 = src; const log = [];
  const ctx = { window: { addEventListener() {} }, document: { readyState: "complete", addEventListener(tt, f) { if (tt === "keydown") ctx.kd = f; }, body: null, head: null }, navigator: { userAgent: "Mobi", maxTouchPoints: 2 },
    location: { pathname: "/due", replace: (u) => log.push(u) }, performance, setTimeout, clearTimeout, setInterval: () => 0, Image: function () {} };
  vm.runInNewContext(src2, ctx); ctx.kd({ key: "F12", keyCode: 123, preventDefault() {}, stopPropagation() {} });
  assert.deepEqual(log, []);
});
