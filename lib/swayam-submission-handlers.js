// lib/swayam-submission-handlers.js  Swayam (StudyBuddyZone's own event) Submission portal, same flow as the GTMC portal.
//   Student: verify (PRN + Order ID of a PAID registration) -> upload the file for their category (or a link for link categories).
//   Coding (zip) category: website link + zip, exactly like GTMC.  Other categories: file/link as set in event-config TRACKS[].submit.
// Uses the existing event_registrations columns + event-submissions bucket  no SQL needed.
const cfg = require("./event-config");

const TABLE = "event_registrations";
const BUCKET = "event-submissions";
const SLUG = "swayam";
const PRN_RE = /^[A-Za-z0-9]{6,20}$/;
const ORDER_ID_RE = /^EVT_[A-Za-z0-9_-]{6,60}$/;
const COLS = "id, prn, full_name, branch, track, topic, submitted_at, submission_path, submission_name, submission_size, submission_link";
const BAD_LOGIN = "PRN \u0914\u0930 Order ID \u0938\u0939\u0940 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964 Payment \u0935\u093e\u0932\u0940 Order ID (EVT_ \u0938\u0947 \u0936\u0941\u0930\u0942) \u0921\u093e\u0932\u0947\u0902\u0964";
const ERR = "\u0915\u0941\u091b \u0917\u0932\u0924 \u0939\u094b \u0917\u092f\u093e\u0964 \u0915\u0943\u092a\u092f\u093e try \u0915\u0930\u0947\u0902\u0964";
const LINK_MAX = 500;

const isZip = (b) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const isJpg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const MAGIC = {
  zip: isZip, docx: isZip, pptx: isZip, jpg: isJpg, jpeg: isJpg,
  pdf: (b) => b.length > 5 && b.slice(0, 5).toString("latin1") === "%PDF-",
  png: (b) => b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  svg: (b) => /<svg[\s>]/i.test(b.slice(0, 4096).toString("utf8")),
};
const MIME = {
  zip: "application/zip", pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
// http(s) URL with a dotted host only (no javascript:, data:, file: ...). Returns normalised string or null.
function cleanLink(v) {
  let t = String(v || "").trim();
  if (!t || t.length > LINK_MAX || /\s/.test(t)) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;
  let u; try { u = new URL(t); } catch (e) { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null;
  return u.toString();
}
const needsLink = (spec) => spec.kind === "file" && spec.exts.length === 1 && spec.exts[0] === "zip";   // website (zip) category = link + zip, like GTMC

function setCors(res, req) {
  require("./cors").applyCors(req, res, { methods: "POST, GET, OPTIONS", headers: "Content-Type" });
  res.setHeader("Cache-Control", "no-store");
}

function makeSwayamSubmissionHandlers({ admin, env, log = console }) {
  const closesAt = () => (cfg.SUBMISSION_CLOSES_AT ? Date.parse(cfg.SUBMISSION_CLOSES_AT) : null);
  const isOpen = () => { if (!cfg.phases(env).submit_open) return false; const t = closesAt(); return !t || Date.now() < t; };

  async function findPaid(b) {
    const prn = String(b.prn || "").trim().toUpperCase();
    const orderId = String(b.order_id || "").trim();
    if (!PRN_RE.test(prn) || !ORDER_ID_RE.test(orderId)) return { bad: true };
    const sel = await admin().from(TABLE).select(COLS).eq("event_slug", SLUG).eq("prn", prn).eq("gateway_order_id", orderId).eq("status", "paid").limit(1);
    if (sel.error) { log.error("swayam-submission select", sel.error); return { error: true }; }
    const r = sel.data && sel.data[0];
    if (!r) return { bad: true };
    const id = cfg.trackOf(r.track || "") ? r.track : cfg.DEFAULT_TRACK;
    return { row: r, track_id: id, tr: cfg.TRACKS[id] };
  }
  const mine = (f, over) => {
    const r = { ...f.row, ...(over || {}) };
    return {
      name: r.full_name, prn: r.prn, branch: r.branch,
      track: { id: f.track_id, title: f.tr.title, icon: f.tr.icon, submit: f.tr.submit, needs_link: needsLink(f.tr.submit) },
      topic: r.topic || null,
      submitted_at: r.submitted_at || null, submission_name: r.submission_name || null, submission_size: r.submission_size || null, submission_link: r.submission_link || null,
      open: isOpen(), closes_at: cfg.SUBMISSION_CLOSES_AT || null,
    };
  };
  const handler = (fn) => async (req, res) => {
    setCors(res, req);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try { return await fn(req, res); }
    catch (err) { log.error("swayam-submission error:", err); return res.status(500).json({ message: ERR }); }
  };

  const verify = handler(async (req, res) => {
    const f = await findPaid(req.body || {});
    if (f.error) return res.status(500).json({ message: ERR });
    if (f.bad) return res.status(401).json({ message: BAD_LOGIN });
    return res.status(200).json(mine(f));
  });

  const upload = handler(async (req, res) => {
    const b = req.body || {};
    if (!isOpen()) return res.status(403).json({ message: "Submission \u0905\u092d\u0940 \u0916\u0941\u0932\u0940 \u0928\u0939\u0940\u0902 \u0939\u0948 \u092f\u093e \u092c\u0902\u0926 \u0939\u094b \u091a\u0941\u0915\u0940 \u0939\u0948\u0964" });
    const f = await findPaid(b);
    if (f.error) return res.status(500).json({ message: ERR });
    if (f.bad) return res.status(401).json({ message: BAD_LOGIN });
    const spec = f.tr.submit;
    const had = !!f.row.submitted_at;
    const now = new Date().toISOString();

    // link-only category (reel etc.)
    if (spec.kind === "link") {
      let u = null; const link = String(b.link || "").trim();
      try { u = new URL(link); } catch (e) {}
      if (!u || u.protocol !== "https:" || link.length > 300) return res.status(400).json({ message: "\u0938\u0939\u0940 https link \u0921\u093e\u0932\u0947\u0902 (YouTube, Instagram \u092f\u093e Google Drive)\u0964" });
      const upd = await admin().from(TABLE).update({ submission_link: link, submission_path: null, submission_name: null, submission_size: null, submitted_at: now }).eq("id", f.row.id);
      if (upd.error) { log.error("swayam-submission link", upd.error); return res.status(500).json({ message: ERR }); }
      if (f.row.submission_path) await admin().storage.from(BUCKET).remove([f.row.submission_path]).catch(() => {});
      return res.status(200).json({ ...mine(f, { submission_link: link, submission_name: null, submission_size: null, submitted_at: now }), replaced: had });
    }

    // file category
    let link = null;
    if (needsLink(spec)) {
      link = cleanLink(b.link);
      if (!link) return res.status(400).json({ message: "\u0938\u0939\u0940 website link \u0921\u093e\u0932\u0947\u0902 (\u091c\u0948\u0938\u0947 https://your-site.vercel.app)\u0964" });
    }
    const filename = String(b.filename || "");
    const m = filename.match(/\.([A-Za-z0-9]{2,5})$/);
    const ext = m ? m[1].toLowerCase() : "";
    if (!spec.exts.includes(ext)) return res.status(400).json({ message: "\u0907\u0938 category \u0915\u0947 \u0932\u093f\u090f \u0938\u093f\u0930\u094d\u092b\u093c \u092f\u0947 file types \u091a\u0932\u0924\u0947 \u0939\u0948\u0902: " + spec.exts.map((e) => "." + e).join(", ") });
    const b64 = String(b.data || "");
    if (!b64) return res.status(400).json({ message: "File \u0916\u093e\u0932\u0940 \u0939\u0948\u0964" });
    if (b64.length > Math.ceil(spec.max * 4 / 3) + 16) return res.status(413).json({ message: "File " + (spec.max / 1048576) + " MB \u0938\u0947 \u092c\u0921\u093c\u0940 \u0939\u0948\u0964" });
    const buf = Buffer.from(b64, "base64");
    if (!buf.length) return res.status(400).json({ message: "File \u0916\u093e\u0932\u0940 \u0939\u0948\u0964" });
    if (buf.length > spec.max) return res.status(413).json({ message: "File " + (spec.max / 1048576) + " MB \u0938\u0947 \u092c\u0921\u093c\u0940 \u0939\u0948\u0964" });
    if (!MAGIC[ext](buf)) return res.status(400).json({ message: "\u092f\u0939 \u0938\u0939\u0940 ." + ext + " file \u0928\u0939\u0940\u0902 \u0932\u0917\u0924\u0940\u0964 \u0926\u0942\u0938\u0930\u0940 file upload \u0915\u0930\u0947\u0902\u0964" });

    const path = SLUG + "/" + f.row.prn + "." + ext;     // one file per PRN; a re-upload replaces it
    const up = await admin().storage.from(BUCKET).upload(path, buf, { contentType: MIME[ext], upsert: true });
    if (up.error) { log.error("swayam-submission upload", up.error); return res.status(500).json({ message: "Upload \u0928\u0939\u0940\u0902 \u0939\u094b \u092a\u093e\u092f\u093e\u0964 \u0915\u0943\u092a\u092f\u093e try \u0915\u0930\u0947\u0902\u0964" }); }
    const safeName = filename.replace(/[^\w.\- ]+/g, "_").slice(-100);
    const upd = await admin().from(TABLE).update({ submission_path: path, submission_name: safeName, submission_size: buf.length, submission_link: link, submitted_at: now }).eq("id", f.row.id);
    if (upd.error) { log.error("swayam-submission update", upd.error); return res.status(500).json({ message: ERR }); }
    if (f.row.submission_path && f.row.submission_path !== path) await admin().storage.from(BUCKET).remove([f.row.submission_path]).catch(() => {});
    return res.status(200).json({ ...mine(f, { submission_path: path, submission_name: safeName, submission_size: buf.length, submission_link: link, submitted_at: now }), replaced: had });
  });

  return { verify, upload };
}

module.exports = { makeSwayamSubmissionHandlers };
