// auth.js — shared auth helpers on top of window.sbz (Supabase Auth).
// Passwords are handled only by Supabase Auth; nothing here stores or logs them.
(function (global) {
  var sb = function () {
    if (!global.sbz) throw new Error('config');
    return global.sbz;
  };

  // Never show raw SDK / SQL errors to the user.
  function friendlyError(err) {
    var m = ((err && (err.message || err.error_description)) || '').toLowerCase();
    try { console.warn('[SBZ] auth error:', err); } catch (e) {}   // raw error stays in the browser console (F12) for debugging
    if (m === 'config') return 'App configuration error. Please contact support.';
    if (m.includes('invalid login')) return 'Invalid email/PRN or password.';
    if (m.includes('email not confirmed')) return 'Please verify your email first (check Inbox/Spam).';
    if (m.includes('already registered') || m.includes('already been registered')) return 'This email is already registered. Try logging in.';
    if (m.includes('password') && m.includes('characters')) return 'Password is too short. Use at least 6 characters.';
    if (m.includes('signups not allowed') || m.includes('signup is disabled') || m.includes('signups are disabled')) return 'New signups are currently disabled. Please contact support.';
    if (m.includes('captcha')) return 'Captcha verification failed. Please contact support.';
    if (m.includes('database error')) return 'Could not create your profile. Check PRN (16 digits) and mobile (10 digits), then try again.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
    if (m.includes('network') || m.includes('failed to fetch')) return 'Network error. Check your connection and try again.';
    if (m.includes('duplicate') || m.includes('unique')) return 'This PRN or mobile is already registered.';
    return 'Something went wrong. Please try again.';
  }

  function isNativeApp() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
  }

  // identity = email OR 16-digit PRN. Returns { user } or throws { notFound:true } / SDK error.
  async function signInWithIdentity(identity, password) {
    var email = identity;
    if (!identity.includes('@')) {
      var r = await sb().rpc('lookup_login_email', { p_prn: identity });
      if (r.error) throw r.error;
      if (!r.data) { var nf = new Error('not_found'); nf.notFound = true; throw nf; }
      email = r.data;
    }
    var res = await sb().auth.signInWithPassword({ email: email, password: password });
    if (res.error) throw res.error;
    return { user: res.data.user };
  }

  // RLS: a user can only read their own row.
  async function getMyProfile() {
    var s = await sb().auth.getSession();
    var uid = s.data && s.data.session && s.data.session.user.id;
    if (!uid) return null;
    var r = await sb().from('profiles')
      .select('id,prn,full_name,email,year,branch,role,tier,tier_expires_at')
      .eq('id', uid).maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }

  // The profiles row is created by the DB trigger handle_new_user() from this metadata,
  // so signup is atomic (no half-created accounts).
  async function signUp(f) {
    var avail = await sb().rpc('prn_available', { p_prn: f.prn });
    if (avail.error) throw avail.error;
    if (!avail.data) { var e = new Error('This PRN is already registered with another account.'); e.userMessage = e.message; throw e; }
    var res = await sb().auth.signUp({
      email: f.email,
      password: f.password,
      options: { data: { full_name: f.name, prn: f.prn, mobile: f.mobile, year: f.year, refer_code: f.referCode || '' } }
    });
    if (res.error) throw res.error;
    // If "Confirm email" is ON in Supabase Auth settings there is no session yet.
    return { user: res.data.user, needsEmailConfirmation: !res.data.session };
  }

  async function sendPasswordReset(email) {
    var res = await sb().auth.resetPasswordForEmail(email, { redirectTo: global.location.origin + '/reset-password' });
    if (res.error) throw res.error;
  }

  async function checkReferCode(code) {
    var r = await sb().rpc('check_refer_code', { p_code: code });
    if (r.error) return { valid: false, error: 'Network error — dobara try karein.' };
    return r.data;
  }

  async function signOut() { try { await sb().auth.signOut(); } catch (e) {} }
  async function getSessionUser() {
    var s = await sb().auth.getSession();
    return (s.data && s.data.session && s.data.session.user) || null;
  }

  global.SBZAuth = {
    friendlyError: friendlyError, isNativeApp: isNativeApp, signInWithIdentity: signInWithIdentity,
    getMyProfile: getMyProfile, signUp: signUp, sendPasswordReset: sendPasswordReset,
    checkReferCode: checkReferCode, signOut: signOut, getSessionUser: getSessionUser
  };
})(window);
