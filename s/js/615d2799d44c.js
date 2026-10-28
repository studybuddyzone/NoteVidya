
const firebaseConfig = {
  apiKey: "AIzaSyCZhDPaVY7jv_hXtHdpVqUcGe1hwAxvZmc",
  authDomain: "students-e5183.firebaseapp.com",
  databaseURL: "https://students-e5183-default-rtdb.firebaseio.com",
  projectId: "students-e5183",
  storageBucket: "students-e5183.firebasestorage.app",
  messagingSenderId: "473442117683",
  appId: "1:473442117683:web:f39adc0665317aa95e9b46"
};
try { firebase.initializeApp(firebaseConfig); } catch(e) {}

const SCREENS = ['stLoading','stCodeEntry','stError','stJoin','stVerified','stWaiting','stStarted'];
function show(id){ SCREENS.forEach(s=>document.getElementById(s).classList.toggle('hidden', s!==id)); }

// Room IDs are always stored/generated as "QZ-XXXXXX" (see api/quiz.js
// makeRoomId). Students often type/paste the code without the dash, with
// extra spaces, or in lowercase (e.g. copying it from a WhatsApp message
// read aloud by the host) — none of that should stop the room from being
// found, so we normalize back to the canonical "QZ-XXXXXX" form before we
// ever send it to the API.
function normalizeRoomCode(input){
  let v = (input || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''); // strip spaces/dashes/etc.
  if (v.startsWith('QZ')) v = v.slice(2); // drop the QZ prefix if present, we'll re-add it below
  return v ? 'QZ-' + v : '';
}

const params = new URLSearchParams(location.search);
let roomId = normalizeRoomCode(params.get('room'));
let ME = null;
let myStudent = null; // {name, prn, branch, college}
let pollTimer = null;

function goToCode(){
  const v = normalizeRoomCode(document.getElementById('codeInput').value);
  if (!v) return;
  location.href = 'quiz-join?room=' + encodeURIComponent(v);
}
function showError(icon, title, msg){
  document.getElementById('errIcon').textContent = icon;
  document.getElementById('errTitle').textContent = title;
  document.getElementById('errMsg').textContent = msg;
  show('stError');
}

(async function boot(){
  ME = await QuizAPI.waitForAuth(4500);
  if (!ME.uid) { location.href = '/?next=' + encodeURIComponent(location.pathname + location.search); return; }

  if (!roomId){ show('stCodeEntry'); return; }

  const r = await QuizAPI.participantService.roomState({ roomId, prn: ME.prn || '' });
  if (!r.success){
    if (r.error === 'not_found') showError('🔍','Quiz Not Found','Yeh quiz link valid nahi hai.');
    else showError('⚠️','Error', r.error || 'Kuch galat ho gaya.');
    return;
  }
  renderJoinInfo(r);

  if (r.alreadyJoined){
    if (r.myStatus === 'completed'){ showError('🎉','Already Submitted','Aapne yeh quiz already complete kar li hai.'); return; }
    if (r.myStatus === 'in-progress' || r.room.status === 'LIVE'){ goLive(); return; }
    // waiting
    enterWaitingRoom(true);
    return;
  }

  if (r.room.status === 'DRAFT') return showError('⏳','Not Open Yet','Yeh quiz abhi shuru nahi hui hai.');
  if (r.room.status === 'ENDED' || r.room.status === 'CANCELLED') return showError('🏁','Quiz Ended','Yeh quiz competition khatam ho chuki hai.');
  if (r.room.participantCount >= r.room.maxParticipants) return showError('🚫','Room Full','Is quiz me maximum participants ho chuke hain.');

  if (ME.prn) document.getElementById('prnInput').value = ME.prn;
  show('stJoin');
})();

function renderJoinInfo(r){
  const room = r.room;
  document.getElementById('jTitle').textContent = room.title;
  document.getElementById('jHost').textContent = 'Hosted by ' + (room.hostName||'Host') + (room.subject ? ' · ' + room.subject : '');
  document.getElementById('jDesc').textContent = room.description || '';
  document.getElementById('jQCount').textContent = room.numQuestions;
  document.getElementById('jDuration').textContent = room.duration;
  document.getElementById('jCount').textContent = room.participantCount + ' / ' + room.maxParticipants;
  document.getElementById('jFill').style.width = Math.min(100, (room.participantCount/room.maxParticipants)*100) + '%';
}

async function doVerify(){
  const prn = document.getElementById('prnInput').value.trim();
  if (!/^\d{16}$/.test(prn)){ alert('PRN exactly 16 digits ka hona chahiye.'); return; }
  const btn = document.getElementById('verifyBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

  const r = await QuizAPI.participantService.verifyPRN({ roomId, prn });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Verify PRN';

  if (!r.success){
    if (r.error === 'room_full') return showError('🚫','Room Full','Is quiz me maximum participants ho chuke hain.');
    if (r.error === 'room_ended') return showError('🏁','Quiz Ended', r.message||'');
    return showError('❌','PRN Not Found', r.message || 'Aapka PRN is quiz ke liye registered nahi hai.');
  }
  myStudent = r.student;
  document.getElementById('vName').textContent = myStudent.name;
  document.getElementById('vPrn').textContent = myStudent.prn;
  document.getElementById('vBranch').textContent = myStudent.branch || '—';
  document.getElementById('vCollege').textContent = myStudent.college || '—';
  show('stVerified');
}

async function enterWaitingRoom(skipFetch){
  if (!myStudent && ME.prn) myStudent = { prn: ME.prn, name: ME.name };
  show('stWaiting');
  await pollWaiting();
  clearInterval(pollTimer);
  pollTimer = setInterval(pollWaiting, 3000);
}
async function pollWaiting(){
  const r = await QuizAPI.participantService.roomState({ roomId, prn: (myStudent&&myStudent.prn)||ME.prn||'' });
  if (!r.success) return;
  const room = r.room;
  document.getElementById('wTitle').textContent = room.title;
  document.getElementById('wCount').textContent = 'Participants: ' + room.participantCount + ' / ' + room.maxParticipants;
  const pill = document.getElementById('wStatusPill');
  const wrap = document.getElementById('wRoster');
  wrap.innerHTML = (r.participants||[]).map(p=>{
    const cls = p.status==='in-progress' ? 'live' : '';
    return `<div class="roster-item"><span class="dot ${cls}"></span>${escapeHtml(p.name)}</div>`;
  }).join('') || '<p class="muted">Waiting for other students...</p>';

  if (room.status === 'LIVE'){
    clearInterval(pollTimer);
    pill.textContent = 'LIVE'; pill.classList.add('live');
    goLive();
  }
}
function goLive(){
  show('stStarted');
  const prn = (myStudent&&myStudent.prn) || ME.prn || '';
  sessionStorage.setItem('sb_quiz_prn_'+roomId, prn);
  setTimeout(()=>{ location.href = 'quiz-live?room=' + encodeURIComponent(roomId); }, 1400);
}
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
