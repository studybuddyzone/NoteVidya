
  const $ = (id) => document.getElementById(id);
  const msg = (t, ok) => { $('msg').textContent = t; $('msg').className = ok ? 'ok' : 'err'; };

  // The reset link signs the user into a short-lived "recovery" session (handled by the SDK).
  let ready = false;
  function showForm() { if (ready) return; ready = true; $('sub').textContent = 'Choose a new password for your account.'; $('form').style.display = 'block'; }
  if (window.sbz) {
    window.sbz.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') showForm(); });
    setTimeout(() => { if (!ready) { $('sub').textContent = ''; msg('This reset link is invalid or has expired. Please request a new one from the login page.', false); } }, 4000);
  } else { msg('App configuration error. Please contact support.', false); }

  $('btn').addEventListener('click', async () => {
    const a = $('pw1').value, b = $('pw2').value;
    if (a.length < 6) return msg('Password must be at least 6 characters.', false);
    if (a !== b) return msg('Passwords do not match.', false);
    $('btn').disabled = true;
    const { error } = await window.sbz.auth.updateUser({ password: a });
    if (error) { $('btn').disabled = false; return msg(SBZAuth.friendlyError(error), false); }
    msg('Password updated! Redirecting to login…', true);
    await SBZAuth.signOut();
    setTimeout(() => { window.location.replace('/'); }, 1500);
  });
