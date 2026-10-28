
(function () {
  'use strict';
  const MAX = 3 * 1024 * 1024;
  // Same rule as the server (lib/gtmc-submission-handlers.js cleanLink): http(s) only, host must contain a dot.
  function normLink(v) {
    let t = String(v || '').trim();
    if (!t || t.length > 500 || /\s/.test(t)) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = 'https://' + t;
    let u; try { u = new URL(t); } catch (e) { return null; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null;
    return u.toString();
  }
  const $ = (id) => document.getElementById(id);
  const API = '/api/event?action=';
  let prn = '', info = null, file = null;

  const show = (ids) => ['verifyCard', 'uploadCard', 'doneCard', 'closedCard'].forEach((i) => { $(i).style.display = ids.includes(i) ? 'block' : 'none'; });
  const fail = (id, m) => { const e = $(id); e.textContent = m; e.style.display = 'block'; };
  const clear = (id) => { $(id).style.display = 'none'; };
  const fmt = (n) => n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const when = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  async function post(action, body) {
    const res = await fetch(API + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let d = {}; try { d = await res.json(); } catch (e) {}
    if (!res.ok) { const err = new Error(d.message || 'कुछ गड़बड़ हो गई। दोबारा try करें।'); err.status = res.status; throw err; }
    return d;
  }

  // ---- step 1
  async function verify() {
    clear('vErr');
    prn = $('prn').value.trim().toUpperCase();
    if (!/^[A-Za-z0-9]{6,20}$/.test(prn)) return fail('vErr', 'सही PRN डालें।');
    const b = $('vBtn'), label = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
    try { info = await post('gtmc-submission-verify', { prn }); enter(); }
    catch (e) { fail('vErr', e.message); }
    b.disabled = false; b.innerHTML = label;
  }
  function enter() {
    if (!info.open) { $('liveTag').textContent = 'CLOSED'; return show(['closedCard']); }
    const h = $('hello'); h.textContent = '';
    h.append('✔ ', Object.assign(document.createElement('b'), { textContent: info.name }), ' · PRN ' + info.prn);
    const s = document.createElement('small');
    s.textContent = [info.course_year, info.branch, info.topic ? 'Topic: ' + info.topic.title : ''].filter(Boolean).join(' · ');
    h.appendChild(s);
    $('noTopic').style.display = info.topic ? 'none' : 'block';
    const pv = $('prev');
    if (info.submitted_at) { pv.textContent = 'पहले से submitted: ' + (info.submission_name || 'project.zip') + ' (' + fmt(info.submission_size || 0) + ') · ' + when(info.submitted_at) + '. नई file upload करने पर यह बदल जाएगी।'; pv.style.display = 'block'; }
    else pv.style.display = 'none';
    reset(); $('link').value = info.submission_link || ''; show(['uploadCard']);
  }

  // ---- step 2
  function reset() { file = null; $('file').value = ''; $('picked').style.display = 'none'; $('uBtn').disabled = true; $('bar').style.display = 'none'; $('barIn').style.width = '0'; clear('uErr'); }
  function pick(f) {
    clear('uErr');
    if (!f) return reset();
    if (!/\.zip$/i.test(f.name)) { reset(); return fail('uErr', 'सिर्फ़ .zip file चलेगी।'); }
    if (f.size > MAX) { reset(); return fail('uErr', 'File ' + fmt(f.size) + ' की है। Maximum 3 MB की अनुमति है, zip छोटा करें।'); }
    if (f.size < 22) { reset(); return fail('uErr', 'File खाली लग रही है।'); }
    file = f; $('pName').textContent = f.name; $('pSize').textContent = fmt(f.size); $('picked').style.display = 'flex'; $('uBtn').disabled = false;
  }
  function toBase64(f) {
    return new Promise((ok, no) => {
      const r = new FileReader();
      r.onload = () => { const s = String(r.result); ok(s.slice(s.indexOf(',') + 1)); };
      r.onerror = () => no(new Error('File पढ़ी नहीं जा सकी।'));
      r.readAsDataURL(f);
    });
  }
  async function submit() {
    clear('uErr');
    const link = normLink($('link').value);
    if (!link) { $('link').focus(); return fail('uErr', 'सही website link डालें (जैसे https://your-site.vercel.app)।'); }
    if (!file) return fail('uErr', 'Project की .zip file भी चुनें।');
    const b = $('uBtn'), label = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    $('bar').style.display = 'block'; $('barIn').style.width = '30%';
    try {
      const data = await toBase64(file); $('barIn').style.width = '60%';
      const d = await post('gtmc-submission-upload', { prn, link, filename: file.name, data });
      $('barIn').style.width = '100%';
      info = d;
      $('dTitle').textContent = d.replaced ? 'Submission Updated!' : 'Submission Received!';
      $('dText').textContent = d.name + ' (PRN ' + d.prn + '), आपका project सफलतापूर्वक submit हो गया है।';
      $('dFile').textContent = d.submission_name + ' · ' + fmt(d.submission_size) + ' · ' + when(d.submitted_at);
      $('dLink').textContent = 'Website: ' + (d.submission_link || link);
      show(['doneCard']);
    } catch (e) { fail('uErr', e.message); $('bar').style.display = 'none'; }
    b.innerHTML = label; b.disabled = !file;
  }

  $('vBtn').addEventListener('click', verify);
  $('prn').addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });
  $('file').addEventListener('change', (e) => pick(e.target.files[0]));
  $('pClear').addEventListener('click', reset);
  $('uBtn').addEventListener('click', submit);
  $('other').addEventListener('click', () => { info = null; reset(); show(['verifyCard']); $('prn').focus(); });
  $('again').addEventListener('click', () => { enter(); });
  const drop = $('drop');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));
})();
