// Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const { applyCors, allowedOrigins } = require("../lib/cors");

function fakeRes() { const h = {}; return { h, setHeader: (k, v) => { h[k] = v; } }; }

test("allowed origin is echoed back (not *)", () => {
  const res = fakeRes();
  assert.equal(applyCors({ headers: { origin: "https://studybuddypro-psi.vercel.app" } }, res), true);
  assert.equal(res.h["Access-Control-Allow-Origin"], "https://studybuddypro-psi.vercel.app");
  assert.equal(res.h["Vary"], "Origin");
});
test("unknown origin gets no Allow-Origin header", () => {
  const res = fakeRes();
  assert.equal(applyCors({ headers: { origin: "https://evil.example" } }, res), false);
  assert.equal(res.h["Access-Control-Allow-Origin"], undefined);
});
test("no Origin header (native app / server-to-server) is fine", () => {
  const res = fakeRes();
  assert.equal(applyCors({ headers: {} }, res), true);
  assert.equal(res.h["Access-Control-Allow-Origin"], undefined);
});
test("SITE_URL and ALLOWED_ORIGINS env are honoured", () => {
  const list = allowedOrigins({ SITE_URL: "https://my.site/", ALLOWED_ORIGINS: "https://a.com, https://b.com/" });
  for (const o of ["https://my.site", "https://a.com", "https://b.com"]) assert.ok(list.includes(o), o);
});
