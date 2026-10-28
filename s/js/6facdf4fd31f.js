
function goHome(){ location.href = 'second-year'; }

function showScreen(id){
  ['stEntry','stLoading','stResult','stEmpty'].forEach(s=>{
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s!==id);
  });
}

async function lookupLeaderboard(){
  const raw = document.getElementById('codeInput').value;
  const roomId = QuizAPI.normalizeRoomCode(raw);
  const errEl = document.getElementById('entryError');
  errEl.textContent = '';
  if (!roomId){ errEl.textContent = 'Quiz code daalo.'; return; }

  const btn = document.getElementById('lookupBtn');
  btn.disabled = true;
  showScreen('stLoading');

  const r = await QuizAPI.leaderboardService.getLeaderboard({ roomId });
  btn.disabled = false;

  if (!r.success){
    showScreen('stEntry');
    if (r.error === 'not_found') errEl.textContent = 'Yeh quiz code valid nahi hai.';
    else errEl.textContent = r.error || 'Kuch galat ho gaya, dobara try karo.';
    return;
  }

  if (!r.leaderboard || !r.leaderboard.length){
    document.getElementById('emptyMsg').textContent = (r.room && r.room.title ? '"' + r.room.title + '" me' : 'Is quiz me') + ' abhi tak kisi ne submit nahi kiya hai.';
    showScreen('stEmpty');
    return;
  }

  renderLeaderboard(r);
  showScreen('stResult');
}

function renderLeaderboard(r){
  document.getElementById('lbTitle').textContent = (r.room && r.room.title) || 'Quiz Results';
  const parts = [];
  if (r.room && r.room.hostName) parts.push('Hosted by ' + r.room.hostName);
  parts.push(r.totalCompleted + ' submission' + (r.totalCompleted===1?'':'s'));
  document.getElementById('lbSub').textContent = parts.join(' · ');

  const wrap = document.getElementById('lbList');
  wrap.innerHTML = r.leaderboard.map(p=>{
    const topCls = p.rank===1?'top1':(p.rank===2?'top2':(p.rank===3?'top3':''));
    const rankDisplay = p.rank<=3 ? `<span class="medal">${p.rank===1?'🥇':p.rank===2?'🥈':'🥉'}</span>` : p.rank;
    return `<div class="row ${topCls}">
      <div class="rank">${rankDisplay}</div>
      <div class="rowinfo">
        <div class="rowname">${esc(p.name)}</div>
        <div class="rowmeta">${esc(p.branch||p.college||'')}</div>
      </div>
      <div class="rowscore">
        <div class="pts">${p.score}/${p.maxScore}</div>
        <div class="pct">${p.percentage}%</div>
      </div>
    </div>`;
  }).join('');
}

function resetSearch(){
  document.getElementById('codeInput').value = '';
  document.getElementById('entryError').textContent = '';
  showScreen('stEntry');
}

function esc(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

document.getElementById('codeInput').addEventListener('keydown', (e)=>{ if (e.key==='Enter') lookupLeaderboard(); });

// If arrived via a direct link like quiz-leaderboard?room=QZ-XXXXXX,
// look it up immediately instead of making the person retype it.
(function boot(){
  const params = new URLSearchParams(location.search);
  const roomParam = params.get('room');
  if (roomParam){
    document.getElementById('codeInput').value = roomParam;
    lookupLeaderboard();
  }
})();
