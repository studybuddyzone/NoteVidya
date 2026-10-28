
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

const params = new URLSearchParams(location.search);
const roomId = (params.get('room') || '').toUpperCase();

let ME = null, prn = null;
let questions = [];       // [{id, question, options}]
let answers = {};         // {qid: {answer, markedForReview}}
let current = 0;
let endTime = null;
let timerInterval = null;
let submitted = false;
let pendingSaveQid = null; // question id whose answer changed but hasn't been sent to the server yet
const LOCAL_KEY = 'sb_quiz_answers_' + roomId;

function show(id){
  ['stLoading','stBlocked','stCompleted','app'].forEach(s=>document.getElementById(s).classList.toggle('hidden', s!==id));
}
function blocked(icon, title, msg){ document.getElementById('blockIcon').textContent=icon; document.getElementById('blockTitle').textContent=title; document.getElementById('blockMsg').textContent=msg; show('stBlocked'); }

(async function boot(){
  if (!roomId) return blocked('🔍','No quiz specified','Quiz link me room code missing hai.');
  ME = await QuizAPI.waitForAuth(4500);
  if (!ME.uid) { location.href = '/?next=' + encodeURIComponent(location.pathname + location.search); return; }
  prn = sessionStorage.getItem('sb_quiz_prn_'+roomId) || ME.prn;
  if (!prn) return blocked('🔒','Not verified','Pehle quiz join page se PRN verify karo.');

  const r = await QuizAPI.questionService.getLiveQuestions({ roomId, prn });
  if (!r.success){
    if (r.error === 'already_submitted') { show('stCompleted'); return; }
    if (r.error === 'not_started') return blocked('⏳','Quiz not started', r.message || 'Host ne abhi quiz start nahi ki. Waiting room me wapas jao.');
    return blocked('⚠️','Could not load quiz', r.error || '');
  }

  document.getElementById('quizName').textContent = r.title;
  questions = r.questions;
  endTime = r.endTime;
  answers = r.savedAnswers || {};
  // merge in anything queued locally but maybe not yet synced
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    Object.keys(local).forEach(k => { if (!answers[k]) answers[k] = local[k]; });
  } catch(e){}

  renderNav();
  renderQuestion();
  startTimer();
  show('app');
})();

function startTimer(){
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    const t = QuizAPI.getRemainingTime(endTime);
    document.getElementById('timerText').textContent = QuizAPI.formatMMSS(t);
    const box = document.getElementById('timerBox');
    box.classList.toggle('warn', t.totalSeconds<=300 && t.totalSeconds>60);
    box.classList.toggle('danger', t.totalSeconds<=60);
    if (t.isUp){ clearInterval(timerInterval); autoSubmit(); }
  }, 1000);
}

function renderQuestion(){
  const q = questions[current];
  document.getElementById('qCounter').textContent = (current+1) + ' / ' + questions.length;
  document.getElementById('qText').textContent = q.question;
  const ans = answers[q.id] || {};
  const opts = ['A','B','C','D'];
  document.getElementById('optsWrap').innerHTML = opts.map(k=>{
    const sel = ans.answer === k;
    return `<div class="opt ${sel?'selected':''}" onclick="selectAnswer('${k}')"><span class="circ">${sel?'<i class="fa-solid fa-check"></i>':''}</span><span>${escapeHtml(q.options[k]||'')}</span></div>`;
  }).join('');
  const markBtn = document.getElementById('markBtn');
  markBtn.classList.toggle('active', !!ans.markedForReview);
  document.getElementById('saveState').textContent = '';
}

function selectAnswer(k){
  const q = questions[current];
  answers[q.id] = Object.assign({}, answers[q.id], { answer: k });
  renderQuestion();
  renderNav();
  // Don't hit the API on every click — a student changing their mind
  // several times before moving on would otherwise fire a save each time.
  // We just remember locally that this question needs saving, and flush it
  // when they actually move away from it (Next/Previous/jump/Submit).
  saveLocal();
  pendingSaveQid = q.id;
  document.getElementById('saveState').textContent = '';
}
function toggleMark(){
  const q = questions[current];
  const cur = answers[q.id] || {};
  answers[q.id] = Object.assign({}, cur, { markedForReview: !cur.markedForReview });
  renderQuestion();
  renderNav();
  saveLocal();
  pendingSaveQid = q.id;
  document.getElementById('saveState').textContent = '';
}

async function flushPendingSave(){
  if (!pendingSaveQid) return;
  const qid = pendingSaveQid;
  pendingSaveQid = null;
  await persistAnswer(qid);
}

async function persistAnswer(qid){
  const a = answers[qid];
  saveLocal();
  const stateEl = document.getElementById('saveState');
  stateEl.textContent = 'Saving...'; stateEl.className = 'savestate';
  try {
    const r = await QuizAPI.resultService.saveAnswer({ roomId, prn, questionId: qid, answer: a.answer, markedForReview: !!a.markedForReview });
    if (r.success){ stateEl.textContent = '✓ Answer saved'; stateEl.className = 'savestate ok'; }
    else { stateEl.textContent = 'Connection interrupted — answers are saved locally.'; stateEl.className = 'savestate err'; }
  } catch (e) {
    stateEl.textContent = 'Connection interrupted — answers are saved locally.'; stateEl.className = 'savestate err';
  }
}
function saveLocal(){ try { localStorage.setItem(LOCAL_KEY, JSON.stringify(answers)); } catch(e){} }

function renderNav(){
  const grid = document.getElementById('navGrid');
  grid.innerHTML = questions.map((q,i)=>{
    const a = answers[q.id] || {};
    let cls = '';
    if (a.markedForReview) cls = 'marked'; else if (a.answer) cls = 'answered';
    if (i===current) cls += ' current';
    return `<div class="navcell ${cls}" onclick="goTo(${i})">${i+1}</div>`;
  }).join('');
}
function goTo(i){ flushPendingSave(); current = i; renderQuestion(); renderNav(); }
function prevQ(){ if (current>0){ flushPendingSave(); current--; renderQuestion(); renderNav(); } }
function nextQ(){ if (current<questions.length-1){ flushPendingSave(); current++; renderQuestion(); renderNav(); } }

function openSubmitModal(){
  const answered = questions.filter(q=>answers[q.id] && answers[q.id].answer).length;
  const marked = questions.filter(q=>answers[q.id] && answers[q.id].markedForReview).length;
  const unanswered = questions.length - answered;
  document.getElementById('modalHost').innerHTML = `
    <div class="modal-bg" onclick="if(event.target===this)closeModal()">
      <div class="modal">
        <h2>Submit Quiz?</h2>
        <div class="sumrow"><span>Answered</span><b>${answered} / ${questions.length}</b></div>
        <div class="sumrow"><span>Unanswered</span><b>${unanswered}</b></div>
        <div class="sumrow"><span>Marked for Review</span><b>${marked}</b></div>
        <div style="display:flex;gap:10px;margin-top:18px;">
          <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="closeModal()">Continue Quiz</button>
          <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="doSubmit(false)">Submit Quiz</button>
        </div>
      </div>
    </div>`;
}
function closeModal(){ document.getElementById('modalHost').innerHTML=''; }

async function doSubmit(auto){
  if (submitted) return;
  submitted = true;
  closeModal();
  clearInterval(timerInterval);
  if (auto){
    document.getElementById('doneIcon').textContent = '⏰';
    document.getElementById('doneTitle').textContent = "Time's Up!";
    document.getElementById('doneMsg').textContent = 'Your quiz has been automatically submitted.';
  }
  await flushPendingSave(); // make sure the last question answered actually reaches the server
  await QuizAPI.resultService.submitQuiz({ roomId, prn, auto: !!auto });
  try { localStorage.removeItem(LOCAL_KEY); } catch(e){}
  show('stCompleted');
}
function autoSubmit(){ doSubmit(true); }

function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
window.addEventListener('beforeunload', saveLocal);
