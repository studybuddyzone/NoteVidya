// /api/event?action=<register|verify|webhook|lookup|topics|submit|info> — ONE serverless function for the whole Swayam event
// (keeps the project under Vercel's function-count limit). Logic lives in lib/event-handlers.js and lib/event-participant-handlers.js.
const cfg = require("../lib/event-config");
const { makeEventHandlers } = require("../lib/event-handlers");
const { makeGtmcHandlers } = require("../lib/gtmc-handlers");
const { makeSubmissionHandlers } = require("../lib/gtmc-submission-handlers");
const { makeParticipantHandlers } = require("../lib/event-participant-handlers");
const { readRawBody } = require("../lib/payment-handlers");
const { admin, getUserFromRequest } = require("../lib/supabase-admin");

const reg = makeEventHandlers({ admin, cashfree: require("../lib/cashfree"), env: process.env });
const gt = makeGtmcHandlers({ admin, cashfree: require("../lib/cashfree"), env: process.env, getUserFromRequest });
const sub = makeSubmissionHandlers({ admin, env: process.env, getUserFromRequest });
const part = makeParticipantHandlers({ admin, env: process.env });

const info = (req, res) => {
  require("../lib/cors").applyCors(req, res, { methods: "GET, OPTIONS", headers: "Content-Type" });
  res.setHeader("Cache-Control", "no-store");
  if (String((req.query && req.query.event) || "") === cfg.GTMC_SLUG)
    return res.status(200).json({ closes_at: cfg.GTMC_REGISTRATION_CLOSES_AT, now: new Date().toISOString(), tracks: cfg.gtmcPublicTracks(), courses: cfg.gtmcCourses(), topics_open: Date.now() < Date.parse(cfg.GTMC_TOPICS_CLOSE_AT), topics_closes_at: cfg.GTMC_TOPICS_CLOSE_AT, submit_open: false });
  res.status(200).json({ closes_at: cfg.REGISTRATION_CLOSES_AT, now: new Date().toISOString(), tracks: cfg.publicTracks(), ...cfg.phases(process.env) });
};

const ROUTES = { register: reg.register, verify: reg.verify, webhook: reg.webhook, lookup: reg.lookup, topics: part.topics, submit: part.submit, info,
  "gtmc-register": gt.register, "gtmc-verify": gt.verify, "gtmc-webhook": gt.webhook, "gtmc-lookup": gt.lookup, "gtmc-certificate": gt.certificate, "gtmc-manual-certificate": gt.manualCertificate, "gtmc-certificate-pdf": gt.certificatePdf, "gtmc-manual-certificate-pdf": gt.manualCertificatePdf,
  "gtmc-topic-verify": gt.topicVerify, "gtmc-topic-assign": gt.topicAssign,
  "gtmc-submission-verify": sub.verify, "gtmc-submission-upload": sub.upload,
  "gtmc-review-list": sub.reviewList, "gtmc-review-download": sub.reviewDownload, "gtmc-review-save": sub.reviewSave };

const { withRateLimit } = require("../lib/rate-limit");

const routerHandler = async (req, res) => {
  const action = String((req.query && req.query.action) || "");
  const handler = Object.prototype.hasOwnProperty.call(ROUTES, action) ? ROUTES[action] : null;
  if (!handler) return res.status(404).json({ message: "Not found" });
  try {
    // The webhook needs the RAW body for signature checking, so body parsing is off for the whole function;
    // every other POST is parsed here.
    if (action !== "webhook" && req.method === "POST" && req.body === undefined) {
      const raw = await readRawBody(req);
      try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { return res.status(400).json({ message: "Invalid request." }); }
    }
    return await handler(req, res);
  } catch (err) {
    console.error("event router error:", err);
    return res.status(500).json({ message: "कुछ गड़बड़ हो गई। दोबारा try करें।" });
  }
};
const HEAVY = new Set(["register", "gtmc-register", "submit", "gtmc-submission-upload", "gtmc-certificate-pdf", "gtmc-manual-certificate-pdf"]);
// webhooks: 300/min; register/upload/PDF: 10/min; everything else (lookup, info, verify...): 60/min — all per IP.
module.exports = withRateLimit(routerHandler, (req) => {
  const a = String((req.query && req.query.action) || "");
  if (a === "webhook" || a === "gtmc-webhook") return { name: "event-webhook", max: 300, windowSec: 60 };
  return HEAVY.has(a) ? { name: "event-heavy", max: 10, windowSec: 60 } : { name: "event", max: 60, windowSec: 60 };
});
module.exports.config = { api: { bodyParser: false } };
