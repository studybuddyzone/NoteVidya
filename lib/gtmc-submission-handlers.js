// lib/gtmc-submission-handlers.js — GTMC (college level) Submission portal + Review portal.
//   Student : verify PRN (must be a PAID row of gtmc_registrations) -> upload ONE .zip (max 3 MB) into the private Supabase bucket.
//   Staff   : list submissions, download a zip (short-lived signed link), save score + remarks.
// Needs sql/gtmc-submission.sql to be run first.
const cfg = require("./event-config");
const { STAFF_ROLES } = require("./authz");

const TABLE = "gtmc_registrations";
const BUCKET = "gtmc-submissions";
const MAX_BYTES = 3 * 1024 * 1024;                       // 3 MB hard limit (also set on the bucket by the SQL file)
const PRN_RE = /^[A-Za-z0-9]{6,20}$/;
const COLS = "prn, full_name, branch, course, year_of_study, phone, topic_id, topic_title, topic_category, submission_path, submission_name, submission_size, submission_link, submitted_at, review_score, review_remarks, reviewed_at, created_at";
const NOT_PAID = "इस PRN से कोई paid registration नहीं मिला। Registration वाला ही PRN डालें।";
const ERR = "कुछ गड़बड़ हो गई। दोबारा try करें।";
const LINK_MAX = 500;
const LINK_MSG = "सही website link डालें (http:// या https:// से शुरू होने वाली)।";
// Accepts only a real http(s) URL with a dotted host; returns the normalised string or null. (No javascript:, data:, file: etc.)
function cleanLink(v) {
  let t = String(v || "").trim();
  if (!t || t.length > LINK_MAX || /\s/.test(t)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;     // "mysite.vercel.app" -> https://mysite.vercel.app
  let u; try { u = new URL(t); } catch (e) { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname) && !/^\[[0-9a-f:]+\]$/i.test(u.hostname)) return null;
  return u.toString();
}
const isZip = (b) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;   // "PK\x03\x04"

function setCors(res, req) {
  require("./cors").applyCors(req, res, { methods: "POST, GET, OPTIONS", headers: "Content-Type, Authorization" });
  res.setHeader("Cache-Control", "no-store");
}

function makeSubmissionHandlers({ admin, env, getUserFromRequest, log = console }) {
  const courseYear = (r) => { const c = cfg.gtmcCourseOf(r.course); const y = c && c.years.find((x) => x.v === Number(r.year_of_study)); return (c ? c.title : "") + (y ? " · " + y.t : ""); };
  const topicOf = (r) => { if (!r.topic_id) return null; const k = cfg.gtmcTopicOf(r.topic_id); return { id: r.topic_id, title: k ? k.title : r.topic_title, category: k ? k.category : r.topic_category }; };
  const closesAt = () => (cfg.GTMC_SUBMISSION_CLOSES_AT ? Date.parse(cfg.GTMC_SUBMISSION_CLOSES_AT) : null);
  const isOpen = () => { const t = closesAt(); return !t || Date.now() < t; };
  const mine = (r) => ({
    name: r.full_name, prn: r.prn, branch: r.branch, course_year: courseYear(r), topic: topicOf(r),
    submitted_at: r.submitted_at || null, submission_name: r.submission_name || null, submission_size: r.submission_size || null, submission_link: r.submission_link || null,
    open: isOpen(), closes_at: cfg.GTMC_SUBMISSION_CLOSES_AT || null, max_bytes: MAX_BYTES,
  });

  async function findPaid(prn) {
    const sel = await admin().from(TABLE).select(COLS).eq("prn", prn).eq("status", "paid").limit(1);
    if (sel.error) { log.error("gtmc-submission select", sel.error); return { error: true }; }
    return { row: sel.data && sel.data[0] };
  }
  const readPrn = (req) => String(((req && req.body) || {}).prn || "").trim().toUpperCase();
  const handler = (fn) => async (req, res) => {
    setCors(res, req);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try { return await fn(req, res); }
    catch (err) { log.error("gtmc-submission error:", err); return res.status(500).json({ message: ERR }); }
  };

  // ───────── STUDENT ─────────
  const verify = handler(async (req, res) => {
    const prn = readPrn(req);
    if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
    const f = await findPaid(prn);
    if (f.error) return res.status(500).json({ message: ERR });
    if (!f.row) return res.status(404).json({ message: NOT_PAID });
    return res.status(200).json(mine(f.row));
  });

  const upload = handler(async (req, res) => {
    const b = req.body || {};
    const prn = readPrn(req);
    if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
    if (!isOpen()) return res.status(403).json({ message: "Submission की तारीख़ खत्म हो चुकी है।" });
    const f = await findPaid(prn);
    if (f.error) return res.status(500).json({ message: ERR });
    if (!f.row) return res.status(404).json({ message: NOT_PAID });

    const link = cleanLink(b.link);
    if (!link) return res.status(400).json({ message: LINK_MSG });

    const filename = String(b.filename || "");
    if (!/\.zip$/i.test(filename)) return res.status(400).json({ message: "सिर्फ़ .zip file चलेगी।" });
    const b64 = String(b.data || "");
    if (!b64) return res.status(400).json({ message: "File खाली है।" });
    if (b64.length > Math.ceil(MAX_BYTES * 4 / 3) + 16) return res.status(413).json({ message: "File 3 MB से बड़ी है। Zip छोटा करके दोबारा upload करें।" });
    const buf = Buffer.from(b64, "base64");
    if (!buf.length) return res.status(400).json({ message: "File खाली है।" });
    if (buf.length > MAX_BYTES) return res.status(413).json({ message: "File 3 MB से बड़ी है। Zip छोटा करके दोबारा upload करें।" });
    if (!isZip(buf)) return res.status(400).json({ message: "यह सही .zip file नहीं लग रही। File जाँचकर दोबारा upload करें।" });

    const path = prn + ".zip";                           // one file per PRN; a re-upload replaces it
    const up = await admin().storage.from(BUCKET).upload(path, buf, { contentType: "application/zip", upsert: true });
    if (up.error) {
      log.error("gtmc-submission upload", up.error);
      const missing = /bucket not found/i.test(String(up.error.message || ""));
      return res.status(500).json({ message: missing ? "Storage bucket नहीं मिला। Admin को बताएँ (sql/gtmc-submission.sql चलाना बाकी है)।" : "Upload नहीं हो पाया। दोबारा try करें।" });
    }
    const safeName = filename.replace(/[^\w.\- ]+/g, "_").slice(-100);
    const now = new Date().toISOString();
    const upd = await admin().from(TABLE).update({ submission_path: path, submission_name: safeName, submission_size: buf.length, submission_link: link, submitted_at: now })
      .eq("prn", prn).eq("status", "paid").select("prn");
    if (upd.error) {
      log.error("gtmc-submission update", upd.error);
      return res.status(500).json({ message: upd.error.code === "42703" ? "Database में submission_link column नहीं मिला। Admin को बताएँ (sql/gtmc-submission-link.sql चलाना बाकी है)।" : "Submission record नहीं हो पाया। दोबारा try करें।" });
    }
    return res.status(200).json({ ...mine({ ...f.row, submitted_at: now, submission_name: safeName, submission_size: buf.length, submission_link: link }), replaced: !!f.row.submitted_at });
  });

  // ───────── STAFF (review portal) ─────────
  // Staff auth: the caller must send "Authorization: Bearer <Supabase access token>" (the staff member's normal site login),
  // the token is validated by Supabase Auth, and profiles.role must be one of STAFF_ROLES (moderator/admin/superadmin/master).
  // Identity and role are NEVER read from the request body. Every review route goes through this one function.
  async function requireStaff(req, res) {
    let user;
    try { user = await getUserFromRequest(req); } catch (e) { log.error("gtmc-review auth", e); res.status(500).json({ message: ERR }); return false; }
    if (!user) { res.status(401).json({ message: "Staff login जरूरी है। पहले login करें।", login_required: true }); return false; }
    const p = await admin().from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (p.error) { log.error("gtmc-review profile", p.error); res.status(500).json({ message: ERR }); return false; }
    if (!p.data || !STAFF_ROLES.includes(p.data.role)) { res.status(403).json({ message: "आपके account के पास Staff access नहीं है।", forbidden: true }); return false; }
    return true;
  }

  const reviewHandler = (fn) => handler(async (req, res) => { if (!(await requireStaff(req, res))) return; return fn(req, res); });

  const reviewList = reviewHandler(async (req, res) => {
    const sel = await admin().from(TABLE).select(COLS).eq("status", "paid").order("created_at", { ascending: true }).limit(5000);
    if (sel.error) {
      log.error("gtmc-review list", sel.error);
      return res.status(500).json({ message: sel.error.code === "42703" ? "Columns नहीं मिले। पहले sql/gtmc-submission.sql चलाएँ।" : ERR });
    }
    const rows = (sel.data || []).map((r) => ({
      prn: r.prn, name: r.full_name, branch: r.branch, course_year: courseYear(r), phone: r.phone, topic: topicOf(r),
      submitted: !!r.submission_path, submitted_at: r.submitted_at || null, file_name: r.submission_name || null, file_size: r.submission_size || null, link: r.submission_link || null,
      score: r.review_score === null || r.review_score === undefined ? null : Number(r.review_score), remarks: r.review_remarks || "", reviewed_at: r.reviewed_at || null,
    }));
    return res.status(200).json({ rows, total: rows.length, submitted: rows.filter((x) => x.submitted).length, reviewed: rows.filter((x) => x.score !== null).length });
  });

  const reviewDownload = reviewHandler(async (req, res) => {
    const prn = readPrn(req);
    if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
    const f = await findPaid(prn);
    if (f.error) return res.status(500).json({ message: ERR });
    if (!f.row || !f.row.submission_path) return res.status(404).json({ message: "इस PRN की कोई submission नहीं मिली।" });
    const dl = (f.row.submission_name || prn + ".zip").replace(/[^\w.\- ]+/g, "_");
    const s = await admin().storage.from(BUCKET).createSignedUrl(f.row.submission_path, 120, { download: prn + "_" + dl });
    if (s.error || !s.data) { log.error("gtmc-review signed url", s.error); return res.status(500).json({ message: "Download link नहीं बन पाया।" }); }
    return res.status(200).json({ url: s.data.signedUrl });
  });

  const reviewSave = reviewHandler(async (req, res) => {
    const b = req.body || {};
    const prn = readPrn(req);
    if (!PRN_RE.test(prn)) return res.status(400).json({ message: "सही PRN डालें।" });
    let score = null;
    if (b.score !== undefined && b.score !== null && String(b.score).trim() !== "") {
      score = Number(b.score);
      if (!isFinite(score) || score < 0 || score > 100) return res.status(400).json({ message: "Score 0 से 100 के बीच होना चाहिए।" });
      score = Math.round(score * 100) / 100;
    }
    const remarks = String(b.remarks || "").replace(/\r/g, "").trim().slice(0, 1000);
    const upd = await admin().from(TABLE).update({ review_score: score, review_remarks: remarks || null, reviewed_at: new Date().toISOString() })
      .eq("prn", prn).eq("status", "paid").select("prn");
    if (upd.error) { log.error("gtmc-review save", upd.error); return res.status(500).json({ message: ERR }); }
    if (!upd.data || !upd.data.length) return res.status(404).json({ message: NOT_PAID });
    return res.status(200).json({ ok: true, prn, score, remarks, reviewed_at: new Date().toISOString() });
  });

  return { verify, upload, reviewList, reviewDownload, reviewSave };
}

module.exports = { makeSubmissionHandlers };
