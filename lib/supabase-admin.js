// lib/supabase-admin.js — SERVER-ONLY Supabase access (service_role). Never import from browser code.
const { createClient } = require("@supabase/supabase-js");

let _admin = null;
function admin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

// Resolves the caller from "Authorization: Bearer <supabase access token>".
// The token is validated by Supabase Auth — identity is never read from the request body.
async function getUserFromRequest(req) {
  const m = (req.headers && req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const { data, error } = await admin().auth.getUser(m[1]);
  return error || !data || !data.user ? null : data.user;
}

// Client that acts AS the caller (their JWT): auth.uid() / RLS / SECURITY DEFINER checks
// inside Postgres apply to every call made through it. Needs SUPABASE_ANON_KEY on the server.
function userClient(token) {
  const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY not set");
  return createClient(url, anon, {
    global: { headers: token ? { Authorization: "Bearer " + token } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = { admin, getUserFromRequest, userClient };
