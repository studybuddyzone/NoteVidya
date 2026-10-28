
// ── Firebase ──────────────────────────────────────────────────────────────────
var firebaseConfig = {
    apiKey:            "AIzaSyCZhDPaVY7jv_hXtHdpVqUcGe1hwAxvZmc",
    authDomain:        "students-e5183.firebaseapp.com",
    databaseURL:       "https://students-e5183-default-rtdb.firebaseio.com",
    projectId:         "students-e5183",
    storageBucket:     "students-e5183.firebasestorage.app",
    messagingSenderId: "473442117683",
    appId:             "1:473442117683:web:f39adc0665317aa95e9b46"
};
firebase.initializeApp(firebaseConfig);
var rtdb      = firebase.database();
var firestore = firebase.firestore();

// ── State ─────────────────────────────────────────────────────────────────────
var BATCH_SIZE  = 50;
var MAX_HISTORY = 1000;
var currentUID  = "";
var currentPRN  = "";
var currentRole = "";
var allHistoryDocs = [];
var renderedCount  = 0;

// ── Debug ─────────────────────────────────────────────────────────────────────
function dbg(msg, type) {
    type = type || "info";
    var box = document.getElementById("debugLog");
    box.classList.add("visible");
    var el = document.createElement("div");
    el.className = "dl-entry dl-" + type;
    el.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
}
function clearDebug() {
    var b = document.getElementById("debugLog");
    b.innerHTML = "";
    b.classList.remove("visible");
}

// ── Alert ─────────────────────────────────────────────────────────────────────
function fireAlert(title, text, type) {
    type = type || "danger";
    document.getElementById("alertTitle").innerText = title;
    document.getElementById("alertBody").innerText  = text;
    var iconBox = document.getElementById("alertIconBox");
    var icon    = document.getElementById("alertIcon");
    var btn     = document.getElementById("alertCloseBtn");
    var map = {
        danger:  { cls:"danger",  ico:"fa-circle-xmark",       btnCls:"red"    },
        success: { cls:"success", ico:"fa-circle-check",       btnCls:"red"    },
        warn:    { cls:"warn",    ico:"fa-triangle-exclamation",btnCls:"orange" }
    };
    var cfg = map[type] || map.danger;
    iconBox.className = "alert-circle " + cfg.cls;
    icon.className    = "fa-solid " + cfg.ico + " fa-xl";
    btn.className     = "btn-alert-close " + cfg.btnCls;
    document.getElementById("customAlertOverlay").style.display = "flex";
}

// ── UI state ──────────────────────────────────────────────────────────────────
function setHistoryUIState(state) {
    document.getElementById("historyLoading").classList.toggle("visible",  state === "loading");
    document.getElementById("historyEmpty").classList.toggle("visible",    state === "empty");
    document.getElementById("historyList").classList.toggle("visible",     state === "loaded");
    document.getElementById("historyStatsBar").classList.toggle("visible", state === "loaded");
    document.getElementById("fetchHistoryBtn").disabled = (state === "loading");
}
function setLoadingText(t) { document.getElementById("loadingText").textContent = t; }

// ── RTDB: find UID + role ─────────────────────────────────────────────────────
function findUIDfromRTDB(prn) {
    // Try /users/<prn> direct key first
    return rtdb.ref("users/" + prn).once("value").then(function(snap) {
        if (snap.exists()) {
            var d   = snap.val();
            var uid = d.uid || d.userId || d.id || d.uId || prn;
            dbg("RTDB /users/" + prn + " mila, uid=" + uid, "ok");
            return { uid: uid, userData: d };
        }
        // Try orderByChild "prn"
        return rtdb.ref("users").orderByChild("prn").equalTo(prn).once("value");
    }).then(function(snap) {
        if (!snap || !snap.exists) return null;
        if (snap.exists && snap.exists()) {
            var data = snap.val();
            var uid  = Object.keys(data)[0];
            // If uid looks like a PRN-keyed node (already handled above), return it
            var ud   = data[uid];
            dbg("RTDB orderByChild(prn) mila, uid=" + uid, "ok");
            return { uid: uid, userData: ud };
        }
        return null;
    }).catch(function(e) {
        dbg("RTDB error: " + e.message, "err");
        return null;
    });
}

// Ab secure server API se PRN verify hota hai (auth ki zaroorat nahi, aur
// email/mobile jaisi sensitive fields client tak nahi aatin)
async function findUser(prn) {
    try {
        var res = await fetch('https://studybuddypro-psi.vercel.app/api/backend?action=verify-prn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prn: prn, mode: 'buyer' })
        });
        var result = await res.json();

        if (result && result.found) {
            dbg("✅ API se mila → uid=" + result.uid + " | role=" + result.role, "ok");
            return { uid: result.uid, userData: { role: result.role, name: result.name, branch: result.branch } };
        }
    } catch(e) { dbg("verify-prn API error: " + e.message, "err"); }

    dbg("❌ PRN " + prn + " kahi nahi mila", "err");
    return null;
}

// ── Firestore: fetch rooms history ───────────────────────────────────────────
async function fetchRoomsHistory(uid, prn) {
    var docsMap = {};

    function addSnap(snap) {
        snap.forEach(function(d) {
            docsMap[d.id] = Object.assign({ id: d.id }, d.data());
        });
    }

    var uidFields = ["hostUID","playerUID","uid","userId","createdBy","player1UID","player2UID","hostId","playerId"];
    var prnFields = ["hostPRN","playerPRN","prn","PRN","player1PRN","player2PRN","OPRN","hostPrn","playerPrn","creatorPRN","opponentPRN"];

    dbg("Firestore: UID queries shuru...", "info");
    for (var i = 0; i < uidFields.length; i++) {
        var f = uidFields[i];
        try {
            var s = await firestore.collection("rooms").where(f, "==", uid).limit(MAX_HISTORY).get();
            if (!s.empty) { addSnap(s); dbg("✅ rooms." + f + "(uid) → " + s.size + " docs", "ok"); }
        } catch(e) { dbg("rooms." + f + "(uid): " + e.message, "err"); }
    }

    dbg("Firestore: PRN queries shuru...", "info");
    for (var j = 0; j < prnFields.length; j++) {
        var pf = prnFields[j];
        try {
            var ps = await firestore.collection("rooms").where(pf, "==", prn).limit(MAX_HISTORY).get();
            if (!ps.empty) { addSnap(ps); dbg("✅ rooms." + pf + "(prn) → " + ps.size + " docs", "ok"); }
        } catch(e) { dbg("rooms." + pf + "(prn): " + e.message, "err"); }
    }

    var allDocs = Object.values(docsMap);
    dbg("Total unique docs: " + allDocs.length, allDocs.length > 0 ? "ok" : "err");

    // Sort by timestamp desc
    allDocs.sort(function(a, b) {
        function getTime(d) {
            if (d.timestamp && d.timestamp.toDate) return d.timestamp.toDate().getTime();
            if (d.createdAt && d.createdAt.toDate) return d.createdAt.toDate().getTime();
            if (typeof d.timestamp === "number") return d.timestamp;
            if (typeof d.createdAt === "number") return d.createdAt;
            return 0;
        }
        return getTime(b) - getTime(a);
    });

    return allDocs.slice(0, MAX_HISTORY);
}

// ── Main loader ───────────────────────────────────────────────────────────────
async function loadMatchHistory() {
    var prn = document.getElementById("historyPrnInput").value.trim();
    if (!prn) { fireAlert("PRN Required", "Pehle PRN daalo.", "warn"); return; }
    if (prn.length !== 16) { fireAlert("Invalid PRN", "PRN 16 digits ka hona chahiye.", "warn"); return; }

    currentPRN     = prn;
    currentUID     = "";
    currentRole    = "";
    allHistoryDocs = [];
    renderedCount  = 0;
    document.getElementById("historyList").innerHTML = "";
    document.getElementById("loadMoreBtn").classList.remove("visible");
    clearDebug();
    setHistoryUIState("loading");

    try {
        setLoadingText("RTDB se PRN verify ho raha hai...");
        var userResult = await findUser(prn);

        if (!userResult) {
            fireAlert("PRN Not Found", "Yah PRN database mein registered nahi hai.");
            setHistoryUIState("idle");
            return;
        }

        currentUID  = userResult.uid;
        var ud      = userResult.userData || {};
        currentRole = (ud.role || ud.Role || ud.userRole || ud.type || "").toLowerCase();
        var userName = ud.name || ud.displayName || ud.studentName || ud.fullName || "";

        dbg("✅ Verified! UID=" + currentUID + " | Role=" + currentRole + " | Name=" + userName, "ok");

        setLoadingText("Firestore se history load ho rahi hai...");
        allHistoryDocs = await fetchRoomsHistory(currentUID, prn);

        if (allHistoryDocs.length === 0) {
            lockInput(userName);
            setHistoryUIState("empty");
            document.getElementById("emptyDetail").textContent = "UID:" + currentUID + " | rooms mein koi record nahi";
            return;
        }

        // Stats
        var totalPts = 0, wins = 0;
        allHistoryDocs.forEach(function(doc) {
            var isHost = isIAmHost(doc);
            var pts    = Number(resolveMyPts(doc, isHost)) || 0;
            var res    = resolveResult(doc, isHost);
            totalPts += pts;
            if (res === "win") wins++;
        });
        document.getElementById("statTotal").textContent  = allHistoryDocs.length;
        document.getElementById("statPoints").textContent = totalPts;
        document.getElementById("statWins").textContent   = wins;

        lockInput(userName);
        setHistoryUIState("loaded");
        renderNextBatch();
        // Show field inspector after 500ms so UI renders first
        setTimeout(function() { showFieldInspector(allHistoryDocs[0]); }, 500);
        setTimeout(clearDebug, 4000);

    } catch(err) {
        console.error(err);
        dbg("Fatal: " + err.message, "err");
        fireAlert("Server Error", "Error: " + (err.message || "Unknown"));
        setHistoryUIState("idle");
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Kya main is game ka host/player1 tha?
function isIAmHost(doc) {
    return doc.hostUID    === currentUID || doc.hostPRN    === currentPRN ||
           doc.player1UID === currentUID || doc.player1PRN === currentPRN ||
           doc.createdBy  === currentUID || doc.creatorPRN === currentPRN ||
           doc.playerUID  === currentUID || doc.playerPRN  === currentPRN;
}

// Kya main is game ka player2/guest tha?
function isIAmPlayer2(doc) {
    return doc.player2UID  === currentUID || doc.player2PRN  === currentPRN ||
           doc.friendUID   === currentUID || doc.friendPRN   === currentPRN ||
           doc.guestUID    === currentUID || doc.guestPRN    === currentPRN ||
           doc.opponentUID === currentUID || doc.opponentPRN === currentPRN ||
           String(doc.OPRN || "") === currentPRN || String(doc.oprn || "") === currentPRN;
}

// isMyDoc = main kisi bhi role mein is game mein tha
function isMyDoc(doc) {
    return isIAmHost(doc) || isIAmPlayer2(doc);
}

function resolveMyPts(doc, isHost) {
    if (isHost) {
        // Host = player1 = aap jab host ho
        return doc.hostScore   ?? doc.hostPoints  ?? doc.player1Score ??
               doc.player1Points ?? doc.score1    ?? doc.myPoints     ??
               doc.myScore      ?? doc.points     ?? 0;
    }
    // Guest = player2 = aap jab join kiya ho
    return doc.player2Score   ?? doc.player2Points ?? doc.friendScore  ??
           doc.friendPoints   ?? doc.guestScore    ?? doc.score2       ??
           doc.opponentPoints ?? doc.playerScore   ?? doc.points       ?? 0;
}

function resolveOppPts(doc, isHost) {
    if (isHost) {
        // Opponent = player2 jab aap host ho
        return doc.player2Score   ?? doc.player2Points ?? doc.friendScore  ??
               doc.friendPoints   ?? doc.guestScore    ?? doc.score2       ??
               doc.opponentPoints ?? doc.playerScore   ?? doc.points       ?? 0;
    }
    // Opponent = host/player1 jab aap guest ho
    return doc.hostScore   ?? doc.hostPoints   ?? doc.player1Score   ??
           doc.player1Points ?? doc.score1     ?? doc.myPoints       ??
           doc.myScore      ?? doc.points      ?? 0;
}

function resolveResult(doc, isHost) {
    var raw = isHost
        ? (doc.hostResult   || doc.player1Result || doc.result)
        : (doc.friendResult || doc.player2Result || doc.opponentResult || doc.result);
    return (raw || "draw").toLowerCase();
}

function resolveOPRN(doc, isHost) {
    // Direct OPRN field
    if (doc.OPRN)        return String(doc.OPRN);
    if (doc.oprn)        return String(doc.oprn);

    if (isHost) {
        // Aap host hain — opponent = player2
        return String(
            doc.player2PRN  || doc.player2Prn  ||
            doc.friendPRN   || doc.friendPrn   ||
            doc.opponentPRN || doc.opponentPrn ||
            doc.guestPRN    || doc.player2UID  ||
            doc.friendUID   || doc.opponentUID || ""
        );
    } else {
        // Aap guest hain — opponent = host/player1
        return String(
            doc.hostPRN     || doc.hostPrn     ||
            doc.player1PRN  || doc.player1Prn  ||
            doc.creatorPRN  || doc.hostUID     ||
            doc.player1UID  || doc.createdBy   || ""
        );
    }
}


function fmtOPRN(raw) {
    if (!raw || raw === "" || raw === "undefined" || raw === "null" || raw === "0") return "????";
    var s = String(raw).trim();
    if (s.length === 0) return "????";
    // 16-digit PRN: first 4 + ... + last 4
    if (s.length >= 10) return s.slice(0, 4) + "..." + s.slice(-4);
    if (s.length >= 4)  return "..." + s.slice(-4);
    return s;
}

function lockInput(name) {
    var inp = document.getElementById("historyPrnInput");
    inp.classList.add("verified-state");
    inp.readOnly = true;
    document.getElementById("phSubtitle").textContent = name ? "Verified: " + name : "Verified";
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatDate(d) {
    var diff = Math.floor((Date.now() - d) / 86400000);
    if (diff === 0) return "Aaj";
    if (diff === 1) return "Kal";
    if (diff < 7)   return diff + "d ago";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// ── Render rows ───────────────────────────────────────────────────────────────
function renderNextBatch() {
    var list = document.getElementById("historyList");
    var end  = Math.min(renderedCount + BATCH_SIZE, allHistoryDocs.length);

    for (var i = renderedCount; i < end; i++) {
        var doc     = allHistoryDocs[i];
        var isHost  = isIAmHost(doc);
        var myPts   = Number(resolveMyPts(doc, isHost))  || 0;
        var oppPts  = Number(resolveOppPts(doc, isHost)) || 0;
        var result  = resolveResult(doc, isHost);
        var opprn   = fmtOPRN(resolveOPRN(doc, isHost));

        var iconClass = "draw", iconFa = "fa-minus";
        if (result === "win")  { iconClass = "win";  iconFa = "fa-trophy"; }
        if (result === "loss") { iconClass = "loss"; iconFa = "fa-skull";  }

        var subject = doc.subject || doc.subjectName || doc.arena || doc.roomName || doc.topic || doc.category || "Unknown Subject";

        function getDate(x) {
            if (!x) return null;
            if (x.toDate) return x.toDate();
            if (typeof x === "number") return new Date(x);
            if (typeof x === "string") return new Date(x);
            return null;
        }
        var dateObj = getDate(doc.timestamp) || getDate(doc.createdAt) || getDate(doc.startedAt);
        var dateStr = dateObj ? formatDate(dateObj) : "—";

        var row     = document.createElement("div");
        row.className = "history-row";

        var numEl = document.createElement("span");
        numEl.className   = "hr-num";
        numEl.textContent = i + 1;

        var iconEl = document.createElement("div");
        iconEl.className = "hr-icon " + iconClass;
        var iTag = document.createElement("i");
        iTag.className = "fa-solid " + iconFa;
        iconEl.appendChild(iTag);

        var bodyEl = document.createElement("div");
        bodyEl.className = "hr-body";
        var subjEl = document.createElement("div");
        subjEl.className   = "hr-subject";
        subjEl.textContent = subject;
        var metaEl = document.createElement("div");
        metaEl.className   = "hr-meta";
        var roleBadge = isHost ? "🏠 Host" : "👤 P2";
        metaEl.textContent = roleBadge + " · vs " + opprn;
        bodyEl.appendChild(subjEl);
        bodyEl.appendChild(metaEl);

        var scoresEl = document.createElement("div");
        scoresEl.className = "hr-scores";
        var myScEl = document.createElement("span");
        myScEl.className   = "hr-score-my";
        myScEl.textContent = myPts;
        var oppScEl = document.createElement("span");
        oppScEl.className   = "hr-score-opp";
        oppScEl.textContent = oppPts;
        scoresEl.appendChild(myScEl);
        scoresEl.appendChild(oppScEl);

        var dateEl = document.createElement("span");
        dateEl.className   = "hr-date";
        dateEl.textContent = dateStr;

        row.appendChild(numEl);
        row.appendChild(iconEl);
        row.appendChild(bodyEl);
        row.appendChild(scoresEl);
        row.appendChild(dateEl);

        // Click to open detail
        (function(d, idx){ 
            row.addEventListener('click', function(){ openMatchDetail(d, idx); });
            row.addEventListener('touchend', function(e){
                // only fire if no scroll happened
                if(Math.abs(e.changedTouches[0].clientY - row._touchY) < 8) openMatchDetail(d, idx);
            }, {passive:true});
            row.addEventListener('touchstart', function(e){ row._touchY = e.touches[0].clientY; }, {passive:true});
        })(doc, i);

        list.appendChild(row);
    }

    renderedCount = end;
    var btn = document.getElementById("loadMoreBtn");
    if (renderedCount < allHistoryDocs.length) {
        btn.classList.add("visible");
        btn.textContent = "Aur load karo (" + (allHistoryDocs.length - renderedCount) + " bache)";
    } else {
        btn.classList.remove("visible");
    }
}

function loadMoreHistory() { renderNextBatch(); }

// ── Field Inspector ───────────────────────────────────────────────────────────
function showFieldInspector(doc) {
    if (!doc) return;
    document.getElementById("inspectorDocId").textContent = "Doc ID: " + doc.id;
    var body = document.getElementById("inspectorBody");
    body.innerHTML = "";
    var highlight = ["prn","score","point","oprn","opponent","friend","host","player","result","uid","name","subject","role"];
    var allKeys = Object.keys(doc).filter(function(k) { return k !== "id"; }).sort();

    allKeys.forEach(function(key) {
        var val = doc[key];
        var valStr, valClass;
        if (val === null || val === undefined) { valStr = "null"; valClass = "bool"; }
        else if (typeof val === "object" && val.toDate) { valStr = val.toDate().toLocaleString(); valClass = "str"; }
        else if (typeof val === "object") { valStr = JSON.stringify(val).slice(0, 80); valClass = "str"; }
        else if (typeof val === "number") { valStr = String(val); valClass = "num"; }
        else if (typeof val === "boolean") { valStr = String(val); valClass = "bool"; }
        else { valStr = String(val).slice(0, 100); valClass = "str"; }

        var isHL = highlight.some(function(h) { return key.toLowerCase().indexOf(h) !== -1; });
        var row = document.createElement("div");
        row.className = "field-row" + (isHL ? " highlight" : "");

        var keySpan = document.createElement("span");
        keySpan.className   = "field-key";
        keySpan.textContent = key;

        var valSpan = document.createElement("span");
        valSpan.className   = "field-val " + valClass;
        valSpan.textContent = valStr;

        row.appendChild(keySpan);
        row.appendChild(valSpan);
        body.appendChild(row);
    });
    document.getElementById("inspectorOverlay").classList.add("visible");
}

// ── FAB tap ───────────────────────────────────────────────────────────────────
function onFabTap() {
    if (!currentPRN) {
        fireAlert("PRN Required", "Pehle apna PRN verify karo.", "warn");
        return;
    }
    if (currentRole !== "master") {
        fireAlert("MASTER ONLY", "Yah feature sirf Master role ke liye hai.\nAapka role: " + (currentRole || "student"), "warn");
        return;
    }
    openMasterPanel();
}

// ── Master Panel ──────────────────────────────────────────────────────────────
async function openMasterPanel() {
    document.getElementById("masterOverlay").classList.add("visible");
    document.getElementById("masterSubtitle").textContent = "Loading all rooms...";
    var listEl = document.getElementById("masterList");
    listEl.innerHTML = "<div class=\"master-empty\"><i class=\"fa-solid fa-circle-notch spin-icon\"></i> Loading rooms...</div>";

    try {
        var apiRes = await fetch('https://studybuddypro-psi.vercel.app/api/backend?action=manage-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prn: currentPRN, action: 'list' })
        });
        var result = await apiRes.json();

        if (!result || !result.success) {
            listEl.innerHTML = "<div class=\"master-empty\" style=\"color:#ef4444\">Error: " + escHtml((result && result.error) || "Access denied") + "</div>";
            return;
        }

        var rooms = result.rooms || [];
        if (rooms.length === 0) {
            listEl.innerHTML = "<div class=\"master-empty\">Koi room nahi mila.</div>";
            document.getElementById("masterSubtitle").textContent = "0 rooms found";
            return;
        }
        document.getElementById("masterSubtitle").textContent = rooms.length + " rooms found";
        listEl.innerHTML = "";

        rooms.forEach(function(d) {
            var roomId  = d.id;
            var subject = d.subject || "Unknown";
            var dt    = d.timestamp ? new Date(d.timestamp) : null;
            var dtStr = dt ? dt.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"2-digit" }) : "—";
            var row   = document.createElement("div");
            row.className = "master-room-row";
            row.id = "mrow-" + roomId;
            var mrInfo = document.createElement("div");
            mrInfo.className = "mrr-info";
            mrInfo.innerHTML = "<div class=\"mrr-id\">" + escHtml(roomId) + "</div><div class=\"mrr-sub\">" + escHtml(subject) + " · " + dtStr + "</div>";
            var delBtn = document.createElement("button");
            delBtn.className = "btn-del-one";
            delBtn.title = "Delete this room";
            delBtn.innerHTML = "<i class=\"fa-solid fa-trash-can\"></i>";
            delBtn.addEventListener("click", function() { deleteOneRoom(roomId); });
            row.appendChild(mrInfo);
            row.appendChild(delBtn);
            listEl.appendChild(row);
        });
    } catch(err) {
        listEl.innerHTML = "<div class=\"master-empty\" style=\"color:#ef4444\">Error: " + escHtml(err.message) + "</div>";
    }
}

function closeMasterPanel() {
    document.getElementById("masterOverlay").classList.remove("visible");
}

async function deleteOneRoom(roomId) {
    var row = document.getElementById("mrow-" + roomId);
    var btn = row ? row.querySelector(".btn-del-one") : null;
    if (btn) btn.disabled = true;
    try {
        var apiRes = await fetch('https://studybuddypro-psi.vercel.app/api/backend?action=manage-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prn: currentPRN, action: 'deleteOne', roomId: roomId })
        });
        var result = await apiRes.json();
        if (!result || !result.success) {
            if (btn) btn.disabled = false;
            fireAlert("Delete Failed", (result && result.error) || "Room delete nahi hua");
            return;
        }
        if (row) { row.style.opacity = "0"; row.style.transition = "opacity .3s"; setTimeout(function() { row.remove(); }, 300); }
        var remaining = document.querySelectorAll(".master-room-row").length - 1;
        document.getElementById("masterSubtitle").textContent = remaining + " rooms remaining";
        dbg("Deleted room: " + roomId, "ok");
    } catch(err) {
        if (btn) btn.disabled = false;
        fireAlert("Delete Failed", "Room " + roomId + " delete nahi hua: " + err.message);
    }
}

async function deleteAllRooms() {
    if (!confirm("Kya aap sach mein sabhi rooms delete karna chahte ho? Yah UNDO nahi hoga.")) return;
    var btn = document.getElementById("btnDelAll");
    btn.classList.add("loading");
    btn.innerHTML = "<i class=\"fa-solid fa-circle-notch spin-icon\"></i> Deleting...";
    try {
        var apiRes = await fetch('https://studybuddypro-psi.vercel.app/api/backend?action=manage-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prn: currentPRN, action: 'deleteAll' })
        });
        var result = await apiRes.json();

        if (!result || !result.success) {
            btn.classList.remove("loading");
            btn.innerHTML = "<i class=\"fa-solid fa-trash-can\"></i> DELETE ALL HISTORY";
            fireAlert("Delete Failed", (result && result.error) || "Error hua");
            return;
        }

        if (result.deletedCount === 0) { btn.innerHTML = "<i class=\"fa-solid fa-check\"></i> Already Empty"; return; }

        document.getElementById("masterList").innerHTML = "<div class=\"master-empty\" style=\"color:#10b981\"><i class=\"fa-solid fa-circle-check\"></i> Sabhi rooms delete ho gaye!</div>";
        document.getElementById("masterSubtitle").textContent = "0 rooms remaining";
        btn.innerHTML = "<i class=\"fa-solid fa-circle-check\"></i> ALL DELETED";
        btn.style.background = "linear-gradient(135deg,#10b981,#065f46)";
        allHistoryDocs = []; renderedCount = 0;
        document.getElementById("historyList").innerHTML = "";
        setHistoryUIState("empty");
    } catch(err) {
        btn.classList.remove("loading");
        btn.innerHTML = "<i class=\"fa-solid fa-trash-can\"></i> DELETE ALL HISTORY";
        fireAlert("Delete Failed", "Error: " + err.message);
    }
}

// ── Input events ──────────────────────────────────────────────────────────────
document.getElementById("historyPrnInput").addEventListener("input", function() {
    if (this.readOnly) {
        this.readOnly = false;
        this.classList.remove("verified-state");
        document.getElementById("phSubtitle").textContent = "PRN daalo aur history dekho";
        clearDebug();
        allHistoryDocs = []; renderedCount = 0; currentUID = ""; currentPRN = ""; currentRole = "";
        document.getElementById("historyList").innerHTML = "";
        document.getElementById("loadMoreBtn").classList.remove("visible");
        setHistoryUIState("idle");
    }
});

document.getElementById("historyPrnInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") loadMatchHistory();
});

document.getElementById("masterOverlay").addEventListener("click", function(e) {
    if (e.target === this) closeMasterPanel();
});

// Touch fix — prevent 300ms delay on iOS/Android
document.getElementById("fetchHistoryBtn").addEventListener("touchend", function(e) {
    e.preventDefault();
    loadMatchHistory();
}, { passive: false });

document.getElementById("alertCloseBtn").addEventListener("click", function() {
    document.getElementById("customAlertOverlay").style.display = "none";
});

// ── Match Detail Popup ────────────────────────────────────────────────────────
function openMatchDetail(doc, idx) {
    var iAmHost = isIAmHost(doc);
    var result  = resolveResult(doc, iAmHost);

    // Score aur PRN — perspective se: main kaun tha?
    var myScore, oppScore, myPRN, oppPRN;

    if (iAmHost) {
        // Main host/player1 tha
        myScore  = doc.hostScore  ?? doc.player1Score ?? doc.hostPoints  ?? doc.player1Points ?? doc.score1 ?? 0;
        oppScore = doc.player2Score ?? doc.player2Points ?? doc.friendScore ?? doc.friendPoints ?? doc.guestScore ?? doc.score2 ?? 0;
        myPRN    = doc.hostPRN  || doc.player1PRN || currentPRN || "—";
        oppPRN   = doc.player2PRN || doc.friendPRN || doc.guestPRN || doc.opponentPRN || "—";
    } else {
        // Main player2/guest tha — scores flip karo
        myScore  = doc.player2Score ?? doc.player2Points ?? doc.friendScore ?? doc.friendPoints ?? doc.guestScore ?? doc.score2 ?? 0;
        oppScore = doc.hostScore  ?? doc.player1Score ?? doc.hostPoints  ?? doc.player1Points ?? doc.score1 ?? 0;
        myPRN    = doc.player2PRN || doc.friendPRN || doc.guestPRN || currentPRN || "—";
        oppPRN   = doc.hostPRN  || doc.player1PRN || doc.creatorPRN || "—";
    }

    myScore  = Number(myScore)  || 0;
    oppScore = Number(oppScore) || 0;

    var subject = doc.subject || doc.subjectName || doc.arena || doc.roomName || doc.topic || "Unknown Subject";

    function getDate(x) {
        if (!x) return null;
        if (x.toDate) return x.toDate();
        if (typeof x === "number") return new Date(x);
        if (typeof x === "string") return new Date(x);
        return null;
    }
    var dateObj = getDate(doc.timestamp) || getDate(doc.createdAt) || getDate(doc.startedAt);
    var dateStr = dateObj
        ? dateObj.toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" }) +
          " · " + dateObj.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
        : "—";

    var rMap = {
        win:  { icon:"fa-trophy", cls:"win",  text:"🏆 JEET" },
        loss: { icon:"fa-skull",  cls:"loss", text:"💀 HAAR" },
        draw: { icon:"fa-minus",  cls:"draw", text:"🤝 DRAW" }
    };
    var rc = rMap[result] || rMap.draw;

    document.getElementById("mdSubject").textContent = subject;
    document.getElementById("mdDate").textContent    = dateStr;

    var badge = document.getElementById("mdBadge");
    badge.className = "md-result-badge " + rc.cls;
    document.getElementById("mdBadgeIcon").className = "fa-solid " + rc.icon;

    // Role labels — perspective ke hisaab se
    document.getElementById("mdMyLabel").textContent  = iAmHost ? "Host (Aap)" : "Player 2 (Aap)";
    document.getElementById("mdOppLabel").textContent = iAmHost ? "Player 2"   : "Host";

    document.getElementById("mdMyScore").textContent  = myScore;
    document.getElementById("mdOppScore").textContent = oppScore;
    document.getElementById("mdMyPRN").textContent    = myPRN;
    document.getElementById("mdOppPRN").textContent   = oppPRN;

    var pill = document.getElementById("mdResultPill");
    pill.textContent = rc.text;
    pill.className   = "md-pill " + rc.cls;

    // Body
    var body = document.getElementById("mdBody");
    body.innerHTML = "";

    function makeCard(label, value, colorClass, full) {
        var card = document.createElement("div");
        card.className = "md-card" + (full ? " full" : "");
        var lbl = document.createElement("div");
        lbl.className   = "md-card-label";
        lbl.textContent = label;
        var val = document.createElement("div");
        val.className   = "md-card-value " + (colorClass || "");
        val.textContent = (value !== null && value !== undefined && value !== "") ? value : "—";
        card.appendChild(lbl);
        card.appendChild(val);
        return card;
    }

    function addSection(title) {
        var t = document.createElement("div");
        t.className   = "md-section-title";
        t.textContent = title;
        body.appendChild(t);
    }

    function addGrid(cards) {
        var grid = document.createElement("div");
        grid.className = "md-grid";
        cards.forEach(function(c){ grid.appendChild(c); });
        body.appendChild(grid);
    }

    // Match Info
    addSection("Match Info");
    addGrid([
        makeCard("Subject",  subject,                       "",    false),
        makeCard("Status",   doc.status || "—",             "dim", false),
        makeCard("Room ID",  doc.roomId || doc.roomID || doc.id || "—", "dim", false),
        makeCard("Date",     dateStr,                       "dim", false),
    ]);

    // Scores — perspective ke hisaab se label
    addSection("Scores");
    addGrid([
        makeCard(iAmHost ? "Aapka Score (Host)" : "Aapka Score (Player 2)", myScore,  "green"),
        makeCard(iAmHost ? "Opponent Score (P2)" : "Opponent Score (Host)", oppScore, myScore > oppScore ? "red" : ""),
    ]);

    // Extra fields (jo upar already show nahi hue)
    var usedKeys = ["subject","subjectName","arena","roomName","topic","category",
                    "timestamp","createdAt","startedAt","id","status","roomId","roomID",
                    "hostPRN","player1PRN","player2PRN","friendPRN","guestPRN",
                    "hostScore","player1Score","player2Score","friendScore","guestScore",
                    "hostPoints","player1Points","player2Points","friendPoints",
                    "score1","score2","points",
                    "hostUID","player1UID","player2UID","friendUID","createdBy","creatorPRN",
                    "hostResult","player1Result","player2Result","friendResult","opponentResult","result",
                    "OPRN","oprn","opponentPRN","opponentPrn"];

    var extraKeys = Object.keys(doc).filter(function(k){
        return usedKeys.indexOf(k) === -1 && k !== "id";
    });

    if (extraKeys.length > 0) {
        addSection("Other");
        var extras = extraKeys.slice(0, 8).map(function(k) {
            var v = doc[k];
            var vs;
            if (v === null || v === undefined) vs = "—";
            else if (typeof v === "object" && v.toDate) vs = v.toDate().toLocaleString();
            else if (typeof v === "object") vs = JSON.stringify(v).slice(0, 40);
            else vs = String(v).slice(0, 40);
            return makeCard(k, vs, "dim");
        });
        addGrid(extras);
    }

    document.getElementById("matchDetailOverlay").classList.add("visible");
    body.scrollTop = 0;
}


function closeMatchDetail() {
    document.getElementById("matchDetailOverlay").classList.remove("visible");
}

// Close on overlay tap
document.getElementById("matchDetailOverlay").addEventListener("click", function(e) {
    if (e.target === this) closeMatchDetail();
});

