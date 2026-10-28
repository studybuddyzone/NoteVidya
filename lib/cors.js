// lib/cors.js — origin allow-list instead of "Access-Control-Allow-Origin: *".
// Allowed origins = SITE_URL + ALLOWED_ORIGINS (comma separated, set in Vercel env) + the built-in list below.
// Browsers on any other website can no longer read responses from our API (native apps / curl are unaffected: they don't use CORS).
const DEFAULTS = [
  "https://studybuddypro-psi.vercel.app",
  "https://manager-public.vercel.app",
  "https://localhost",          // Capacitor / Android WebView
  "capacitor://localhost",      // iOS WebView
  "http://localhost",
  "http://localhost:3000",
];

function allowedOrigins(env) {
  const e = env || process.env;
  const list = DEFAULTS.slice();
  if (e.SITE_URL) list.push(String(e.SITE_URL).replace(/\/+$/, ""));
  if (e.ALLOWED_ORIGINS) for (const o of String(e.ALLOWED_ORIGINS).split(",")) if (o.trim()) list.push(o.trim().replace(/\/+$/, ""));
  return list;
}

// Sets the CORS headers. `headers` = value for Access-Control-Allow-Headers. Returns true if the Origin was allowed (or absent).
function applyCors(req, res, { methods = "POST, GET, OPTIONS", headers = "Content-Type, Authorization", env } = {}) {
  const origin = String((req && req.headers && req.headers.origin) || "");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);
  if (!origin) return true;                         // same-origin / server-to-server / native: no CORS needed
  if (allowedOrigins(env).includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    return true;
  }
  return false;                                     // header not set => browser blocks the response
}

module.exports = { applyCors, allowedOrigins, DEFAULTS };
