
fetch('/api/event?action=info').then(r => r.json()).then(d => {
  document.getElementById('catCount').textContent = (d.tracks || []).length;
  const hc = document.getElementById('heroCats'); hc.innerHTML = '';
  (d.tracks || []).forEach(t => { const s = document.createElement('span'); s.textContent = t.title; hc.appendChild(s); });
  const box = document.getElementById('cats'); box.innerHTML = '';
  (d.tracks || []).forEach(t => {
    const w = document.createElement('div'); w.className = 'cat';
    const ic = document.createElement('i'); ic.className = 'fa-solid ' + t.icon;
    const bd = document.createElement('div');
    const b = document.createElement('b'); b.textContent = t.title;
    const p = document.createElement('p'); p.textContent = t.desc;
    const em = document.createElement('em'); em.textContent = 'Submit करना है: ' + t.submit.label + '। ' + t.submit.hint;
    bd.append(b, p, em); w.append(ic, bd); box.appendChild(w);
  });
  if (d.topics_open) document.getElementById('ctaTopics').style.display = 'flex';
  if (d.submit_open) document.getElementById('ctaSubmit').style.display = 'flex';
  const left = Date.parse(d.closes_at) - Date.parse(d.now);
  if (left <= 0) { const c = document.getElementById('cta'); c.textContent = 'Registration बंद हो गया'; c.classList.add('off'); c.removeAttribute('href'); }
  else setTimeout(() => location.reload(), Math.min(left + 500, 2147483000));
}).catch(() => { document.getElementById('cats').innerHTML = '<p class="note">Categories load नहीं हो पाईं। Page refresh करें।</p>'; });
