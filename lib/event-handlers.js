// lib/event-handlers.js — event registration: create-order / verify (return_url) / webhook.
// Fee + event come from EVENTS below (server-side); the client can never set the amount.
const { readRawBody } = require("./payment-handlers");
const cfgAll = require("./event-config");
const { REGISTRATION_CLOSES_AT, trackOf } = cfgAll;
// GTMC (college level) has its own table + handlers (lib/gtmc-handlers.js). This file is Swayam state level ONLY.

const EVENTS = { swayam: { name: "Swayam Competition", fee: 20, closes: () => cfgAll.REGISTRATION_CLOSES_AT, trackOf: (id) => cfgAll.trackOf(id), page: "/event" } };
const PRN_RE = /^[A-Za-z0-9]{6,20}$/;
const BRANCHES = ["AIML", "CS", "IT", "ENTC", "Electrical", "Civil", "Mechanical", "Production", "Chemical", "Petrochemical", "Other"];
const ORDER_ID_RE = /^EVT_[A-Za-z0-9_-]{6,60}$/;

function setCors(res, req) {
  require("./cors").applyCors(req, res, { methods: "POST, GET, OPTIONS", headers: "Content-Type" });
}

function makeEventHandlers({ admin, cashfree, env, log = console }) {
  const siteUrl = () => (env.SITE_URL || "https://studybuddypro-psi.vercel.app").replace(/\/$/, "");

  // Registration details travel inside the Cashfree order (order_tags), so NO row is created in the DB until the
  // payment is actually confirmed. Unpaid / abandoned attempts therefore never leave a "pending" record behind.
  function detailsFrom(order, customer) {
    const t = (order && order.order_tags) || {};
    const c = customer || {};
    return {
      slug: String(t.event || "swayam"),
      prn: String(t.prn || "").trim().toUpperCase(),
      name: String(t.name || c.customer_name || "").trim(),
      phone: String(t.phone || c.customer_phone || "").trim(),
      branch: String(t.branch || ""),
      track: String(t.track || ""),
    };
  }

  async function markPaid(orderId, paymentId, paidAmount, raw, order, customer) {
    const pid = paymentId ? String(paymentId) : null;
    const { data: row } = await admin().from("event_registrations")
      .select("id,status,amount").eq("gateway_order_id", orderId).maybeSingle();

    // Older rows created before this change (status pending) are updated in place.
    if (row) {
      if (row.status === "paid") return { ok: true, already: true };
      if (Number(paidAmount) < Number(row.amount)) return { ok: false, reason: "amount_mismatch" };
      const { error } = await admin().from("event_registrations").update({
        status: "paid", gateway_payment_id: pid, paid_at: new Date().toISOString(), raw,
      }).eq("id", row.id);
      if (error && error.code === "23505") {   // same PRN already has a paid registration (two payments raced)
        await admin().from("event_registrations").update({ status: "duplicate_paid", gateway_payment_id: pid, raw }).eq("id", row.id);
        return { ok: false, reason: "duplicate_paid" };
      }
      if (error) { log.error("event markPaid", error); return { ok: false, reason: "db_error" }; }
      return { ok: true };
    }

    // New flow: payment is confirmed, now create the registration row as "paid".
    const d = detailsFrom(order, customer);
    if (d.slug !== "swayam") return { ok: false, reason: "unknown_order" };   // e.g. a GTMC order must never land in this table
    const ev = Object.prototype.hasOwnProperty.call(EVENTS, d.slug) ? EVENTS[d.slug] : null;
    if (!ev || !PRN_RE.test(d.prn)) return { ok: false, reason: "unknown_order" };
    if (Number(paidAmount) < Number(ev.fee)) return { ok: false, reason: "amount_mismatch" };
    const base = {
      event_slug: d.slug, prn: d.prn, full_name: d.name, phone: d.phone, branch: d.branch, track: d.track,
      amount: ev.fee, gateway_order_id: orderId, gateway_payment_id: pid, raw,
    };
    const ins = await admin().from("event_registrations").insert({ ...base, status: "paid", paid_at: new Date().toISOString() });
    if (!ins.error) return { ok: true };
    if (ins.error.code === "23505") {
      // Either verify + webhook inserted the same order at the same moment, or this PRN is already paid.
      const { data: again } = await admin().from("event_registrations")
        .select("id,status").eq("gateway_order_id", orderId).maybeSingle();
      if (again) return again.status === "paid" ? { ok: true, already: true } : { ok: false, reason: "duplicate_paid" };
      const dup = await admin().from("event_registrations").insert({ ...base, status: "duplicate_paid" });
      if (dup.error) { log.error("event dup insert", dup.error); return { ok: false, reason: "db_error" }; }
      return { ok: false, reason: "duplicate_paid" };
    }
    log.error("event markPaid insert", ins.error);
    return { ok: false, reason: "db_error" };
  }

  const register = async (req, res) => {
    setCors(res, req);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try {
      const b = req.body || {};
      const slug = "swayam";
      const ev = Object.prototype.hasOwnProperty.call(EVENTS, slug) ? EVENTS[slug] : null;
      if (!ev) return res.status(400).json({ message: "Invalid event." });
      if (Date.now() >= Date.parse(ev.closes())) return res.status(403).json({ message: "Registration is closed." });
      const prn = String(b.prn || "").trim().toUpperCase();
      const name = String(b.name || "").trim().replace(/\s+/g, " ");
      const branch = String(b.branch || "");
      const phone = String(b.phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
      if (!ev) return res.status(400).json({ message: "Invalid event." });
      if (!PRN_RE.test(prn)) return res.status(400).json({ message: "Enter a valid PRN." });
      if (name.length < 3 || name.length > 80) return res.status(400).json({ message: "Enter your full name." });
      if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "सही 10 अंकों का mobile number डालें।" });
      if (!BRANCHES.includes(branch)) return res.status(400).json({ message: "Select your branch." });
      const trackId = String(b.track || "");
      if (!ev.trackOf(trackId)) return res.status(400).json({ message: "Competition category चुनें।" });

      const { data: paid } = await admin().from("event_registrations")
        .select("id").eq("event_slug", slug).eq("prn", prn).eq("status", "paid").limit(1);
      if (paid && paid.length) return res.status(409).json({ message: "यह PRN पहले से registered है। दोबारा payment की ज़रूरत नहीं। नीचे वाले 'पहले से registered हैं?' बटन से अपना Order ID देखें।" });

      const orderId = "EVT_" + Date.now() + "_" + require("crypto").randomBytes(4).toString("hex");
      try {
        const order = await cashfree.createOrder({
          order_id: orderId, order_amount: ev.fee, order_currency: "INR",
          customer_details: { customer_id: "EVT_" + prn, customer_name: name, customer_phone: phone },
          order_note: ev.name,
          order_tags: { event: slug, track: trackId, prn, name: name.slice(0, 80), phone, branch },
          order_meta: {
            return_url: siteUrl() + "/api/event?action=verify&order_id={order_id}",
            notify_url: siteUrl() + "/api/event?action=webhook",
          },
        });
        return res.status(200).json({ order_id: orderId, payment_session_id: order.payment_session_id });
      } catch (e) {
        log.error("event createOrder", e);
        return res.status(500).json({ message: "Could not create the payment. Please try again." });
      }
    } catch (err) {
      log.error("event-register error:", err);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  };

  // "Already registered?" — PRN + the mobile number used at registration must both match a PAID row.
  // (PRN alone is not enough: the Order ID doubles as the login secret for topic/submission.)
  const lookup = async (req, res) => {
    setCors(res, req);
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try {
      const b = req.body || {};
      const prn = String(b.prn || "").trim().toUpperCase();
      const phone = String(b.phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
      const lslug = "swayam";
      if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
      if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "सही 10 अंकों का mobile number डालें।" });
      const { data } = await admin().from("event_registrations")
        .select("gateway_order_id").eq("event_slug", lslug).eq("prn", prn).eq("phone", phone).eq("status", "paid").limit(1);
      if (!data || !data.length) return res.status(404).json({ message: "इस PRN और mobile number से कोई paid registration नहीं मिला। Registration के समय वाला ही number डालें।" });
      return res.status(200).json({ order_id: data[0].gateway_order_id });
    } catch (err) {
      log.error("event-lookup error:", err);
      return res.status(500).json({ message: "कुछ गड़बड़ हो गई। दोबारा try करें।" });
    }
  };

  const verify = async (req, res) => {
    setCors(res, req);
    const orderId = String((req.query && req.query.order_id) || "");
    let page = "/event";
    const to = (status) => res.redirect(302, `${page}?status=${status}&order_id=${encodeURIComponent(orderId)}`);
    try {
      if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ message: "Invalid order." });
      const cf = await cashfree.getOrder(orderId);
      const tagSlug = String(((cf && cf.order_tags) || {}).event || "swayam");
      if (Object.prototype.hasOwnProperty.call(EVENTS, tagSlug)) page = EVENTS[tagSlug].page;
      if (cf.order_status !== "PAID") return to("failed");
      let paymentId = String(cf.cf_order_id || orderId), paidAmount = Number(cf.order_amount);
      try {
        const pays = await cashfree.getOrderPayments(orderId);
        const ok = (Array.isArray(pays) ? pays : []).find((p) => p.payment_status === "SUCCESS");
        if (ok) { paymentId = String(ok.cf_payment_id); paidAmount = Number(ok.payment_amount); }
      } catch (e) { /* fall back to order-level data */ }
      const r = await markPaid(orderId, paymentId, paidAmount, { source: "verify", order_status: cf.order_status }, cf, cf.customer_details);
      return to(r.ok ? "success" : r.reason === "duplicate_paid" ? "duplicate" : "failed");
    } catch (err) {
      log.error("event-verify error:", err);
      return to("failed");
    }
  };

  const webhook = async (req, res) => {
    if (req.method !== "POST") return res.status(405).end();
    try {
      const secret = env.CASHFREE_WEBHOOK_SECRET;
      if (!secret) return res.status(500).json({ error: "misconfigured" });
      const raw = await readRawBody(req);
      if (!cashfree.verifyWebhookSignature(raw, req.headers["x-webhook-timestamp"], req.headers["x-webhook-signature"], secret))
        return res.status(401).json({ error: "Invalid signature" });
      const event = JSON.parse(raw);
      const orderId = event.data && event.data.order && event.data.order.order_id;
      if (!orderId || !ORDER_ID_RE.test(String(orderId))) return res.status(200).json({ message: "Ignored" });

      if (["PAYMENT_FAILED_WEBHOOK", "PAYMENT_USER_DROPPED_WEBHOOK"].includes(event.type)) {
        await admin().from("event_registrations").update({ status: "failed" }).eq("gateway_order_id", String(orderId)).eq("status", "pending");
        return res.status(200).json({ message: "Failure recorded" });
      }
      if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") return res.status(200).json({ message: "Event ignored" });
      const pay = event.data.payment || {};
      if (pay.payment_status !== "SUCCESS") return res.status(200).json({ message: "Ignored" });
      const r = await markPaid(String(orderId), pay.cf_payment_id, pay.payment_amount, event, event.data.order, event.data.customer_details);
      if (!r.ok && r.reason === "db_error") return res.status(500).json({ error: "retry" });
      return res.status(200).json({ success: r.ok, reason: r.reason });
    } catch (err) {
      log.error("event-webhook error:", err);
      return res.status(500).json({ error: "retry" });
    }
  };

  return { register, verify, webhook, lookup };
}

module.exports = { makeEventHandlers };
