// supabase-client.js — single shared Supabase client (window.sbz).
// Load order on every page:
//   1) @supabase/supabase-js (UMD)  2) js/supabase-config.js  3) js/supabase-client.js
(function (global) {
  if (global.sbz) return; // never initialise twice
  var cfg = global.SBZ_CONFIG || {};
  if (!global.supabase || !cfg.SUPABASE_URL || /YOUR_/.test(cfg.SUPABASE_URL) || /YOUR_/.test(cfg.SUPABASE_ANON_KEY || '')) {
    console.error('[SBZ] Supabase is not configured. Fill in js/supabase-config.js.');
    return;
  }
  global.sbz = global.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})(window);
