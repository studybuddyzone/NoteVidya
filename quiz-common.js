/* quiz-common.js — StudyBuddy Quiz: shared service layer + helpers.
 * Loaded by quiz-host.html, quiz-join.html, quiz-live.html.
 * Keep ALL API calls here — pages should never fetch() the quiz API directly.
 */
(function (global) {
  const QUIZ_API = 'https://studybuddypro-psi.vercel.app/api/quiz';

  async function callQuiz(action, payload) {
    const res = await fetch(QUIZ_API + '?action=' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    let data;
    try { data = await res.json(); } catch (e) { data = { success: false, error: 'Server se invalid response mila.' }; }
    if (!res.ok && data.success === undefined) data.success = false;
    return data;
  }

  // ── quizService ──────────────────────────────────────────────────────────
  const quizService = {
    createQuiz: (payload) => callQuiz('create-quiz', payload),
    listQuizzes: (payload) => callQuiz('list-quizzes', payload),
    getQuizAdmin: (payload) => callQuiz('get-quiz-admin', payload),
    startQuiz: (payload) => callQuiz('start-quiz', payload),
    endQuiz: (payload) => callQuiz('end-quiz', payload),
    deleteQuiz: (payload) => callQuiz('delete-quiz', payload)
  };

  // ── participantService ───────────────────────────────────────────────────
  const participantService = {
    roomState: (payload) => callQuiz('room-state', payload),
    verifyPRN: (payload) => callQuiz('verify-and-join', payload) // verifies + joins in one step
  };

  // ── leaderboardService ───────────────────────────────────────────────────
  const leaderboardService = {
    getLeaderboard: (payload) => callQuiz('leaderboard', payload)
  };

  // ── room code helper ────────────────────────────────────────────────────
  // Room IDs are always "QZ-XXXXXX". Students/hosts often type/paste a code
  // without the dash, with stray spaces, or lowercase — normalize so those
  // still resolve to the real room instead of a false "not found".
  function normalizeRoomCode(input){
    let v = (input || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.startsWith('QZ')) v = v.slice(2);
    return v ? 'QZ-' + v : '';
  }

  // ── questionService / resultService ──────────────────────────────────────
  const questionService = {
    getLiveQuestions: (payload) => callQuiz('get-live-questions', payload)
  };
  const resultService = {
    saveAnswer: (payload) => callQuiz('save-answer', payload),
    submitQuiz: (payload) => callQuiz('submit-quiz', payload)
  };

  // ── link helper ──────────────────────────────────────────────────────────
  function generateQuizLink(roomId) {
    return window.location.origin + '/quiz-join?room=' + encodeURIComponent(roomId);
  }

  // ── timer abstraction — never trust local elapsed time, always derive from server endTime ──
  function getRemainingTime(serverEndTime) {
    const ms = Math.max(0, serverEndTime - Date.now());
    const totalSeconds = Math.floor(ms / 1000);
    return {
      ms,
      totalSeconds,
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
      isUp: ms <= 0
    };
  }
  function formatMMSS(t) {
    return String(t.minutes).padStart(2, '0') + ':' + String(t.seconds).padStart(2, '0');
  }

  // ── who's asking — reused across pages, reads the globals second-year already sets ──
  function currentIdentity() {
    return {
      uid: global._userUid || null,
      prn: global._userPrn || null,
      name: global._userName || null,
      isAdmin: !!global._userIsPremium
    };
  }

  const ADMIN_ROLES = ['admin', 'superadmin', 'super admin', 'super-admin', 'master'];

  // Resolves the logged-in StudyBuddy user's PRN/name/role from RTDB (same
  // `users` node & `uid` field convention used across the site), the same
  // way second-year's onAuthStateChanged handler does — pages that load
  // standalone (like a shared quiz link) don't get that for free, so we redo
  // the lookup here.
  function waitForAuth(timeoutMs) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (u) => { if (!done) { done = true; resolve(u); } };
      try {
        firebase.auth().onAuthStateChanged((user) => {
          if (!user) return finish({ uid: null, prn: null, name: null, isAdmin: false });
          global._userUid = user.uid;
          firebase.database().ref('users').orderByChild('uid').equalTo(user.uid).once('value')
            .then((snap) => {
              if (!snap.exists()) return finish({ uid: user.uid, prn: null, name: user.email || null, isAdmin: false });
              let prn = null, data = null;
              snap.forEach((child) => { prn = child.key; data = child.val(); });
              const role = ((data && data.role) || '').toString().toLowerCase();
              global._userPrn = prn;
              global._userName = (data && (data.name || data.displayName)) || (user.email ? user.email.split('@')[0] : 'Student');
              global._userIsPremium = ADMIN_ROLES.includes(role);
              finish({ uid: user.uid, prn, name: global._userName, isAdmin: ADMIN_ROLES.includes(role) });
            })
            .catch(() => finish({ uid: user.uid, prn: null, name: null, isAdmin: false }));
        });
      } catch (e) { finish({ uid: null, prn: null, name: null, isAdmin: false }); }
      setTimeout(() => finish({ uid: null, prn: null, name: null, isAdmin: false }), timeoutMs || 6000);
    });
  }

  global.QuizAPI = {
    quizService, participantService, questionService, resultService, leaderboardService,
    generateQuizLink, normalizeRoomCode, getRemainingTime, formatMMSS, currentIdentity, waitForAuth
  };
})(window);
