// lib/notices-handler.js — api/notices.js on Supabase (replaces RTDB notifications + userNotifications).
// Broadcast notices are also readable directly (RLS); year-targeted and student-specific ones are
// filtered per caller here with the service role, so a private notice never reaches another student.

const ms = (iso) => (iso ? new Date(iso).getTime() : null);
const COLS = "id,title,content,type,action_text,action_url,attachment_name,attachment_type,attachment_url,request_status,target,target_year,target_prn,target_sid,active,created_at";

function noticeMatches(n, prn, sid, year) {
  if (!n || n.active === false) return false;
  if (n.target === "everyone") return true;
  if (n.target === "year") return !!n.target_year && n.target_year === year;
  if (n.target === "specific") return !!((n.target_prn && n.target_prn === prn) || (n.target_sid && sid && n.target_sid === sid));
  return false;
}
function toClient(n, read) {
  return {
    id: n.id, title: n.title, message: n.content, type: n.type || null,
    actionText: n.action_text || null, actionUrl: n.action_url || null,
    attachmentName: n.attachment_name || null, attachmentType: n.attachment_type || null, attachmentUrl: n.attachment_url || null,
    requestStatus: n.request_status || null, createdAt: ms(n.created_at), active: true, read: !!read,
  };
}

function makeNotices({ admin, getUserFromRequest, log = console }) {
  return async function handler(req, res) {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: "Missing or invalid auth token" });
      const { data: me } = await admin().from("profiles").select("id,prn,sid").eq("id", user.id).maybeSingle();
      if (!me) return res.status(401).json({ error: "Profile not found" });

      const latest = async () => {
        const { data, error } = await admin().from("notices").select(COLS).eq("active", true)
          .order("created_at", { ascending: false }).limit(50);
        if (error) throw error;
        return data || [];
      };

      if (req.method === "GET") {
        // Lightweight check used before showing the "Allow notifications" prompt: has ANY device of this ID already enabled push?
        if (req.query && req.query.pushStatus) {
          let enabled = false;
          try {
            const { count } = await admin().from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
            enabled = !!count;
          } catch (e) { /* table missing */ }
          return res.status(200).json({ pushReminder: !enabled, pushEnabled: enabled });
        }
        const year = String((req.query && req.query.year) || "");            // 'first' | 'second' ...
        const items = (await latest()).filter((n) => noticeMatches(n, me.prn, me.sid, year));
        const ids = items.map((n) => n.id);
        const { data: reads } = ids.length
          ? await admin().from("notice_reads").select("notice_id").eq("user_id", user.id).in("notice_id", ids)
          : { data: [] };
        const readSet = new Set((reads || []).map((r) => r.notice_id));
        const out = items.map((n) => toClient(n, readSet.has(n.id)));
        // pushReminder=true => this student has no push subscription yet, so the page shows the "Enable notifications" popup.
        let pushReminder = false;
        try {
          const { count } = await admin().from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
          pushReminder = !count;
        } catch (e) { /* table missing: no reminder */ }
        return res.status(200).json({ notifications: out, unreadCount: out.filter((n) => !n.read).length, pushReminder });
      }

      if (req.method === "POST") {
        const { id, all, year, action, subscription, token } = req.body || {};
        if (action === "register-token") {
          // Web Push subscription {endpoint, keys:{p256dh,auth}}; native FCM tokens are stored too (kind='fcm', not sent yet).
          let row = null;
          if (subscription && subscription.endpoint && subscription.keys && subscription.keys.p256dh && subscription.keys.auth) {
            row = { user_id: user.id, endpoint: String(subscription.endpoint), p256dh: String(subscription.keys.p256dh), auth: String(subscription.keys.auth), kind: "webpush" };
          } else if (token) {
            row = { user_id: user.id, endpoint: "fcm:" + String(token), p256dh: null, auth: null, kind: "fcm" };
          }
          if (!row) return res.status(400).json({ error: "subscription required" });
          row.year = year ? String(year) : null;
          row.user_agent = String((req.headers && req.headers["user-agent"]) || "").slice(0, 300);
          row.updated_at = new Date().toISOString();
          const { error } = await admin().from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
          if (error) { log.error("register-token", error); return res.status(500).json({ error: "Could not save subscription", detail: String(error.message || error.code || "").slice(0, 200) }); }
          return res.status(200).json({ ok: true, push: "registered" });
        }
        if (all) {
          const ids = (await latest()).filter((n) => noticeMatches(n, me.prn, me.sid, String(year || ""))).map((n) => n.id);
          if (ids.length) await admin().from("notice_reads").upsert(ids.map((nid) => ({ user_id: user.id, notice_id: nid })), { onConflict: "user_id,notice_id" });
          return res.status(200).json({ ok: true });
        }
        if (!id) return res.status(400).json({ error: "id required" });
        const { error } = await admin().from("notice_reads").upsert({ user_id: user.id, notice_id: String(id) }, { onConflict: "user_id,notice_id" });
        if (error) return res.status(400).json({ error: "Invalid notice" });
        return res.status(200).json({ ok: true });
      }
      return res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
      log.error("notices error:", e);
      return res.status(500).json({ error: "Something went wrong." });
    }
  };
}
module.exports = { makeNotices, noticeMatches };
