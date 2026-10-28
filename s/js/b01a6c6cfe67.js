
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const API = '/api/event?action=';
  let rows = [], filter = 'all';
  const fmt = (n) => n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB';
  const when = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  async function token() {
    if (!window.sbz) return '';
    const s = await window.sbz.auth.getSession();
    return (s.data && s.data.session && s.data.session.access_token) || '';
  }
  async function post(action, body) {
    const t = await token();
    const headers = { 'Content-Type': 'application/json' };
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(API + action, { method: 'POST', headers, body: JSON.stringify(body || {}) });
    let d = {}; try { d = await res.json(); } catch (e) {}
    if (res.status === 401 || res.status === 403) { const err = new Error(d.message || 'Staff login जरूरी है।'); err.auth = true; throw err; }
    if (!res.ok) throw new Error(d.message || 'कुछ गड़बड़ हो गई। दोबारा try करें।');
    return d;
  }
  const showGate = (msg) => {
    $('app').style.display = 'none'; $('logout').style.display = 'none'; $('gate').style.display = 'block';
    $('gPw').value = '';
    const e = $('gErr'); if (msg) { e.textContent = msg; e.style.display = 'block'; } else e.style.display = 'none';
  };
  async function login() {
    const id = $('gId').value.trim(), pw = $('gPw').value;
    if (!id || !pw) return showGate('Email/PRN और password दोनों डालें।');
    if (!id.includes('@') && !/^\d{16}$/.test(id)) return showGate('PRN exactly 16 digits का होना चाहिए।');
    const b = $('gBtn'), label = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
    try {
      await SBZAuth.signInWithIdentity(id, pw);
      b.disabled = false; b.innerHTML = label;
      await enter();                       // the server decides whether this account is staff
    } catch (err) {
      b.disabled = false; b.innerHTML = label;
      showGate(err && err.notFound ? 'इस PRN से कोई account नहीं मिला।' : SBZAuth.friendlyError(err));
    }
  }
  // Probe the protected API: 200 -> show portal, 401/403 -> back to the login form.
  async function enter() {
    try { const d = await post('gtmc-review-list'); $('gate').style.display = 'none'; $('app').style.display = 'block'; $('logout').style.display = 'inline-flex'; apply(d); }
    catch (e) {
      if (e.auth) { const had = !!(await token()); if (had) await SBZAuth.signOut(); showGate(had ? e.message : ''); }
      else { $('gate').style.display = 'none'; $('app').style.display = 'block'; const x = el('div', 'err', e.message); x.style.gridColumn = '1/-1'; $('list').replaceChildren(x); }
    }
  }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function icon(c) { const i = el('i'); i.className = 'fa-solid ' + c; return i; }

  async function load() {
    $('list').replaceChildren(Object.assign(el('div', 'loading', 'Loading...'), { style: 'grid-column:1/-1' }));
    try { apply(await post('gtmc-review-list')); }
    catch (e) { if (e.auth) return showGate(e.message); const x = el('div', 'err', e.message); x.style.gridColumn = '1/-1'; $('list').replaceChildren(x); }
  }
  function apply(d) {
    rows = d.rows || [];
    $('sTotal').textContent = d.total; $('sSub').textContent = d.submitted; $('sPend').textContent = d.total - d.submitted; $('sRev').textContent = d.reviewed;
    render();
  }
  function visible() {
    const q = $('q').value.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'sub' && !r.submitted) return false;
      if (filter === 'pend' && r.submitted) return false;
      if (filter === 'todo' && !(r.submitted && r.score === null)) return false;
      if (!q) return true;
      return [r.prn, r.name, r.branch, r.link, r.topic && r.topic.title, r.topic && r.topic.category].join(' ').toLowerCase().includes(q);
    });
  }
  function render() {
    const list = visible();
    $('count').textContent = list.length + ' of ' + rows.length + ' shown';
    if (!list.length) { const x = el('div', 'empty', 'कोई entry नहीं मिली।'); x.style.gridColumn = '1/-1'; return $('list').replaceChildren(x); }
    $('list').replaceChildren(...list.map(card));
  }
  function card(r) {
    const c = el('article', 'item ' + (r.submitted ? 'has' : 'no'));
    const h = el('div', 'ih'), t = el('div');
    t.append(el('b', '', r.name), el('small', '', 'PRN ' + r.prn));
    const p = el('span', 'pill ' + (r.submitted ? (r.score !== null ? 's' : 'y') : 'n'), r.submitted ? (r.score !== null ? 'Reviewed' : 'Submitted') : 'Pending');
    h.append(t, p); c.appendChild(h);
    const m = el('div', 'meta');
    const line = (ic, txt) => { const d = el('div'); d.append(icon(ic), txt); m.appendChild(d); };
    line('fa-graduation-cap', [r.course_year, r.branch].filter(Boolean).join(' · '));
    line('fa-lightbulb', r.topic ? r.topic.title : 'Topic अभी नहीं चुना');
    if (r.phone) line('fa-phone', r.phone);
    c.appendChild(m);
    if (r.submitted) {
      const lk = el('div', 'lnk'); lk.append(icon('fa-globe'));
      if (r.link && /^https?:\/\//i.test(r.link)) { const a = el('a', '', r.link); a.href = r.link; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; lk.appendChild(a); }
      else { lk.classList.add('none'); lk.append('Website link नहीं दिया'); }
      c.appendChild(lk);
      const f = el('div', 'file'); f.append(icon('fa-file-zipper'));
      f.append(el('span', '', (r.file_name || 'project.zip') + ' · ' + fmt(r.file_size) + ' · ' + when(r.submitted_at)));
      const b = el('button', 'btn g'); b.type = 'button'; b.append(icon('fa-download'), ' Download');
      b.addEventListener('click', () => download(r.prn, b));
      f.appendChild(b); c.appendChild(f);
      const sc = el('div', 'sc');
      const a = el('div'), la = el('label', '', 'Score /100'); la.htmlFor = 'sc' + r.prn;
      const ia = el('input'); ia.id = 'sc' + r.prn; ia.type = 'number'; ia.min = 0; ia.max = 100; ia.step = '0.5'; ia.inputMode = 'decimal'; ia.value = r.score === null ? '' : r.score;
      a.append(la, ia);
      const bb = el('div'), lb = el('label', '', 'Remarks'); lb.htmlFor = 'rm' + r.prn;
      const ib = el('textarea'); ib.id = 'rm' + r.prn; ib.maxLength = 1000; ib.rows = 1; ib.value = r.remarks || '';
      bb.append(lb, ib); sc.append(a, bb); c.appendChild(sc);
      const sv = el('div', 'sv'), sb = el('button', 'btn'); sb.type = 'button'; sb.append(icon('fa-floppy-disk'), ' Save review');
      const msg = el('span', '', r.reviewed_at ? 'Saved ' + when(r.reviewed_at) : '');
      sb.addEventListener('click', () => save(r, ia, ib, sb, msg, p));
      sv.append(sb, msg); c.appendChild(sv);
    }
    return c;
  }
  async function download(prn, btn) {
    btn.disabled = true;
    try { const d = await post('gtmc-review-download', { prn }); location.href = d.url; }
    catch (e) { if (e.auth) showGate(e.message); else alert(e.message); }
    setTimeout(() => { btn.disabled = false; }, 1200);
  }
  async function save(r, ia, ib, btn, msg, pill) {
    btn.disabled = true; msg.className = 'sv'; msg.textContent = 'Saving...';
    try {
      const d = await post('gtmc-review-save', { prn: r.prn, score: ia.value, remarks: ib.value });
      r.score = d.score; r.remarks = d.remarks; r.reviewed_at = d.reviewed_at;
      msg.className = 'ok'; msg.textContent = 'Saved ✓';
      pill.className = 'pill ' + (r.score !== null ? 's' : 'y'); pill.textContent = r.score !== null ? 'Reviewed' : 'Submitted';
      $('sRev').textContent = rows.filter((x) => x.score !== null).length;
    } catch (e) { if (e.auth) { showGate(e.message); return; } msg.className = 'er'; msg.textContent = e.message; }
    btn.disabled = false;
  }
  function csv() {
    const esc = (v) => { v = String(v === null || v === undefined ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const head = ['PRN', 'Name', 'Course/Year', 'Branch', 'Phone', 'Topic', 'Category', 'Submitted', 'Submitted At', 'File Size (bytes)', 'Website Link', 'Score', 'Remarks'];
    const body = visible().map((r) => [r.prn, r.name, r.course_year, r.branch, r.phone, r.topic ? r.topic.title : '', r.topic ? r.topic.category : '', r.submitted ? 'Yes' : 'No', r.submitted_at || '', r.file_size || '', r.link || '', r.score === null ? '' : r.score, r.remarks]);
    const blob = new Blob(['﻿' + [head, ...body].map((x) => x.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gtmc-submissions.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  $('q').addEventListener('input', render);
  $('refresh').addEventListener('click', load);
  $('csv').addEventListener('click', csv);
  $('gBtn').addEventListener('click', login);
  ['gId', 'gPw'].forEach((i) => $(i).addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); }));
  $('logout').addEventListener('click', async () => { await SBZAuth.signOut(); rows = []; showGate(''); });
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tab'); if (!b) return;
    filter = b.dataset.f; document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b)); render();
  });
  (async () => { if (await token()) enter(); else showGate(''); })();
})();
