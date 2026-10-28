const test = require("node:test");
const assert = require("node:assert");
const { withRateLimit, check, clientIp } = require("../lib/rate-limit");

function mkRes() {
  const r = { code: 200, h: {}, body: null };
  r.setHeader = (k, v) => { r.h[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}
const req = (ip, method = "POST") => ({ method, headers: { "x-forwarded-for": ip + ", 10.0.0.1" }, query: {} });

test("clientIp takes the first x-forwarded-for entry", () => assert.equal(clientIp(req("1.2.3.4")), "1.2.3.4"));

test("allows up to max then answers 429 with Retry-After", async () => {
  let calls = 0;
  const h = withRateLimit(async (q, s) => { calls++; s.status(200).json({ ok: true }); }, { name: "t1", max: 3, windowSec: 60 });
  for (let i = 0; i < 3; i++) { const s = mkRes(); await h(req("9.9.9.1"), s); assert.equal(s.code, 200); }
  const s = mkRes(); await h(req("9.9.9.1"), s);
  assert.equal(s.code, 429);
  assert.ok(Number(s.h["Retry-After"]) >= 1);
  assert.equal(calls, 3);
});
test("limits are per IP", async () => {
  const h = withRateLimit(async (q, s) => s.status(200).json({}), { name: "t2", max: 1, windowSec: 60 });
  let s = mkRes(); await h(req("8.8.8.1"), s); assert.equal(s.code, 200);
  s = mkRes(); await h(req("8.8.8.2"), s); assert.equal(s.code, 200);
  s = mkRes(); await h(req("8.8.8.1"), s); assert.equal(s.code, 429);
});
test("OPTIONS preflight is never counted", async () => {
  const h = withRateLimit(async (q, s) => s.status(200).end(), { name: "t3", max: 1, windowSec: 60 });
  for (let i = 0; i < 5; i++) { const s = mkRes(); await h(req("7.7.7.7", "OPTIONS"), s); assert.equal(s.code, 200); }
});
test("opts can be a function (per-action limits) and handler props like config are kept", async () => {
  const base = async (q, s) => s.status(200).json({});
  base.config = { api: { bodyParser: false } };
  const h = withRateLimit(base, (q) => ({ name: "t4", max: 1, windowSec: 60 }));
  assert.deepEqual(h.config, base.config);
  let s = mkRes(); await h(req("6.6.6.6"), s); assert.equal(s.code, 200);
  s = mkRes(); await h(req("6.6.6.6"), s); assert.equal(s.code, 429);
});
test("check() reports count", async () => {
  const r1 = await check(req("5.5.5.5"), { name: "t5", max: 2 });
  const r2 = await check(req("5.5.5.5"), { name: "t5", max: 2 });
  const r3 = await check(req("5.5.5.5"), { name: "t5", max: 2 });
  assert.deepEqual([r1.limited, r2.limited, r3.limited], [false, false, true]);
});
