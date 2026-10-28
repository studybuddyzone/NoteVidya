// api/webhook.js — merged: webhook, webhook-fy1, event-webhook (all Cashfree notify_urls, same signature secret).
// Old URLs still work through the rewrites in vercel.json (event-webhook adds ?type=event).
const { makeHandlers } = require("../lib/payment-handlers");
const { makeEventHandlers } = require("../lib/event-handlers");
const { admin, getUserFromRequest } = require("../lib/supabase-admin");
const cashfree = require("../lib/cashfree");

const payment = makeHandlers({ admin, getUserFromRequest, cashfree, env: process.env });
const event = makeEventHandlers({ admin, cashfree, env: process.env });

const { withRateLimit } = require("../lib/rate-limit");

const handler = (req, res) => {
  const type = String((req.query && req.query.type) || "");
  return type === "event" ? event.webhook(req, res) : payment.webhook(req, res);
};
module.exports = withRateLimit(handler, { name: "webhook", max: 300, windowSec: 60 });
// Signature must be checked on the RAW body, so disable Vercel's body parser.
module.exports.config = { api: { bodyParser: false } };
