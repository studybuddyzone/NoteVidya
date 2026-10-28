// lib/visitor-counter-handler.js — public visitor counter.
//
// Storage : Firebase Realtime Database (the same RTDB lib/helpers.js already initialises).
// Path    : visitorCounter/paymentGateway/totalVisits   (a plain integer)
// Methods : POST -> atomically adds exactly 1 and returns the new total
//           GET  -> returns the current total without changing it
//
// This file never touches payments, PRN checks, Cashfree or Supabase. Dependencies are
// injected (like the other lib/*-handlers.js) so it can be tested without a real database.

const COUNTER_PATH = "visitorCounter/paymentGateway/totalVisits";
const DB_TIMEOUT_MS = 8000;

// Abuse protection: per-IP cap on *increments* per window. Students on one campus Wi-Fi share
// an IP, so the cap is generous. Over the cap the request is NOT rejected: it just returns the
// current total without incrementing (the page still renders normally).
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_INCREMENTS = 60;
const RATE_MAP_MAX = 5000;

function makeVisitorCounter({ getDb, now = () => Date.now(), log = console, path = COUNTER_PATH }) {
  const hits = new Map(); // ip -> { start, count }  (per warm serverless instance, best effort)

  function clientIp(req) {
    const h = (req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "";
    return String(h).split(",")[0].trim() || "unknown";
  }

  function allowIncrement(ip) {
    const t = now();
    if (hits.size > RATE_MAP_MAX) {
      for (const [k, v] of hits) if (t - v.start >= RATE_WINDOW_MS) hits.delete(k);
      if (hits.size > RATE_MAP_MAX) hits.clear();
    }
    const e = hits.get(ip);
    if (!e || t - e.start >= RATE_WINDOW_MS) { hits.set(ip, { start: t, count: 1 }); return true; }
    e.count += 1;
    return e.count <= RATE_MAX_INCREMENTS;
  }

  const withTimeout = (p) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("counter_timeout")), DB_TIMEOUT_MS);
    p.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });

  async function read() {
    const snap = await withTimeout(getDb().ref(path).once("value"));
    const n = Number(snap.val());
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  async function increment() {
    // Transaction => concurrency-safe. The update function may run more than once (and first
    // sees null if the value is not cached), so it must stay pure. A missing node starts at 0,
    // so the very first visit creates the path with value 1.
    const result = await withTimeout(getDb().ref(path).transaction((cur) => {
      const n = Number(cur);
      return (Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0) + 1;
    }));
    if (!result.committed) throw new Error("counter_not_committed");
    return Number(result.snapshot.val());
  }

  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "POST" && req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }
    try {
      if (req.method === "GET") return res.status(200).json({ ok: true, count: await read(), counted: false });
      if (!allowIncrement(clientIp(req))) {
        return res.status(200).json({ ok: true, count: await read(), counted: false });
      }
      return res.status(200).json({ ok: true, count: await increment(), counted: true });
    } catch (e) {
      // Log the message only (never env values / credentials).
      log.error("visitor-counter:", String((e && e.message) || "error"));
      return res.status(503).json({ ok: false, error: "counter_unavailable" });
    }
  };
}

module.exports = { makeVisitorCounter, COUNTER_PATH };
