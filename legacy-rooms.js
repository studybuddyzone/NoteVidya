// lib/legacy-rooms.js — the ONLY Firebase code left in api/backend.js.
// Master-only housekeeping of Firestore `rooms` used by the battle-arena pages (not migrated yet).
// Authorization (role === master) is already enforced by the Supabase-based router before this runs.
const { admin, initError } = require("./helpers");

async function handle(body, res) {
  if (initError) return res.status(500).json({ error: "Rooms service unavailable." });
  const action = String(body.action || "").trim(), roomId = String(body.roomId || "").trim();
  const db = admin.firestore();

  if (action === "list") {
    const snap = await db.collection("rooms").limit(500).get();
    const rooms = snap.docs.map((doc) => {
      const d = doc.data();
      return { id: doc.id, subject: d.subject || d.subjectName || d.arena || d.roomName || d.topic || "Unknown",
               timestamp: (d.timestamp && d.timestamp.toMillis) ? d.timestamp.toMillis() : (d.createdAt || null) };
    });
    return res.status(200).json({ success: true, rooms });
  }
  if (action === "deleteOne") {
    if (!roomId) return res.status(400).json({ error: "roomId zaroori hai." });
    await db.collection("rooms").doc(roomId).delete();
    return res.status(200).json({ success: true });
  }
  if (action === "deleteAll") {
    const snap = await db.collection("rooms").limit(500).get();
    if (snap.empty) return res.status(200).json({ success: true, deletedCount: 0 });
    const batches = []; let batch = db.batch(), count = 0;
    snap.forEach((doc) => { batch.delete(doc.ref); count++; if (count % 400 === 0) { batches.push(batch); batch = db.batch(); } });
    batches.push(batch);
    await Promise.all(batches.map((b) => b.commit()));
    return res.status(200).json({ success: true, deletedCount: snap.size });
  }
  return res.status(400).json({ error: "Unknown room action." });
}
module.exports = { handle };
