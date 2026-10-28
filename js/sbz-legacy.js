// sbz-legacy.js — compatibility layer so the existing pages keep working on Supabase.
//
// The pages were written against a Firebase-style API:  auth().onAuthStateChanged(...),
// database().ref('users').orderByChild('uid').equalTo(uid).once('value'), ref('SY/civil/sem3').on('value', ...).
// This file provides that small READ-ONLY surface on top of Supabase (window.sbz), so each page needs
// only a script-tag swap instead of a rewrite. Everything is enforced by Postgres RLS, never by this file:
// a page that asks for data the caller may not see simply gets an empty snapshot.
//
// Supported database paths (anything else logs a warning and yields an empty snapshot):
//   users  | users/{prn}[/{field}]   -> profiles   (own row; staff can read others via RLS)
//   premium (orderByChild uid)       -> subscriptions / active tier
//   site_config/notification|maintenance[/{year}] -> site_config (public) + realtime
//   SY|TY|FY/{branch}/{section}      -> resources (premium rows hidden by RLS) + realtime
//
// It also attaches the Supabase access token to calls to OUR api/* endpoints (and only those).
(function (global) {
  "use strict";
  var sbz = function () { return global.sbz; };
  var warn = function (m, x) { try { console.warn("[SBZLegacy] " + m, x || ""); } catch (e) {} };
  var ms = function (iso) { return iso ? new Date(iso).getTime() : null; };

  // ------------------------------------------------------------------ fetch interceptor
  var API_HOSTS = [global.location && global.location.host, "studybuddypro-psi.vercel.app"];
  function isOurApi(url) {
    try {
      var u = new URL(url, global.location.href);
      return u.pathname.indexOf("/api/") === 0 && API_HOSTS.indexOf(u.host) !== -1;
    } catch (e) { return false; }
  }
  if (!global.__sbzFetchPatched && typeof global.fetch === "function") {
    global.__sbzFetchPatched = true;
    var nativeFetch = global.fetch.bind(global);
    global.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url);
      if (!sbz() || !isOurApi(url)) return nativeFetch(input, init);
      return sbz().auth.getSession().then(function (s) {
        var token = s && s.data && s.data.session && s.data.session.access_token;
        if (!token) return nativeFetch(input, init);
        var headers = new Headers((init && init.headers) || (typeof input !== "string" && input.headers) || {});
        if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
        return nativeFetch(input, Object.assign({}, init || {}, { headers: headers }));
      }, function () { return nativeFetch(input, init); });
    };
  }

  // ------------------------------------------------------------------ auth
  var listeners = [], initialised = false, lastUid, cachedUser = null, subscribed = false;
  function mapUser(u, session) {
    if (!u) return null;
    var meta = u.user_metadata || {};
    return {
      uid: u.id, email: u.email, displayName: meta.full_name || null, emailVerified: !!u.email_confirmed_at,
      getIdToken: function () {
        return sbz().auth.getSession().then(function (s) { return s.data && s.data.session ? s.data.session.access_token : null; });
      },
      reload: function () { return Promise.resolve(); },
    };
  }
  function emit(user) { listeners.slice().forEach(function (cb) { setTimeout(function () { try { cb(user); } catch (e) { console.error(e); } }, 0); }); }
  function ensureAuthSubscription() {
    if (subscribed) return;
    if (!sbz()) { setTimeout(ensureAuthSubscription, 150); return; }   // client not ready yet -> try again
    subscribed = true;
    sbz().auth.onAuthStateChange(function (event, session) {
      var u = session ? session.user : null, uid = u ? u.id : null;
      cachedUser = mapUser(u);
      // Like Firebase: fire on first state and on real sign-in / sign-out, not on token refresh.
      if (!initialised || uid !== lastUid) { initialised = true; lastUid = uid; emit(cachedUser); }
    });
  }
  var authApi = {
    get currentUser() { return cachedUser; },
    onAuthStateChanged: function (cb) {
      listeners.push(cb); ensureAuthSubscription();
      if (initialised) setTimeout(function () { cb(cachedUser); }, 0);
      return function () { listeners = listeners.filter(function (l) { return l !== cb; }); };
    },
    signOut: function () { return global.SBZAuth ? global.SBZAuth.signOut() : sbz().auth.signOut(); },
    sendPasswordResetEmail: function (email) { return global.SBZAuth.sendPasswordReset(email); },
    signInWithEmailAndPassword: function (email, password) {
      return sbz().auth.signInWithPassword({ email: email, password: password }).then(function (r) {
        if (r.error) { var e = new Error(global.SBZAuth.friendlyError(r.error)); e.code = "auth/invalid-credential"; throw e; }
        return { user: mapUser(r.data.user) };
      });
    },
  };

  // ------------------------------------------------------------------ data access (read-only)
  function legacyUser(p) {
    var tierOk = p.tier && (!p.tier_expires_at || new Date(p.tier_expires_at).getTime() > Date.now());
    var role = p.role && p.role !== "student" ? p.role : (tierOk ? p.tier : "student");
    return { uid: p.id, prn: p.prn, name: p.full_name, email: p.email, mobile: p.mobile, phone: p.mobile, dob: p.dob,
             year: p.year, branch: p.branch, role: role, roleExpires: ms(p.tier_expires_at), premiumSince: ms(p.premium_since),
             sid: p.sid, photoURL: p.photo_url, createdAt: ms(p.created_at) };
  }
  var PCOLS = "id,prn,sid,full_name,email,mobile,dob,year,branch,role,tier,tier_expires_at,premium_since,photo_url,created_at";
  var USER_KEYS = { uid: "id", prn: "prn", sid: "sid", email: "email" };

  async function resolveUsers(seg, q) {
    var col, val;
    if (seg.length === 1) {
      if (!q || !USER_KEYS[q.orderBy]) { warn("unsupported users query", q); return null; }
      col = USER_KEYS[q.orderBy]; val = q.equalTo;
    } else { col = "prn"; val = seg[1]; }
    var r = await sbz().from("profiles").select(PCOLS).eq(col, val).limit(1).maybeSingle();
    if (r.error) throw r.error;
    if (!r.data) return null;
    var u = legacyUser(r.data);
    if (seg.length === 1) { var o = {}; o[u.prn || u.uid] = u; return o; }
    return seg.length >= 3 ? (u[seg[2]] === undefined ? null : u[seg[2]]) : u;
  }

  async function resolvePremium(seg, q) {
    var s = await sbz().auth.getSession(), me = s.data && s.data.session && s.data.session.user;
    if (!me) return null;
    if (seg.length === 1 && !(q && q.orderBy === "uid" && q.equalTo === me.id)) { warn("premium: only own record is readable", q); return null; }
    var sub = await sbz().from("subscriptions").select("id,tier,started_at,expires_at").eq("user_id", me.id).eq("status", "active")
      .order("expires_at", { ascending: false }).limit(1).maybeSingle();
    if (sub.error) throw sub.error;
    var profRes = await sbz().from("profiles").select("prn,tier,tier_expires_at,premium_since").eq("id", me.id).maybeSingle();
    if (profRes.error) throw profRes.error;
    var prof = profRes.data || {};
    var rec = null;
    if (sub.data && new Date(sub.data.expires_at).getTime() > Date.now()) {
      rec = { uid: me.id, prn: prof.prn, plan: sub.data.tier, activationDate: ms(sub.data.started_at), expiryDate: ms(sub.data.expires_at) };
    } else if (prof.tier && (!prof.tier_expires_at || new Date(prof.tier_expires_at).getTime() > Date.now())) {   // manual grant
      rec = { uid: me.id, prn: prof.prn, plan: prof.tier, activationDate: ms(prof.premium_since), expiryDate: ms(prof.tier_expires_at) };
    }
    if (!rec) return null;
    if (seg.length === 2) return rec;
    var o = {}; o[sub.data ? sub.data.id : (prof.prn || me.id)] = rec; return o;
  }

  async function resolveSiteConfig(seg) {
    var r = await sbz().from("site_config").select("key,value").in("key", ["notification", "maintenance"]);
    if (r.error) throw r.error;
    var cfg = {}; (r.data || []).forEach(function (x) { cfg[x.key] = x.value; });
    var n = typeof cfg.notification === "string" ? cfg.notification : null, m = cfg.maintenance && typeof cfg.maintenance === "object" ? cfg.maintenance : null;
    if (seg.length === 1) return { notification: n, maintenance: m };
    if (seg[1] === "notification") return n;
    if (seg[1] === "maintenance") { if (seg.length === 2) return m; return m && m[seg[2]] !== undefined ? !!m[seg[2]] : null; }
    return null;
  }

  async function resolveContent(seg) {
    if (seg.length !== 3) { warn("content path must be YEAR/branch/section", seg.join("/")); return null; }
    var r = await sbz().from("resources").select("id,title,external_url,kind,sort_order,created_at")
      .eq("year", seg[0]).eq("branch", seg[1]).eq("section", seg[2]).order("sort_order", { ascending: true }).order("created_at", { ascending: true }).limit(500);
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) return null;
    var out = {}; r.data.forEach(function (x) { out[x.id] = { title: x.title, name: x.title, url: x.external_url || "#", type: x.kind || "pdf" }; });
    return out;
  }

  var CONTENT_ROOTS = { SY: 1, TY: 1, FY: 1 };
  function resolve(seg, q) {
    var top = seg[0];
    if (top === "users") return resolveUsers(seg, q);
    if (top === "premium") return resolvePremium(seg, q);
    if (top === "site_config") return resolveSiteConfig(seg);
    if (CONTENT_ROOTS[top]) return resolveContent(seg);
    warn("unsupported path (not migrated): " + seg.join("/"));
    return Promise.resolve(null);
  }
  function tableFor(top) { return top === "site_config" ? "site_config" : CONTENT_ROOTS[top] ? "resources" : top === "premium" ? "subscriptions" : top === "users" ? "profiles" : null; }

  // Retry transient failures (network blip, token mid-refresh). Rejects only after all attempts fail,
  // so callers can tell "error" apart from "really empty" and keep the last good UI.
  var sleep = function (t) { return new Promise(function (r) { setTimeout(r, t); }); };
  async function resolveRetry(seg, q) {
    var delays = [0, 500, 1500], err;
    for (var i = 0; i < delays.length; i++) {
      if (delays[i]) await sleep(delays[i]);
      try {
        if (sbz()) await sbz().auth.getSession();          // lets supabase-js refresh an expired token first
        return await resolve(seg, q);
      } catch (e) { err = e; warn("fetch failed (attempt " + (i + 1) + ")", e && e.message); }
    }
    throw err;
  }

  function Snapshot(key, value) {
    return {
      key: key, exists: function () { return value !== null && value !== undefined; }, val: function () { return value === undefined ? null : value; },
      forEach: function (fn) { if (value && typeof value === "object") Object.keys(value).some(function (k) { return fn(Snapshot(k, value[k])) === true; }); },
      child: function (k) { return Snapshot(k, value && typeof value === "object" && k in value ? value[k] : null); },
    };
  }

  // one shared realtime channel per table; every .on() listener re-resolves (debounced) on changes.
  // Realtime can be off (table not in the publication) or dead after sleep/back-forward, so we ALSO
  // re-fetch on: tab visible, bfcache restore (pageshow), network back, and a slow 60s poll.
  var channels = {}, watchers = {}, activeRuns = [];
  function openChannel(table) {
    var timer = null;
    channels[table] = sbz().channel("sbz-legacy-" + table + "-" + Date.now())
      .on("postgres_changes", { event: "*", schema: "public", table: table }, function () {
        clearTimeout(timer); timer = setTimeout(function () { (watchers[table] || []).slice().forEach(function (f) { f(); }); }, 300);
      }).subscribe();
  }
  function watch(table, fn) {
    if (!table || !sbz() || !sbz().channel) return function () {};
    (watchers[table] = watchers[table] || []).push(fn);
    if (!channels[table]) openChannel(table);
    return function () { watchers[table] = (watchers[table] || []).filter(function (f) { return f !== fn; }); };
  }
  function healChannels() {
    Object.keys(channels).forEach(function (t) {
      var ch = channels[t];
      if (ch && ch.state !== "joined" && ch.state !== "joining") {
        try { sbz().removeChannel(ch); } catch (e) {}
        delete channels[t]; if ((watchers[t] || []).length) openChannel(t);
      }
    });
  }
  function refreshAll() { healChannels(); activeRuns.slice().forEach(function (f) { f(); }); }

  var lastRefresh = 0;
  function softRefresh() { var n = Date.now(); if (n - lastRefresh < 1000) return; lastRefresh = n; refreshAll(); }
  global.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;                       // page restored from back/forward cache: JS state is stale
    if (!sbz()) return;
    sbz().auth.getSession().then(function (s) {
      var uid = s.data && s.data.session ? s.data.session.user.id : null;
      if (initialised && uid !== lastUid) { global.location.reload(); return; }   // logged in/out on another page
      softRefresh();
    });
  });
  global.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") softRefresh(); });
  global.addEventListener("online", softRefresh);
  setInterval(function () { if (document.visibilityState === "visible" && activeRuns.length) refreshAll(); }, 60000);

  // Pages can only ADD unlocks (never re-lock), so when the user's tier really changes we reload once.
  var NO_RELOAD = /payment|receipt|premium-get|profile-edit|edit-profile|reset-password/i;
  function tierSig(top, v) {
    if (top === "premium") { var r = v && (v.plan ? v : Object.values(v)[0]); return r ? String(r.plan) : "none"; }
    if (top === "users" && v && typeof v === "object") { var u = Object.values(v)[0]; return u && typeof u === "object" ? String(u.role) : undefined; }
    return undefined;
  }
  function maybeReload() {
    if (global.SBZ_NO_AUTO_RELOAD || NO_RELOAD.test(global.location.pathname)) return;
    try { var t = +sessionStorage.getItem("sbz_reload_ts") || 0; if (Date.now() - t < 15000) return; sessionStorage.setItem("sbz_reload_ts", String(Date.now())); } catch (e) {}
    global.location.reload();
  }

  var stops = {};   // path -> [stop fns], so ref(path).off() works even on a fresh Ref object
  function Ref(seg, q) {
    var pathKey = seg.join("/");
    var self = {
      key: seg[seg.length - 1] || null,
      child: function (p) { return Ref(seg.concat(String(p).split("/").filter(Boolean)), null); },
      orderByChild: function (c) { return Ref(seg, { orderBy: c, equalTo: undefined }); },
      equalTo: function (v) { return Ref(seg, { orderBy: q && q.orderBy, equalTo: v }); },
      limitToLast: function () { return self; }, limitToFirst: function () { return self; },
      once: function (evt, cb) {
        var p = resolveRetry(seg, q).catch(function (e) { warn("once failed, returning empty", e && e.message); return null; })
          .then(function (v) { return Snapshot(self.key, v); });
        if (typeof cb === "function") p.then(cb);
        return p;
      },
      get: function () { return self.once("value"); },
      on: function (evt, cb, errCb) {
        var live = true, seq = 0, last, hasLast = false, baseSig;
        var run = function () {
          if (!live) return;
          var my = ++seq;
          resolveRetry(seg, q).then(function (v) {
            if (!live || my !== seq) return;                       // stale/out-of-order response
            var sig = JSON.stringify(v === undefined ? null : v);
            var ts = tierSig(seg[0], v);
            if (ts !== undefined) {
              if (baseSig !== undefined && ts !== baseSig) { baseSig = ts; maybeReload(); return; }
              baseSig = ts;
            }
            if (hasLast && sig === last) return;                   // nothing changed -> no UI churn
            hasLast = true; last = sig;
            cb(Snapshot(self.key, v));
          }, function (e) { if (errCb) errCb(e); else warn("listener fetch failed; keeping last data", e && e.message); });
        };
        run();
        var stopWatch = watch(tableFor(seg[0]), run);
        activeRuns.push(run);
        var stop = function () { live = false; stopWatch(); activeRuns = activeRuns.filter(function (f) { return f !== run; }); };
        (stops[pathKey] = stops[pathKey] || []).push(stop);
        self._offs = (self._offs || []).concat([stop]);
        return cb;
      },
      off: function () {
        var all = (stops[pathKey] || []).slice(); stops[pathKey] = [];
        all.forEach(function (f) { f(); }); self._offs = [];
      },
    };
    return self;
  }
  var dbApi = { ref: function (path) { return Ref(String(path || "").split("/").filter(Boolean), null); } };

  global.SBZLegacy = { auth: function () { return authApi; }, database: function () { return dbApi; }, _resolve: resolve };
})(window);
