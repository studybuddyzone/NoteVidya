// api/quiz.js
// StudyBuddy Quiz Competition backend.
//
// Identity/roles: RTDB `users/{prn}` (same source of truth as api/backend.js).
// Quiz data (rooms, questions, participants): Firestore, under `quizRooms`.
//
// SECURITY NOTE: correct answers / explanations are only ever read here with
// the Admin SDK and are stripped before anything is sent to a student. The
// `quizRooms/{roomId}/questions` subcollection should be locked in your
// Firestore rules (allow read: if false; allow write: if false;) since it is
// only ever touched from this server-side function.

const { admin, getRoleByPRN } = require("../lib/helpers");

const ELEVATED_ROLES = ["admin", "superadmin", "super admin", "super-admin", "master"];
const ROOM_ID_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion

function makeRoomId() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)];
  return "QZ-" + s;
}

// Normalizes a room code the same way for every handler below. Room IDs are
// always stored as "QZ-XXXXXX", but students/hosts frequently pass codes in
// without the dash, with stray spaces, or lowercase (copied from a chat
// message) — without this, those otherwise-valid codes 404 as "not_found"
// even though the room exists.
function normalizeRoomId(raw) {
  let v = (raw || "").toString().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!v) return "";
  if (v.startsWith("QZ")) v = v.slice(2);
  return v ? "QZ-" + v : "";
}

async function getUserNode(prn) {
  const snap = await admin.database().ref("users/" + prn).once("value");
  return snap.val();
}

// Resolves who's calling (by PRN or by Auth uid) and checks they're allowed to host.
async function requireAdmin(body) {
  let adminPrn = (body.adminPrn || "").toString().trim();
  const adminUid = (body.adminUid || "").toString().trim();
  const db = admin.database();

  if (!adminPrn && adminUid) {
    const snap = await db.ref("users").orderByChild("uid").equalTo(adminUid).once("value");
    const val = snap.val();
    if (val) adminPrn = Object.keys(val)[0];
  }
  if (!adminPrn) {
    const err = new Error("Admin identity missing. adminPrn ya adminUid dena zaroori hai.");
    err.status = 401;
    throw err;
  }
  const node = await getUserNode(adminPrn);
  const role = ((node && node.role) || "").toString().toLowerCase();
  if (!ELEVATED_ROLES.includes(role)) {
    const err = new Error("Sirf admin/master hi quiz host kar sakte hain.");
    err.status = 403;
    throw err;
  }
  return { adminPrn, adminName: (node && (node.name || node.displayName)) || "Host" };
}

function publicRoomView(doc) {
  const d = doc.data();
  return {
    roomId: doc.id,
    title: d.title,
    subject: d.subject,
    description: d.description || "",
    hostName: d.hostName || "Host",
    duration: d.duration,
    maxParticipants: d.maxParticipants,
    participantCount: d.participantCount || 0,
    numQuestions: d.numQuestions,
    status: d.status,
    startTime: d.startTime || null,
    endTime: d.endTime || null,
    negativeMarking: !!d.negativeMarking,
    passingPercentage: d.passingPercentage || 0,
    createdAt: d.createdAt && d.createdAt.toMillis ? d.createdAt.toMillis() : (d.createdAt || null)
  };
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleCreateQuiz(body, res) {
  const { adminPrn, adminName } = await requireAdmin(body);

  const title = (body.title || "").toString().trim();
  const questions = Array.isArray(body.questions) ? body.questions : [];
  const duration = parseInt(body.duration, 10);
  const maxParticipants = parseInt(body.maxParticipants, 10);

  if (!title) return res.status(400).json({ success: false, error: "Quiz title zaroori hai." });
  if (!questions.length) return res.status(400).json({ success: false, error: "Kam se kam 1 question add karo." });
  if (!duration || duration <= 0) return res.status(400).json({ success: false, error: "Valid duration (minutes) do." });
  if (!maxParticipants || maxParticipants <= 0) return res.status(400).json({ success: false, error: "Valid max participants do." });

  for (const q of questions) {
    if (!q.question || !q.options || !q.correctAnswer) {
      return res.status(400).json({ success: false, error: "Har question me text, 4 options aur correct answer hona chahiye." });
    }
  }

  const db = admin.firestore();

  let roomId, exists = true, attempts = 0;
  do {
    roomId = makeRoomId();
    const check = await db.collection("quizRooms").doc(roomId).get();
    exists = check.exists;
    attempts++;
  } while (exists && attempts < 8);

  const roomRef = db.collection("quizRooms").doc(roomId);

  await roomRef.set({
    title,
    subject: (body.subject || "").toString().trim(),
    description: (body.description || "").toString().trim(),
    hostPrn: adminPrn,
    hostName: adminName,
    status: "WAITING",
    duration,
    maxParticipants,
    participantCount: 0,
    numQuestions: questions.length,
    passingPercentage: parseInt(body.passingPercentage, 10) || 40,
    negativeMarking: !!body.negativeMarking,
    negativeMarkValue: body.negativeMarking ? (parseFloat(body.negativeMarkValue) || 0.25) : 0,
    randomQuestions: !!body.randomQuestions,
    randomOptions: !!body.randomOptions,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    startTime: null,
    endTime: null
  });

  const batch = db.batch();
  questions.forEach((q, i) => {
    const qRef = roomRef.collection("questions").doc("q" + (i + 1));
    batch.set(qRef, {
      order: i,
      question: (q.question || "").toString(),
      options: q.options,
      correctAnswer: (q.correctAnswer || "").toString(),
      marks: parseFloat(q.marks) || 1,
      negativeMarks: parseFloat(q.negativeMarks) || 0,
      difficulty: q.difficulty || "medium",
      topic: q.topic || "",
      explanation: q.explanation || ""
    });
  });
  await batch.commit();

  return res.status(200).json({ success: true, roomId });
}

async function handleListQuizzes(body, res) {
  const { adminPrn } = await requireAdmin(body);
  const db = admin.firestore();
  const snap = await db.collection("quizRooms").where("hostPrn", "==", adminPrn).limit(100).get();
  const rooms = snap.docs
    .map(publicRoomView)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return res.status(200).json({ success: true, rooms });
}

async function handleGetQuizAdmin(body, res) {
  await requireAdmin(body);
  const roomId = normalizeRoomId(body.roomId);
  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });

  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const [roomDoc, qSnap, pSnap] = await Promise.all([
    roomRef.get(),
    roomRef.collection("questions").orderBy("order").get(),
    roomRef.collection("participants").get()
  ]);
  if (!roomDoc.exists) return res.status(404).json({ success: false, error: "Quiz room nahi mila." });

  const questions = qSnap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  const participants = pSnap.docs.map((d) => {
    const p = d.data();
    return {
      prn: p.prn,
      name: p.name,
      branch: p.branch,
      college: p.college,
      status: p.status,
      score: typeof p.score === "number" ? p.score : null,
      maxScore: typeof p.maxScore === "number" ? p.maxScore : null,
      percentage: typeof p.percentage === "number" ? p.percentage : null,
      submittedAt: p.submittedAt || null
    };
  });

  return res.status(200).json({ success: true, room: publicRoomView(roomDoc), questions, participants });
}

async function handleRoomState(body, res) {
  const roomId = normalizeRoomId(body.roomId);
  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });
  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const roomDoc = await roomRef.get();
  if (!roomDoc.exists) return res.status(404).json({ success: false, error: "not_found" });

  const room = publicRoomView(roomDoc);
  let alreadyJoined = false;
  let myStatus = null;

  const prn = (body.prn || "").toString().trim();
  let participants = [];

  if (room.status === "WAITING" || room.status === "LIVE") {
    const pSnap = await roomRef.collection("participants").get();
    participants = pSnap.docs.map((d) => {
      const p = d.data();
      if (prn && p.prn === prn) { alreadyJoined = true; myStatus = p.status; }
      return { name: p.name, status: p.status };
    });
  } else if (prn) {
    const pDoc = await roomRef.collection("participants").doc(prn).get();
    if (pDoc.exists) { alreadyJoined = true; myStatus = pDoc.data().status; }
  }

  return res.status(200).json({ success: true, room, participants, alreadyJoined, myStatus });
}

async function handleVerifyAndJoin(body, res) {
  const roomId = normalizeRoomId(body.roomId);
  const prn = (body.prn || "").toString().trim();

  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });
  if (!/^\d{16}$/.test(prn)) return res.status(400).json({ success: false, error: "invalid_prn", message: "PRN exactly 16 digits ka hona chahiye." });

  const userNode = await getUserNode(prn);
  if (!userNode) return res.status(404).json({ success: false, error: "invalid_prn", message: "Yeh PRN database me registered nahi hai." });

  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const roomDoc = await roomRef.get();
  if (!roomDoc.exists) return res.status(404).json({ success: false, error: "room_not_found" });

  const room = roomDoc.data();
  if (room.status === "ENDED" || room.status === "CANCELLED") {
    return res.status(409).json({ success: false, error: "room_ended", message: "Yeh quiz khatam ho chuki hai." });
  }
  if (room.status === "DRAFT") {
    return res.status(409).json({ success: false, error: "not_open", message: "Yeh quiz abhi shuru nahi hui hai." });
  }

  const student = {
    name: userNode.name || userNode.displayName || "Student",
    prn,
    branch: userNode.branch || userNode.selectedBranch || userNode.branchCode || "",
    college: userNode.college || "StudyBuddy"
  };

  const participantRef = roomRef.collection("participants").doc(prn);

  try {
    await db.runTransaction(async (tx) => {
      const [freshRoom, existingParticipant] = await Promise.all([tx.get(roomRef), tx.get(participantRef)]);
      if (existingParticipant.exists) return; // already joined — idempotent
      const rd = freshRoom.data();
      if ((rd.participantCount || 0) >= rd.maxParticipants) {
        const err = new Error("room_full");
        err.code = "room_full";
        throw err;
      }
      tx.set(participantRef, {
        prn,
        name: student.name,
        branch: student.branch,
        college: student.college,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "waiting",
        answers: {}
      });
      tx.update(roomRef, { participantCount: admin.firestore.FieldValue.increment(1) });
    });
  } catch (err) {
    if (err.code === "room_full") {
      return res.status(409).json({ success: false, error: "room_full", message: "Room full ho chuki hai." });
    }
    throw err;
  }

  return res.status(200).json({ success: true, student });
}

async function handleStartQuiz(body, res) {
  await requireAdmin(body);
  const roomId = normalizeRoomId(body.roomId);
  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });

  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const roomDoc = await roomRef.get();
  if (!roomDoc.exists) return res.status(404).json({ success: false, error: "Quiz room nahi mila." });
  const room = roomDoc.data();
  if (room.status !== "WAITING") return res.status(409).json({ success: false, error: "Quiz sirf WAITING state se start ho sakti hai." });

  const startTime = Date.now();
  const endTime = startTime + room.duration * 60 * 1000;

  await roomRef.update({ status: "LIVE", startTime, endTime });

  const pSnap = await roomRef.collection("participants").where("status", "==", "waiting").get();
  const batch = db.batch();
  pSnap.docs.forEach((d) => batch.update(d.ref, { status: "in-progress" }));
  await batch.commit();

  return res.status(200).json({ success: true, startTime, endTime });
}

async function handleEndQuiz(body, res) {
  await requireAdmin(body);
  const roomId = normalizeRoomId(body.roomId);
  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });
  const db = admin.firestore();
  await db.collection("quizRooms").doc(roomId).update({ status: "ENDED" });
  return res.status(200).json({ success: true });
}

async function handleGetLiveQuestions(body, res) {
  const roomId = normalizeRoomId(body.roomId);
  const prn = (body.prn || "").toString().trim();
  if (!roomId || !prn) return res.status(400).json({ success: false, error: "roomId aur prn zaroori hai." });

  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const [roomDoc, participantDoc] = await Promise.all([roomRef.get(), roomRef.collection("participants").doc(prn).get()]);

  if (!roomDoc.exists) return res.status(404).json({ success: false, error: "Quiz room nahi mila." });
  if (!participantDoc.exists) return res.status(403).json({ success: false, error: "Aap is quiz me registered nahi ho." });

  const participant = participantDoc.data();
  if (participant.status === "completed") {
    return res.status(409).json({ success: false, error: "already_submitted" });
  }
  if (participant.status !== "in-progress") {
    return res.status(409).json({ success: false, error: "not_started", message: "Host ne abhi quiz start nahi ki." });
  }

  const room = roomDoc.data();
  const qSnap = await roomRef.collection("questions").orderBy("order").get();
  let questions = qSnap.docs.map((d) => {
    const q = d.data();
    return { id: d.id, question: q.question, options: q.options }; // correctAnswer NEVER sent
  });
  if (room.randomQuestions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  return res.status(200).json({
    success: true,
    title: room.title,
    endTime: room.endTime,
    duration: room.duration,
    negativeMarking: !!room.negativeMarking,
    questions,
    savedAnswers: participant.answers || {}
  });
}

async function handleSaveAnswer(body, res) {
  const roomId = normalizeRoomId(body.roomId);
  const prn = (body.prn || "").toString().trim();
  const questionId = (body.questionId || "").toString().trim();
  if (!roomId || !prn || !questionId) return res.status(400).json({ success: false, error: "roomId, prn aur questionId zaroori hai." });

  const db = admin.firestore();
  const participantRef = db.collection("quizRooms").doc(roomId).collection("participants").doc(prn);
  const pDoc = await participantRef.get();
  if (!pDoc.exists) return res.status(403).json({ success: false, error: "Not registered." });
  if (pDoc.data().status !== "in-progress") return res.status(409).json({ success: false, error: "Quiz active nahi hai." });

  const field = "answers." + questionId;
  await participantRef.update({
    [field]: {
      answer: body.answer === undefined ? null : body.answer,
      markedForReview: !!body.markedForReview,
      savedAt: Date.now()
    }
  });

  return res.status(200).json({ success: true });
}

async function handleSubmitQuiz(body, res) {
  const roomId = normalizeRoomId(body.roomId);
  const prn = (body.prn || "").toString().trim();
  if (!roomId || !prn) return res.status(400).json({ success: false, error: "roomId aur prn zaroori hai." });

  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const participantRef = roomRef.collection("participants").doc(prn);
  const pDoc = await participantRef.get();
  if (!pDoc.exists) return res.status(403).json({ success: false, error: "Not registered." });
  const participant = pDoc.data();

  if (participant.status === "completed") {
    return res.status(200).json({
      success: true,
      summary: { answered: participant.correctCount + participant.wrongCount, unanswered: participant.unansweredCount, autoSubmitted: !!participant.autoSubmitted }
    });
  }

  const [roomDoc, qSnap] = await Promise.all([roomRef.get(), roomRef.collection("questions").orderBy("order").get()]);
  const room = roomDoc.data();
  const answers = participant.answers || {};

  let score = 0, maxScore = 0, correctCount = 0, wrongCount = 0, unansweredCount = 0;
  qSnap.docs.forEach((d) => {
    const q = d.data();
    maxScore += q.marks || 1;
    const given = answers[d.id] && answers[d.id].answer;
    if (!given) { unansweredCount++; return; }
    if (given === q.correctAnswer) { score += (q.marks || 1); correctCount++; }
    else {
      wrongCount++;
      if (room.negativeMarking) score -= (q.negativeMarks || room.negativeMarkValue || 0);
    }
  });

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
  const timeTakenSeconds = room.startTime ? Math.max(0, Math.round((Date.now() - room.startTime) / 1000)) : null;

  await participantRef.update({
    status: "completed",
    score, maxScore, percentage, correctCount, wrongCount, unansweredCount,
    passed: percentage >= (room.passingPercentage || 0),
    submittedAt: Date.now(),
    autoSubmitted: !!body.auto,
    timeTakenSeconds
  });

  return res.status(200).json({
    success: true,
    summary: { answered: correctCount + wrongCount, unanswered: unansweredCount, autoSubmitted: !!body.auto }
  });
}

// Public leaderboard for a quiz: anyone with the quiz/room ID can look up who
// finished 1st, 2nd, 3rd, etc. Only counts participants who actually
// completed the quiz (status "completed"). Ranked by score first, and for
// students tied on score, whoever submitted earlier ranks higher.
async function handleGetLeaderboard(body, res) {
  const roomId = normalizeRoomId(body.roomId);
  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });

  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);
  const [roomDoc, pSnap] = await Promise.all([roomRef.get(), roomRef.collection("participants").get()]);
  if (!roomDoc.exists) return res.status(404).json({ success: false, error: "not_found" });

  const room = publicRoomView(roomDoc);

  const ranked = pSnap.docs
    .map((d) => d.data())
    .filter((p) => p.status === "completed")
    .sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.submittedAt || 0) - (b.submittedAt || 0); // earlier finish wins a tie
    })
    .map((p, i) => ({
      rank: i + 1,
      name: p.name || "Student",
      branch: p.branch || "",
      college: p.college || "",
      score: typeof p.score === "number" ? p.score : 0,
      maxScore: typeof p.maxScore === "number" ? p.maxScore : 0,
      percentage: typeof p.percentage === "number" ? p.percentage : 0,
      timeTakenSeconds: typeof p.timeTakenSeconds === "number" ? p.timeTakenSeconds : null
    }));

  return res.status(200).json({
    success: true,
    room: { title: room.title, subject: room.subject, hostName: room.hostName, status: room.status, numQuestions: room.numQuestions },
    totalCompleted: ranked.length,
    leaderboard: ranked
  });
}

async function handleDeleteQuiz(body, res) {
  await requireAdmin(body);
  const roomId = normalizeRoomId(body.roomId);
  if (!roomId) return res.status(400).json({ success: false, error: "roomId zaroori hai." });
  const db = admin.firestore();
  const roomRef = db.collection("quizRooms").doc(roomId);

  for (const sub of ["questions", "participants"]) {
    const snap = await roomRef.collection(sub).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await roomRef.delete();
  return res.status(200).json({ success: true });
}

// ── Router ────────────────────────────────────────────────────────────────────
const { withRateLimit } = require("../lib/rate-limit");
const quizRouter = async (req, res) => {
  require("../lib/cors").applyCors(req, res, { methods: "GET, POST, OPTIONS", headers: "Content-Type" });
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = (req.query && req.query.action) || (req.body && req.body.action) || "";
  const body = req.method === "GET" ? (req.query || {}) : (req.body || {});

  try {
    switch (action) {
      case "create-quiz":       return await handleCreateQuiz(body, res);
      case "list-quizzes":      return await handleListQuizzes(body, res);
      case "get-quiz-admin":    return await handleGetQuizAdmin(body, res);
      case "room-state":        return await handleRoomState(body, res);
      case "verify-and-join":   return await handleVerifyAndJoin(body, res);
      case "start-quiz":        return await handleStartQuiz(body, res);
      case "end-quiz":          return await handleEndQuiz(body, res);
      case "get-live-questions":return await handleGetLiveQuestions(body, res);
      case "save-answer":       return await handleSaveAnswer(body, res);
      case "submit-quiz":       return await handleSubmitQuiz(body, res);
      case "leaderboard":       return await handleGetLeaderboard(body, res);
      case "delete-quiz":       return await handleDeleteQuiz(body, res);
      default:
        return res.status(400).json({ success: false, error: "Unknown or missing action: '" + action + "'" });
    }
  } catch (err) {
    console.error(`quiz action=${action} error:`, err);
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
};

module.exports = withRateLimit(quizRouter, { name: "quiz", max: 240, windowSec: 60 });   // live quiz polls often; per IP
