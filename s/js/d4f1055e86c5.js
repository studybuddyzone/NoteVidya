
const $ = (id) => document.getElementById(id);
const show = (id, on) => { $(id).style.display = on ? '' : 'none'; };
function showErr(id, msg) { const e = $(id); e.textContent = msg; e.style.display = msg ? 'block' : 'none'; }
function saved() { try { return JSON.parse(sessionStorage.getItem('swayam_login') || '{}'); } catch (e) { return {}; } }
function save(prn, oid) { try { sessionStorage.setItem('swayam_login', JSON.stringify({ prn: prn, order_id: oid })); } catch (e) {} }
async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok) { const er = new Error(d.message || 'कुछ गड़बड़ हो गई। दोबारा try करें।'); er.status = r.status; throw er; }
  return d;
}
function creds() { return { prn: $('prn').value.trim().toUpperCase(), order_id: $('oid').value.trim() }; }
function fmtSize(n) { return n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
function fmtTime(iso) { try { return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } }

let CUR = null;
function setMe(d) {
  CUR = d;
  $('av').textContent = (d.name || '?').trim().charAt(0).toUpperCase();
  $('who').textContent = d.name; $('whoSub').textContent = d.branch + ' · ' + d.track.title;
  const p = $('prev');
  if (d.submitted_at) {
    p.style.display = ''; p.innerHTML = ''; const b = document.createElement('b'); b.textContent = 'पिछला submission: ';
    const what = d.submission_link ? d.submission_link : (d.submission_name || 'file') + ', ' + fmtSize(d.submission_size || 0);
    p.append(b, what + ' (' + fmtTime(d.submitted_at) + ')');
  } else p.style.display = 'none';
}
function showUpload(d) {
  setMe(d);
  const sp = d.track.submit;
  $('upHint').textContent = sp.label + '। ' + sp.hint;
  const isLink = sp.kind === 'link';
  show('fileBox', !isLink); show('linkBox', isLink);
  if (isLink) { $('linkLabel').textContent = sp.label; $('link').value = ''; }
  else { $('file').value = ''; $('file').setAttribute('accept', sp.exts.map(x => '.' + x).join(',')); onFile(); }
  show('loginCard', false); show('doneCard', false); show('upCard', true);
}
async function login() {
  const c = creds(); showErr('loginErr', '');
  if (!c.prn || !c.order_id) return showErr('loginErr', 'PRN और Order ID दोनों डालें।');
  const btn = $('loginBtn'); btn.disabled = true;
  try { const d = await post('/api/event?action=submit', c); save(c.prn, c.order_id); showUpload(d); }
  catch (e) { showErr('loginErr', e.message); }
  btn.disabled = false;
}
function extOf(n) { const m = String(n).match(/\.([A-Za-z0-9]{2,5})$/); return m ? m[1].toLowerCase() : ''; }
function fileProblem(f) {
  const sp = CUR.track.submit;
  if (!sp.exts.includes(extOf(f.name))) return 'इस category में सिर्फ़ ये file types चलेंगे: ' + sp.exts.map(x => '.' + x).join(', ');
  if (f.size > sp.max) return 'File ' + fmtSize(f.size) + ' की है, जो ' + fmtSize(sp.max) + ' से बड़ी है। उसे छोटा करके दोबारा चुनें।';
  return '';
}
function onFile() {
  const f = $('file').files[0]; showErr('upErr', '');
  const sp = CUR && CUR.track.submit;
  if (!f) { $('fname').textContent = 'File चुनने के लिए यहाँ दबाएँ'; $('fmeta').textContent = sp ? sp.exts.map(x => '.' + x).join(', ') + ' · maximum ' + fmtSize(sp.max) : ''; return; }
  $('fname').textContent = f.name; $('fmeta').textContent = fmtSize(f.size);
  const pr = fileProblem(f); if (pr) showErr('upErr', pr);
}
function toB64(file) {
  return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(new Error('File पढ़ी नहीं जा सकी।')); r.readAsDataURL(file); });
}
async function submitIt() {
  showErr('upErr', '');
  const sp = CUR.track.submit; let extra;
  if (sp.kind === 'link') {
    const link = $('link').value.trim();
    if (!/^https:\/\/\S+$/i.test(link)) return showErr('upErr', 'सही https link डालें।');
    extra = { link: link };
  } else {
    const f = $('file').files[0];
    if (!f) return showErr('upErr', 'पहले file चुनें।');
    const pr = fileProblem(f); if (pr) return showErr('upErr', pr);
    extra = null;
  }
  const btn = $('upBtn'); btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submit हो रहा है...';
  try {
    if (!extra) { const f = $('file').files[0]; extra = { filename: f.name, data: await toB64(f) }; }
    const d = await post('/api/event?action=submit', Object.assign(creds(), extra));
    $('doneH').textContent = d.replaced ? 'Submission बदल दिया गया' : 'Submission मिल गया';
    $('doneP').textContent = d.name + ', आपका ' + d.track.title + ' submission ' + fmtTime(d.submitted_at) + ' पर मिल गया।';
    setMe(d); show('upCard', false); show('doneCard', true);
  } catch (e) { showErr('upErr', e.message); }
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit करें';
}
$('loginBtn').addEventListener('click', login);
$('upBtn').addEventListener('click', submitIt);
$('file').addEventListener('change', onFile);
$('again').addEventListener('click', (e) => { e.preventDefault(); showUpload(CUR); });
(async function init() {
  let open = false;
  try { open = (await (await fetch('/api/event?action=info')).json()).submit_open; } catch (e) {}
  if (!open) return show('closedCard', true);
  const s = saved(); $('prn').value = s.prn || ''; $('oid').value = s.order_id || '';
  show('loginCard', true);
  if (s.prn && s.order_id) login();
})();
