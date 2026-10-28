// api/payment.js — merged: create-order, create-order-fy1, verify-payment, verify-payment-fy1.
// Old URLs still work through the rewrites in vercel.json (they add ?action=...).
// (Webhooks live in api/webhook.js because they need the RAW body; this file needs the parsed body.)
const { makeHandlers } = require("../lib/payment-handlers");
const { admin, getUserFromRequest } = require("../lib/supabase-admin");
const h = makeHandlers({ admin, getUserFromRequest, cashfree: require("../lib/cashfree"), env: process.env });

const routes = {
  "create-order": h.createOrder("main"),
  "create-order-fy1": h.createOrder("fy"),
  "verify-payment": h.verifyPayment,
  "verify-payment-fy1": h.verifyPayment, // old return_urls of in-flight FY1 orders; catalog comes from the order row
};

const { withRateLimit } = require("../lib/rate-limit");

const handler = (req, res) => {
  const action = String((req.query && req.query.action) || "");
  const fn = Object.prototype.hasOwnProperty.call(routes, action) ? routes[action] : null;
  if (!fn) return res.status(404).json({ message: "Unknown action." });
  return fn(req, res);
};

// create-order: 10/min per IP; verify-payment: 30/min per IP.
module.exports = withRateLimit(handler, (req) => {
  const a = String((req.query && req.query.action) || "");
  return a.startsWith("create-order") ? { name: "pay-create", max: 10, windowSec: 60 } : { name: "pay-verify", max: 30, windowSec: 60 };
});
