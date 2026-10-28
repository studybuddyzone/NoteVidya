
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    // Everything (Cloudinary PDF upload AND Supabase reads/writes) goes through
    // this same backend — the client never touches Cloudinary or Supabase
    // directly (same pattern as the existing profile-photo upload). This also
    // means no Supabase security-rules changes are needed for this page to work.
    const BACKEND_BASE_URL = 'https://studybuddypro-psi.vercel.app/api/backend';

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Could not read the file."));
            reader.readAsDataURL(file);
        });
    }

    async function saveRevaluationData(file, rawText, records, onProgress, forceOverwrite) {
        const base64 = await fileToBase64(file);
        if (onProgress) onProgress(55);
        const resp = await fetch(`${BACKEND_BASE_URL}?action=upload-revaluation-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdf: base64, fileName: file.name, rawText, records, forceOverwrite: !!forceOverwrite })
        });
        let result = null;
        try { result = await resp.json(); } catch (e) { /* non-JSON response */ }
        if (onProgress) onProgress(80);
        if (resp.status === 409 && result && result.duplicate) {
            const err = new Error(result.error || "This file is already uploaded.");
            err.isDuplicate = true;
            throw err;
        }
        if (!resp.ok || !result || !result.success) {
            const msg = (result && (result.error || result.message)) || `Server error (HTTP ${resp.status}).`;
            throw new Error(msg);
        }
        return result; // { success, pdfUrl, savedCount }
    }

    async function fetchRevaluationScore(prn) {
        const resp = await fetch(`${BACKEND_BASE_URL}?action=get-revaluation-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prn })
        });
        let result = null;
        try { result = await resp.json(); } catch (e) { /* non-JSON response */ }
        if (resp.status === 404) return null;
        if (!resp.ok || !result || !result.success) {
            const msg = (result && (result.error || result.message)) || `Server error (HTTP ${resp.status}).`;
            throw new Error(msg);
        }
        return result.data;
    }

    // Reference-only threshold: below this ESE (external paper) marks, we
    // suggest NOT applying for revaluation. Not an official rule.
    const REVAL_ESE_THRESHOLD = 12;

    function cleanPrn(v){ return (v || "").trim().replace(/\s+/g, ""); }
    function escapeHtml(str){ return (str || "").toString().replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
    function showStatus(elId, type, msg){ const el = document.getElementById(elId); el.className = "status-msg show " + type; el.innerHTML = msg; }
    function hideStatus(elId){ document.getElementById(elId).className = "status-msg"; }

    // ============================================================
    // PDF TEXT EXTRACTION — reconstructs physical rows using each
    // text item's Y position (like a real table row), so columns
    // that share a line stay together instead of collapsing into
    // one space-joined blob. This exact approach was validated
    // against a real university CR Report PDF (0 parsing errors
    // across 44 student records).
    // ============================================================
    async function extractPdfLines(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const allLines = [];
        const Y_TOLERANCE = 1.5; // points — items within this distance of the running
                                // line reference are treated as the same physical row.
                                // (A fixed rounding grid can split one real row into two
                                // buckets when a value sits right on a grid boundary —
                                // clustering by relative distance avoids that.)
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const items = content.items
                .map(item => ({ x: item.transform[4], y: item.transform[5], str: item.str }))
                .filter(it => it.str && it.str.trim() !== "");
            // Sort top-to-bottom (PDF y grows upward, so descending y = reading order), then left-to-right
            items.sort((a, b) => b.y - a.y || a.x - b.x);

            let currentLine = [];
            let currentY = null;
            const flush = () => {
                if (!currentLine.length) return;
                currentLine.sort((a, b) => a.x - b.x);
                const line = currentLine.map(t => t.str).join(" ").replace(/\s+/g, " ").trim();
                if (line) allLines.push(line);
                currentLine = [];
            };
            items.forEach(it => {
                if (currentY === null || Math.abs(it.y - currentY) <= Y_TOLERANCE) {
                    currentLine.push(it);
                    if (currentY === null) currentY = it.y;
                } else {
                    flush();
                    currentLine = [it];
                    currentY = it.y;
                }
            });
            flush();
        }
        return allLines;
    }

    // ============================================================
    // SUBJECT META — parses "CODE : SUBJECT NAME (Credit :n )" list
    // that appears once per PDF in the header preamble. Some subjects
    // are AUDIT courses (e.g. "24AF1EEEES209 : ENERGY AND ENVIRONMENTAL
    // ENGINEERING") with NO "(Credit :n)" suffix at all — these are
    // still captured (credit:null, isAudit:true) so subject POSITION
    // stays aligned with the per-student grade line later, instead of
    // silently vanishing and shifting every subject after it by one.
    // ============================================================
    function parseSubjectMeta(rawText) {
        // Subject codes repeat once per page (this header reprints on every
        // page of the report). Scanning the whole document and de-duplicating
        // by code — keeping first-seen order — is more robust than trying to
        // find a "preamble" boundary, since the exact line order around
        // "EXAMINATION :" varies between different report layouts.
        const codeRe = /([0-9A-Z]{6,20})\s*:\s*/g;
        const matches = [];
        let m;
        while ((m = codeRe.exec(rawText)) !== null) {
            if (!/\d/.test(m[1])) continue; // real subject codes always contain a digit; skips false hits like "EXAMINATION :"
            matches.push({ code: m[1], start: m.index, contentStart: codeRe.lastIndex });
        }
        const seen = new Map(); // code -> index in subjects[]
        const subjects = [];
        for (let i = 0; i < matches.length; i++) {
            const chunkEnd = i + 1 < matches.length ? matches[i + 1].start : rawText.length;
            let chunk = rawText.slice(matches[i].contentStart, chunkEnd).trim();
            const creditMatch = chunk.match(/\(Credit\s*:\s*(\d+)\s*\)/);
            let credit = null, isAudit = true;
            if (creditMatch) {
                credit = parseInt(creditMatch[1], 10);
                isAudit = false;
                chunk = chunk.slice(0, creditMatch.index).trim();
            } else {
                // No "(Credit :n)" on THIS occurrence doesn't necessarily mean
                // audit — it could just be a page where the line got cut off
                // differently. Only trust "isAudit" if the subject name itself
                // looks like a real subject name (a handful of words), not an
                // empty/garbled fragment, to avoid false audit-classification.
                if (!chunk || chunk.length < 3) continue;
            }
            const code = matches[i].code;
            if (seen.has(code)) {
                // Prefer an occurrence that DOES carry a credit value over an
                // earlier one that (due to page-break formatting) didn't.
                const existing = subjects[seen.get(code)];
                if (existing.isAudit && !isAudit) { existing.credit = credit; existing.isAudit = false; existing.name = chunk; }
                continue;
            }
            seen.set(code, subjects.length);
            subjects.push({ code, name: chunk, credit, isAudit });
        }
        // Classify non-audit subjects into Group A (theory: ESE ~60, has a
        // separate mid-term) vs Group B (lab/co-curricular/IKS-style: ESE
        // ~40, no separate mid-term). This is a heuristic (code patterns
        // like "...L2xx" or "CC" commonly indicate Group B) — it isn't
        // guaranteed to match every possible program's layout, which is why
        // numeric ESE/CA/MID extraction below is allowed to fail gracefully
        // per-record without losing the (far more reliable) grade/FAIL data.
        subjects.forEach(s => {
            if (s.isAudit) { s.group = null; return; }
            s.group = (/L[0-9]/.test(s.code) || s.code.includes("CC")) ? "B" : "A";
        });
        return subjects;
    }

    // ============================================================
    // STUDENT RECORD PARSER
    // Each student's data follows this sequence of lines:
    //   1) Seat/PRN + Name + Institute + Result   (all on one line)
    //   2) Row of numbers    -> ESE marks, Group-A (theory) subjects
    //   3) [optional] a bare "d.dd" line -> SGPA (present only if PASS)
    //   4) Center code line, e.g. "02508 (Whole)"
    //   5) Two decimals line -> Total Grade Points, Credits Earned
    //   6) Row of numbers    -> ESE marks, Group-B (lab/NSS/IKS) subjects
    //   7) A bare integer    -> Total Marks obtained (out of 1100)
    //   8) Row of numbers    -> CA (internal) marks, all non-audit subjects
    //   9) Row of numbers    -> Mid-term marks, Group-A subjects
    //  10) Row of numbers    -> Subject-wise TOTAL marks obtained
    //  11) Grade line        -> per-subject grade tokens (see below)
    //
    // The overall Result on line 1 isn't limited to PASS/FAIL — some
    // university exports use WITHHELD when one paper's result is still
    // pending at their end. Whatever word appears there is kept as-is
    // (matched against a small known set) so the UI can react to it.
    // ============================================================
    const SEAT_RE = /^(\d{10,20})\s*(?:\(F\)\s*)?(.+?)\s+(\d{4,6})\s*-\s*(.+?)\s+(PASS|FAIL|WITHHELD|CANCEL|DETAIN(?:ED)?)\s*$/;
    const SGPA_RE = /^\d{1,2}\.\d{2}$/;
    const TOTGRP_RE = /^(\d+\.\d+)\s+(\d+\.\d+)$/;

    function parseNums(line) {
        // "--" (or similar dashes) marks a subject whose result/marks are
        // pending/on-hold at the university — kept as null, not a hard error,
        // so the rest of the row can still be read.
        return line.trim().split(/\s+/).map(tok => (/^-+$/.test(tok) ? null : parseInt(tok, 10)));
    }

    // Splits a student's grade line into ordered tokens. Most tokens look
    // like "7.5/BC/15" (gradePoint/letter/weightedPoint, sometimes with a
    // trailing "(G-3)" annotation attached with no space — parseFloat just
    // ignores that trailing text). Audit subjects instead show a bare
    // word like "AU" with no slashes at all — kept as a special token so
    // subject position stays aligned instead of collapsing the sequence.
    function tokenizeGradeLine(line) {
        return line.trim().split(/\s+/).filter(Boolean).map(tok => {
            const m = tok.match(/^(-?\d+(?:\.\d+)?)\/([A-Za-z]+)\/(-?\d+(?:\.\d+)?)/);
            if (m) return { type: "graded", gp: parseFloat(m[1]), grade: m[2].toUpperCase(), wp: parseFloat(m[3]) };
            return { type: "special", label: tok.toUpperCase() };
        });
    }

    function parseStudentRecords(lines, subjects) {
        const gradedSubjects = subjects.filter(s => !s.isAudit);
        const groupA = gradedSubjects.filter(s => s.group === "A");
        const groupB = gradedSubjects.filter(s => s.group === "B");
        const records = [];

        for (let i = 0; i < lines.length; i++) {
            const seatMatch = lines[i].match(SEAT_RE);
            if (!seatMatch) continue;

            const [, prn, name, instCode, instName, result] = seatMatch;
            const rec = {
                prn: cleanPrn(prn),
                studentName: name.trim(),
                instituteCode: instCode,
                instituteName: instName.trim(),
                overallResult: result,
                subjects: [],
                parseOk: false,
                numericDataAvailable: false,
                hasHeldSubject: false
            };

            try {
                let pos = i + 1;
                const row1 = parseNums(lines[pos]); pos++;
                if (row1.some(v => v === null)) rec.hasHeldSubject = true;

                let sgpa = null;
                if (SGPA_RE.test(lines[pos])) { sgpa = parseFloat(lines[pos]); pos++; }

                const centerCode = lines[pos]; pos++;

                const totgrpMatch = lines[pos].match(TOTGRP_RE);
                const totalGradePoints = totgrpMatch ? parseFloat(totgrpMatch[1]) : null;
                const creditsEarned = totgrpMatch ? parseFloat(totgrpMatch[2]) : null;
                pos++;

                const row2 = parseNums(lines[pos]); pos++;
                if (row2.some(v => v === null)) rec.hasHeldSubject = true;

                const totalMarksObtained = parseInt(lines[pos], 10); pos++;

                const row3 = parseNums(lines[pos]); pos++; // CA
                const row4 = parseNums(lines[pos]); pos++; // MID
                const row5 = parseNums(lines[pos]); pos++; // TOTAL

                const gradeTokens = tokenizeGradeLine(lines[pos]); pos++;

                rec.centerCode = centerCode;
                rec.sgpa = sgpa;
                rec.totalGradePoints = totalGradePoints;
                rec.creditsEarned = creditsEarned;
                rec.totalMarksObtained = totalMarksObtained;
                rec.parseOk = true;
                i = pos - 1; // advance outer loop past this record

                // ── Reliable pass: subject name + grade, aligned by position
                //    against the grade line (works even if the numeric rows
                //    below fail entirely — that's a separate, best-effort step).
                let aIdx = 0, bIdx = 0;
                let numericOk = row1.length === groupA.length && row2.length === groupB.length &&
                                 row3.length === gradedSubjects.length && row4.length === groupA.length &&
                                 row5.length === gradedSubjects.length;

                subjects.forEach((s, idx) => {
                    const tok = gradeTokens[idx];

                    if (s.isAudit) {
                        rec.subjects.push({
                            code: s.code, name: s.name, credit: null, group: null,
                            isAudit: true, isFail: false, isHeld: false,
                            gradeLetter: tok && tok.type === "special" ? tok.label : "AU",
                            gradePoint: null, weightedPoint: null,
                            eseObtained: null, caObtained: null, midObtained: null, totalObtained: null
                        });
                        return;
                    }

                    const isHeld = numericOk && ((s.group === "A" ? row1[aIdx] : row2[bIdx]) === null);
                    let ese = null, mid = null, ca = null, total = null;
                    if (numericOk) {
                        ese = s.group === "A" ? row1[aIdx] : row2[bIdx];
                        mid = s.group === "A" ? row4[aIdx] : null;
                        ca = row3[idx];
                        total = row5[idx];
                    }
                    if (s.group === "A") aIdx++; else bIdx++;

                    let gradeLetter = null, gradePoint = null, weightedPoint = null;
                    if (tok && tok.type === "graded") {
                        gradeLetter = tok.grade; gradePoint = tok.gp; weightedPoint = tok.wp;
                    } else if (tok && tok.type === "special") {
                        gradeLetter = tok.label;
                    }

                    rec.subjects.push({
                        code: s.code, name: s.name, credit: s.credit, group: s.group,
                        isAudit: false,
                        isHeld: isHeld,
                        eseObtained: ese, caObtained: ca, midObtained: mid, totalObtained: total,
                        gradePoint, gradeLetter, weightedPoint,
                        isFail: gradeLetter === "FF"
                    });
                });

                rec.numericDataAvailable = numericOk;
            } catch (e) {
                // Something above the grade-line step failed outright (e.g. an
                // unrecognized line where a fixed-position row was expected).
                // We still keep the PRN + overall result from the seat line —
                // just without any subject breakdown for this one record.
                rec.parseOk = false;
                rec.parseError = (e && e.message) || String(e);
            }

            records.push(rec);
        }
        return records;
    }

    // ============================================================
    // UPLOAD — PDF binary -> Cloud Storage. Extracted / analyzed
    // structured data -> Supabase, keyed per PRN found inside.
    // ============================================================
    async function uploadRevaluationPdf() {
        const fileInput = document.getElementById("uploadFileInput");
        const file = fileInput.files[0];
        const btn = document.getElementById("uploadBtn");
        const progressOuter = document.getElementById("progressOuter");
        const progressInner = document.getElementById("progressInner");

        if (!file) { showStatus("uploadStatus", "err", "Please choose a PDF file."); return; }
        if (file.type !== "application/pdf") { showStatus("uploadStatus", "err", "Only PDF files are supported."); return; }

        btn.disabled = true;
        progressOuter.classList.add("show");
        progressInner.style.width = "8%";
        showStatus("uploadStatus", "loading", '<i class="fa-solid fa-spinner fa-spin"></i> Reading &amp; analyzing PDF...');

        try {
            const lines = await extractPdfLines(file);
            const rawText = lines.join("\n");
            progressInner.style.width = "30%";

            const subjects = parseSubjectMeta(rawText);
            if (subjects.length === 0) throw new Error("Could not detect any subjects in this PDF's header. Is this a valid CR Report?");

            const records = parseStudentRecords(lines, subjects);
            const okRecords = records.filter(r => r.parseOk);
            if (records.length === 0) throw new Error("No PRN/Seat No. records could be detected in this PDF.");

            progressInner.style.width = "50%";
            showStatus("uploadStatus", "loading", '<i class="fa-solid fa-spinner fa-spin"></i> Uploading PDF &amp; saving ' + records.length + ' PRN(s)...');

            let result;
            try {
                result = await saveRevaluationData(file, rawText, records, (pct) => { progressInner.style.width = pct + "%"; }, false);
            } catch (err) {
                if (err.isDuplicate) {
                    const confirmOverwrite = confirm(
                        "This file name was already uploaded before.\n\n" +
                        "If this is an UPDATED result for the same students (e.g. after revaluation), press OK to overwrite the previous data.\n" +
                        "Press Cancel to stop."
                    );
                    if (!confirmOverwrite) {
                        showStatus("uploadStatus", "err", "Upload cancelled — file already exists.");
                        progressOuter.classList.remove("show");
                        btn.disabled = false;
                        return;
                    }
                    showStatus("uploadStatus", "loading", '<i class="fa-solid fa-spinner fa-spin"></i> Overwriting previous upload...');
                    result = await saveRevaluationData(file, rawText, records, (pct) => { progressInner.style.width = pct + "%"; }, true);
                } else {
                    throw err;
                }
            }

            progressInner.style.width = "100%";
            const warnMsg = okRecords.length < records.length ? ` (${records.length - okRecords.length} record(s) skipped — subject data couldn't be parsed for those).` : "";
            showStatus("uploadStatus", "ok", `<i class="fa-solid fa-circle-check"></i> Done — extracted &amp; saved data for ${result.savedCount} PRN(s).${warnMsg}`);
            fileInput.value = "";
            setTimeout(() => { progressOuter.classList.remove("show"); progressInner.style.width = "0%"; }, 1200);
        } catch (err) {
            console.error(err);
            showStatus("uploadStatus", "err", "Something went wrong: " + (err.message || err));
            progressOuter.classList.remove("show");
        } finally {
            btn.disabled = false;
        }
    }

    // ============================================================
    // SEARCH — pulls the analyzed data for a PRN and renders it
    // ============================================================
    async function searchByPrn() {
        const prn = cleanPrn(document.getElementById("searchPrnInput").value);
        const resultArea = document.getElementById("resultArea");
        const btn = document.getElementById("searchBtn");
        if (!prn) { showStatus("searchStatus", "err", "Please enter a PRN to search."); return; }

        btn.disabled = true;
        resultArea.classList.remove("show");
        showStatus("searchStatus", "loading", '<i class="fa-solid fa-spinner fa-spin"></i> Fetching your result...');

        try {
            const data = await fetchRevaluationScore(prn);
            if (!data) {
                showStatus("searchStatus", "err", `No revaluation record found for PRN ${prn}.`);
                btn.disabled = false;
                return;
            }
            renderResult(data);
            hideStatus("searchStatus");
            resultArea.classList.add("show");
        } catch (err) {
            console.error(err);
            showStatus("searchStatus", "err", "Search failed: " + (err.message || err));
        } finally {
            btn.disabled = false;
        }
    }

    function renderResult(data) {
        const heroSlot = document.getElementById("heroSlot");
        const summarySlot = document.getElementById("summarySlot");
        const subjectsSlot = document.getElementById("subjectsSlot");
        const disclaimerBox = document.getElementById("disclaimerBox");
        const pdfLink = document.getElementById("resPdfLink");

        summarySlot.innerHTML = "";
        subjectsSlot.innerHTML = "";

        const status = data.overallResult;
        const isPass = status === "PASS";
        const allSubjects = data.subjects || [];
        const failSubjects = allSubjects.filter(s => s.isFail && !s.isAudit);
        const heldSubjects = allSubjects.filter(s => s.isHeld && !s.isFail);

        if (isPass) {
            // ✅ Passed — per requirement, show only a congratulatory message, no marks data.
            heroSlot.innerHTML = `
                <div class="status-hero pass">
                    <span class="emoji">🎉</span>
                    <h2>You're Smart! You've Passed</h2>
                    <p>No backlog subjects found — nothing more to show here.</p>
                    <div class="prn-tag">PRN: ${sbzEsc(data.prn)}${data.studentName ? " · " + sbzEsc(data.studentName) : ""}</div>
                </div>`;
            disclaimerBox.style.display = "none";
            pdfLink.style.display = "none";
            return;
        }

        const isWithheld = status === "WITHHELD";
        const heroTitle = isWithheld ? "Result On Hold" : (status === "CANCEL" || status.startsWith("DETAIN") ? "Result Cancelled / Detained" : "Backlog Subject(s) Found");
        const heroEmoji = isWithheld ? "⏳" : (status === "CANCEL" || status.startsWith("DETAIN") ? "🚫" : "📋");
        const heroSub = isWithheld
            ? "One or more of your papers has a result still pending at the university — this isn't a Pass or Fail yet."
            : "Here are your Fail (FF) subjects, with a reference-only revaluation suggestion for each.";

        heroSlot.innerHTML = `
            <div class="status-hero fail">
                <span class="emoji">${heroEmoji}</span>
                <h2>${heroTitle}</h2>
                <p>${heroSub}</p>
                <div class="prn-tag">PRN: ${sbzEsc(data.prn)}${data.studentName ? " · " + sbzEsc(data.studentName) : ""}</div>
            </div>`;

        let subjectsHtml = "";

        if (!data.parseOk) {
            subjectsHtml = `<div class="hint" style="text-align:center;padding:10px;">Marked as ${escapeHtml(status)} overall, but subject-wise details couldn't be extracted for this record from the uploaded PDF.${data.parseError ? `<br><span style="font-family:monospace;font-size:10px;opacity:.75;">(${escapeHtml(data.parseError)})</span>` : ""}</div>`;
        } else {
            // Held/pending subjects first — these are the ones the WITHHELD status is usually about.
            heldSubjects.forEach(s => {
                subjectsHtml += `
                    <div class="subject-card">
                        <div class="subject-card-top">
                            <div>
                                <div class="subject-name">${escapeHtml(s.name)}</div>
                                <div class="subject-code">${escapeHtml(s.code)}</div>
                            </div>
                            <div class="subject-marks" style="color:#92610a;background:var(--warn-bg);">⏳ Pending</div>
                        </div>
                        <div class="hint" style="margin-top:8px;">Hold for Result — this paper's marks haven't been released by the university yet. Please check back later.</div>
                    </div>`;
            });

            if (failSubjects.length === 0 && heldSubjects.length === 0) {
                subjectsHtml += `<div class="hint" style="text-align:center;padding:10px;">Marked ${escapeHtml(status)} overall, but no individual subject shows an FF grade or a pending result — please verify against the original PDF.</div>`;
            }

            failSubjects.forEach((s, i) => {
                const subjId = `sub_${data.prn}_${i}`;
                const hasEse = s.eseObtained !== null && s.eseObtained !== undefined && !isNaN(s.eseObtained);
                const belowThreshold = hasEse && s.eseObtained < REVAL_ESE_THRESHOLD;

                let badgeHtml;
                if (!hasEse) {
                    badgeHtml = `<div class="suggestion-badge no"><i class="fa-solid fa-circle-question"></i>
                         <div>ESE marks not available for this subject<span class="suggestion-note">Couldn't be read from this PDF — use your own judgement, or check the poll below.</span></div>
                       </div>`;
                } else if (belowThreshold) {
                    badgeHtml = `<div class="suggestion-badge no"><i class="fa-solid fa-triangle-exclamation"></i>
                         <div>Don't add for revaluation<span class="suggestion-note">External (ESE) marks below ${REVAL_ESE_THRESHOLD} — this is a reference only, not official. You can still apply if you wish.</span></div>
                       </div>`;
                } else {
                    badgeHtml = `<div class="suggestion-badge yes"><i class="fa-solid fa-circle-check"></i>
                         <div>You may consider applying for revaluation<span class="suggestion-note">Reference suggestion only — not an official recommendation.</span></div>
                       </div>`;
                }

                subjectsHtml += `
                    <div class="subject-card" id="${subjId}">
                        <div class="subject-card-top">
                            <div>
                                <div class="subject-name">${escapeHtml(s.name)}</div>
                                <div class="subject-code">${escapeHtml(s.code)}</div>
                            </div>
                            <div class="subject-marks">${hasEse ? `ESE: ${s.eseObtained}` : "ESE: —"}</div>
                        </div>
                        <div class="subject-meta-row">
                            ${s.caObtained !== null && s.caObtained !== undefined ? `<span>CA: <b>${s.caObtained}</b></span>` : ""}
                            ${s.midObtained !== null && s.midObtained !== undefined ? `<span>Mid: <b>${s.midObtained}</b></span>` : ""}
                            ${s.totalObtained !== null && s.totalObtained !== undefined ? `<span>Total: <b>${s.totalObtained}/100</b></span>` : ""}
                            <span>Grade: <b>${escapeHtml(s.gradeLetter || "FF")}</b></span>
                        </div>
                        <div id="${subjId}_badge">${badgeHtml}</div>
                        <div class="poll-box" id="${subjId}_poll">
                            <div class="poll-question">✍️ Did you write this paper properly (attempted most of it)?</div>
                            <div class="poll-buttons">
                                <button type="button" class="poll-btn yes" onclick="answerPoll('${subjId}', true)">Yes, I wrote it well</button>
                                <button type="button" class="poll-btn no" onclick="answerPoll('${subjId}', false)">No, I wrote very little</button>
                            </div>
                        </div>
                    </div>`;
            });
        }

        subjectsSlot.innerHTML = subjectsHtml;
        disclaimerBox.style.display = "flex";
        if (data.pdfUrl) {
            pdfLink.style.display = "inline-flex";
            pdfLink.onclick = () => openPdfViewer(data.pdfUrl, data.prn ? `Result - ${data.prn}` : "Result PDF");
        } else { pdfLink.style.display = "none"; }
    }

    // Poll answer — purely client-side, ephemeral (per-view only, not saved
    // anywhere). Lets the student self-assess when we couldn't reliably read
    // their exact ESE marks, or simply gives them a second opinion either way.
    function answerPoll(subjId, wroteWell) {
        const badgeEl = document.getElementById(`${subjId}_badge`);
        const pollEl = document.getElementById(`${subjId}_poll`);
        if (!badgeEl || !pollEl) return;

        if (wroteWell) {
            badgeEl.innerHTML = `<div class="suggestion-badge yes"><i class="fa-solid fa-circle-check"></i>
                <div>You may also add this for revaluation<span class="suggestion-note">Since you feel you attempted this paper well, it may be worth applying — still just a reference, not official.</span></div>
              </div>`;
        } else {
            badgeEl.innerHTML = `<div class="suggestion-badge no"><i class="fa-solid fa-triangle-exclamation"></i>
                <div>Probably not worth adding for revaluation<span class="suggestion-note">Since very little was attempted, revaluation is unlikely to change the outcome — but it's still your choice.</span></div>
              </div>`;
        }
        pollEl.style.display = "none";
    }
