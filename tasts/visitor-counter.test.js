// Run: node --test tests/visitor-counter.test.js   (uses an in-memory fake of the RTDB API)
const test = require("node:test");
const assert = require("node:assert");
const { makeVisitorCounter, COUNTER_PATH } = require("../lib/visitor-counter-handler");

// Fake RTDB. transaction() mimics the real SDK: the update fn first sees `null`, the commit
// is rejected if the stored value changed in between, and the fn is then re-run (optimistic retry).
function fakeDb(initial) {
  const store = { v: initial };
  let conflictsToInject = 0;
  const db = {
    store,
    injectConflicts: (n) => { conflictsToInject = n; },
    ref(path) {
      assert.strictEqual(path, COUNTER_PATH);
      return {
        once: async () => ({ val: () => store.v }),
        transaction: async (fn) => {
          let guess = null;
          for (;;) {
            const next = fn(guess);
            await new Promise((r) => setImmediate(r));          // yield: lets other writers interleave
            if (conflictsToInject > 0) { conflictsToInject--; store.v = (store.v || 0); guess = store.v; continue; }
            if (guess !== store.v && !(guess === null && store.v === undefined)) { guess = store.v; continue; }
            store.v = next;
            return { committed: true, snapshot: { val: () => store.v } };
          }
        },
      };
    },
  };
  return db;
}
const mkRes = () => { const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const call = async (h, method = "POST", ip = "1.1.1.1") => { const res = mkRes(); await h({ method, headers: { "x-forwarded-for": ip } }, res); return res; };
const quiet = { error() {} };

test("first visit creates the node with 1, each load adds exactly 1", async () => {
  const db = fakeDb(undefined), h = makeVisitorCounter({ getDb: () => db, log: quiet });
  assert.strictEqual((await call(h)).body.count, 1);
  assert.strictEqual((await call(h)).body.count, 2);
  assert.strictEqual((await call(h)).body.count, 3);
  assert.strictEqual(db.store.v, 3);
});

test("continues from an existing / seeded value (persistence)", async () => {
  const db = fakeDb(1285), h = makeVisitorCounter({ getDb: () => db, log: quiet });
  const r = await call(h); assert.strictEqual(r.body.count, 1286); assert.strictEqual(r.body.counted, true);
  // new handler instance = "server restart"; value lives in the DB
  const h2 = makeVisitorCounter({ getDb: () => db, log: quiet });
  assert.strictEqual((await call(h2)).body.count, 1287);
});

test("GET never increments", async () => {
  const db = fakeDb(10), h = makeVisitorCounter({ getDb: () => db, log: quiet });
  const r = await call(h, "GET"); assert.deepStrictEqual([r.body.count, r.body.counted], [10, false]); assert.strictEqual(db.store.v, 10);
});

test("100 concurrent visitors => exactly +100, no lost updates, all distinct", async () => {
  const db = fakeDb(0), h = makeVisitorCounter({ getDb: () => db, log: quiet });
  const rs = await Promise.all(Array.from({ length: 100 }, (_, i) => call(h, "POST", "10.0.0." + i)));
  assert.strictEqual(db.store.v, 100);
  assert.strictEqual(new Set(rs.map((r) => r.body.count)).size, 100);
});

test("transaction retries do not double count", async () => {
  const db = fakeDb(5), h = makeVisitorCounter({ getDb: () => db, log: quiet });
  db.injectConflicts(3);
  assert.strictEqual((await call(h)).body.count, 6);
});

test("corrupt stored value is treated as 0", async () => {
  const db = fakeDb("abc"), h = makeVisitorCounter({ getDb: () => db, log: quiet });
  assert.strictEqual((await call(h)).body.count, 1);
});

test("rate limit: same IP over the cap gets the current total, 200, no increment; other IPs unaffected; window resets", async () => {
  let t = 0; const db = fakeDb(0), h = makeVisitorCounter({ getDb: () => db, now: () => t, log: quiet });
  for (let i = 0; i < 60; i++) assert.strictEqual((await call(h, "POST", "9.9.9.9")).body.counted, true);
  const over = await call(h, "POST", "9.9.9.9");
  assert.deepStrictEqual([over.code, over.body.ok, over.body.counted, over.body.count], [200, true, false, 60]);
  assert.strictEqual((await call(h, "POST", "8.8.8.8")).body.counted, true);
  t += 61000;
  assert.strictEqual((await call(h, "POST", "9.9.9.9")).body.counted, true);
  assert.strictEqual(db.store.v, 62);
});

test("database failure => 503 JSON, no throw, no secrets in the response", async () => {
  const h = makeVisitorCounter({ getDb: () => { throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable set nahi hai"); }, log: quiet });
  const r = await call(h); assert.strictEqual(r.code, 503); assert.deepStrictEqual(r.body, { ok: false, error: "counter_unavailable" });
});

test("other methods => 405; responses are never cached", async () => {
  const h = makeVisitorCounter({ getDb: () => fakeDb(0), log: quiet });
  const r = await call(h, "DELETE"); assert.strictEqual(r.code, 405);
  assert.match((await call(h, "POST")).headers["Cache-Control"], /no-store/);
});
