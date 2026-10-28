

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

let TOPICS = [];
function renderDone(d) {
  const t = TOPICS.find(x => x.id === d.topic);
  $('doneWho').textContent = d.name + ', ' + d.branch;
  $('doneTopic').textContent = t ? t.title : d.topic;
  $('doneIdea').textContent = d.idea || '';
  show('doneIdeaRow', !!d.idea);
  show('loginCard', false); show('pickCard', false); show('noCard', false); show('doneCard', true);
}
function renderPick(d) {
  TOPICS = d.topics || [];
  if (d.topic) return renderDone(d);
  if (!TOPICS.length) { $('noP').textContent = d.name + ', ' + d.track.title + ' category में topic चुनने की ज़रूरत नहीं है। सीधे submission window का इंतज़ार करें।'; show('loginCard', false); show('pickCard', false); show('doneCard', false); show('noCard', true); return; }
  $('av').textContent = (d.name || '?').trim().charAt(0).toUpperCase();
  $('who').textContent = d.name; $('whoSub').textContent = d.branch + ' · ' + d.track.title;
  const box = $('list'); box.innerHTML = '';
  TOPICS.forEach(t => {
    const l = document.createElement('label'); l.className = 'topic';
    const i = document.createElement('input'); i.type = 'radio'; i.name = 'topic'; i.value = t.id;
    const b = document.createElement('b'); b.textContent = t.title;
    const s = document.createElement('span'); s.textContent = t.desc;
    l.append(i, b, s); box.appendChild(l);
  });
  show('loginCard', false); show('pickCard', true); show('noCard', false); show('doneCard', false);
}
async function login() {
  const c = creds(); showErr('loginErr', '');
  if (!c.prn || !c.order_id) return showErr('loginErr', 'PRN और Order ID दोनों डालें।');
  const btn = $('loginBtn'); btn.disabled = true;
  try { const d = await post('/api/event?action=topics', c); save(c.prn, c.order_id); renderPick(d); }
  catch (e) { showErr('loginErr', e.message); }
  btn.disabled = false;
}
async function pick() {
  const c = creds(); const sel = document.querySelector('input[name=topic]:checked'); showErr('pickErr', '');
  if (!sel) return showErr('pickErr', 'पहले एक topic चुनें।');
  if (!confirm('Topic पक्का करें? इसे बाद में बदला नहीं जा सकेगा।')) return;
  const btn = $('pickBtn'); btn.disabled = true;
  try { const d = await post('/api/event?action=topics', Object.assign(c, { topic: sel.value, idea: $('idea').value })); renderDone(d); }
  catch (e) { showErr('pickErr', e.message); }
  btn.disabled = false;
}
$('loginBtn').addEventListener('click', login);
$('pickBtn').addEventListener('click', pick);
$('idea').addEventListener('input', () => { $('cnt').textContent = $('idea').value.length; });
(async function init() {
  let open = false;
  try { open = (await (await fetch('/api/event?action=info')).json()).topics_open; } catch (e) {}
  if (!open) return show('closedCard', true);
  const s = saved(); $('prn').value = s.prn || ''; $('oid').value = s.order_id || '';
  show('loginCard', true);
  if (s.prn && s.order_id) login();
})();

