#!/usr/bin/env node
/**
 * scripts/check-firebase-rules.js — READ-ONLY probe: can an anonymous person on the internet read your Firebase data?
 *
 *   node scripts/check-firebase-rules.js
 *   node scripts/check-firebase-rules.js --db=https://<project>-default-rtdb.firebaseio.com --project=<project-id>
 *
 * Needs internet. It sends only GET requests (never writes). It cannot test WRITE rules — for that use
 * Firebase console -> Rules -> "Rules Playground" (see docs/FIREBASE-RULES.md).
 * HTTP 200 = anyone can read it (BAD for private data) · 401/403 = locked (good).
 */
const arg = (n, d) => (process.argv.find((a) => a.startsWith("--" + n + "=")) || "").split("=").slice(1).join("=") || d;
const DB = arg("db", "https://students-e5183-default-rtdb.firebaseio.com").replace(/\/+$/, "");
const PROJECT = arg("project", "students-e5183");

const RTDB_PATHS = ["", "users", "premium", "site_config", "SY", "TY", "orders", "payments", "agni_training"];
const FS_COLLECTIONS = ["users", "rooms", "quizRooms", "orders", "payments", "agni_training"];
// private-looking data that must NOT be world-readable; site_config / SY / TY are normally public content
const PRIVATE = new Set(["", "users", "premium", "orders", "payments", "agni_training", "quizRooms"]);

async function probe(url) {
  try { const r = await fetch(url, { headers: { Accept: "application/json" } }); return r.status; }
  catch (e) { return "ERR " + e.message; }
}

(async () => {
  const rows = [];
  for (const p of RTDB_PATHS) {
    const s = await probe(`${DB}/${p ? p + "/" : ""}.json?shallow=true`);
    rows.push(["RTDB", "/" + p, s]);
  }
  for (const c of FS_COLLECTIONS) {
    const s = await probe(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${c}?pageSize=1`);
    rows.push(["Firestore", c, s]);
  }
  let bad = 0;
  for (const [kind, p, s] of rows) {
    const open = s === 200;
    const name = p.replace(/^\//, "");
    const verdict = open ? (PRIVATE.has(name) ? "❌ OPEN — anyone can read" : "⚠️ open (ok only if this is public content)") : (s === 401 || s === 403 ? "✅ locked" : s === 404 ? "— not found" : "? " + s);
    if (open && PRIVATE.has(name)) bad++;
    console.log(kind.padEnd(10), p.padEnd(16), String(s).padEnd(6), verdict);
  }
  console.log(bad ? `\n${bad} private path(s) are world-readable. Fix the rules NOW (docs/FIREBASE-RULES.md).` : "\nNo private path is world-readable from this probe. Still test WRITE rules in the Rules Playground.");
  process.exit(bad ? 1 : 0);
})();
