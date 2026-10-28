
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

let ME = null;              // {uid, prn, name, isAdmin}
let draftQuestions = [];
let editingIndex = -1;
let genRoomId = null, genLink = null;
let currentRoomId = null;
let currentTab = 'ALL';
let allQuizzes = [];
let roomPollTimer = null;

function toast(msg){
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.getElementById('toastHost').appendChild(el);
  setTimeout(()=>el.remove(), 2600);
}
function show(id){
  ['screenDashboard','screenCreate','screenGenerated','screenRoom'].forEach(s=>{
    document.getElementById(s).classList.toggle('hidden', s!==id);
  });
}

// ── Boot / auth gate ─────────────────────────────────────────────────────
(async function boot(){
  ME = await QuizAPI.waitForAuth(4500);
  if (!ME || !ME.uid) {
    window.location.href = '/';
    return;
  }
  if (!ME.isAdmin) {
    document.getElementById('gateScreen').classList.add('hidden');
    document.getElementById('deniedScreen').classList.remove('hidden');
    return;
  }
  document.getElementById('gateScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  goDashboard();
})();

// ── Dashboard ────────────────────────────────────────────────────────────
async function goDashboard(){
  clearInterval(roomPollTimer);
  show('screenDashboard');
  document.getElementById('quizListWrap').innerHTML = '<div class="loader"></div>';
  const r = await QuizAPI.quizService.listQuizzes({ adminPrn: ME.prn, adminUid: ME.uid });
  if (!r.success) { document.getElementById('quizListWrap').innerHTML = '<div class="empty">'+ (r.error||'Load failed') +'</div>'; return; }
  allQuizzes = r.rooms || [];
  renderQuizList();
}
function setTab(t){
  currentTab = t;
  document.querySelectorAll('#dashTabs .tab').forEach(el=>el.classList.toggle('active', el.dataset.f===t));
  renderQuizList();
}
function renderQuizList(){
  const wrap = document.getElementById('quizListWrap');
  const list = currentTab==='ALL' ? allQuizzes : allQuizzes.filter(q=>q.status===currentTab);
  if (!list.length){ wrap.innerHTML = '<div class="empty"><i class="fa-solid fa-inbox"></i>No quizzes here yet.</div>'; return; }
  wrap.innerHTML = list.map(q=>`
    <div class="quiz-card">
      <div style="min-width:0;">
        <div style="font-weight:700;">${esc(q.title)} <span class="badge badge-${q.status.toLowerCase()}">${q.status}</span></div>
        <div class="meta">${esc(q.subject||'—')} · ${q.numQuestions} Qs · ${q.duration} min · ${q.participantCount}/${q.maxParticipants} joined</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="openRoom('${q.roomId}')">Manage</button>
    </div>`).join('');
}

// ── Create quiz ──────────────────────────────────────────────────────────
function goCreate(){
  draftQuestions = []; editingIndex = -1;
  ['cTitle','cSubject','cDesc','qText','qA','qB','qC','qD','qTopic','qExpl'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cDuration').value=30;
  document.getElementById('cMax').value=10;
  document.getElementById('cPassing').value=40;
  document.getElementById('cNeg').checked=false;
  document.getElementById('cNegValWrap').classList.add('hidden');
  document.getElementById('cRandQ').checked=false;
  document.getElementById('cRandO').checked=false;
  setAddMode('manual');
  document.getElementById('jsonInput').value='';
  document.getElementById('jsonError').textContent='';
  document.getElementById('jsonFileName').textContent='';
  renderQuestionList();
  show('screenCreate');
}
function setAddMode(mode){
  document.querySelectorAll('#screenCreate .tabs .tab').forEach(el=>el.classList.toggle('active', el.dataset.m===mode));
  document.getElementById('manualAddWrap').classList.toggle('hidden', mode!=='manual');
  document.getElementById('jsonAddWrap').classList.toggle('hidden', mode!=='json');
}

const SAMPLE_MCQ_JSON = JSON.stringify([
  {
    question: "Which SQL keyword is used to remove duplicate rows from a result set?",
    options: { A: "UNIQUE", B: "DISTINCT", C: "FILTER", D: "REMOVE" },
    correctAnswer: "B",
    marks: 1,
    negativeMarks: 0.25,
    difficulty: "easy",
    topic: "SQL Basics",
    explanation: "DISTINCT eliminates duplicate rows from the SELECT output."
  },
  {
    question: "In DBMS, which normal form removes partial dependency on a composite primary key?",
    options: { A: "1NF", B: "2NF", C: "3NF", D: "BCNF" },
    correctAnswer: "B",
    marks: 2,
    negativeMarks: 0.5,
    difficulty: "medium",
    topic: "Normalization",
    explanation: "2NF requires that every non-key attribute be fully functionally dependent on the whole primary key."
  },
  {
    question: "What is the time complexity of binary search on a sorted array of n elements?",
    options: { A: "O(n)", B: "O(n log n)", C: "O(log n)", D: "O(1)" },
    correctAnswer: "C",
    marks: 1,
    negativeMarks: 0.25,
    difficulty: "easy",
    topic: "Algorithms",
    explanation: "Binary search halves the search space each step, giving O(log n)."
  },
  {
    question: "Which layer of the OSI model is responsible for routing packets between networks?",
    options: { A: "Data Link Layer", B: "Network Layer", C: "Transport Layer", D: "Session Layer" },
    correctAnswer: "B",
    marks: 1,
    negativeMarks: 0,
    difficulty: "medium",
    topic: "Computer Networks",
    explanation: "The Network Layer (Layer 3) handles logical addressing and routing."
  },
  {
    question: "In Java, which keyword is used to prevent a class from being inherited?",
    options: { A: "static", B: "private", C: "final", D: "abstract" },
    correctAnswer: "C",
    marks: 1,
    negativeMarks: 0.25,
    difficulty: "easy",
    topic: "OOP Concepts",
    explanation: "A 'final' class cannot be subclassed."
  }
], null, 2);

function handleJSONFileUpload(input){
  const file = input.files && input.files[0];
  const errEl = document.getElementById('jsonError');
  const nameEl = document.getElementById('jsonFileName');
  errEl.textContent = '';
  nameEl.textContent = '';
  if (!file) return;

  if (!/\.json$/i.test(file.name)){
    errEl.textContent = 'Sirf .json file upload karo.';
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('jsonInput').value = reader.result;
    input.value = ''; // allow re-uploading the same file later
    // Uploading a file should count as importing it — don't make the host
    // click "Import Questions" a second time, and don't let "Generate Quiz"
    // wrongly complain about 0 questions when a valid file was just loaded.
    importQuestionsJSON();
    if (document.getElementById('jsonError').textContent){
      // Import failed validation (bad JSON / missing fields) — leave the
      // raw content in the textarea so the host can see & fix it, but let
      // them know the file itself did load.
      nameEl.textContent = '📄 ' + file.name + ' loaded, but has errors — see below.';
    } else {
      nameEl.textContent = '📄 ' + file.name + ' imported.';
    }
  };
  reader.onerror = () => {
    errEl.textContent = 'File read nahi ho paayi, dobara try karo.';
    input.value = '';
  };
  reader.readAsText(file);
}

function importQuestionsJSON(){
  const raw = document.getElementById('jsonInput').value.trim();
  const errEl = document.getElementById('jsonError');
  errEl.textContent = '';
  if (!raw){ errEl.textContent = 'Pehle JSON paste karo ya "Load Sample" try karo.'; return; }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e){ errEl.textContent = 'Invalid JSON: ' + e.message; return; }

  if (!Array.isArray(parsed)){ errEl.textContent = 'JSON ek array honi chahiye, e.g. [ {...}, {...} ]'; return; }
  if (!parsed.length){ errEl.textContent = 'Array khaali hai — kam se kam 1 question do.'; return; }

  const cleaned = [];
  for (let i=0;i<parsed.length;i++){
    const q = parsed[i] || {};
    const opts = q.options || {};
    const question = (q.question||'').toString().trim();
    const A = (opts.A||'').toString().trim(), B = (opts.B||'').toString().trim(), C = (opts.C||'').toString().trim(), D = (opts.D||'').toString().trim();
    const correct = (q.correctAnswer||'').toString().trim().toUpperCase();

    if (!question || !A || !B || !C || !D){ errEl.textContent = `Question #${i+1}: "question" aur chaaron options (A,B,C,D) zaroori hain.`; return; }
    if (!['A','B','C','D'].includes(correct)){ errEl.textContent = `Question #${i+1}: "correctAnswer" A/B/C/D me se ek hona chahiye.`; return; }

    cleaned.push({
      question,
      options: { A, B, C, D },
      correctAnswer: correct,
      marks: parseFloat(q.marks) || 1,
      negativeMarks: parseFloat(q.negativeMarks) || 0,
      difficulty: ['easy','medium','hard'].includes((q.difficulty||'').toLowerCase()) ? q.difficulty.toLowerCase() : 'medium',
      topic: (q.topic||'').toString().trim(),
      explanation: (q.explanation||'').toString().trim()
    });
  }

  draftQuestions = draftQuestions.concat(cleaned);
  renderQuestionList();
  document.getElementById('jsonInput').value = '';
  toast(cleaned.length + ' question(s) imported!');
  // Stay on the JSON Import tab — don't force-switch to Manual. The
  // question list above already reflects the newly-imported questions
  // regardless of which tab is showing, and forcing the switch made it look
  // like the import "moved" the data to Manual mode and also made it easy
  // to lose your place if you wanted to paste a second JSON batch.
}
function addOrUpdateQuestion(){
  const q = {
    question: document.getElementById('qText').value.trim(),
    options: { A: document.getElementById('qA').value.trim(), B: document.getElementById('qB').value.trim(), C: document.getElementById('qC').value.trim(), D: document.getElementById('qD').value.trim() },
    correctAnswer: document.getElementById('qCorrect').value,
    marks: parseFloat(document.getElementById('qMarks').value)||1,
    difficulty: document.getElementById('qDiff').value,
    topic: document.getElementById('qTopic').value.trim(),
    explanation: document.getElementById('qExpl').value.trim(),
    negativeMarks: 0
  };
  if (!q.question || !q.options.A || !q.options.B || !q.options.C || !q.options.D){
    toast('Question aur chaaron options bharo'); return;
  }
  if (editingIndex >= 0){ draftQuestions[editingIndex] = q; editingIndex = -1; document.getElementById('qAddBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Add Question'; }
  else draftQuestions.push(q);
  ['qText','qA','qB','qC','qD','qTopic','qExpl'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('qMarks').value=1;
  renderQuestionList();
}
function renderQuestionList(){
  document.getElementById('qCount').textContent = draftQuestions.length;
  const wrap = document.getElementById('questionListWrap');
  if (!draftQuestions.length){ wrap.innerHTML = '<p class="muted" style="margin-bottom:6px;">Koi question add nahi hua abhi.</p>'; return; }
  wrap.innerHTML = draftQuestions.map((q,i)=>`
    <div class="qitem">
      <div class="qtxt">Q${i+1}. ${esc(q.question)}</div>
      <div class="opts">
        <div>${q.correctAnswer==='A'?'<b>A. '+esc(q.options.A)+' ✓</b>':'A. '+esc(q.options.A)}</div>
        <div>${q.correctAnswer==='B'?'<b>B. '+esc(q.options.B)+' ✓</b>':'B. '+esc(q.options.B)}</div>
        <div>${q.correctAnswer==='C'?'<b>C. '+esc(q.options.C)+' ✓</b>':'C. '+esc(q.options.C)}</div>
        <div>${q.correctAnswer==='D'?'<b>D. '+esc(q.options.D)+' ✓</b>':'D. '+esc(q.options.D)}</div>
      </div>
      <div class="qactions">
        <button class="btn btn-outline btn-sm" onclick="editQuestion(${i})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-outline btn-sm" onclick="duplicateQuestion(${i})"><i class="fa-solid fa-copy"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}
function editQuestion(i){
  const q = draftQuestions[i];
  document.getElementById('qText').value=q.question;
  document.getElementById('qA').value=q.options.A; document.getElementById('qB').value=q.options.B;
  document.getElementById('qC').value=q.options.C; document.getElementById('qD').value=q.options.D;
  document.getElementById('qCorrect').value=q.correctAnswer;
  document.getElementById('qDiff').value=q.difficulty;
  document.getElementById('qMarks').value=q.marks;
  document.getElementById('qTopic').value=q.topic;
  document.getElementById('qExpl').value=q.explanation;
  editingIndex = i;
  document.getElementById('qAddBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Question';
  window.scrollTo({top: document.getElementById('qText').offsetTop - 100, behavior:'smooth'});
}
function duplicateQuestion(i){ draftQuestions.splice(i+1,0, JSON.parse(JSON.stringify(draftQuestions[i]))); renderQuestionList(); }
function deleteQuestion(i){ draftQuestions.splice(i,1); renderQuestionList(); }

async function generateQuiz(){
  const title = document.getElementById('cTitle').value.trim();
  const duration = parseInt(document.getElementById('cDuration').value,10);
  const maxParticipants = parseInt(document.getElementById('cMax').value,10);
  if (!title) return toast('Quiz title daalo');
  if (!draftQuestions.length) return toast('Kam se kam 1 question add karo');
  if (!duration || duration<=0) return toast('Valid duration daalo');
  if (!maxParticipants || maxParticipants<=0) return toast('Valid max participants daalo');

  const btn = document.getElementById('genBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

  const r = await QuizAPI.quizService.createQuiz({
    adminPrn: ME.prn, adminUid: ME.uid,
    title, subject: document.getElementById('cSubject').value.trim(),
    description: document.getElementById('cDesc').value.trim(),
    duration, maxParticipants,
    passingPercentage: parseInt(document.getElementById('cPassing').value,10)||40,
    negativeMarking: document.getElementById('cNeg').checked,
    negativeMarkValue: parseFloat(document.getElementById('cNegVal').value)||0.25,
    randomQuestions: document.getElementById('cRandQ').checked,
    randomOptions: document.getElementById('cRandO').checked,
    questions: draftQuestions
  });

  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Generate Quiz';

  if (!r.success){ toast(r.error || 'Quiz create nahi ho paya'); return; }
  genRoomId = r.roomId;
  genLink = QuizAPI.generateQuizLink(r.roomId);
  document.getElementById('genLinkBox').textContent = genLink;
  show('screenGenerated');
}
function copyGenLink(){ navigator.clipboard.writeText(genLink).then(()=>toast('Link copied!')); }
function shareGenLink(){
  if (navigator.share) navigator.share({ title:'Join my StudyBuddy Quiz', url: genLink }).catch(()=>{});
  else copyGenLink();
}

// ── Room management (waiting / live / ended) ────────────────────────────
async function openRoom(roomId){
  currentRoomId = roomId;
  show('screenRoom');
  document.getElementById('roomLinkBox').textContent = QuizAPI.generateQuizLink(roomId);
  await refreshRoom();
  clearInterval(roomPollTimer);
  roomPollTimer = setInterval(refreshRoom, 3000);
}
async function refreshRoom(){
  const r = await QuizAPI.quizService.getQuizAdmin({ adminPrn: ME.prn, adminUid: ME.uid, roomId: currentRoomId });
  if (!r.success){ toast(r.error||'Load failed'); return; }
  const room = r.room, participants = r.participants || [];
  document.getElementById('roomTitle').textContent = room.title;
  const badge = document.getElementById('roomBadge');
  badge.textContent = room.status;
  badge.className = 'badge badge-'+room.status.toLowerCase();
  document.getElementById('roomCount').textContent = room.participantCount+'/'+room.maxParticipants;
  const inProgress = participants.filter(p=>p.status==='in-progress').length;
  const completed = participants.filter(p=>p.status==='completed').length;
  document.getElementById('roomInProgress').textContent = inProgress;
  document.getElementById('roomCompleted').textContent = completed;

  const rw = document.getElementById('rosterWrap');
  if (!participants.length) rw.innerHTML = '<p class="muted">Waiting for students to join...</p>';
  else rw.innerHTML = participants.map(p=>{
    const cls = p.status==='completed' ? 'done' : (p.status==='in-progress' ? 'live':'');
    const label = p.status==='completed' ? (typeof p.percentage==='number' ? p.percentage+'%' : 'Done') : (p.status==='in-progress' ? 'In quiz':'Waiting');
    return `<div class="roster-item"><span class="dot ${cls}"></span><span style="flex:1;">${esc(p.name)}</span><span class="muted">${esc(p.branch||'')}</span><span class="muted" style="font-weight:700;">${label}</span></div>`;
  }).join('');

  document.getElementById('startBtn').classList.toggle('hidden', room.status!=='WAITING');
  document.getElementById('endBtn').classList.toggle('hidden', room.status!=='LIVE');
  if (room.status==='ENDED' || room.status==='DRAFT') clearInterval(roomPollTimer);
}

function confirmStart(){
  openModal(`
    <h2>Start Quiz?</h2>
    <p class="muted" style="margin:10px 0 18px;">Timer will start immediately for all joined students. This cannot be undone.</p>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="doStart()">Start Quiz</button>
    </div>`);
}
async function doStart(){
  closeModal();
  const r = await QuizAPI.quizService.startQuiz({ adminPrn: ME.prn, adminUid: ME.uid, roomId: currentRoomId });
  if (!r.success) return toast(r.error||'Start failed');
  toast('Quiz started!');
  refreshRoom();
}
function confirmEnd(){
  openModal(`
    <h2>End Quiz?</h2>
    <p class="muted" style="margin:10px 0 18px;">Students still in progress won't be able to continue answering.</p>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" style="flex:1;justify-content:center;" onclick="doEnd()">End Quiz</button>
    </div>`);
}
async function doEnd(){
  closeModal();
  const r = await QuizAPI.quizService.endQuiz({ adminPrn: ME.prn, adminUid: ME.uid, roomId: currentRoomId });
  if (!r.success) return toast(r.error||'End failed');
  toast('Quiz ended.');
  refreshRoom();
}

function openModal(html){
  document.getElementById('modalHost').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`;
  document.getElementById('modalHost').classList.remove('hidden');
}
function closeModal(){ document.getElementById('modalHost').innerHTML=''; document.getElementById('modalHost').classList.add('hidden'); }
function esc(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
