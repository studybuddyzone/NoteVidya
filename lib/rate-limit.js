// lib/rate-limit.js — simple fixed-window rate limiter for Vercel functions.
//  * If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set -> shared counter across all instances (recommended).
//  * Otherwise -> in-memory counter per warm instance (best-effort: stops loops/bots hammering one instance, not a distributed attack).
// Usage:  module.exports = withRateLimit(handler, { name: "payment", max: 30, windowSec: 60 });
const mem = new Map();
let lastSweep = 0;

function clientIp(req) {
  const h = (req && req.headers) || {};
  const xff = String(h["x-forwarded-for"] || "").split(",")[0].trim();
  return xff || String(h["x-real-ip"] || "") || (req && req.socket && req.socket.remoteAddress) || "unknown";
}

function memHit(key, windowSec) {
  const now = Date.now();
  if (now - lastSweep > 60000) {                    // drop expired entries once a minute
    lastSweep = now;
    for (const [k, v] of mem) if (v.reset <= now) mem.delete(k);
  }
  let e = mem.get(key);
  if (!e || e.reset <= now) { e = { count: 0, reset: now + windowSec * 1000 }; mem.set(key, e); }
  e.count += 1;
  return { count: e.count, resetMs: e.reset - now };
}

async function upstashHit(key, windowSec, env) {
  const url = env.UPSTASH_REDIS_REST_URL, token = env.UPSTASH_REDIS_REST_TOKEN;
  const r = await fetch(url.replace(/\/+$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(windowSec), "NX"]]),
  });
  if (!r.ok) throw new Error("upstash " + r.status);
  const out = await r.json();
  return { count: Number(out[0].result), resetMs: windowSec * 1000 };
}

// Returns { limited, count, retryAfterSec }. Never throws: if the shared store is down we fall back to memory.
async function check(req, { name = "api", max = 60, windowSec = 60, env = process.env } = {}) {
  const key = `rl:${name}:${clientIp(req)}`;
  let r;
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try { r = await upstashHit(key, windowSec, env); } catch (e) { r = memHit(key, windowSec); }
  } else r = memHit(key, windowSec);
  return { limited: r.count > max, count: r.count, retryAfterSec: Math.max(1, Math.ceil(r.resetMs / 1000)) };
}

// Wrap a (req,res) handler. `opts` may also be a function (req) => opts, so one function can use different limits per action.
function withRateLimit(handler, opts) {
  const wrapped = async (req, res) => {
    if (req.method === "OPTIONS") return handler(req, res);          // CORS preflight is free
    const o = typeof opts === "function" ? opts(req) : opts;
    if (o && o.max > 0) {
      const r = await check(req, o);
      res.setHeader("X-RateLimit-Limit", String(o.max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, o.max - r.count)));
      if (r.limited) {
        res.setHeader("Retry-After", String(r.retryAfterSec));
        return res.status(429).json({ message: "बहुत ज़्यादा requests। कुछ देर बाद दोबारा try करें।", retry_after: r.retryAfterSec });
      }
    }
    return handler(req, res);
  };
  for (const k of Object.keys(handler)) wrapped[k] = handler[k];     // keep module.exports.config etc.
  return wrapped;
}

module.exports = { withRateLimit, check, clientIp, _mem: mem };
