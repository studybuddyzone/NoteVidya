// lib/event-participant-handlers.js — Swayam phases after registration: topic selection + submission.
// Identity = PRN + Order ID of a PAID registration (the Order ID is a random secret shown after payment).
// What a participant can pick/submit depends on the category (track) they chose at registration.
// Both phases are OFF until EVENT_TOPICS_OPEN=1 / EVENT_SUBMIT_OPEN=1 are set in the environment.
const { TRACKS, DEFAULT_TRACK, trackOf, phases } = require("./event-config");

const PRN_RE = /^[A-Za-z0-9]{6,20}$/;
const ORDER_ID_RE = /^EVT_[A-Za-z0-9_-]{6,60}$/;
const BUCKET = "event-submissions";
const SLUG = "swayam";
const BAD_LOGIN = "PRN या Order ID सही नहीं है। Payment के बाद मिला Order ID (EVT_ से शुरू) डालें।";

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
const mbText = (n) => (n / 1048576) + " MB";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function makeParticipantHandlers({ admin, env, log = console }) {
  async function findParticipant(b) {
    const prn = String(b.prn || "").trim().toUpperCase();
    const orderId = String(b.order_id || "").trim();
    if (!PRN_RE.test(prn) || !ORDER_ID_RE.test(orderId)) return null;
    const { data } = await admin().from("event_registrations")
      .select("id,prn,full_name,branch,track,topic,idea,submitted_at,submission_size,submission_name,submission_link,submission_path")
      .eq("event_slug", SLUG).eq("prn", prn).eq("gateway_order_id", orderId).eq("status", "paid").maybeSingle();
    if (!data) return null;
    const id = trackOf(data.track || "") ? data.track : DEFAULT_TRACK;
    return { ...data, track_id: id, tr: TRACKS[id] };
  }
  const me = (p) => ({
    name: p.full_name, branch: p.branch,
    track: { id: p.track_id, title: p.tr.title, icon: p.tr.icon, submit: p.tr.submit },
    topic: p.topic || null, idea: p.idea || null,
    submitted_at: p.submitted_at || null, submission_size: p.submission_size || null,
    submission_name: p.submission_name || null, submission_link: p.submission_link || null,
  });

  const topics = async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(200).end();
    const open = phases(env).topics_open;
    if (req.method === "GET") return res.status(200).json({ open });
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try {
      if (!open) return res.status(403).json({ message: "Topic selection अभी शुरू नहीं हुआ है।" });
      const b = req.body || {};
      const p = await findParticipant(b);
      if (!p) return res.status(401).json({ message: BAD_LOGIN });
      const list = p.tr.topics || [];
      if (b.topic === undefined || b.topic === null || b.topic === "")       // login / status check
        return res.status(200).json({ ...me(p), topics: list });
      if (p.topic) return res.status(409).json({ message: "आप पहले ही topic चुन चुके हैं। इसे बदला नहीं जा सकता।", ...me(p) });
      const t = list.find((x) => x.id === String(b.topic));
      if (!t) return res.status(400).json({ message: "सूची में से एक topic चुनें।" });
      const idea = String(b.idea || "").trim().replace(/\s+/g, " ");
      if (idea.length > 300) return res.status(400).json({ message: "Idea 300 अक्षरों के अंदर लिखें।" });
      const up = await admin().from("event_registrations")
        .update({ topic: t.id, idea: idea || null, topic_chosen_at: new Date().toISOString() })
        .eq("id", p.id).is("topic", null).select("id");
      if (up.error) { log.error("event topic update", up.error); return res.status(500).json({ message: "Topic save नहीं हो पाया। दोबारा try करें।" }); }
      if (!up.data || !up.data.length) return res.status(409).json({ message: "आप पहले ही topic चुन चुके हैं।" });
      return res.status(200).json({ ...me(p), topic: t.id, idea: idea || null, topics: list });
    } catch (err) {
      log.error("event-topics error:", err);
      return res.status(500).json({ message: "कुछ गड़बड़ हो गई। दोबारा try करें।" });
    }
  };

  const submit = async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
    try {
      if (!phases(env).submit_open) return res.status(403).json({ message: "Submission अभी शुरू नहीं हुआ है।" });
      const b = req.body || {};
      const p = await findParticipant(b);
      if (!p) return res.status(401).json({ message: BAD_LOGIN });
      const spec = p.tr.submit;
      const has = (v) => v !== undefined && v !== null && v !== "";
      if (!has(b.data) && !has(b.link)) return res.status(200).json(me(p));   // login / status check
      const had = !!p.submitted_at;
      const now = new Date().toISOString();

      if (spec.kind === "link") {
        const link = String(b.link || "").trim();
        let u = null; try { u = new URL(link); } catch (e) {}
        if (!u || u.protocol !== "https:" || link.length > 300) return res.status(400).json({ message: "सही https link डालें (YouTube, Instagram या Google Drive)।" });
        const upd = await admin().from("event_registrations").update({
          submission_link: link, submission_path: null, submission_name: null, submission_size: null, submitted_at: now,
        }).eq("id", p.id);
        if (upd.error) { log.error("event link update", upd.error); return res.status(500).json({ message: "Submission record नहीं हो पाया। दोबारा try करें।" }); }
        if (p.submission_path) await admin().storage.from(BUCKET).remove([p.submission_path]).catch(() => {});
        return res.status(200).json({ ...me(p), submission_link: link, submission_name: null, submission_size: null, submitted_at: now, replaced: had });
      }

      const filename = String(b.filename || "");
      const m = filename.match(/\.([A-Za-z0-9]{2,5})$/);
      const ext = m ? m[1].toLowerCase() : "";
      if (!spec.exts.includes(ext)) return res.status(400).json({ message: "इस category में सिर्फ़ ये file types चलेंगे: " + spec.exts.map((e) => "." + e).join(", ") });
      const b64 = String(b.data);
      if (b64.length > Math.ceil(spec.max * 1.4) + 16) return res.status(413).json({ message: "File " + mbText(spec.max) + " से बड़ी है।" });
      const buf = Buffer.from(b64, "base64");
      if (!buf.length) return res.status(400).json({ message: "File खाली है।" });
      if (buf.length > spec.max) return res.status(413).json({ message: "File " + mbText(spec.max) + " से बड़ी है। उसे छोटा करके दोबारा upload करें।" });
      if (!MAGIC[ext](buf)) return res.status(400).json({ message: "यह सही ." + ext + " file नहीं लग रही। File जाँचकर दोबारा upload करें।" });

      const path = `${SLUG}/${p.prn}.${ext}`;
      const up = await admin().storage.from(BUCKET).upload(path, buf, { contentType: MIME[ext], upsert: true });
      if (up.error) { log.error("event upload", up.error); return res.status(500).json({ message: "Upload नहीं हो पाया। दोबारा try करें।" }); }
      const safeName = filename.replace(/[^\w.\- ]+/g, "_").slice(-100);
      const upd = await admin().from("event_registrations").update({
        submission_path: path, submission_size: buf.length, submission_name: safeName, submission_link: null, submitted_at: now,
      }).eq("id", p.id);
      if (upd.error) { log.error("event submit update", upd.error); return res.status(500).json({ message: "Submission record नहीं हो पाया। दोबारा try करें।" }); }
      if (p.submission_path && p.submission_path !== path) await admin().storage.from(BUCKET).remove([p.submission_path]).catch(() => {});
      return res.status(200).json({ ...me(p), submission_link: null, submission_name: safeName, submission_size: buf.length, submitted_at: now, replaced: had });
    } catch (err) {
      log.error("event-submit error:", err);
      return res.status(500).json({ message: "कुछ गड़बड़ हो गई। दोबारा try करें।" });
    }
  };

  return { topics, submit };
}

module.exports = { makeParticipantHandlers };
