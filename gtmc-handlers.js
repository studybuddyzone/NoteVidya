// lib/gtmc-handlers.js — Swayam directed by ASTRA (GTMC, college level): register / verify / webhook / lookup.
// Writes ONLY to public.gtmc_registrations. It never touches event_registrations (Swayam state level).
// Fee and rules are enforced here on the server; the client can never set the amount.
const { readRawBody } = require("./payment-handlers");
const cfg = require("./event-config");
const { randomBytes } = require("crypto");

const SLUG = cfg.GTMC_SLUG;
const TABLE = "gtmc_registrations";
const MANUAL = "gtmc_manual_certificates";
const FEE = 30;
const PAGE = "/event-gtmc";
const NAME = "Swayam directed by ASTRA - Web Designing (GTMC)";
const PRN_RE = /^[A-Za-z0-9]{6,20}$/;
const ORDER_ID_RE = /^GTMC_[A-Za-z0-9_-]{6,60}$/;
const BRANCH_RE = /^[A-Za-z0-9][A-Za-z0-9 &.,()\/+-]{1,49}$/;   // typed by the student, 2-50 chars

// Certificate ID: SWY26- + 8 random characters (no 0/O/1/I so it is easy to read out). 32 symbols divide 256, so no bias.
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCertId() { let s = ""; for (const x of randomBytes(8)) s += ID_ALPHABET[x % 32]; return "SWY26-" + s; }

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
const cleanPhone = (v) => String(v || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

function makeGtmcHandlers({ admin, cashfree, env, getUserFromRequest, log = console }) {
  const siteUrl = () => (env.SITE_URL || "https://studybuddypro-psi.vercel.app").replace(/\/$/, "");

  // Details travel inside the Cashfree order (order_tags): no DB row exists until the payment is confirmed.
  function detailsFrom(order, customer) {
    const t = (order && order.order_tags) || {};
    const c = customer || {};
    return {
      slug: String(t.event || ""),
      prn: String(t.prn || "").trim().toUpperCase(),
      name: String(t.name || c.customer_name || "").trim(),
      phone: String(t.phone || c.customer_phone || "").trim(),
      course: String(t.course || ""),
      year: Number(t.year) || null,
      branch: String(t.branch || ""),
      track: String(t.track || ""),
    };
  }

  async function markPaid(orderId, paymentId, paidAmount, raw, order, customer) {
    const pid = paymentId ? String(paymentId) : null;
    const d = detailsFrom(order, customer);
    if (d.slug !== SLUG || !PRN_RE.test(d.prn) || !cfg.gtmcTrackOf(d.track) || !cfg.gtmcYearOk(d.course, d.year))
      return { ok: false, reason: "unknown_order" };
    if (Number(paidAmount) < FEE) return { ok: false, reason: "amount_mismatch" };

    const base = {
      prn: d.prn, full_name: d.name, phone: d.phone, course: d.course, year_of_study: d.year, branch: d.branch,
      track: d.track, amount: FEE, gateway_order_id: orderId, gateway_payment_id: pid, raw,
    };
    const ins = await admin().from(TABLE).insert({ ...base, status: "paid", paid_at: new Date().toISOString() });
    if (!ins.error) return { ok: true };
    if (ins.error.code === "23505") {
      // verify + webhook raced on the same order, or this PRN is already paid.
      const { data: again } = await admin().from(TABLE).select("id,status").eq("gateway_order_id", orderId).maybeSingle();
      if (again) return again.status === "paid" ? { ok: true, already: true } : { ok: false, reason: "duplicate_paid" };
      const dup = await admin().from(TABLE).insert({ ...base, status: "duplicate_paid" });
      if (dup.error) { log.error("gtmc dup insert", dup.error); return { ok: false, reason: "db_error" }; }
      return { ok: false, reason: "duplicate_paid" };
    }
    log.error("gtmc markPaid insert", ins.error);
    return { ok: false, reason: "db_error" };
  }

  const register = async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try {
      const b = req.body || {};
      if (Date.now() >= Date.parse(cfg.GTMC_REGISTRATION_CLOSES_AT)) return res.status(403).json({ message: "Registration is closed." });
      const prn = String(b.prn || "").trim().toUpperCase();
      const name = String(b.name || "").trim().replace(/\s+/g, " ");
      const phone = cleanPhone(b.phone);
      const course = String(b.course || "");
      const year = Number(b.year);
      const branch = String(b.branch || "").trim().replace(/\s+/g, " ");
      const trackId = String(b.track || "");
      if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
      if (name.length < 3 || name.length > 80) return res.status(400).json({ message: "अपना पूरा नाम डालें।" });
      if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "सही 10 अंकों का mobile number डालें।" });
      if (!cfg.gtmcCourseOf(course)) return res.status(400).json({ message: "Polytechnic या Engineering चुनें।" });
      if (!cfg.gtmcYearOk(course, year)) return res.status(400).json({ message: "अपना year चुनें।" });
      if (!BRANCH_RE.test(branch)) return res.status(400).json({ message: "अपनी branch लिखें (2 से 50 अक्षर)।" });
      if (!cfg.gtmcTrackOf(trackId)) return res.status(400).json({ message: "Competition category चुनें।" });

      const { data: paid } = await admin().from(TABLE).select("id").eq("prn", prn).eq("status", "paid").limit(1);
      if (paid && paid.length) return res.status(409).json({ message: "यह PRN पहले से registered है। दोबारा payment की ज़रूरत नहीं। नीचे वाले 'पहले से registered हैं?' बटन से अपना Order ID देखें।" });

      const orderId = "GTMC_" + Date.now() + "_" + require("crypto").randomBytes(4).toString("hex");
      try {
        const order = await cashfree.createOrder({
          order_id: orderId, order_amount: FEE, order_currency: "INR",
          customer_details: { customer_id: "GTMC_" + prn, customer_name: name, customer_phone: phone },
          order_note: NAME,
          order_tags: { event: SLUG, track: trackId, prn, name: name.slice(0, 80), phone, course, year: String(year), branch: branch.slice(0, 50) },
          order_meta: {
            return_url: siteUrl() + "/api/event?action=gtmc-verify&order_id={order_id}",
            notify_url: siteUrl() + "/api/event?action=gtmc-webhook",
          },
        });
        return res.status(200).json({ order_id: orderId, payment_session_id: order.payment_session_id });
      } catch (e) {
        log.error("gtmc createOrder", e);
        return res.status(500).json({ message: "Could not create the payment. Please try again." });
      }
    } catch (err) {
      log.error("gtmc-register error:", err);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  };

  // "Already registered?" — PRN + the registration mobile number must both match a PAID row.
  const lookup = async (req, res) => {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try {
      const b = req.body || {};
      const prn = String(b.prn || "").trim().toUpperCase();
      const phone = cleanPhone(b.phone);
      if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
      if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "सही 10 अंकों का mobile number डालें।" });
      const { data } = await admin().from(TABLE).select("gateway_order_id").eq("prn", prn).eq("phone", phone).eq("status", "paid").limit(1);
      if (!data || !data.length) return res.status(404).json({ message: "इस PRN और mobile number से कोई paid registration नहीं मिला। Registration के समय वाला ही number डालें।" });
      return res.status(200).json({ order_id: data[0].gateway_order_id });
    } catch (err) {
      log.error("gtmc-lookup error:", err);
      return res.status(500).json({ message: "कुछ गड़बड़ हो गई। दोबारा try करें।" });
    }
  };

  const verify = async (req, res) => {
    setCors(res);
    const orderId = String((req.query && req.query.order_id) || "");
    const to = (status) => res.redirect(302, `${PAGE}?status=${status}&order_id=${encodeURIComponent(orderId)}`);
    try {
      if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ message: "Invalid order." });
      const cf = await cashfree.getOrder(orderId);
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
      log.error("gtmc-verify error:", err);
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
      if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") return res.status(200).json({ message: "Event ignored" });
      const pay = event.data.payment || {};
      if (pay.payment_status !== "SUCCESS") return res.status(200).json({ message: "Ignored" });
      const r = await markPaid(String(orderId), pay.cf_payment_id, pay.payment_amount, event, event.data.order, event.data.customer_details);
      if (!r.ok && r.reason === "db_error") return res.status(500).json({ error: "retry" });
      return res.status(200).json({ success: r.ok, reason: r.reason });
    } catch (err) {
      log.error("gtmc-webhook error:", err);
      return res.status(500).json({ error: "retry" });
    }
  };

  // ON/OFF switch for certificates, flipped from the Master page (backend action "master-gtmc-certificates"). Stored in site_config (key "gtmc_certificates", value {open:true|false}); default OFF.
  const CERT_KEY = "gtmc_certificates";
  async function certificatesOpen() {
    const { data } = await admin().from("site_config").select("value").eq("key", CERT_KEY).maybeSingle();
    return !!(data && data.value && data.value.open === true);
  }
  // Gives a paid registration its permanent certificate ID (only the first call creates it; later calls return the saved one).
  async function ensureRegCertId(prn, current) {
    let id = current || "";
    for (let i = 0; !id && i < 6; i++) {
      const up = await admin().from(TABLE).update({ certificate_id: newCertId() }).eq("prn", prn).eq("status", "paid").is("certificate_id", null).select("certificate_id");
      if (up.error) {
        if (up.error.code === "23505") continue;                       // that random ID already exists elsewhere: try another
        log.error("gtmc-certificate update", up.error); return "";
      }
      if (up.data && up.data.length) return up.data[0].certificate_id;
      const again = await admin().from(TABLE).select("certificate_id").eq("prn", prn).eq("status", "paid").limit(1);   // another request saved it first
      id = (again.data && again.data[0] && again.data[0].certificate_id) || "";
    }
    return id;
  }

  // ───────── shared helpers for the 4 certificate endpoints ─────────
  const ERR_GENERIC = { ok: false, code: 500, message: "कुछ गड़बड़ हो गई। दोबारा try करें।" };
  const bad = (code, message) => ({ ok: false, code, message });
  function preflight(req, res) {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "OPTIONS") { res.status(200).end(); return false; }
    if (req.method !== "POST") { res.status(405).json({ message: "Method not allowed" }); return false; }
    return true;
  }

  // STUDENT: certificate data for a PAID registration, only while the Master-page switch is ON.
  async function studentCertData(body) {
    if (!(await certificatesOpen())) return bad(403, "Certificates अभी उपलब्ध नहीं हैं। Event के बाद यहीं से download कर पाएँगे।");
    const prn = String((body || {}).prn || "").trim().toUpperCase();
    if (!PRN_RE.test(prn)) return bad(400, "सही PRN / EN number डालें।");
    const sel = await admin().from(TABLE).select("prn, full_name, branch, course, year_of_study, certificate_id").eq("prn", prn).eq("status", "paid").limit(1);
    if (sel.error) { log.error("gtmc-certificate select", sel.error); return ERR_GENERIC; }
    if (!sel.data || !sel.data.length) return bad(404, "इस PRN / EN से कोई paid registration नहीं मिला। Registration वाला ही PRN डालें।");
    const r = sel.data[0];
    const id = await ensureRegCertId(prn, r.certificate_id);
    if (!id) return bad(500, "Certificate ID नहीं बन पाई। दोबारा try करें।");
    const c = cfg.gtmcCourseOf(r.course);
    const y = c && c.years.find((x) => x.v === Number(r.year_of_study));
    return { ok: true, data: { name: r.full_name, prn: r.prn, branch: r.branch, year: y ? y.t : String(r.year_of_study || ""), certificate_id: id } };
  }

  // ADMIN (Master page): typed details -> certificate data with a permanent ID. One PRN/EN = one ID, always.
  // If that PRN is a paid registration its registration ID is used, otherwise the ID is kept in gtmc_manual_certificates.
  async function manualCertData(req) {
    const user = getUserFromRequest ? await getUserFromRequest(req) : null;
    if (!user) return bad(401, "Pehle admin account se login karein.");
    const { data: prof } = await admin().from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!prof || !["admin", "superadmin", "master"].includes(prof.role)) return bad(403, "Sirf admin manual certificate bana sakte hain.");
    const b = req.body || {};
    const clean = (v, max) => String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
    const name = clean(b.name, 80), branch = clean(b.branch, 60), year = clean(b.year, 30), prn = String(b.prn || "").trim().toUpperCase();
    if (name.length < 2 || !branch || !year) return bad(400, "Name, Branch aur Year teeno bharna zaroori hai.");
    if (!PRN_RE.test(prn)) return bad(400, "Sahi PRN / EN number daalein (6-20 letters/numbers).");

    let id = "";
    const reg = await admin().from(TABLE).select("certificate_id").eq("prn", prn).eq("status", "paid").limit(1);
    if (reg.data && reg.data.length) {
      id = await ensureRegCertId(prn, reg.data[0].certificate_id);          // same person, same ID as on the website
    } else {
      const have = await admin().from(MANUAL).select("certificate_id").eq("prn", prn).maybeSingle();
      if (have.error) { log.error("gtmc-manual select", have.error); return have.error.code === "42P01" ? bad(500, "Table gtmc_manual_certificates nahi mili. Pehle SQL chalayein (gtmc-certificate-id.sql).") : ERR_GENERIC; }
      id = (have.data && have.data.certificate_id) || "";
      for (let i = 0; !id && i < 6; i++) {
        const cand = newCertId();
        const taken = await admin().from(TABLE).select("prn").eq("certificate_id", cand).limit(1);
        if (taken.data && taken.data.length) continue;
        const ins = await admin().from(MANUAL).insert({ prn, certificate_id: cand, full_name: name, branch, year_label: year, created_by: user.id });
        if (!ins.error) { id = cand; break; }
        if (ins.error.code !== "23505") { log.error("gtmc-manual insert", ins.error); return ERR_GENERIC; }
        const again = await admin().from(MANUAL).select("certificate_id").eq("prn", prn).maybeSingle();   // same PRN saved by a parallel click, or ID clash
        id = (again.data && again.data.certificate_id) || "";
      }
      if (id) await admin().from(MANUAL).update({ full_name: name, branch, year_label: year }).eq("prn", prn);   // keep latest typed details, ID never changes
    }
    if (!id) return bad(500, "Certificate ID nahi ban payi. Dobara try karein.");
    return { ok: true, data: { name, prn, branch, year, certificate_id: id } };
  }

  // Builds the PDF from VERIFIED data on the server and signs it (lib/gtmc-certificate-pdf.js + lib/sign-pdf.js).
  // A PDF is never accepted from the browser, so nobody can get a forged document signed with your key.
  async function sendSignedPdf(res, data) {
    if (!env.SIGN_P12_BASE64 && !env.SIGN_P12_PATH) return res.status(503).json({ message: "Digital signing abhi setup nahi hai (Vercel me SIGN_P12_BASE64 aur SIGN_P12_PASSWORD daalein)." });
    let build, sign;
    try { build = require("./gtmc-certificate-pdf").buildCertificatePdf; sign = require("./sign-pdf").signPdf; }
    catch (e) { log.error("gtmc-pdf modules", e); return res.status(500).json({ message: "PDF modules load nahi hue (package.json dependencies install honi chahiye)." }); }
    // Two separate stages so a PDF-building problem (images, fonts) is never reported as a bad .p12 / password.
    let unsigned, signed;
    try { unsigned = await build(data); }
    catch (e) { log.error("gtmc-pdf build", e && e.message); return res.status(500).json({ message: "Certificate PDF ban nahi payi (server error). Admin ko batayein.", code: "PDF_BUILD_FAILED" }); }
    try { signed = await sign(unsigned); }
    catch (e) {
      const msg = String((e && e.message) || e);
      log.error("gtmc-pdf sign", msg);   // message only: never log the p12 / password
      if (/No \.p12 provided/i.test(msg)) return res.status(503).json({ message: "Digital signing abhi setup nahi hai (SIGN_P12_BASE64 / SIGN_P12_PASSWORD).", code: "SIGN_NOT_CONFIGURED" });
      if (/invalid password|mac could not be verified|mac verif|pkcs#?12|pkcs12|asn\.1|too few bytes|unsupported|cannot read|certificate\/key|no private key|no certificate/i.test(msg))
        return res.status(500).json({ message: "PDF sign nahi ho payi: .p12 file ya password galat/unsupported hai. Env SIGN_P12_BASE64 aur SIGN_P12_PASSWORD check karein.", code: "SIGN_P12_INVALID" });
      if (/placeholder/i.test(msg)) return res.status(500).json({ message: "PDF sign nahi ho payi: signature placeholder chhota hai (certificate chain badi hai).", code: "SIGN_PLACEHOLDER" });
      return res.status(500).json({ message: "PDF sign nahi ho payi (signing step error). Server logs dekhein.", code: "SIGN_FAILED" });
    }
    const file = "Swayam_Certificate_" + String(data.name).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") + ".pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="' + file + '"');
    res.setHeader("Content-Length", String(signed.length));
    return res.status(200).end(signed);
  }

  const wrap = (fn) => async (req, res) => {
    if (!preflight(req, res)) return;
    try { await fn(req, res); }
    catch (err) { log.error("gtmc-certificate error:", err); return res.status(500).json({ message: ERR_GENERIC.message }); }
  };
  const answerJson = (res, r) => (r.ok ? res.status(200).json(r.data) : res.status(r.code).json({ message: r.message }));

  const certificate = wrap(async (req, res) => answerJson(res, await studentCertData(req.body)));
  const manualCertificate = wrap(async (req, res) => answerJson(res, await manualCertData(req)));
  const certificatePdf = wrap(async (req, res) => { const r = await studentCertData(req.body); return r.ok ? sendSignedPdf(res, r.data) : answerJson(res, r); });
  const manualCertificatePdf = wrap(async (req, res) => { const r = await manualCertData(req); return r.ok ? sendSignedPdf(res, r.data) : answerJson(res, r); });

  return { register, verify, webhook, lookup, certificate, manualCertificate, certificatePdf, manualCertificatePdf };
}

module.exports = { makeGtmcHandlers };
