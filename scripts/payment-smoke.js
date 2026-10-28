#!/usr/bin/env node
/**
 * scripts/payment-smoke.js — automatic SAFETY checks against a deployed URL (Vercel preview is best).
 *
 *   node scripts/payment-smoke.js https://your-preview.vercel.app
 *
 * It does NOT pay anything and never needs a login. It checks the things that must be true BEFORE you test real payments:
 *   1. create-order without login        -> 401/403  (not a created order)
 *   2. webhook with a wrong signature    -> 401      (fake "payment success" must be refused)
 *   3. verify-payment with a junk order id -> 400 (it never grants anything without Cashfree saying PAID)
 *   4. CORS from a foreign website       -> no Access-Control-Allow-Origin header
 *   5. rate limit                        -> 429 appears after a burst on create-order
 * Real money flow (success / failure / drop / duplicate webhook) = docs/PAYMENT-SANDBOX-TEST.md.
 */
const base = (process.argv[2] || "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) { console.error("Usage: node scripts/payment-smoke.js https://<deployment>"); process.exit(2); }
let failed = 0;
const ok = (c, msg, extra = "") => { console.log((c ? "✅ " : "❌ ") + msg + (extra ? "  → " + extra : "")); if (!c) failed++; };
const post = (p, body, headers = {}) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body || {}) });

(async () => {
  let r = await post("/api/create-order", { role: "gold", amount: 1 });
  ok([401, 403].includes(r.status), "create-order without login is refused", "HTTP " + r.status);

  r = await post("/api/webhook", { data: { order: { order_id: "SMOKE_TEST" }, payment: { payment_status: "SUCCESS" } }, type: "PAYMENT_SUCCESS_WEBHOOK" },
    { "x-webhook-signature": "AAAA", "x-webhook-timestamp": String(Date.now()) });
  ok(r.status === 401, "webhook with wrong signature returns 401", "HTTP " + r.status);

  r = await fetch(base + "/api/verify-payment?order_id=junk", { redirect: "manual" });
  ok(r.status === 400, "verify-payment with a junk order id is refused", "HTTP " + r.status);

  r = await post("/api/create-order", {}, { Origin: "https://evil.example" });
  ok(!r.headers.get("access-control-allow-origin"), "foreign origin gets no CORS permission", "ACAO=" + r.headers.get("access-control-allow-origin"));

  let got429 = false;
  for (let i = 0; i < 16 && !got429; i++) got429 = (await post("/api/create-order", {})).status === 429;
  ok(got429, "burst of requests gets HTTP 429 (rate limit works)", got429 ? "" : "no 429 after 16 requests — in-memory limiter may be hitting different instances; set UPSTASH_* env");

  console.log(failed ? `\n${failed} check(s) failed.` : "\nAll safety checks passed.");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
