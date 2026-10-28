
        // Firebase Configuration
        const firebaseConfig = {
          apiKey: "AIzaSyCZhDPaVY7jv_hXtHdpVqUcGe1hwAxvZmc",
          authDomain: "students-e5183.firebaseapp.com",
          databaseURL: "https://students-e5183-default-rtdb.firebaseio.com",
          projectId: "students-e5183",
          storageBucket: "students-e5183.firebasestorage.app",
          messagingSenderId: "473442117683",
          appId: "1:473442117683:web:f39adc0665317aa95e9b46",
          measurementId: "G-DT4XQLZJW3"
        };

        firebase.initializeApp(firebaseConfig);
        const firestore = firebase.firestore();

        // 50 Engineering Mathematics - 1 Dataset (M1)
        const m1Dataset = [
            {q: "If A is an orthogonal matrix, then its determinant |A| is equal to?", a: "0", b: "±1", c: "Infinity", d: "2", ans: "b"},
            {q: "The rank of a null matrix is always?", a: "1", b: "0", c: "Undefined", d: "Minus infinity", ans: "b"},
            {q: "Every square matrix satisfies its own characteristic equation. This theorem is named?", a: "Euler's Theorem", b: "Cayley-Hamilton Theorem", c: "Taylor's Theorem", d: "Maclaurin Theorem", ans: "b"},
            {q: "If λ is an eigenvalue of an invertible matrix A, then the eigenvalue of A⁻¹ is?", a: "λ²", b: "1/λ", c: "-λ", d: "√λ", ans: "b"},
            {q: "A square matrix A is called skew-symmetric if?", a: "Aᵀ = A", b: "Aᵀ = -A", c: "A⁻¹ = A", d: "Aᵀ = A⁻¹", ans: "b"},
            {q: "The nth derivative of e^(ax) is?", a: "a e^(ax)", b: "a^n e^(ax)", c: "n! e^(ax)", d: "e^(ax)/a^n", ans: "b"},
            {q: "Leibnitz's theorem is used to find the nth derivative of?", a: "Sum of two functions", b: "Product of two functions", c: "Quotient of two functions", d: "Logarithmic functions", ans: "b"},
            {q: "The expansion of f(x) in powers of x (around x=0) is called?", a: "Taylor's Series", b: "Maclaurin's Series", c: "Fourier Series", d: "Laurent's Series", ans: "b"},
            {q: "If u is a homogeneous function of x and y of degree n, then by Euler's Theorem, x(∂u/∂x) + y(∂u/∂y) = ?", a: "0", b: "nu", c: "(n-1)u", d: "n(n-1)u", ans: "b"},
            {q: "If x = r cosθ and y = r sinθ, then the Jacobian J(x,y / r,θ) is?", a: "1", b: "r", c: "1/r", d: "r²", ans: "b"},
            {q: "The value of lim (x→0) (singx/x) in indeterminate forms is?", a: "0", b: "1", c: "Undefined", d: "Infinity", ans: "b"},
            {q: "If z = x + iy, then the value of |e^z| is?", a: "e^x", b: "e^y", c: "e^(x+y)", d: "1", ans: "a"},
            {q: "According to De Moivre's Theorem, (cosθ + i sinθ)^n = ?", a: "cosθ^n + i sinθ^n", b: "cos(nθ) + i sin(nθ)", c: "n(cosθ + i sinθ)", d: "cos(nθ) - i sin(nθ)", ans: "b"},
            {q: "The roots of the equation x^2 + 1 = 0 are?", a: "±1", b: "±i", c: "0", d: "Real and distinct", ans: "b"},
            {q: "The product of all characteristic roots (eigenvalues) of a matrix is equal to?", a: "Trace of matrix", b: "Determinant of matrix", c: "Rank of matrix", d: "0", ans: "b"},
            {q: "The sum of the diagonal elements of a square matrix is called?", a: "Determinant", b: "Trace", c: "Rank", d: "Eigenvector", ans: "b"},
            {q: "If two rows of a square matrix are identical, its determinant value is?", a: "1", b: "0", c: "-1", d: "Infinite", ans: "b"},
            {q: "The nth derivative of log(x) is?", a: "1/x^n", b: "(-1)^(n-1) * (n-1)! / x^n", c: "(-1)^n * n! / x^n", d: "n!/x", ans: "b"},
            {q: "If z = f(x,y), then ∂²z/∂x∂y is equal to?", a: "∂²z/∂y²", b: "∂²z/∂y∂x", c: "(∂z/∂x) * (∂z/∂y)", d: "0", ans: "b"},
            {q: "A system of linear equations AX = B is consistent if?", a: "Rank(A) ≠ Rank([A|B])", b: "Rank(A) = Rank([A|B])", c: "Rank(A) = 0", d: "|A| = 0", ans: "b"},
            {q: "An eigenvalue of a symmetric matrix is always?", a: "Imaginary", b: "Real", c: "Zero", d: "Complex number", ans: "b"},
            {q: "The value of log(-1) in complex numbers is?", a: "0", b: "iπ", c: "1", d: "-1", ans: "b"},
            {q: "If z = cosh(x) + sinh(x), then z equals?", a: "e^-x", b: "e^x", c: "1", d: "0", ans: "b"},
            {q: "The value of sin(ix) is equal to?", a: "i sinh(x)", b: "sinh(ix)", c: "i sin(x)", d: "cos(x)", ans: "a"},
            {q: "The value of cos(ix) is equal to?", a: "i cosh(x)", b: "cosh(x)", c: "-cosh(x)", d: "sin(x)", ans: "b"},
            {q: "Under what condition does a system AX=0 have a non-trivial solution?", a: "|A| ≠ 0", b: "|A| = 0", c: "A is identity matrix", d: "Rank(A) = number of unknowns", ans: "b"},
            {q: "The rank of an Identity matrix of order n is?", a: "0", b: "n", c: "1", d: "n-1", ans: "b"},
            {q: "The condition for a function f(x,y) to have a maximum value at (a,b) is?", a: "rt - p^2 > 0 and r > 0", b: "rt - s^2 > 0 and r < 0", c: "rt - s^2 < 0", d: "rt - s^2 = 0", ans: "b"},
            {q: "In extreme values of a function, 's' stands for?", a: "∂²f/∂x²", b: "∂²f/∂x∂y", c: "∂²f/∂y²", d: "∂f/∂x", ans: "b"},
            {q: "In extreme values of a function, 'r' stands for?", a: "∂²f/∂y²", b: "∂²f/∂x²", c: "∂f/∂y", d: "0", ans: "b"},
            {q: "The stationary points are obtained by equating?", a: "r=0, t=0", b: "∂f/∂x = 0 and ∂f/∂y = 0", c: "rt-s² = 0", d: "None", ans: "b"},
            {q: "The expansion of cos(x) via Maclaurin's series contains only?", a: "Odd powers of x", b: "Even powers of x", c: "Prime powers of x", d: "Fractional powers", ans: "b"},
            {q: "The expansion of sin(x) via Maclaurin's series contains only?", a: "Even powers of x", b: "Odd powers of x", c: "Constant terms", d: "Negative powers", ans: "b"},
            {q: "By L'Hospital's rule, lim(x→0) (tan x / x) is equal to?", a: "0", b: "1", c: "Infinity", d: "2", ans: "b"},
            {q: "The value of lim(x→0) (1 + x)^(1/x) is equal to?", a: "0", b: "e", c: "1", d: "1/e", ans: "b"},
            {q: "If A is a matrix of order 3x4, then maximum possible rank of A is?", a: "4", b: "3", c: "7", d: "12", ans: "b"},
            {q: "If a matrix has eigenvectors, they are always corresponding to?", a: "Rank", b: "Eigenvalues", c: "Trace", d: "Inverse", ans: "b"},
            {q: "The modulus of complex number z = 3 + 4i is?", a: "7", b: "5", c: "25", d: "1", ans: "b"},
            {q: "The argument of complex number z = 1 + i is?", a: "π/2", b: "π/4", c: "π/3", d: "π", ans: "b"},
            {q: "For a unit matrix I, Iᵀ is equal to?", a: "-I", b: "I", c: "0", d: "I⁻¹", ans: "b"},
            {q: "If a matrix A is upper triangular, its eigenvalues are?", a: "Always 0", b: "Elements of its principal diagonal", c: "Always 1", d: "Reciprocals of diagonal elements", ans: "b"},
            {q: "The Jacobian of u,v with respect to x,y is denoted as?", a: "∂(x,y)/∂(u,v)", b: "∂(u,v)/∂(x,y)", c: "d(uv)/d(xy)", d: "J(u/v)", ans: "b"},
            {q: "If J is the Jacobian of (u,v) w.r.t (x,y) and J' is Jacobian of (x,y) w.r.t (u,v), then JJ' = ?", a: "0", b: "1", c: "-1", d: "Infinity", ans: "b"},
            {q: "The nth derivative of (ax+b)^m when m=n is?", a: "0", b: "n! * a^n", c: "a^n", d: "n!", ans: "b"},
            {q: "The nth derivative of sin(ax+b) is?", a: "a^n sin(ax+b)", b: "a^n sin(ax+b + nπ/2)", c: "sin(ax+b + nπ/2)", d: "(-1)^n a^n cos(ax+b)", ans: "b"},
            {q: "The value of cosh²x - sinh²x is?", a: "0", b: "1", c: "-1", d: "cosh(2x)", ans: "b"},
            {q: "The real part of cos(x+iy) is?", a: "cos x cosh y", b: "-sin x sinh y", c: "cos x sinh y", d: "sin x cosh y", ans: "a"},
            {q: "The imaginary part of cos(x+iy) is?", a: "cos x cosh y", b: "-sin x sinh y", c: "sin x sinh y", d: "0", ans: "b"},
            {q: "If A is non-singular square matrix, then |A| is?", a: "= 0", b: "≠ 0", c: "< 0", d: "Undefined", ans: "b"},
            {q: "Every identity matrix is a special case of?", a: "Null matrix", b: "Diagonal matrix", c: "Skew-symmetric matrix", d: "Non-square matrix", ans: "b"}
        ];

        // Global Engine State
        let gameMode = "solo";
        let currentRoomId = null;
        let myRole = "host"; 
        let myPrnNumber = "";
        let matchTimerInterval = null;

        // AGORA AUDIO STATE VARIABLES
        const agoraAppId = "40bcc907d60d45d29c37321ed5311a79"; 
        let agoraClient = null;
        let localAudioTrack = null;
        let isMuted = false;
        let voiceCloseInterval = null;


        let roomUnsubscribeFunc = null;
        let pendingRoomIdToJoin = null;

        // Auto Joining URL Detector
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const room = urlParams.get('room');
            const sub = urlParams.get('subject');
            
            if(room && sub === 'm1') {
                pendingRoomIdToJoin = room;
                document.getElementById('prnGatekeeperModal').style.display = 'flex';
            }
        });

        // APP-WIDE CUSTOM MODERN DYNAMIC ALERT CALLER
        function triggerCustomAlert(title, text, styleType) {
            const overlay = document.getElementById('customAlertOverlay');
            const iconBox = document.getElementById('alertIconContainer');
            const icon = document.getElementById('alertIcon');
            const titleLbl = document.getElementById('alertTitleLabel');
            const descLbl = document.getElementById('alertDescriptionLabel');
            const closeBtn = document.getElementById('alertCloseBtn');

            titleLbl.innerText = title;
            descLbl.innerText = text;

            if(styleType === "warning") {
                iconBox.className = "alert-icon-circle warning";
                icon.className = "fa-solid fa-circle-exclamation fa-xl";
                closeBtn.className = "btn-alert-close warning";
            } else {
                iconBox.className = "alert-icon-circle danger";
                icon.className = "fa-solid fa-triangle-exclamation fa-xl";
                closeBtn.className = "btn-alert-close danger";
            }

            overlay.style.display = "flex";
        }

        function closeCustomAlert() {
            document.getElementById('customAlertOverlay').style.opacity = "0";
            setTimeout(() => {
                document.getElementById('customAlertOverlay').style.display = "none";
                document.getElementById('customAlertOverlay').style.opacity = "1";
            }, 200);
        }

        // DATABASE PRN STRICT VERIFIER WITH APP ALERT INTEGRATION
        function checkValidPRNInDatabase(prnStr) {
            if (!prnStr) {
                triggerCustomAlert("PRN REQUIRED", "आगे बढ़ने के लिए कृपया अपना PRN नंबर दर्ज करें!", "warning");
                return Promise.resolve(false);
            }
            if (prnStr.length !== 16) {
                triggerCustomAlert("INVALID LENGTH", "अमान्य PRN! आपका PRN नंबर पूरे 16 अंकों का होना चाहिए, न कम न ज्यादा।", "danger");
                return Promise.resolve(false);
            }
            
            return firestore.collection("users").where("prn", "==", prnStr).get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        return true; 
                    } else {
                        triggerCustomAlert("NOT REGISTERED", "यह 16-अंकीय PRN डेटाबेस में मौजूद नहीं है। कृपया सही नंबर डालें!", "danger");
                        return false;
                    }
                })
                .catch((err) => {
                    triggerCustomAlert("DATABASE ERROR", err.message, "danger");
                    return false;
                });
        }

        // PLAYER-2 VERIFY
        function verifyPlayer2PRN() {
            const prnInput = document.getElementById('gatekeeperPrnInput').value.trim();
            
            checkValidPRNInDatabase(prnInput).then((isValid) => {
                if (isValid) {
                    myPrnNumber = prnInput;
                    document.getElementById('prnGatekeeperModal').style.display = 'none';
                    if (pendingRoomIdToJoin) {
                        joinMultiplayerRoom(pendingRoomIdToJoin);
                        pendingRoomIdToJoin = null;
                    }
                }
            });
        }

        // SOLO GAME RUNNER WITH LIVE FIREBASE AUTH CHECK
        function startSoloGame() {
            const dashPrn = document.getElementById('myDashboardPRN').value.trim();
            
            checkValidPRNInDatabase(dashPrn).then((isValid) => {
                if (isValid) {
                    myPrnNumber = dashPrn;
                    gameMode = "solo";
                    document.getElementById('arenaTitle').innerText = "M1 Solo Mode";
                    document.getElementById('lobbyPanel').style.display = "none";
                    document.getElementById('scoreboard').style.display = "none";
                    document.getElementById('micControlBox').style.display = "none"; // Hide Mic in Solo
                    document.getElementById('gameOverlay').style.display = "block";
                    
                    startLiveCountdown(600);
                    renderQuizQuestions();
                    document.getElementById('quizContainer').style.display = "block";
                    document.body.style.overflow = "hidden";
                }
            });
        }

        // MULTIPLAYER ROOM (HOST)
        function createMultiplayerRoom() {
            const dashPrn = document.getElementById('myDashboardPRN').value.trim();
            
            checkValidPRNInDatabase(dashPrn).then((isValid) => {
                if (!isValid) return; 

                myPrnNumber = dashPrn;
                gameMode = "multiplayer";
                myRole = "host";
                currentRoomId = "ROOM_" + Math.floor(100000 + Math.random() * 900000);
                
                document.getElementById('arenaTitle').innerText = "1v1 Matchmaking Lobby";
                document.getElementById('quizContainer').style.display = "none";
                document.getElementById('shareBox').style.display = "none";
                document.getElementById('lobbyPanel').style.display = "block";
                document.getElementById('micControlBox').style.display = "none"; // Hide mic during waiting
                document.getElementById('gameOverlay').style.display = "block";
                document.body.style.overflow = "hidden";

                const inviteUrl = window.location.origin + window.location.pathname + "?room=" + currentRoomId + "&subject=m1";
                
                firestore.collection("rooms").doc(currentRoomId).set({
                    roomId: currentRoomId,
                    subject: "m1",
                    status: "waiting",
                    hostPrn: myPrnNumber,
                    player2Prn: "", 
                    hostScore: 0,
                    player2Score: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    document.getElementById('inviteUrlInput').value = inviteUrl;
                    document.getElementById('shareBox').style.display = "block";
                    listenToRoomChanges();
                }).catch(err => triggerCustomAlert("ERROR", err.message, "danger"));
            });
        }

        function copyInviteLink() {
            const inputEl = document.getElementById('inviteUrlInput');
            inputEl.select();
            document.execCommand('copy');
            triggerCustomAlert("LINK COPIED", "चैलेंज लिंक क्लिपबोर्ड पर कॉपी हो गया है! इसे शेयर करें।", "warning");
        }

        // JOIN MULTIPLAYER ROOM
        function joinMultiplayerRoom(roomId) {
            gameMode = "multiplayer";
            myRole = "player2";
            currentRoomId = roomId;

            firestore.collection("rooms").doc(roomId).get().then((doc) => {
                if (doc.exists && doc.data().status === "waiting") {
                    document.getElementById('arenaTitle').innerText = "M1 Live 1v1 Arena";
                    document.getElementById('lobbyPanel').style.display = "none";
                    document.getElementById('gameOverlay').style.display = "block";
                    document.body.style.overflow = "hidden";
                    
                    return firestore.collection("rooms").doc(roomId).update({ 
                        status: "active",
                        player2Prn: myPrnNumber
                    });
                } else {
                    triggerCustomAlert("EXPIRED ROOM", "यह रूम कोड अमान्य है या मैच खत्म हो चुका है!", "danger");
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }).then(() => {
                if(currentRoomId) listenToRoomChanges();
            }).catch(err => console.log(err));
        }

        // Realtime Synchronizer
        function listenToRoomChanges() {
            roomUnsubscribeFunc = firestore.collection("rooms").doc(currentRoomId).onSnapshot((doc) => {
                if(!doc.exists) return;
                const roomData = doc.data();

                if(roomData.status === "active") {
                    document.getElementById('lobbyPanel').style.display = "none";
                    document.getElementById('scoreboard').style.display = "flex";
                    document.getElementById('quizContainer').style.display = "block";
                    
                    document.getElementById('myPrnDisplay').innerText = myRole === "host" ? roomData.hostPrn : roomData.player2Prn;
                    document.getElementById('oppPrnDisplay').innerText = myRole === "host" ? (roomData.player2Prn || "Wait..") : roomData.hostPrn;

                    if(!matchTimerInterval) {
                        startLiveCountdown(600);
                        renderQuizQuestions();
                        // Initialize Agora Voice Chat when room turns active
                        initAgoraVoiceChat(currentRoomId);
                    }
                }

                if(myRole === "host") {
                    document.getElementById('myLiveScoreLabel').innerText = roomData.hostScore || 0;
                    document.getElementById('oppLiveScoreLabel').innerText = roomData.player2Score !== undefined ? roomData.player2Score + " pts" : "Joining..";
                } else {
                    document.getElementById('myLiveScoreLabel').innerText = roomData.player2Score || 0;
                    document.getElementById('oppLiveScoreLabel').innerText = (roomData.hostScore || 0) + " pts";
                }

                if(roomData.status === "finished") {
                    clearInterval(matchTimerInterval);
                    evaluateFinalResults(roomData);
                    startVoiceCloseTimeout();
                }
            });
        }

        function renderQuizQuestions() {
            const area = document.getElementById('dynamicQuizArea');
            area.innerHTML = "";
            
            m1Dataset.forEach((data, index) => {
                const card = document.createElement('div');
                card.style = "background:var(--surface); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid var(--border);";
                
                card.innerHTML = `
                    <div style="background:rgba(0, 210, 255, 0.1); padding:4px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--primary);">Question ${index+1} / 50</div>
                    <p style="font-weight:600; font-size:15px; margin-bottom:15px; line-height:1.5;">${data.q}</p>
                    <label class="option-label"><input type="radio" name="m1Q_${index}" value="a" onclick="transmitRealtimeScore()"> A) ${data.a}</label>
                    <label class="option-label"><input type="radio" name="m1Q_${index}" value="b" onclick="transmitRealtimeScore()"> B) ${data.b}</label>
                    <label class="option-label"><input type="radio" name="m1Q_${index}" value="c" onclick="transmitRealtimeScore()"> C) ${data.c}</label>
                    <label class="option-label"><input type="radio" name="m1Q_${index}" value="d" onclick="transmitRealtimeScore()"> D) ${data.d}</label>
                `;
                area.appendChild(card);
            });
        }

        function transmitRealtimeScore() {
            if(gameMode !== "multiplayer") return;
            
            let tempCorrect = 0;
            m1Dataset.forEach((item, index) => {
                const checked = document.querySelector(`input[name="m1Q_${index}"]:checked`);
                if(checked && checked.value === item.ans) {
                    tempCorrect += 2;
                }
            });

            const payload = {};
            if(myRole === "host") payload.hostScore = tempCorrect;
            else payload.player2Score = tempCorrect;
            
            firestore.collection("rooms").doc(currentRoomId).update(payload);
        }

        function startLiveCountdown(secondsLeft) {
            clearInterval(matchTimerInterval);
            matchTimerInterval = setInterval(() => {
                secondsLeft--;
                let mins = Math.floor(secondsLeft / 60);
                let secs = secondsLeft % 60;
                document.getElementById('liveTimer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                if(secondsLeft <= 0) {
                    clearInterval(matchTimerInterval);
                    submitGameAnswers();
                }
            }, 1000);
        }

        function submitGameAnswers() {
            let corr = 0, wrng = 0, skip = 0;
            m1Dataset.forEach((item, index) => {
                const sel = document.querySelector(`input[name="m1Q_${index}"]:checked`);
                if (!sel) skip++;
                else if (sel.value === item.ans) corr++;
                else wrng++;
            });

            const finalPercent = Math.round((corr / m1Dataset.length) * 100);
            document.getElementById('lblCorrectCount').innerText = corr;
            document.getElementById('lblWrongCount').innerText = wrng;
            document.getElementById('lblSkippedCount').innerText = skip;
            document.getElementById('finalScorePercent').innerText = finalPercent + "%";

            if(gameMode === "multiplayer") {
                firestore.collection("rooms").doc(currentRoomId).update({ status: "finished" });
            } else {
                document.getElementById('resultHeaderTitle').innerText = "SOLO TEST RESULT";
                document.getElementById('matchOutcomeMessage').style.display = "none";
                document.getElementById('resultModal').style.display = 'flex';
            }
        }

        function evaluateFinalResults(roomData) {
            document.getElementById('resultHeaderTitle').innerText = "1v1 BATTLE RESULT";
            const msgBox = document.getElementById('matchOutcomeMessage');
            msgBox.style.display = "block";

            const hScore = roomData.hostScore || 0;
            const p2Score = roomData.player2Score || 0;

            if(myRole === "host") {
                if(hScore > p2Score) { msgBox.innerText = `🏆 WINNER! (${hScore} vs ${p2Score})`; msgBox.style.color = "var(--success)"; }
                else if(hScore < p2Score) { msgBox.innerText = `😭 DEFEAT! (${hScore} vs ${p2Score})`; msgBox.style.color = "var(--danger)"; }
                else { msgBox.innerText = `👔 DRAW MATCH! (${hScore} vs ${p2Score})`; msgBox.style.color = "orange"; }
            } else {
                if(p2Score > hScore) { msgBox.innerText = `🏆 WINNER! (${p2Score} vs ${hScore})`; msgBox.style.color = "var(--success)"; }
                else if(p2Score < hScore) { msgBox.innerText = `😭 DEFEAT! (${p2Score} vs ${hScore})`; msgBox.style.color = "var(--danger)"; }
                else { msgBox.innerText = `👔 DRAW MATCH! (${p2Score} vs ${hScore})`; msgBox.style.color = "orange"; }
            }
            document.getElementById('resultModal').style.display = 'flex';
        }

        function leaveGame() {
            clearInterval(matchTimerInterval);
            matchTimerInterval = null;
            if (voiceCloseInterval) { clearInterval(voiceCloseInterval); voiceCloseInterval = null; }
            if(roomUnsubscribeFunc) { roomUnsubscribeFunc(); roomUnsubscribeFunc = null; }
            document.getElementById('gameOverlay').style.display = 'none';
            document.getElementById('resultModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    
        // AGORA ENGINE FUNCTIONS
        async function initAgoraVoiceChat(channelId) {
            try {
                document.getElementById('micControlBox').style.display = "flex";
                agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                agoraClient.on("user-published", async (user, mediaType) => {
                    await agoraClient.subscribe(user, mediaType);
                    if (mediaType === "audio") {
                        user.audioTrack.play();
                    }
                });
                await agoraClient.join(agoraAppId, channelId, null, null);
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                await agoraClient.publish([localAudioTrack]);
                isMuted = false;
                updateMicUI();
            } catch (err) {
                console.error("Agora mic activation failed:", err);
            }
        }

        function toggleMic() {
            if (!localAudioTrack) return;
            if (!isMuted) {
                localAudioTrack.setEnabled(false);
                isMuted = true;
            } else {
                localAudioTrack.setEnabled(true);
                isMuted = false;
            }
            updateMicUI();
        }

        function updateMicUI() {
            const btn = document.getElementById('micToggleBtn');
            const icon = document.getElementById('micIcon');
            const label = document.getElementById('micStatusLabel');
            if (isMuted) {
                btn.className = "btn-mic-toggle muted";
                icon.className = "fa-solid fa-microphone-slash";
                label.innerText = "Muted";
                label.style.color = "var(--danger)";
            } else {
                btn.className = "btn-mic-toggle";
                icon.className = "fa-solid fa-microphone";
                label.innerText = "Voice On";
                label.style.color = "#0ea5e9";
            }
        }

        function startVoiceCloseTimeout() {
            if (voiceCloseInterval) return;
            let secondsLeftForVoice = 30;
            const label = document.getElementById('micStatusLabel');
            if (label) {
                label.innerText = `Closing in ${secondsLeftForVoice}s`;
                label.style.color = "var(--warn)";
            }
            voiceCloseInterval = setInterval(() => {
                secondsLeftForVoice--;
                if (label) label.innerText = `Closing in ${secondsLeftForVoice}s`;
                if (secondsLeftForVoice <= 0) {
                    clearInterval(voiceCloseInterval);
                    voiceCloseInterval = null;
                    closeAgoraVoiceChat();
                }
            }, 1000);
        }

        async function closeAgoraVoiceChat() {
            document.getElementById('micControlBox').style.display = "none";
            if (localAudioTrack) {
                localAudioTrack.close();
                localAudioTrack = null;
            }
            if (agoraClient) {
                await agoraClient.leave();
                agoraClient = null;
            }
        }

        