// Run: node --test tests/visitor-counter-client.test.js  (stubbed DOM/fetch; no browser needed)
const test = require("node:test"), assert = require("node:assert"), vm = require("node:vm"), fs = require("node:fs");
const src = fs.readFileSync(__dirname + "/../js/visitor-counter.js", "utf8");
function run({ search, fetchImpl }) {
  const cls = new Set(["is-loading"]);
  const card = { hidden: false, classList: { add: (c) => cls.add(c), remove: (...c) => c.forEach((x) => cls.delete(x)) } };
  const els = { visitorCounter: card, visitorCounterNum: { textContent: "0000" }, visitorCounterSuffix: { textContent: "Loading…" } };
  const calls = [];
  const win = { location: { search }, matchMedia: () => ({ matches: true }) };
  const ctx = { window: win, document: { hidden: false, getElementById: (i) => els[i] }, URLSearchParams, AbortController, setTimeout, clearTimeout, setInterval: () => 0,
    performance, requestAnimationFrame: (f) => f(performance.now() + 1e4),
    fetch: (...a) => { calls.push(a); return fetchImpl(...a); } };
  vm.runInNewContext(src, ctx);
  return { els, cls, card, calls, win };
}
const tick = () => new Promise((r) => setTimeout(r, 10));

test("one POST per load, shows formatted total", async () => {
  const t = run({ search: "?prn=1&branch=cs", fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, count: 1286 }) }) });
  await tick();
  assert.strictEqual(t.calls.length, 1); assert.strictEqual(t.calls[0][1].method, "POST");
  assert.strictEqual(t.els.visitorCounterNum.textContent, "1,286"); assert.strictEqual(t.els.visitorCounterSuffix.textContent, "Total Visits");
  assert.ok(!t.cls.has("is-loading"));
});
test("failure shows fallback, makes exactly one attempt (no retry)", async () => {
  const t = run({ search: "?prn=1&branch=cs", fetchImpl: async () => { throw new Error("net"); } });
  await tick();
  assert.strictEqual(t.calls.length, 1); assert.ok(t.cls.has("is-error")); assert.match(t.els.visitorCounterSuffix.textContent, /unavailable/);
});
test("HTTP 503 shows fallback", async () => {
  const t = run({ search: "?prn=1&branch=cs", fetchImpl: async () => ({ ok: false, json: async () => ({}) }) });
  await tick(); assert.ok(t.cls.has("is-error"));
});
test("every real page load is counted, even without prn/branch (js/visitor-counter.js: \"Counts every real page load\")", async () => {
  const t = run({ search: "", fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, count: 5 }) }) });
  await tick(); assert.strictEqual(t.calls.length, 1); assert.strictEqual(t.calls[0][1].method, "POST"); assert.strictEqual(t.card.hidden, false);
});
