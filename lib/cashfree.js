// lib/cashfree.js — thin Cashfree PG client (server-only; secrets come from env).
const crypto = require("crypto");

const API_VERSION = "2023-08-01";
function base() {
  return process.env.CASHFREE_ENV === "sandbox" ? "https://sandbox.cashfree.com" : "https://api.cashfree.com";
}
function headers() {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) throw new Error("Cashfree credentials not set");
  return {
    "Content-Type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": process.env.CASHFREE_APP_ID,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  };
}
async function call(method, path, body) {
  const res = await fetch(base() + path, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch (e) { /* non-JSON */ }
  if (!res.ok) { const err = new Error((data && data.message) || "cashfree_http_" + res.status); err.status = res.status; throw err; }
  return data;
}

const createOrder = (payload) => call("POST", "/pg/orders", payload);
const getOrder = (orderId) => call("GET", "/pg/orders/" + encodeURIComponent(orderId));
const getOrderPayments = (orderId) => call("GET", "/pg/orders/" + encodeURIComponent(orderId) + "/payments");

// Cashfree signs: base64( HMAC-SHA256( secret, timestamp + RAW_BODY ) ).
// It MUST be computed over the exact raw bytes received, not JSON.stringify(parsedBody).
function verifyWebhookSignature(rawBody, timestamp, signature, secret) {
  if (!rawBody || !timestamp || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createOrder, getOrder, getOrderPayments, verifyWebhookSignature };
