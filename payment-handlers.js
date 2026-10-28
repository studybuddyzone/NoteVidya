// lib/payment-handlers.js — create-order / verify-payment / webhook, with injected deps (testable).
//
// Trust model:
//   * Who is paying      -> Supabase JWT (Authorization: Bearer), never body.prn
//   * How much / what    -> plans table in the DB, never body.amount / body.role price
//   * Did they pay       -> Cashfree API (verify-payment) or signed webhook, never query params
//   * Granting premium   -> public.fulfill_order() (idempotent, service_role only)

const TIERS = ["silver", "gold", "diamond", "lifetime"];
const SUCCESS_PAGE = { main: "/payment-success", fy: "/fy-payment-success" };
const FAILED_PAGE  = { main: "/payment-failed",  fy: "/fy-payment-failed" };
const ORDER_PREFIX = { main: "SBP_", fy: "FY1_" };   // same prefixes as the old code
const ORDER_ID_RE  = /^[A-Za-z0-9_-]{6,60}$/;
const FAIL_EVENTS  = ["PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK"];

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");           // Bearer-token API (no cookies) => not CSRF-able
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
function newOrderId(catalog) {
  return ORDER_PREFIX[catalog] + Date.now() + "_" + require("crypto").randomBytes(4).toString("hex");
}
function readRawBody(req) {
  if (typeof req.rawBody === "string") return Promise.resolve(req.rawBody);
  return new Promise((resolve, reject) => {
    let d = ""; req.setEncoding("utf8");
    req.on("data", (c) => (d += c)); req.on("end", () => resolve(d)); req.on("error", reject);
  });
}


// Lifetime plan = permanent moderator-level access. Runs after fulfill_order succeeded (idempotent).
async function promoteLifetime(admin, orderId, log) {
  try {
    const { data: o } = await admin().from("orders").select("user_id,tier").eq("gateway_order_id", orderId).maybeSingle();
    if (!o || o.tier !== "lifetime") return;
    const { data: p } = await admin().from("profiles").select("role").eq("id", o.user_id).maybeSingle();
    if (p && ["admin", "superadmin", "master"].includes(p.role)) return;   // never downgrade higher staff
    const up = await admin().from("profiles")
      .update({ role: "moderator", tier: null, tier_expires_at: null }).eq("id", o.user_id);
    if (up.error) log.error("promoteLifetime", up.error);
  } catch (e) { log.error("promoteLifetime", e); }
}

function makeHandlers({ admin, getUserFromRequest, cashfree, env, log = console }) {
  const siteUrl = () => (env.SITE_URL || "https://studybuddypro-psi.vercel.app").replace(/\/$/, "");

  // ---------------------------------------------------------------- create-order
  const createOrder = (catalog) => async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    let gwOrderId = null;
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: "Please login again to continue." });

      const body = req.body || {};
      const tier = String(body.role || body.tier || "").toLowerCase();
      if (!TIERS.includes(tier)) return res.status(400).json({ message: "Invalid plan." });

      const { data: profile, error: pErr } = await admin().from("profiles")
        .select("id,full_name,email,mobile,role").eq("id", user.id).maybeSingle();
      if (pErr || !profile) return res.status(404).json({ message: "Profile not found." });
      if (["master", "superadmin", "admin", "moderator"].includes(profile.role)) {
        return res.status(403).json({ message: "Staff accounts do not need a subscription." });
      }

      gwOrderId = newOrderId(catalog);
      const rec = await admin().rpc("create_order_record",
        { p_user: user.id, p_tier: tier, p_gateway_order_id: gwOrderId, p_catalog: catalog });
      if (rec.error) { log.error("create_order_record", rec.error); return res.status(400).json({ message: "Plan unavailable." }); }
      const amount = Number(rec.data.amount);             // from DB — client amount is ignored

      const order = await cashfree.createOrder({
        order_id: gwOrderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: profile.full_name,
          customer_email: profile.email,
          customer_phone: /^\d{10}$/.test(profile.mobile || "") ? profile.mobile : "9999999999",
        },
        order_tags: { tier, catalog },
        order_meta: {
          // No prn / role in the URL: verify-payment looks the order up in OUR database.
          return_url: siteUrl() + "/api/verify-payment?order_id={order_id}",
          notify_url: siteUrl() + "/api/webhook",
        },
      });
      return res.status(200).json({ order_id: gwOrderId, payment_session_id: order.payment_session_id, amount, currency: "INR" });
    } catch (err) {
      log.error("create-order error:", err);
      if (gwOrderId) { try { await admin().rpc("mark_order_failed", { p_gateway_order_id: gwOrderId }); } catch (e) {} }
      return res.status(500).json({ message: "Could not create the order. Please try again." });
    }
  };

  // ---------------------------------------------------------------- verify-payment (return_url)
  const verifyPayment = async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(200).end();
    const orderId = String((req.query && req.query.order_id) || "");
    const fail = (catalog) => res.redirect(302, `${FAILED_PAGE[catalog] || FAILED_PAGE.main}?order_id=${encodeURIComponent(orderId)}`);
    try {
      if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ message: "Invalid order." });

      const { data: ord } = await admin().from("orders")
        .select("id,user_id,tier,catalog,status").eq("gateway_order_id", orderId).maybeSingle();
      if (!ord) return fail("main");                      // unknown order: never grant anything

      // Ask Cashfree directly. Nothing in the URL is trusted.
      const cf = await cashfree.getOrder(orderId);
      if (cf.order_status !== "PAID") return fail(ord.catalog);

      let paymentId = String(cf.cf_order_id || orderId), paidAmount = Number(cf.order_amount);
      try {
        const pays = await cashfree.getOrderPayments(orderId);
        const ok = (Array.isArray(pays) ? pays : []).find((p) => p.payment_status === "SUCCESS");
        if (ok) { paymentId = String(ok.cf_payment_id); paidAmount = Number(ok.payment_amount); }
      } catch (e) { /* fall back to order-level data */ }

      const r = await admin().rpc("fulfill_order", {
        p_gateway_order_id: orderId, p_gateway_payment_id: paymentId, p_paid_amount: paidAmount,
        p_raw: { source: "verify-payment", order_status: cf.order_status },
      });
      if (r.error || !r.data || !r.data.ok) { log.error("fulfill_order (verify)", r.error || r.data); return fail(ord.catalog); }

      await promoteLifetime(admin, orderId, log);

      // role/prn/order_id below are display-only on the success page and come from OUR database.
      let prn = "";
      try {
        const { data: pr } = await admin().from("profiles").select("prn").eq("id", ord.user_id).maybeSingle();
        prn = (pr && pr.prn) || "";
      } catch (e) { /* display only */ }
      return res.redirect(302, `${SUCCESS_PAGE[ord.catalog] || SUCCESS_PAGE.main}?order_id=${encodeURIComponent(orderId)}&role=${ord.tier}&prn=${encodeURIComponent(prn)}`);
    } catch (err) {
      log.error("verify-payment error:", err);
      return res.redirect(302, `${FAILED_PAGE.main}?order_id=${encodeURIComponent(orderId)}`);
    }
  };

  // ---------------------------------------------------------------- webhook
  const webhook = async (req, res) => {
    if (req.method !== "POST") return res.status(405).end();
    try {
      const secret = env.CASHFREE_WEBHOOK_SECRET;
      if (!secret) { log.error("CASHFREE_WEBHOOK_SECRET not set"); return res.status(500).json({ error: "misconfigured" }); }   // fail closed

      const raw = await readRawBody(req);
      const sig = req.headers["x-webhook-signature"], ts = req.headers["x-webhook-timestamp"];
      if (!cashfree.verifyWebhookSignature(raw, ts, sig, secret)) return res.status(401).json({ error: "Invalid signature" });

      const event = JSON.parse(raw);

      // Failed / abandoned attempts: just close the unpaid order. A later successful attempt on the same
      // order still grants premium (fulfill_order only skips orders that are already 'paid').
      if (FAIL_EVENTS.includes(event.type)) {
        const failedId = event.data && event.data.order && event.data.order.order_id;
        if (failedId) {
          const m = await admin().rpc("mark_order_failed", { p_gateway_order_id: String(failedId) });
          if (m && m.error) log.error("mark_order_failed (webhook)", m.error);
        }
        return res.status(200).json({ message: "Failure recorded" });
      }
      if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") return res.status(200).json({ message: "Event ignored" });

      const orderId = event.data && event.data.order && event.data.order.order_id;
      const pay = (event.data && event.data.payment) || {};
      if (!orderId || pay.payment_status !== "SUCCESS") return res.status(200).json({ message: "Ignored" });

      const r = await admin().rpc("fulfill_order", {
        p_gateway_order_id: String(orderId),
        p_gateway_payment_id: pay.cf_payment_id != null ? String(pay.cf_payment_id) : null,
        p_paid_amount: Number(pay.payment_amount),
        p_raw: event,
      });
      if (r.error) { log.error("fulfill_order (webhook)", r.error); return res.status(500).json({ error: "retry" }); }   // 5xx => Cashfree retries
      if (!r.data.ok) { log.error("webhook not fulfilled:", orderId, r.data.reason); return res.status(200).json({ message: r.data.reason }); }
      await promoteLifetime(admin, String(orderId), log);
      return res.status(200).json({ success: true, already_processed: !!r.data.already_processed });
    } catch (err) {
      log.error("webhook error:", err);
      return res.status(500).json({ error: "retry" });
    }
  };

  return { createOrder, verifyPayment, webhook };
}

module.exports = { makeHandlers, readRawBody };
