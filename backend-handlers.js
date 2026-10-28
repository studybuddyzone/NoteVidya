// lib/backend-handlers.js — api/backend.js on Supabase (dependencies injected => testable).
//
// What changed vs the Firebase version
//  * Identity comes ONLY from the Supabase JWT (Authorization: Bearer ...). Body fields such as
//    uid / prn / adminPrn / adminUid / idToken are ignored for authorization.
//  * Roles come from profiles.role (staff) + profiles.tier (paid), checked on the server AND,
//    where an RPC exists, again inside Postgres (it runs as the caller via userClient).
//  * Response shapes are unchanged so the existing pages keep working.
//  * Never returned any more: stored passwords (master-list-users used to return them).

const {
  STAFF_ROLES, TIERS, ROLE_WEIGHT, weight, tierActive, legacyRole, roleFields,
} = require("./authz");

const PRN_RE = /^\d{16}$/;
const SY_BRANCHES = ["civil", "cs", "aiml", "electrical", "entc"];
const PROFILE_COLS = "id,prn,sid,full_name,email,mobile,dob,year,branch,role,tier,tier_expires_at,premium_since,refer_code,photo_url";

const str = (v) => (v === undefined || v === null ? "" : String(v)).trim();
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const ms = (iso) => (iso ? new Date(iso).getTime() : null);
const errMsg = (e) => String((e && e.message) || "");

function makeBackend({ admin, userClientFor, getUserFromRequest, cloudinary, env = process.env, legacyRooms, log = console }) {
  const send = (res, code, body) => res.status(code).json(body);
  const fail = (res, code, error, extra) => res.status(code).json(Object.assign({ error }, extra || {}));
  const cloudinaryReady = () => !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

  // ------------------------------------------------------------------ auth
  async function authenticate(req) {
    const user = await getUserFromRequest(req);
    if (!user) return null;
    const { data: profile } = await admin().from("profiles").select(PROFILE_COLS).eq("id", user.id).maybeSingle();
    if (!profile) return null;
    const token = ((req.headers && req.headers.authorization) || "").replace(/^Bearer\s+/i, "");
    return { user, profile, token, role: profile.role, staff: STAFF_ROLES.includes(profile.role), legacy: legacyRole(profile) };
  }
  const isMaster = (c) => c.role === "master";
  const isAdmin = (c) => weight(c.role) >= 60;
  const LEVELS = {
    none: () => true, optional: () => true, user: () => true,
    staff: (c) => c.staff, admin: isAdmin, master: isMaster,
  };

  async function getConfig(key) {
    const { data } = await admin().from("site_config").select("value").eq("key", key).maybeSingle();
    return data ? data.value : null;
  }
  async function referralConfig() {
    const v = (await getConfig("referral")) || {};
    return {
      percent: Number.isFinite(Number(v.percent)) ? Number(v.percent) : 10,
      minWithdraw: Number.isFinite(Number(v.minWithdraw)) ? Number(v.minWithdraw) : 50,
    };
  }
  async function profileByPrn(prn) {
    const { data } = await admin().from("profiles").select(PROFILE_COLS).eq("prn", prn).maybeSingle();
    return data;
  }

  // ------------------------------------------------------------------ profile / identity
  async function verifyPrn(c, body, res) {
    const mode = body.mode || "buyer";
    const prn = str(body.prn);
    if (mode === "login") return fail(res, 400, "Login mode removed — use Supabase Auth.");
    if (!PRN_RE.test(prn)) return fail(res, 400, "PRN exactly 16 digits ka hona chahiye.");
    if (!c.staff && prn !== c.profile.prn) return fail(res, 403, "Aap sirf apni PRN verify kar sakte hain.");

    const p = prn === c.profile.prn ? c.profile : await profileByPrn(prn);
    if (!p) return send(res, 404, { found: false, error: "PRN not found" });

    const safe = { found: true, uid: p.id, name: p.full_name || "Student", role: legacyRole(p), branch: (p.branch || "").toLowerCase() };
    if (mode === "admin") return send(res, 200, { found: true, role: safe.role });
    if (mode === "receipt") {
      // catalog ('fy' = first-year plans, 'main' = second year onwards) comes from the order behind the payment
      const base = () => admin().from("payments");
      let q = await base().select("amount,created_at,orders(tier,catalog)")
        .eq("user_id", p.id).eq("status", "success").order("created_at", { ascending: false }).limit(1);
      if (q.error) q = await base().select("amount,created_at")      // older DB without orders.catalog: still works
        .eq("user_id", p.id).eq("status", "success").order("created_at", { ascending: false }).limit(1);
      const pays = q.data, ord = pays && pays[0] && pays[0].orders ? [].concat(pays[0].orders)[0] : null;
      return send(res, 200, {
        found: true, name: safe.name, branch: safe.branch, role: safe.role, year: p.year || "",
        premiumSince: ms(p.premium_since), roleExpires: ms(p.tier_expires_at),
        amount: pays && pays[0] ? Number(pays[0].amount) : null,
        catalog: ord ? ord.catalog || null : null, tier: ord ? ord.tier || null : null,
      });
    }
    return send(res, 200, safe);
  }

  // The profile row is created by the DB trigger at signUp, so this is now an idempotent no-op.
  async function registerUser(c, body, res) { return send(res, 200, { success: true, referral: null }); }

  async function selectBranch(c, body, res) {
    const branch = str(body.branch).toLowerCase();
    if (!SY_BRANCHES.includes(branch)) return fail(res, 400, "Invalid branch. Allowed: " + SY_BRANCHES.join(", "), { success: false });
    const { error } = await userClientFor(c.token).rpc("select_branch", { p_branch: branch });
    if (error) { log.error("select_branch", error); return fail(res, 400, "Branch select nahi ho paayi.", { success: false }); }
    return send(res, 200, { success: true, branch });
  }

  // Expiry is enforced by the database (has_tier checks tier_expires_at), so the old
  // client-driven "demote me" call only tidies the caller's OWN expired tier. It can never touch others.
  async function demoteRole(c, body, res) {
    if (c.profile.tier && !tierActive(c.profile)) {
      await admin().from("profiles").update({ tier: null, tier_expires_at: null }).eq("id", c.user.id);
    }
    return send(res, 200, { success: true });
  }

  async function submitProfileRequest(c, body, res) {
    const map = { newName: "full_name", newEmail: "email", newPhone: "mobile", newDOB: "dob", newYear: "year", newRole: "role" };
    const changes = {};
    for (const k of Object.keys(map)) if (str(body[k])) changes[map[k]] = str(body[k]);
    if (!Object.keys(changes).length) return fail(res, 400, "Kam se kam ek field badalna zaroori hai.");
    const { error } = await userClientFor(c.token).rpc("submit_profile_request", { p_changes: changes });
    if (error) {
      const m = errMsg(error);
      if (m.includes("invalid_mobile")) return fail(res, 400, "Mobile number exactly 10 digits ka hona chahiye.");
      log.error("submit_profile_request", error);
      return fail(res, 400, "Request submit nahi ho paayi.");
    }
    return send(res, 200, { success: true, currentRole: c.legacy });
  }

  // ------------------------------------------------------------------ S ID
  function isValidSid(sid) {
    return typeof sid === "string" && sid.length >= 3 && sid.length <= 20 && /^[a-z0-9._]+$/.test(sid)
      && !sid.startsWith(".") && !sid.endsWith(".") && !sid.includes("..");
  }
  async function checkSid(c, body, res) {
    const sid = str(body.sid).toLowerCase();
    if (!isValidSid(sid)) return send(res, 200, { valid: false, available: false, error: "Invalid S ID format." });
    const { data } = await admin().from("profiles").select("id").eq("sid", sid).limit(1);
    return send(res, 200, { valid: true, available: !(data && data.length) });
  }
  async function createSid(c, body, res) {
    const sid = str(body.sid).toLowerCase();
    if (!isValidSid(sid)) return fail(res, 400, "Invalid S ID format.", { success: false });
    if (c.profile.sid) return send(res, 200, { success: true, sid: c.profile.sid });     // immutable once set
    const { data, error } = await admin().from("profiles").update({ sid }).eq("id", c.user.id).is("sid", null).select("sid");
    if (error) {
      if (error.code === "23505") return fail(res, 409, "Yeh S ID abhi-abhi kisi aur ne le liya, dusra try karein.", { success: false });
      log.error("create-sid", error); return fail(res, 500, "Something went wrong.", { success: false });
    }
    return send(res, 200, { success: true, sid: data && data[0] ? data[0].sid : sid });
  }

  // ------------------------------------------------------------------ photo
  async function uploadPhoto(c, body, res) {
    const image = str(body.image);
    if (!image.startsWith("data:image/")) return fail(res, 400, "Valid base64 image data URL zaroori hai.");
    if (!cloudinaryReady()) return fail(res, 500, "Image service not configured.");
    if (!c.profile.prn) return fail(res, 400, "PRN not set on this account.");
    if (Math.floor(image.length * 0.75) > 3 * 1024 * 1024) return fail(res, 400, "Image too large (max ~3MB).");
    let up;
    try {
      up = await cloudinary.uploader.upload(image, {
        folder: "profile_photos", public_id: c.profile.prn, overwrite: true, resource_type: "image",
        transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
      });
    } catch (e) { log.error("cloudinary upload", e); return fail(res, 502, "Upload failed."); }
    await admin().from("profiles").update({ photo_url: up.secure_url }).eq("id", c.user.id);
    return send(res, 200, { success: true, photoURL: up.secure_url });
  }

  // ------------------------------------------------------------------ solo scores
  async function submitScore(c, body, res) {
    const delta = Number(body.scoreDelta), count = Number(body.questionCount);
    if (!Number.isFinite(delta) || !Number.isFinite(count)) return fail(res, 400, "scoreDelta aur questionCount valid number hone chahiye.");
    if (count < 1 || count > 20) return fail(res, 400, "questionCount range ke bahar hai.");
    if (delta > count * 4 || delta < count * -1) return fail(res, 400, "Yeh score is round ke hisaab se possible nahi hai.");
    const { error } = await userClientFor(c.token).rpc("submit_solo_score", { p_delta: delta, p_count: count });
    if (error) { log.error("submit_solo_score", error); return fail(res, 400, "Score save nahi ho paaya."); }
    return send(res, 200, { success: true });
  }
  async function resetScores(c, body, res) {
    const { data, error } = await admin().rpc("reset_solo_scores");
    if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true, count: data });
  }
  async function wipeDatabase(c, body, res) {
    const { data, error } = await admin().rpc("wipe_solo_scores");
    if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true, deletedCount: data });
  }
  async function requestWipeout(c, body, res) {
    if (!["admin", "moderator", "superadmin"].includes(c.role)) return fail(res, 403, "Aapke role ko yeh request bhejne ki anumati nahi hai.");
    const { error } = await admin().from("master_requests").insert({
      requester_id: c.user.id, kind: "wipeout",
      payload: { requestedByPRN: c.profile.prn, role: c.role.toUpperCase(), message: "Request server wipeout triggered by " + c.role },
    });
    if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true });
  }

  // ------------------------------------------------------------------ revaluation PDFs (Cloudinary)
  async function deleteRevaluationUpload(row) {
    if (row.cloudinary_public_id) {
      try { await cloudinary.uploader.destroy(row.cloudinary_public_id, { resource_type: "image" }); }
      catch (e) { log.error("cloudinary destroy (continuing)", e); }
    }
    const { data: scores } = await admin().from("revaluation_scores").select("prn").eq("source_upload_id", row.id);
    await admin().from("revaluation_uploads").delete().eq("id", row.id);     // scores cascade (FK)
    return { deletedPrnCount: scores ? scores.length : 0 };
  }

  async function uploadRevaluationPdf(c, body, res) {
    const pdf = str(body.pdf);
    const fileName = str(body.fileName || "revaluation.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    const records = Array.isArray(body.records) ? body.records : [];
    if (!pdf.startsWith("data:application/pdf")) return fail(res, 400, "Valid base64 PDF data URL zaroori hai.");
    if (!records.length) return fail(res, 400, "Koi parsed student record nahi mila (records array khaali hai).");
    if (!cloudinaryReady()) return fail(res, 500, "File service not configured.");
    if (Math.floor(pdf.length * 0.75) > 15 * 1024 * 1024) return fail(res, 400, "PDF too large (max ~15MB).");

    const { data: dupes } = await admin().from("revaluation_uploads").select("id,cloudinary_public_id").eq("file_name", fileName).limit(1);
    if (dupes && dupes.length && !body.forceOverwrite) {
      return fail(res, 409, "This file is already uploaded. Please check your previous uploads.", { duplicate: true });
    }
    if (dupes && dupes.length) for (const d of dupes) await deleteRevaluationUpload(d);

    let up;
    try {
      up = await cloudinary.uploader.upload(pdf, {
        folder: "revaluation_pdfs", public_id: `${Date.now()}_${fileName.replace(/\.pdf$/i, "")}`, resource_type: "image", overwrite: false,
      });
    } catch (e) { log.error("cloudinary pdf upload", e); return fail(res, 502, "Upload failed."); }
    const publicId = up.public_id;
    const pdfUrl = cloudinary.utils.private_download_url(publicId, up.format, { resource_type: "image", type: "upload", attachment: false });
    const pdfDownloadUrl = cloudinary.utils.private_download_url(publicId, up.format, { resource_type: "image", type: "upload", attachment: true });

    const ok = records.filter((r) => r && PRN_RE.test(String(r.prn)));
    const { data: upRow, error: upErr } = await admin().from("revaluation_uploads").insert({
      file_name: fileName, pdf_url: pdfUrl, pdf_download_url: pdfDownloadUrl, cloudinary_public_id: publicId,
      raw_text: str(body.rawText).slice(0, 900000), prn_count: ok.length, parsed_ok_count: ok.filter((r) => r.parseOk).length,
      uploaded_by: c.user.id,
    }).select("id").single();
    if (upErr) {
      log.error("revaluation_uploads insert", upErr);
      try { await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); } catch (e) {}
      return fail(res, 500, "Something went wrong.");
    }

    for (let i = 0; i < ok.length; i += 400) {
      const rows = ok.slice(i, i + 400).map((r) => ({
        prn: String(r.prn),
        source_upload_id: upRow.id,
        data: {
          prn: String(r.prn), studentName: r.studentName || null, instituteCode: r.instituteCode || null,
          instituteName: r.instituteName || null, overallResult: r.overallResult || null, sgpa: r.sgpa || null,
          totalMarksObtained: r.totalMarksObtained || null, totalGradePoints: r.totalGradePoints || null,
          creditsEarned: r.creditsEarned || null, subjects: r.subjects || [], parseOk: !!r.parseOk,
          parseError: r.parseError || null, numericDataAvailable: !!r.numericDataAvailable, hasHeldSubject: !!r.hasHeldSubject,
          pdfUrl, pdfDownloadUrl, cloudinaryPublicId: publicId, sourceUploadId: upRow.id, revaluationMarks: null,
        },
      }));
      const { error } = await admin().from("revaluation_scores").upsert(rows, { onConflict: "prn" });
      if (error) { log.error("revaluation_scores upsert", error); return fail(res, 500, "Something went wrong."); }
    }
    return send(res, 200, { success: true, pdfUrl, savedCount: ok.length });
  }

  async function getRevaluationScore(c, body, res) {
    const prn = str(body.prn);
    if (!prn) return fail(res, 400, "PRN zaroori hai.");
    if (!c.staff && prn !== c.profile.prn) return fail(res, 403, "Aap sirf apna result dekh sakte hain.");
    const { data } = await admin().from("revaluation_scores").select("data,source_upload_id").eq("prn", prn).maybeSingle();
    if (!data) return fail(res, 404, "No record found for this PRN.");
    const out = Object.assign({}, data.data);
    if (!out.cloudinaryPublicId && data.source_upload_id) {      // picks up repair-revaluation-urls fixes
      const { data: u } = await admin().from("revaluation_uploads").select("cloudinary_public_id").eq("id", data.source_upload_id).maybeSingle();
      if (u && u.cloudinary_public_id) out.cloudinaryPublicId = u.cloudinary_public_id;
    }
    return send(res, 200, { success: true, data: out });
  }

  async function fetchRevaluationPdfBytes(c, body, res) {
    const publicId = str(body.publicId), format = str(body.format || "pdf");
    if (!publicId) return fail(res, 400, "publicId zaroori hai.");
    // Only PDFs that belong to a recorded revaluation upload can be proxied.
    const { data: row } = await admin().from("revaluation_uploads").select("id").eq("cloudinary_public_id", publicId).limit(1);
    if (!row || !row.length) return fail(res, 404, "File not found.");
    try {
      const url = cloudinary.utils.private_download_url(publicId, format, { resource_type: "image", type: "upload" });
      const r = await fetch(url);
      if (!r.ok) { log.error("cloudinary admin-download", r.status); return fail(res, 502, "Could not fetch the PDF."); }
      return send(res, 200, { success: true, base64: Buffer.from(await r.arrayBuffer()).toString("base64") });
    } catch (e) { log.error(e); return fail(res, 500, "Server error while fetching the PDF."); }
  }

  async function listRevaluationUploads(c, body, res) {
    const { data } = await admin().from("revaluation_uploads")
      .select("id,file_name,pdf_url,pdf_download_url,cloudinary_public_id,prn_count,parsed_ok_count,created_at")
      .order("created_at", { ascending: false }).limit(200);
    return send(res, 200, { success: true, uploads: (data || []).map((d) => ({
      id: d.id, fileName: d.file_name, pdfUrl: d.pdf_url, pdfDownloadUrl: d.pdf_download_url,
      cloudinaryPublicId: d.cloudinary_public_id, prnCount: d.prn_count, parsedOkCount: d.parsed_ok_count, uploadedAt: ms(d.created_at),
    })) });
  }
  async function deleteRevaluationUploadAction(c, body, res) {
    const id = str(body.uploadId);
    if (!id) return fail(res, 400, "uploadId zaroori hai.");
    const { data: row } = await admin().from("revaluation_uploads").select("id,cloudinary_public_id").eq("id", id).maybeSingle();
    if (!row) return fail(res, 404, "This upload record no longer exists.");
    return send(res, 200, Object.assign({ success: true }, await deleteRevaluationUpload(row)));
  }
  async function repairRevaluationUrls(c, body, res) {
    const { data } = await admin().from("revaluation_uploads").select("id,file_name,pdf_url,cloudinary_public_id");
    let fixedCount = 0, skippedCount = 0; const errors = [];
    for (const d of data || []) {
      if (d.cloudinary_public_id) { skippedCount++; continue; }
      const m = d.pdf_url && d.pdf_url.match(/\/upload\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
      if (!m) { errors.push({ id: d.id, fileName: d.file_name, reason: "Could not determine the Cloudinary file reference from the stored URL." }); continue; }
      await admin().from("revaluation_uploads").update({ cloudinary_public_id: m[1] }).eq("id", d.id);
      fixedCount++;
    }
    return send(res, 200, { success: true, fixedCount, skippedCount, errors });
  }

  // ------------------------------------------------------------------ study material list
  async function managementList(c, body, res) {
    const subject = str(body.subject);
    if (!subject) return fail(res, 400, "subject required");
    const key = subject.replace(/[.#$/\[\]]/g, "_").replace(/\s+/g, "_");
    // Run as the caller (or anonymous): RLS (resources_read / has_tier) hides premium rows from non-entitled users.
    const client = userClientFor(c ? c.token : null);
    const { data, error } = await client.from("resources")
      .select("id,title,section,category,external_url,bucket,file_path,min_tier,created_at")
      .eq("subject_key", key).order("created_at", { ascending: false }).limit(500);
    if (error) { log.error("management-list", error); return fail(res, 500, "Something went wrong."); }
    const files = [];
    for (const r of data || []) {
      let url = r.external_url || null;
      if (!url && r.bucket && r.file_path) {
        const s = await admin().storage.from(r.bucket).createSignedUrl(r.file_path, 3600);   // private files: short-lived signed URL
        url = s && s.data ? s.data.signedUrl : null;
      }
      files.push({ id: r.id, name: r.title, url, category: r.category || (r.section && r.section !== "management" ? r.section : "question-bank"), uploadedAt: ms(r.created_at) });
    }
    return send(res, 200, { subject: key, files });
  }

  // ------------------------------------------------------------------ master / admin panel
  async function masterVerifySelf(c, body, res) { return send(res, 200, { authorized: true, role: c.legacy }); }

  async function masterCreateAccount(c, body, res) {
    const prn = str(body.prn), name = str(body.name), email = str(body.email), phone = str(body.phone);
    const dob = str(body.dob), year = str(body.year), password = String(body.password || ""), targetRole = str(body.targetRole || "student");
    if (!(targetRole in ROLE_WEIGHT)) return fail(res, 400, "Invalid role.");
    if (!isMaster(c) && weight(c.role) <= weight(targetRole)) return fail(res, 403, "Aap apne barabar ya usse upar rank ka account nahi bana sakte.");
    if (!PRN_RE.test(prn)) return fail(res, 400, "PRN exactly 16 digits ka hona chahiye.");
    if (!name || !email || !password) return fail(res, 400, "Name, email aur password zaroori hain.");
    if (password.length < 6) return fail(res, 400, "Password kam se kam 6 characters ka hona chahiye.");
    if (await profileByPrn(prn)) return fail(res, 409, "Yeh PRN pehle se registered hai.");

    const created = await admin().auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: name, prn, mobile: /^\d{10}$/.test(phone) ? phone : "", year: year || "1" },
    });
    if (created.error || !created.data || !created.data.user) {
      log.error("createUser", created.error);
      return fail(res, 400, "Account nahi ban paaya (email pehle se registered ho sakta hai).");
    }
    const fields = Object.assign({}, roleFields(targetRole, new Date().toISOString()), dob ? { dob } : {});
    await admin().from("profiles").update(fields).eq("id", created.data.user.id);       // trigger already created the row
    return send(res, 200, { success: true });
  }

  async function masterListRequests(c, body, res) {
    const { data: reqs } = await admin().from("profile_edit_requests")
      .select("id,user_id,old_values,requested_changes,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(500);
    const ids = (reqs || []).map((r) => r.user_id);
    const { data: profs } = ids.length ? await admin().from("profiles").select("id,prn").in("id", ids) : { data: [] };
    const prnOf = Object.fromEntries((profs || []).map((p) => [p.id, p.prn]));
    const out = {};
    for (const r of reqs || []) {
      const o = r.old_values || {}, n = r.requested_changes || {}, prn = prnOf[r.user_id];
      if (!prn) continue;
      out[prn] = {
        prn, oldName: o.full_name || "Not Available", newName: n.full_name || o.full_name || "Not Available",
        oldEmail: o.email || "Not Available", newEmail: n.email || o.email || "Not Available",
        oldPhone: o.mobile || "Not Available", newPhone: n.mobile || o.mobile || "Not Available",
        oldDOB: o.dob || "Not Set", newDOB: n.dob || o.dob || "Not Set",
        oldYear: o.year || "1", newYear: n.year || o.year || "1",
        oldRole: o.role || "student", newRole: n.role || o.role || "student",
        status: "pending", requestedAt: ms(r.created_at),
      };
    }
    return send(res, 200, { success: true, requests: out });
  }

  async function masterProcessRequest(c, body, res) {
    const prn = str(body.prn), action = str(body.action);
    if (!prn || !["approved", "rejected"].includes(action)) return fail(res, 400, "Invalid request.");
    const target = await profileByPrn(prn);
    if (!target) return fail(res, 404, "Request not found.");
    const { data: pend } = await admin().from("profile_edit_requests").select("id").eq("user_id", target.id).eq("status", "pending").limit(1);
    if (!pend || !pend.length) return fail(res, 404, "Request not found.");

    // Rank rules + the actual update run inside Postgres as the caller.
    const { data, error } = await userClientFor(c.token).rpc("process_profile_request", { p_request: pend[0].id, p_action: action, p_note: null });
    if (error) {
      const m = errMsg(error);
      if (m.includes("forbidden_rank")) return fail(res, 403, "Unauthorized action on higher rank parameters.");
      if (m.includes("forbidden")) return fail(res, 403, "Access denied.");
      log.error("process_profile_request", error); return fail(res, 400, "Request process nahi ho paayi.");
    }
    if (data && data.email_change) {          // auth.users.email can only be changed through the Auth admin API
      const up = await admin().auth.admin.updateUserById(target.id, { email: data.email_change, email_confirm: true });
      if (!up.error) await admin().from("profiles").update({ email: data.email_change }).eq("id", target.id);
      else log.error("email change", up.error);
    }
    return send(res, 200, { success: true });
  }

  async function masterListUsers(c, body, res) {
    const users = {};
    for (let from = 0; from < 50000; from += 1000) {
      const { data, error } = await admin().from("profiles").select("prn,full_name,year,role,tier,tier_expires_at")
        .not("prn", "is", null).order("created_at", { ascending: true }).range(from, from + 999);
      if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
      for (const u of data || []) users[u.prn] = { name: u.full_name, year: u.year, role: legacyRole(u), password: null };
      if (!data || data.length < 1000) break;
    }
    return send(res, 200, { success: true, users, adminRole: c.legacy });
  }

  async function masterModifyRole(c, body, res) {
    const newRole = str(body.newRole);
    if (!(newRole in ROLE_WEIGHT)) return fail(res, 400, "Invalid role.");
    const target = await profileByPrn(str(body.targetPrn));
    if (!target) return fail(res, 404, "User not found.");
    const cur = legacyRole(target);                         // trust the DB, never body.currentTargetRole
    if (target.role === "master") return fail(res, 403, "Master Node is Immortal!");
    if (target.role === "superadmin" && !isMaster(c)) return fail(res, 403, "Only Master can demote a Superadmin!");
    if (!isMaster(c) && (weight(c.role) <= weight(newRole) || weight(c.role) <= weight(cur))) {
      return fail(res, 403, "Aap kisi ko apni rank ya usse upar promote nahi kar sakte!");
    }
    await admin().from("profiles").update(roleFields(newRole, new Date().toISOString())).eq("id", target.id);
    return send(res, 200, { success: true });
  }

  async function masterTerminateAccount(c, body, res) {
    const target = await profileByPrn(str(body.targetPrn));
    if (!target) return fail(res, 404, "User not found.");
    if (target.role === "master") return fail(res, 403, "Master Engine cannot be deleted!");
    if (target.role === "superadmin" && !isMaster(c)) return fail(res, 403, "Only Master can wipe a Superadmin!");
    if (!isMaster(c) && weight(c.role) <= weight(target.role)) return fail(res, 403, "Access denied.");
    const del = await admin().auth.admin.deleteUser(target.id);          // profile + dependent rows cascade
    if (del.error) { log.error("deleteUser", del.error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true });
  }

  // Works WITHOUT any email service: staff sets a new password for a student who cannot use "Forgot password".
  // Rank rule: master can reset anyone (except another master); others only strictly lower ranks.
  async function masterResetPassword(c, body, res) {
    const target = await profileByPrn(str(body.targetPrn || body.prn));
    const pw = String(body.newPassword || "");
    if (!target) return fail(res, 404, "User not found.");
    if (pw.length < 8) return fail(res, 400, "Password kam se kam 8 characters ka hona chahiye.");
    if (target.id !== c.user.id) {
      if (target.role === "master") return fail(res, 403, "Master ka password yahan se reset nahi ho sakta.");
      if (!isMaster(c) && weight(c.role) <= weight(target.role)) return fail(res, 403, "Access denied.");
    }
    const r = await admin().auth.admin.updateUserById(target.id, { password: pw });
    if (r.error) { log.error("resetPassword", r.error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true });
  }

  async function masterUpdateNotification(c, body, res) {
    const text = str(body.text);
    if (!text) return fail(res, 400, "Notification text khaali hai.");
    const { error } = await admin().from("site_config").upsert({ key: "notification", value: text, updated_by: c.user.id, updated_at: new Date().toISOString() });
    if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true });
  }
  async function masterClearNotification(c, body, res) {
    await admin().from("site_config").delete().eq("key", "notification");
    return send(res, 200, { success: true });
  }
  async function masterToggleMaintenance(c, body, res) {
    const yearKey = str(body.yearKey);
    if (!["fy", "sy", "ty", "ffy"].includes(yearKey)) return fail(res, 400, "Invalid year key.");
    const { error } = await admin().rpc("set_maintenance", { p_key: yearKey, p_on: !!body.isOn });
    if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true });
  }
  // Swayam (GTMC x ASTRA) certificates ON/OFF. Body {} -> current state, {open:true|false} -> change. Admin level or above.
  async function masterGtmcCertificates(c, body, res) {
    if (typeof body.open === "boolean") {
      const { error } = await admin().from("site_config").upsert({ key: "gtmc_certificates", value: { open: body.open }, updated_by: c.user.id, updated_at: new Date().toISOString() });
      if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    }
    const v = await getConfig("gtmc_certificates");
    return send(res, 200, { success: true, open: !!(v && v.open === true) });
  }
  async function masterGetSiteConfig(c, body, res) {
    const n = await getConfig("notification"), m = await getConfig("maintenance");
    return send(res, 200, { success: true, notification: typeof n === "string" ? n : null, maintenance: m && typeof m === "object" ? m : {}, gtmcCertificates: !!((await getConfig("gtmc_certificates")) || {}).open });
  }

  // ------------------------------------------------------------------ refer & earn
  async function checkReferCode(c, body, res) {
    const { data, error } = await admin().rpc("check_refer_code", { p_code: str(body.code) });
    if (error || !data || !data.valid) return fail(res, 404, "Yeh Refer code valid nahi hai ya abhi active nahi hai.", { valid: false });
    return send(res, 200, { valid: true, referrerName: data.referrer_name || "Student" });
  }

  async function referDashboard(c, body, res) {
    const me = c.profile;
    const eligible = ["gold", "diamond"].includes(me.tier) && tierActive(me);
    let code = null;
    if (eligible) {
      const r = await admin().rpc("ensure_refer_code_for", { p_user: me.id });
      code = r.error ? me.refer_code : r.data;
    }
    const cfg = await referralConfig();
    const [{ data: wallet }, { data: kids }, { data: credits }, { data: wds }] = await Promise.all([
      admin().from("referral_wallets").select("balance,total_earned,total_withdrawn,subscription_count").eq("user_id", me.id).maybeSingle(),
      admin().from("profiles").select("id,full_name,prn,created_at").eq("referred_by", me.id).limit(1000),
      admin().from("referral_credits").select("referred_id,amount,commission,status").eq("referrer_id", me.id),
      admin().from("referral_withdrawals").select("id,amount,status,created_at,processed_at,admin_note").eq("user_id", me.id).order("created_at", { ascending: false }),
    ]);
    const paid = {};
    for (const cr of credits || []) if (cr.status === "credited") paid[cr.referred_id] = cr;
    const referred = (kids || []).map((k) => ({
      name: k.full_name || "Student", prnMasked: "••••" + String(k.prn || "").slice(-4), joinedAt: ms(k.created_at) || 0,
      subscribed: !!paid[k.id], amount: paid[k.id] ? Number(paid[k.id].amount) : 0, commission: paid[k.id] ? Number(paid[k.id].commission) : 0,
    })).sort((a, b) => b.joinedAt - a.joinedAt);
    const w = wallet || {};
    return send(res, 200, {
      success: true, year: String(me.year || ""), eligible, code, percent: cfg.percent, minWithdraw: cfg.minWithdraw,
      wallet: { balance: Number(w.balance || 0), totalEarned: Number(w.total_earned || 0), totalWithdrawn: Number(w.total_withdrawn || 0), subscriptionCount: w.subscription_count || 0 },
      referredCount: referred.length, referred,
      withdrawals: (wds || []).map((x) => ({ id: x.id, amount: Number(x.amount), status: x.status, createdAt: ms(x.created_at), processedAt: ms(x.processed_at), note: x.admin_note || "" })),
    });
  }

  async function referWithdraw(c, body, res) {
    const amount = round2(body.amount), image = str(body.image), cfg = await referralConfig();
    if (!Number.isFinite(amount) || amount <= 0) return fail(res, 400, "Valid amount daalein.");
    if (amount < cfg.minWithdraw) return fail(res, 400, `Minimum withdrawal ₹${cfg.minWithdraw} hai.`);
    if (!image.startsWith("data:image/")) return fail(res, 400, "Payment QR code ki image upload karna zaroori hai.");
    if (Math.floor(image.length * 0.75) > 3 * 1024 * 1024) return fail(res, 400, "QR image bahut badi hai (max ~3MB).");
    if (!cloudinaryReady()) return fail(res, 500, "File service not configured.");

    let up;
    try { up = await cloudinary.uploader.upload(image, { folder: "referral_qr", public_id: `${c.profile.prn}_${Date.now()}`, resource_type: "image", overwrite: false }); }
    catch (e) { log.error("QR upload", e); return fail(res, 500, "QR upload fail hua, dobara try karein."); }

    const { data, error } = await admin().rpc("request_withdrawal", { p_user: c.user.id, p_amount: amount, p_qr_url: up.secure_url, p_qr_public_id: up.public_id, p_min: cfg.minWithdraw });
    if (error) {
      try { await cloudinary.uploader.destroy(up.public_id, { resource_type: "image" }); } catch (e) {}
      const m = errMsg(error);
      if (m.includes("pending_exists") || m.includes("referral_one_pending")) return fail(res, 409, "Aapki ek withdrawal request pehle se pending hai.");
      if (m.includes("insufficient_balance")) return fail(res, 400, "Wallet me itna balance nahi hai.");
      if (m.includes("below_minimum")) return fail(res, 400, `Minimum withdrawal ₹${cfg.minWithdraw} hai.`);
      log.error("request_withdrawal", error); return fail(res, 400, "Withdrawal request nahi ho paayi.");
    }
    return send(res, 200, { success: true, id: data.id });
  }

  async function masterReferList(c, body, res) {
    const cfg = await referralConfig();
    const { data } = await admin().from("referral_withdrawals")
      .select("id,user_id,amount,qr_path,qr_public_id,status,name,mobile,admin_note,created_at,processed_at")
      .order("created_at", { ascending: false }).limit(200);
    const ids = [...new Set((data || []).map((w) => w.user_id))];
    const { data: profs } = ids.length ? await admin().from("profiles").select("id,prn").in("id", ids) : { data: [] };
    const prnOf = Object.fromEntries((profs || []).map((p) => [p.id, p.prn]));
    return send(res, 200, { success: true, config: cfg, withdrawals: (data || []).map((w) => ({
      id: w.id, prn: prnOf[w.user_id] || null, name: w.name, mobile: w.mobile, amount: Number(w.amount), qrUrl: w.qr_path,
      qrPublicId: w.qr_public_id, status: w.status, createdAt: ms(w.created_at), processedAt: ms(w.processed_at), note: w.admin_note || "",
    })) });
  }
  async function masterReferProcess(c, body, res) {
    const id = str(body.withdrawalId), decision = str(body.decision);
    if (!id || !["paid", "rejected"].includes(decision)) return fail(res, 400, "withdrawalId aur decision (paid/rejected) zaroori hain.");
    const { error } = await admin().rpc("process_withdrawal", { p_id: id, p_decision: decision, p_note: str(body.note).slice(0, 200), p_by: c.user.id });
    if (error) {
      const m = errMsg(error);
      if (m.includes("already_processed")) return fail(res, 409, "Yeh request pehle hi process ho chuki hai.");
      if (m.includes("not_found")) return fail(res, 404, "Request nahi mili.");
      log.error("process_withdrawal", error); return fail(res, 400, "Request process nahi ho paayi.");
    }
    return send(res, 200, { success: true, status: decision });
  }
  async function masterReferSettings(c, body, res) {
    const percent = Number(body.percent), minWithdraw = Number(body.minWithdraw);
    if (!Number.isFinite(percent) || percent < 0 || percent > 50) return fail(res, 400, "Commission % 0 se 50 ke beech hona chahiye.");
    if (!Number.isFinite(minWithdraw) || minWithdraw < 1) return fail(res, 400, "Minimum withdrawal kam se kam ₹1 hona chahiye.");
    const { error } = await admin().from("site_config").upsert({ key: "referral", value: { percent, minWithdraw }, updated_by: c.user.id, updated_at: new Date().toISOString() });
    if (error) { log.error(error); return fail(res, 500, "Something went wrong."); }
    return send(res, 200, { success: true, percent, minWithdraw });
  }

  // Arena/battle rooms still live in Firestore (quiz/arena is out of scope for now): lazy, isolated.
  async function manageRooms(c, body, res) {
    if (!legacyRooms) return fail(res, 501, "Rooms management is not available.");
    return legacyRooms(body, res);
  }

  // ------------------------------------------------------------------ router
  // [authorization level, handler]
  const ACTIONS = {
    "verify-prn": ["user", verifyPrn], "register-user": ["user", registerUser], "select-branch": ["user", selectBranch],
    "demote-role": ["user", demoteRole], "request-wipeout": ["user", requestWipeout],
    "reset-scores": ["master", resetScores], "wipe-database": ["master", wipeDatabase], "submit-score": ["user", submitScore],
    "upload-photo": ["user", uploadPhoto],
    "upload-revaluation-pdf": ["admin", uploadRevaluationPdf], "get-revaluation-score": ["user", getRevaluationScore],
    "fetch-revaluation-pdf-bytes": ["user", fetchRevaluationPdfBytes], "list-revaluation-uploads": ["staff", listRevaluationUploads],
    "delete-revaluation-upload": ["admin", deleteRevaluationUploadAction], "repair-revaluation-urls": ["admin", repairRevaluationUrls],
    "check-sid": ["none", checkSid], "create-sid": ["user", createSid], "management-list": ["optional", managementList],
    "submit-profile-request": ["user", submitProfileRequest], "manage-rooms": ["master", manageRooms],
    "master-create-account": ["staff", masterCreateAccount], "master-list-requests": ["staff", masterListRequests],
    "master-process-request": ["staff", masterProcessRequest], "master-list-users": ["staff", masterListUsers],
    "master-modify-role": ["staff", masterModifyRole], "master-terminate-account": ["staff", masterTerminateAccount], "master-reset-password": ["staff", masterResetPassword],
    "master-update-notification": ["staff", masterUpdateNotification], "master-clear-notification": ["staff", masterClearNotification],
    "master-toggle-maintenance": ["staff", masterToggleMaintenance], "master-gtmc-certificates": ["admin", masterGtmcCertificates], "master-verify-self": ["staff", masterVerifySelf],
    "master-get-site-config": ["staff", masterGetSiteConfig],
    "check-refer-code": ["none", checkReferCode], "refer-dashboard": ["user", referDashboard], "refer-withdraw": ["user", referWithdraw],
    "master-refer-list": ["master", masterReferList], "master-refer-process": ["master", masterReferProcess],
    "master-refer-settings": ["master", masterReferSettings],
  };

  async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");           // Bearer-token API, no cookies
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();

    const action = (req.query && req.query.action) || (req.body && req.body.action) || "";
    const body = req.method === "GET" ? (req.query || {}) : (req.body || {});
    const entry = ACTIONS[action];
    if (!entry) return fail(res, 400, "Unknown or missing action: '" + String(action).slice(0, 60) + "'");
    const [level, fn] = entry;

    try {
      let c = null;
      if (level !== "none") {
        c = await authenticate(req);
        if (!c && level !== "optional") {
          return action === "master-verify-self"
            ? fail(res, 401, "Login required.", { authorized: false })
            : fail(res, 401, "Login required. Please login again.");
        }
      }
      if (c && !LEVELS[level](c)) {
        return action === "master-verify-self"
          ? fail(res, 403, "Access denied.", { authorized: false })
          : fail(res, 403, "Access denied.");
      }
      return await fn(c, body, res);
    } catch (e) {
      log.error(`backend action=${action} error:`, e);
      return fail(res, 500, "Something went wrong. Please try again.");      // never leak internals
    }
  }

  return { handler, ACTIONS };
}

module.exports = { makeBackend };
