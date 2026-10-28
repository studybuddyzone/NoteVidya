#!/usr/bin/env node
/**
 * StudyBuddyPro: Firebase -> Supabase DATA migration  (MIGRATION.md, item A2/A3/A5)
 *
 * DEFAULT = DRY RUN (nothing is written). Add --apply to write.
 * Run ONLY against a TEST Supabase project first.
 *
 * Source (pick one):
 *   --from-json=rtdb-export.json     RTDB export (Firebase console -> Realtime Database -> Export JSON)
 *   (default)                        live read with firebase-admin; needs FIREBASE_SERVICE_ACCOUNT_KEY
 *   Firestore steps (orders, solo, reval) need live firebase-admin; they are skipped with --from-json.
 *
 * Target env:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (+ SITE_URL for --send-reset)
 *
 * Options:
 *   --steps=users,config,notices,content,orders,referrals,solo,reval   (default: all, in this order)
 *   --password-mode=reset|plaintext   reset (default): random password, users must use "Forgot password".
 *                                     plaintext: re-use RTDB `confirmPassword` (it was stored in plaintext)
 *                                       so users log in unchanged. Passwords changed later via Firebase
 *                                       reset may be stale. Supabase hashes it; nothing is kept here.
 *   --send-reset                      after `users`, email a reset link to every user created in this run
 *                                     (paced; configure custom SMTP first, default SMTP is ~2-4 mails/hour)
 *   --tier-rules=rules.json           override resources.min_tier rules (see DEFAULT_TIER_RULES)
 *   --limit=N                         only first N items per step (for trial runs)
 *   --report=dir                      where reports go (default ./migration-report)
 *
 * Idempotent: every step skips rows that already exist, so it is safe to re-run after fixing errors.
 * Items marked [VERIFY] map fields I could not confirm from the repo; check them on your real data.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ----------------------------------------------------------------------------- pure helpers (unit-tested)
const STAFF = ["moderator", "admin", "superadmin", "master"];
const TIERS = ["silver", "gold", "diamond"];
const normRole = (r) => {
  const s = String(r || "").toLowerCase().replace(/[\s_-]+/g, "");
  return s || "student";
};
function toIso(v) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "object") {                       // Firestore Timestamp (admin or REST/JSON export shapes)
    if (typeof v.toDate === "function") return v.toDate().toISOString();
    const sec = v._seconds ?? v.seconds;
    if (sec !== undefined) return new Date(Number(sec) * 1000).toISOString();
    return null;
  }
  const n = Number(v);
  const d = Number.isFinite(n) && String(v).trim() !== "" ? new Date(n) : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
/** Old single `role` field -> new (role, tier, tier_expires_at). Expired tiers are dropped (tier=null). */
function mapAccess(u, now = Date.now()) {
  const r = normRole(u.role);
  const expMs = u.roleExpires !== undefined && u.roleExpires !== null && Number.isFinite(Number(u.roleExpires)) ? Number(u.roleExpires) : null;
  const since = toIso(u.premiumSince);
  if (STAFF.includes(r)) return { role: r, tier: null, tier_expires_at: null, premium_since: since, note: null };
  if (TIERS.includes(r)) {
    if (expMs !== null && expMs <= now) return { role: "student", tier: null, tier_expires_at: null, premium_since: since, note: "expired" };
    return { role: "student", tier: r, tier_expires_at: expMs !== null ? new Date(expMs).toISOString() : null, premium_since: since, note: expMs === null ? "manual-grant-no-expiry" : null };
  }
  return { role: "student", tier: null, tier_expires_at: null, premium_since: since, note: r === "student" ? null : `unknown-role:${r}` };
}
/** Validates one RTDB users/{prn} record against the Postgres CHECK constraints. Returns {ok, row|reason}. */
function validateUser(prnKey, u) {
  const prn = String(u.prn || prnKey || "").trim();
  const email = String(u.email || "").trim().toLowerCase();
  if (!/^\d{16}$/.test(prn)) return { ok: false, reason: "bad-prn" };
  if (!email.includes("@")) return { ok: false, reason: "bad-email" };
  const mobile = /^\d{10}$/.test(String(u.mobile || "").trim()) ? String(u.mobile).trim() : null;
  return { ok: true, row: { prn, email, mobile, name: String(u.name || u.displayName || "").trim() || "Student", year: String(u.year || "1") } };
}
// Resource gating. Pages gate per branch inconsistently (only CS and SY-aiml have locked groups in the
// current HTML; other branches' pages unlock everything via unlockFreeCard). Defaults below cover ONLY what
// the pages prove; anything not matched stays free and is listed under "unmatched" in the report: REVIEW IT.
// Key = "YEAR/branch/section", "YEAR/*/section" or "YEAR/branch/*"; most specific wins; value null = free.
const DEFAULT_TIER_RULES = {
  "SY/cs/sem3": "gold", "SY/cs/sem4": "gold", "SY/cs/notes": "diamond", "SY/cs/piqs": "diamond",
  "TY/cs/sem5subjects": "gold", "TY/cs/sem6subjects": "gold", "TY/cs/notes": "diamond", "TY/cs/piqs": "diamond",
  "SY/aiml/sem3": "gold", "SY/aiml/sem4": "gold", "SY/aiml/qb": "diamond", "SY/aiml/answers": "diamond",
};
function tierFor(rules, year, branch, section) {
  for (const k of [`${year}/${branch}/${section}`, `${year}/*/${section}`, `${year}/${branch}/*`]) if (k in rules) return { tier: rules[k], matched: true };
  return { tier: null, matched: false };
}
const orderCatalog = (orderId) => (String(orderId).startsWith("FY1_") ? "fy" : "main");
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const entries = (o) => (o && typeof o === "object" ? Object.entries(o) : []);

// ----------------------------------------------------------------------------- CLI / context
function parseArgs(argv) {
  const a = {};
  argv.forEach((x) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(x); if (m) a[m[1]] = m[2] === undefined ? true : m[2]; });
  return a;
}
const ALL_STEPS = ["users", "config", "notices", "content", "orders", "referrals", "solo", "reval"];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = !!args.apply;
  const steps = args.steps ? String(args.steps).split(",") : ALL_STEPS;
  const limit = args.limit ? Number(args.limit) : Infinity;
  const pwMode = args["password-mode"] || "reset";
  if (!["reset", "plaintext"].includes(pwMode)) throw new Error("--password-mode must be reset|plaintext");
  const reportDir = args.report || "./migration-report";
  fs.mkdirSync(reportDir, { recursive: true });
  const rules = Object.assign({}, DEFAULT_TIER_RULES, args["tier-rules"] ? JSON.parse(fs.readFileSync(args["tier-rules"], "utf8")) : {});

  // ---- source
  let rtdbJson = null, fb = null;
  if (args["from-json"]) rtdbJson = JSON.parse(fs.readFileSync(args["from-json"], "utf8"));
  else {
    const admin = require("firebase-admin");
    if (!admin.apps.length) admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "null")),
      databaseURL: process.env.FIREBASE_DB_URL || "https://students-e5183-default-rtdb.firebaseio.com",
    });
    fb = admin;
  }
  const rtdb = async (p) => {
    if (rtdbJson) return p.split("/").filter(Boolean).reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), rtdbJson) ?? null;
    return (await fb.database().ref(p).once("value")).val();
  };
  const firestore = async (col) => {
    if (!fb) return null;
    return (await fb.firestore().collection(col).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  // ---- target
  let sb = null;
  if (apply || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    const { createClient } = require("@supabase/supabase-js");
    sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  if (apply && !sb) throw new Error("--apply needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");

  const report = { mode: apply ? "APPLY" : "DRY-RUN", startedAt: new Date().toISOString(), steps: {} };
  const R = (step) => (report.steps[step] = report.steps[step] || { ok: 0, skippedExisting: 0, rejected: [], warnings: [] });
  const log = (...m) => console.log(...m);
  log(`\n=== ${report.mode} | steps: ${steps.join(",")} | source: ${rtdbJson ? "json" : "firebase-admin"} | target: ${sb ? "supabase" : "(none, offline dry-run)"} ===`);

  // helper: load prn -> {id} from profiles (needed by every step after `users`)
  let prnMap = null;
  const loadPrnMap = async () => {
    if (prnMap) return prnMap;
    prnMap = new Map();
    if (!sb) return prnMap;
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from("profiles").select("id,prn").not("prn", "is", null).range(from, from + 999);
      if (error) throw error;
      data.forEach((p) => prnMap.set(p.prn, p.id));
      if (data.length < 1000) break;
    }
    return prnMap;
  };

  const newlyCreated = []; // for --send-reset

  // ============================================================== 1. USERS
  if (steps.includes("users")) {
    const S = R("users");
    const users = entries(await rtdb("users")).slice(0, limit);
    log(`users: ${users.length} in source`);
    const seenEmail = new Set(), existing = await loadPrnMap();
    const plan = [];
    for (const [key, u] of users) {
      const v = validateUser(key, u || {});
      if (!v.ok) { S.rejected.push({ key, reason: v.reason }); continue; }
      if (seenEmail.has(v.row.email)) { S.rejected.push({ key, reason: "duplicate-email", email: v.row.email }); continue; }
      seenEmail.add(v.row.email);
      if (existing.has(v.row.prn)) { S.skippedExisting++; continue; }
      plan.push({ key, u, v: v.row, access: mapAccess(u) });
    }
    const notes = {}; plan.forEach((p) => { if (p.access.note) notes[p.access.note] = (notes[p.access.note] || 0) + 1; });
    S.warnings.push({ accessNotes: notes });
    log(`users: to create ${plan.length}, existing ${S.skippedExisting}, rejected ${S.rejected.length}`, notes);

    if (apply) {
      for (const p of plan) {
        let password = crypto.randomBytes(24).toString("hex");
        let usedPlain = false;
        if (pwMode === "plaintext" && typeof p.u.confirmPassword === "string" && p.u.confirmPassword.length >= 6) { password = p.u.confirmPassword; usedPlain = true; }
        const { data, error } = await sb.auth.admin.createUser({
          email: p.v.email, password, email_confirm: true,
          user_metadata: { full_name: p.v.name, prn: p.v.prn, mobile: p.v.mobile, year: p.v.year },
        });
        if (error) { S.rejected.push({ key: p.key, reason: "createUser: " + error.message }); continue; }
        const id = data.user.id;
        const upd = {
          sid: p.u.sid || null, branch: p.u.branch || null, photo_url: p.u.photoURL || p.u.photoUrl || null,
          dob: toIso(p.u.dob)?.slice(0, 10) || null, role: p.access.role, tier: p.access.tier,
          tier_expires_at: p.access.tier_expires_at, premium_since: p.access.premium_since,
          legacy_firebase_uid: p.u.uid || null, created_at: toIso(p.u.createdAt) || undefined,
        };
        Object.keys(upd).forEach((k) => upd[k] === undefined && delete upd[k]);
        const { error: e2 } = await sb.from("profiles").update(upd).eq("id", id);
        if (e2) S.warnings.push({ key: p.key, profileUpdate: e2.message });
        prnMap.set(p.v.prn, id); S.ok++;
        if (!usedPlain) newlyCreated.push(p.v.email);
      }
      // second pass: refer codes + referred_by (needs all profiles to exist)
      for (const [key, u] of users) {
        const id = prnMap.get(String((u || {}).prn || key));
        if (!id) continue;
        const upd = {};
        if (u.referCode) upd.refer_code = String(u.referCode).toUpperCase();
        if (u.referredBy && prnMap.get(String(u.referredBy))) upd.referred_by = prnMap.get(String(u.referredBy));
        if (Object.keys(upd).length) { const { error } = await sb.from("profiles").update(upd).eq("id", id); if (error) S.warnings.push({ key, referral: error.message }); }
      }
      log(`users: created ${S.ok}`);
    }
    if (pwMode === "plaintext") S.warnings.push("plaintext mode used: RTDB still contains plaintext passwords; delete users/*/confirmPassword (or the whole RTDB) after cutover.");
  }

  // ============================================================== 2. SITE CONFIG
  if (steps.includes("config")) {
    const S = R("config");
    const cfg = (await rtdb("site_config")) || {};
    const rows = [];
    if (cfg.referral && typeof cfg.referral === "object") rows.push({ key: "referral", value: { percent: Number(cfg.referral.percent) || 10, minWithdraw: Number(cfg.referral.minWithdraw) || 50 } });
    if (cfg.maintenance && typeof cfg.maintenance === "object") rows.push({ key: "maintenance", value: cfg.maintenance });
    if (typeof cfg.notification === "string") rows.push({ key: "notification", value: cfg.notification });
    log(`config: ${rows.length} keys (${rows.map((r) => r.key)})`);
    if (apply && rows.length) { const { error } = await sb.from("site_config").upsert(rows, { onConflict: "key" }); if (error) S.rejected.push({ reason: error.message }); else S.ok = rows.length; }
  }

  // ============================================================== 3. NOTICES   [VERIFY field names: admin tool is in manager-public]
  if (steps.includes("notices")) {
    const S = R("notices");
    const src = entries(await rtdb("notifications")).slice(0, limit);
    const rows = [];
    for (const [id, n] of src) {
      if (!n || typeof n !== "object") continue;
      const title = String(n.title || "").trim();
      if (!title) { S.rejected.push({ id, reason: "no-title" }); continue; }
      const target = ["everyone", "year", "specific"].includes(n.target) ? n.target : "everyone";
      const att = n.attachment || {};
      rows.push({
        title, content: String(n.message ?? n.content ?? ""), priority: Number(n.priority) || 0, active: n.active !== false,
        action_url: n.actionUrl || null, action_text: n.actionText || null, type: n.type || null,
        attachment_name: n.attachmentName || att.name || null, attachment_type: n.attachmentType || att.type || null, attachment_url: n.attachmentUrl || att.url || null,
        request_status: n.requestStatus || null, target, target_year: n.targetYear || null, target_prn: n.targetPrn || null, target_sid: n.targetSid || null,
        created_at: toIso(n.createdAt ?? n.timestamp) || undefined,
      });
    }
    log(`notices: ${rows.length}`);
    if (apply) {
      const { data: have } = await sb.from("notices").select("title,created_at");
      const seen = new Set((have || []).map((r) => r.title + "|" + new Date(r.created_at).getTime()));
      for (const r of rows) {
        if (r.created_at && seen.has(r.title + "|" + new Date(r.created_at).getTime())) { S.skippedExisting++; continue; }
        Object.keys(r).forEach((k) => r[k] === undefined && delete r[k]);
        const { error } = await sb.from("notices").insert(r); if (error) S.rejected.push({ title: r.title, reason: error.message }); else S.ok++;
      }
    }
  }

  // ============================================================== 4. CONTENT -> resources (+ min_tier)
  if (steps.includes("content")) {
    const S = R("content");
    const tierTable = {}; const unmatched = new Set(); const rows = [];
    for (const year of ["SY", "TY", "FY"]) {
      const tree = (await rtdb(year)) || {};
      for (const [branch, secs] of entries(tree)) for (const [section, items] of entries(secs)) {
        const { tier, matched } = tierFor(rules, year, branch, section);
        tierTable[`${year}/${branch}/${section}`] = tier || "free"; if (!matched) unmatched.add(`${year}/${branch}/${section}`);
        const list = entries(items).map(([id, v]) => ({ id, v })).sort((a, b) => (Number(a.v?.uploadedAt ?? a.v?.createdAt) || 0) - (Number(b.v?.uploadedAt ?? b.v?.createdAt) || 0));
        list.forEach(({ id, v }, i) => {
          const o = typeof v === "object" && v ? v : { title: String(v) };
          const url = o.url && o.url !== "#" ? String(o.url) : null;
          if (!url) { S.rejected.push({ path: `${year}/${branch}/${section}/${id}`, reason: "no-url" }); return; }
          rows.push({ year, branch, section, title: String(o.title || o.name || id), external_url: url, kind: o.type === "video" ? "video" : "pdf", min_tier: tier, sort_order: i, created_at: toIso(o.uploadedAt ?? o.createdAt) || undefined });
        });
      }
    }
    // management/<subject>/files   [VERIFY url field names]
    for (const [key, m] of entries(await rtdb("management"))) {
      entries(m && m.files).forEach(([id, f], i) => {
        const url = f && (f.url || f.secure_url || f.fileUrl || f.pdfUrl);
        if (!url) { S.rejected.push({ path: `management/${key}/files/${id}`, reason: "no-url" }); return; }
        rows.push({ year: null, branch: null, section: "management", subject_key: key, title: String(f.title || f.name || f.fileName || id), external_url: String(url), kind: f.type === "video" ? "video" : "pdf", min_tier: null, sort_order: i, created_at: toIso(f.uploadedAt ?? f.createdAt) || undefined });
      });
    }
    S.warnings.push({ tierTable, unmatchedSectionsReviewMinTier: [...unmatched] });
    fs.writeFileSync(path.join(reportDir, "tier-table.json"), JSON.stringify({ tierTable, unmatched: [...unmatched] }, null, 2));
    log(`content: ${rows.length} items; ${unmatched.size} sections have no tier rule (-> free). See ${reportDir}/tier-table.json`);
    if (apply) {
      const { data: have } = await sb.from("resources").select("year,branch,section,subject_key,external_url");
      const seen = new Set((have || []).map((r) => [r.year, r.branch, r.section, r.subject_key, r.external_url].join("|")));
      const fresh = rows.filter((r) => { const k = [r.year, r.branch, r.section, r.subject_key || null, r.external_url].join("|"); if (seen.has(k)) { S.skippedExisting++; return false; } return true; });
      for (const c of chunk(fresh, 200)) {
        c.forEach((r) => Object.keys(r).forEach((k) => r[k] === undefined && delete r[k]));
        const { error } = await sb.from("resources").insert(c); if (error) S.rejected.push({ batch: c.length, reason: error.message }); else S.ok += c.length;
      }
    }
  }

  // ============================================================== 5. ORDERS -> orders + payments + subscriptions   (Firestore)
  const orderIdByGateway = new Map();
  if (steps.includes("orders")) {
    const S = R("orders");
    const docs = [];
    for (const col of ["sy_payment_requests", "fy_payment_requests"]) { const d = await firestore(col); if (d) docs.push(...d); else S.warnings.push(`Firestore ${col} skipped (needs live firebase-admin)`); }
    const paid = docs.filter((d) => d.paymentMethod === "cashfree_online" && d.orderId && d.status === "approved").slice(0, limit);
    S.warnings.push({ cashfreeApproved: paid.length, otherManualRequestsIgnored: docs.length - paid.length });
    log(`orders: ${paid.length} Cashfree-approved of ${docs.length} request docs`);
    if (apply) {
      await loadPrnMap();
      for (const d of paid) {
        const uid = prnMap.get(String(d.prn)); const tier = normRole(d.role);
        if (!uid || !TIERS.includes(tier)) { S.rejected.push({ orderId: d.orderId, reason: !uid ? "unknown-prn" : "bad-tier:" + tier }); continue; }
        const { data: ex } = await sb.from("orders").select("id").eq("gateway_order_id", d.orderId).maybeSingle();
        if (ex) { orderIdByGateway.set(d.orderId, ex.id); S.skippedExisting++; continue; }
        const paidAt = toIso(d.approvedAt ?? d.createdAt) || new Date().toISOString();
        const amount = Number(d.amount) || 0;
        const { data: o, error } = await sb.from("orders").insert({ user_id: uid, gateway: "cashfree", gateway_order_id: d.orderId, catalog: orderCatalog(d.orderId), tier, amount, status: "paid", created_at: toIso(d.createdAt) || paidAt, paid_at: paidAt }).select("id").single();
        if (error) { S.rejected.push({ orderId: d.orderId, reason: error.message }); continue; }
        orderIdByGateway.set(d.orderId, o.id);
        await sb.from("payments").insert({ user_id: uid, order_id: o.id, amount, status: "success", verified_at: paidAt, raw_event: { migrated_from: "firestore", docId: d.id } });
        const exp = toIso(d.roleExpires) || new Date(Date.parse(paidAt) + 180 * 864e5).toISOString();
        const { error: e3 } = await sb.from("subscriptions").insert({ user_id: uid, tier, status: Date.parse(exp) > Date.now() ? "active" : "expired", started_at: toIso(d.premiumSince) || paidAt, expires_at: exp, order_id: o.id });
        if (e3) S.warnings.push({ orderId: d.orderId, subscription: e3.message });
        S.ok++;
      }
    }
  }

  // ============================================================== 6. REFERRALS   [VERIFY withdrawal field names]
  if (steps.includes("referrals")) {
    const S = R("referrals");
    const wallets = entries(await rtdb("referrals")).filter(([, v]) => v && v.wallet).slice(0, limit);
    const credits = entries(await rtdb("referral_payments"));
    const wds = entries(await rtdb("referral_withdrawals"));
    log(`referrals: wallets ${wallets.length}, credits ${credits.length}, withdrawals ${wds.length}`);
    if (apply) {
      await loadPrnMap();
      for (const [prn, v] of wallets) {
        const uid = prnMap.get(prn); if (!uid) { S.rejected.push({ prn, reason: "unknown-prn" }); continue; }
        const w = v.wallet, n = (x) => Math.round((Number(x) || 0) * 100) / 100;
        const { error } = await sb.from("referral_wallets").upsert({ user_id: uid, balance: n(w.balance), total_earned: n(w.totalEarned), total_withdrawn: n(w.totalWithdrawn), subscription_count: Number(w.subscriptionCount) || 0 }, { onConflict: "user_id" });
        if (error) S.rejected.push({ prn, reason: error.message }); else S.ok++;
      }
      for (const [orderId, c] of credits) {
        if (!c || !["credited", "no_referrer", "referrer_not_eligible"].includes(c.status)) continue;   // "processing" = half-done, ignore
        let oid = orderIdByGateway.get(orderId);
        if (!oid) { const { data } = await sb.from("orders").select("id").eq("gateway_order_id", orderId).maybeSingle(); oid = data && data.id; }
        const referred = prnMap.get(String(c.prn)), referrer = prnMap.get(String(c.referrerPrn));
        if (!oid || !referred) { S.warnings.push({ orderId, credit: "order or referred user not migrated, skipped" }); continue; }
        const { error } = await sb.from("referral_credits").upsert({ order_id: oid, referrer_id: referrer || null, referred_id: referred, amount: c.amount ?? null, percent: c.percent ?? null, commission: c.commission ?? null, status: c.status, created_at: toIso(c.at) || undefined }, { onConflict: "order_id" });
        if (error) S.warnings.push({ orderId, credit: error.message });
      }
      for (const [id, w] of wds) {
        const uid = prnMap.get(String(w.prn)); const st = ["pending", "paid", "rejected"].includes(w.status) ? w.status : null;
        if (!uid || !st || !(Number(w.amount) > 0)) { S.rejected.push({ id, reason: "bad-withdrawal" }); continue; }
        const created = toIso(w.createdAt);
        const { data: ex } = await sb.from("referral_withdrawals").select("id").eq("user_id", uid).eq("created_at", created).maybeSingle();
        if (ex) { S.skippedExisting++; continue; }
        const { error } = await sb.from("referral_withdrawals").insert({ user_id: uid, amount: Number(w.amount), qr_path: w.qrUrl || null, qr_public_id: w.qrPublicId || null, name: w.name || null, mobile: w.mobile || null, status: st, admin_note: w.note || null, created_at: created || undefined, processed_at: toIso(w.processedAt) });
        if (error) S.rejected.push({ id, reason: error.message });
      }
    }
  }

  // ============================================================== 7. SOLO SCORES   (Firestore solo_mcq)
  if (steps.includes("solo")) {
    const S = R("solo");
    const docs = await firestore("solo_mcq");
    if (!docs) S.warnings.push("Firestore solo_mcq skipped (needs live firebase-admin)");
    else {
      log(`solo: ${docs.length}`);
      if (apply) {
        await loadPrnMap();
        const best = new Map(); docs.forEach((d) => { const p = String(d.prn); if (!best.has(p) || (d.score || 0) > (best.get(p).score || 0)) best.set(p, d); });
        for (const [prn, d] of best) {
          const uid = prnMap.get(prn); if (!uid) { S.rejected.push({ prn, reason: "unknown-prn" }); continue; }
          const { error } = await sb.from("solo_scores").upsert({ user_id: uid, prn, name: d.name || "Student", score: Math.round(Number(d.score) || 0), last_tested_at: toIso(d.lastTestedTimestamp) || new Date().toISOString() }, { onConflict: "user_id" });
          if (error) S.rejected.push({ prn, reason: error.message }); else S.ok++;
        }
      }
    }
  }

  // ============================================================== 8. REVALUATION   (Firestore; PDFs stay on Cloudinary)
  if (steps.includes("reval")) {
    const S = R("reval");
    const ups = await firestore("revaluation_uploads"), scs = await firestore("revaluation_score");
    if (!ups || !scs) S.warnings.push("Firestore revaluation_* skipped (needs live firebase-admin)");
    else {
      log(`reval: uploads ${ups.length}, scores ${scs.length}`);
      if (apply) {
        const idMap = new Map(), byUrl = new Map();
        for (const u of ups) {
          const { data: ex } = await sb.from("revaluation_uploads").select("id").eq("file_name", u.fileName).maybeSingle();
          let id = ex && ex.id;
          if (!id) {
            const { data, error } = await sb.from("revaluation_uploads").insert({ file_name: u.fileName, pdf_url: u.pdfUrl || null, pdf_download_url: u.pdfDownloadUrl || null, cloudinary_public_id: u.cloudinaryPublicId || null, raw_text: u.rawText || null, prn_count: u.prnCount ?? null, parsed_ok_count: u.parsedOkCount ?? null, created_at: toIso(u.uploadedAt) || undefined }).select("id").single();
            if (error) { S.rejected.push({ file: u.fileName, reason: error.message }); continue; }
            id = data.id; S.ok++;
          } else S.skippedExisting++;
          idMap.set(u.id, id); if (u.pdfUrl) byUrl.set(u.pdfUrl, id);
        }
        const rows = scs.filter((s) => /^\d{16}$/.test(String(s.prn || s.id))).map((s) => {
          const prn = String(s.prn || s.id); const { id: _i, ...data } = s;
          const src = idMap.get(s.sourceUploadId) || byUrl.get(s.pdfUrl) || null;
          return { prn, data: { ...data, prn, sourceUploadId: src }, source_upload_id: src };
        });
        for (const c of chunk(rows, 400)) { const { error } = await sb.from("revaluation_scores").upsert(c, { onConflict: "prn" }); if (error) S.rejected.push({ batch: c.length, reason: error.message }); else S.ok += c.length; }
      }
    }
  }

  // ============================================================== optional: password-reset emails
  if (args["send-reset"] && apply && newlyCreated.length) {
    const redirectTo = `${process.env.SITE_URL || ""}/reset-password`;
    log(`sending ${newlyCreated.length} reset emails (paced)...`);
    const S = R("send-reset");
    for (const email of newlyCreated) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) S.rejected.push({ email, reason: error.message }); else S.ok++;
      await sleep(1500);
    }
  } else if (apply && pwMode === "reset" && newlyCreated.length) {
    fs.writeFileSync(path.join(reportDir, "needs-password-reset.csv"), "email\n" + newlyCreated.join("\n") + "\n");
    log(`wrote ${reportDir}/needs-password-reset.csv (re-run with --send-reset or tell users to use "Forgot password")`);
  }

  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(reportDir, "report.json"), JSON.stringify(report, null, 2));
  log("\n--- summary ---");
  for (const [k, v] of Object.entries(report.steps)) log(`${k.padEnd(10)} ok=${v.ok} existing=${v.skippedExisting} rejected=${v.rejected.length} warnings=${v.warnings.length}`);
  log(`full report: ${path.join(reportDir, "report.json")}${apply ? "" : "\n(DRY RUN: nothing was written. Add --apply to write.)"}`);
}

module.exports = { normRole, toIso, mapAccess, validateUser, tierFor, orderCatalog, DEFAULT_TIER_RULES };
if (require.main === module) main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
