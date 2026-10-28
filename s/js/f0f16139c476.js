
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

        // 50 BEEE Questions Dataset
        const beeeDataset = [
            {q: "KCL is based on the law of conservation of?", a: "Energy", b: "Charge", c: "Mass", d: "Momentum", ans: "b"},
            {q: "KVL is based on the law of conservation of?", a: "Charge", b: "Energy", c: "Flux", d: "Resistance", ans: "b"},
            {q: "The unit of Magnetic Flux is?", a: "Tesla", b: "Weber", c: "Ampere-turn", d: "Henry", ans: "b"},
            {q: "The ratio of RMS value to Average value is called?", a: "Peak Factor", b: "Form Factor", c: "Power Factor", d: "None", ans: "b"},
            {q: "In a purely capacitive circuit, current ___ the voltage by 90°.", a: "Lags", b: "Leads", c: "In phase", d: "None", ans: "b"},
            {q: "Transformer works on the principle of?", a: "Self induction", b: "Mutual induction", c: "Static induction", d: "None", ans: "b"},
            {q: "The core of a transformer is laminated to reduce?", a: "Hysteresis loss", b: "Eddy current loss", c: "Copper loss", d: "Friction loss", ans: "b"},
            {q: "A p-type semiconductor has majority carriers as?", a: "Electrons", b: "Holes", c: "Neutrons", d: "None", ans: "b"},
            {q: "A Zener diode is always connected in?", a: "Forward bias", b: "Reverse bias", c: "Series", d: "None", ans: "b"},
            {q: "In a BJT, which region is most heavily doped?", a: "Base", b: "Emitter", c: "Collector", d: "None", ans: "b"},
            {q: "Unit of conductance is?", a: "Ohm", b: "Siemens (Mho)", c: "Henry", d: "Farad", ans: "b"},
            {q: "Power Factor of a purely resistive circuit is?", a: "0", b: "1", c: "0.5", d: "Infinity", ans: "b"},
            {q: "Standard frequency of AC supply in India is?", a: "60 Hz", b: "50 Hz", c: "100 Hz", d: "230 Hz", ans: "b"},
            {q: "The opposition offered by a magnetic circuit to flux is?", a: "Resistance", b: "Reluctance", c: "Permeance", d: "Inductance", ans: "b"},
            {q: "An ideal transformer has ___ efficiency.", a: "50%", b: "100%", c: "90%", d: "0%", ans: "b"},
            {q: "Which gate is called a Universal Gate?", a: "AND", b: "NAND", c: "OR", d: "NOT", ans: "b"},
            {q: "Binary equivalent of decimal 5 is?", a: "100", b: "101", c: "110", d: "111", ans: "b"},
            {q: "In a series RLC circuit at resonance, Impedance is?", a: "Maximum", b: "Minimum (Z=R)", c: "Zero", d: "Infinite", ans: "b"},
            {q: "A Bridge Rectifier uses ___ diodes.", a: "1", b: "2", c: "4", d: "3", ans: "c"},
            {q: "The pentavalent impurity added to Silicon creates?", a: "P-type", b: "N-type", c: "Intrinsic", d: "Insulator", ans: "b"},
            {q: "An Ammeter is always connected in?", a: "Parallel", b: "Series", c: "Both", d: "None", ans: "b"},
            {q: "A Voltmeter is always connected in?", a: "Series", b: "Parallel", c: "None", d: "Both", ans: "b"},
            {q: "According to Ohm's Law?", a: "V=IR", b: "I=VR", c: "R=VI", d: "None", ans: "a"},
            {q: "The reciprocal of Impedance is?", a: "Reactance", b: "Admittance", c: "Susceptance", d: "Conductance", ans: "b"},
            {q: "Transformer oil is used for?", a: "Lubrication", b: "Cooling & Insulation", c: "Cleaning", d: "None", ans: "b"},
            {q: "LED emits light in ___ bias.", a: "Reverse", b: "Forward", c: "Both", d: "None", ans: "b"},
            {q: "The output of an OR gate is LOW only if?", a: "One input is HIGH", b: "Both inputs are LOW", c: "Both inputs are HIGH", d: "None", ans: "b"},
            {q: "The unit of Magnetic Field Strength (H) is?", a: "Weber/m²", b: "Ampere-turns/meter", c: "Tesla", d: "Henry/m", ans: "b"},
            {q: "Active power in AC circuit is measured in?", a: "VAR", b: "Watts", c: "VA", d: "Ohms", ans: "b"},
            {q: "Apparent power is measured in?", a: "Watts", b: "VA", c: "VAR", d: "Henry", ans: "b"},
            {q: "Resistance of an ideal voltmeter is?", a: "Zero", b: "Infinite", c: "100 Ohm", d: "None", ans: "b"},
            {q: "Resistance of an ideal ammeter is?", a: "Infinite", b: "Zero", c: "1 Ohm", d: "None", ans: "b"},
            {q: "Forbidden energy gap in Germanium is approx?", a: "1.1 eV", b: "0.72 eV", c: "5 eV", d: "0 eV", ans: "b"},
            {q: "The width of depletion layer ___ in reverse bias.", a: "Decreases", b: "Increases", c: "Remains same", d: "Disappears", ans: "b"},
            {q: "The relation between α and β is?", a: "β = α/(1+α)", b: "β = α/(1-α)", c: "α = β/(1-β)", d: "None", ans: "b"},
            {q: "Open circuit test on transformer gives?", a: "Copper loss", b: "Core loss", c: "Friction loss", d: "None", ans: "b"},
            {q: "Short circuit test on transformer gives?", a: "Core loss", b: "Copper loss", c: "Windage loss", d: "None", ans: "b"},
            {q: "Hexadecimal system has a base of?", a: "8", b: "16", c: "10", d: "2", ans: "b"},
            {q: "For a purely inductive circuit, the power factor is?", a: "1", b: "0 (lagging)", c: "0 (leading)", d: "0.5", ans: "b"},
            {q: "Superposition theorem is applicable only to?", a: "Non-linear circuits", b: "Linear bilateral circuits", c: "Complex circuits", d: "None", ans: "b"},
            {q: "B-H curve for air is a?", a: "Circle", b: "Straight line through origin", c: "Parabola", d: "Hysteresis loop", ans: "b"},
            {q: "RMS value of sinewave with peak Vm is?", a: "Vm/2", b: "Vm/√2", c: "2Vm/π", d: "Vm", ans: "b"},
            {q: "A half adder can add ___ bits.", a: "1", b: "2", c: "3", d: "4", ans: "b"},
            {q: "Which gate performs logical multiplication?", a: "OR", b: "AND", c: "NOT", d: "XOR", ans: "b"},
            {q: "The arrow in diode symbol points towards?", a: "Anode (P)", b: "Cathode (N)", c: "Gate", d: "None", ans: "b"},
            {q: "Three 10 Ohm resistors in parallel give total resistance of?", a: "30 Ohm", b: "3.33 Ohm", c: "10 Ohm", d: "0.33 Ohm", ans: "b"},
            {q: "Quality Factor (Q) of series RLC circuit is?", a: "R/L", b: "(1/R) * √(L/C)", c: "L/CR", d: "None", ans: "b"},
            {q: "Which part of transformer carries flux?", a: "Windings", b: "Core", c: "Bushings", d: "Conservator", ans: "b"},
            {q: "Valence electrons in a Silicon atom are?", a: "2", b: "4", c: "8", d: "14", ans: "b"},
            {q: "A byte consists of ___ bits.", a: "4", b: "8", c: "16", d: "32", ans: "b"}
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
            
            if(room && sub === 'beee') {
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
            
            // यहाँ अब सोलो मोड में भी PRN को डेटाबेस से लाइव चेक किया जाता है
            checkValidPRNInDatabase(dashPrn).then((isValid) => {
                if (isValid) {
                    myPrnNumber = dashPrn;
                    gameMode = "solo";
                    document.getElementById('arenaTitle').innerText = "BEEE Solo Mode";
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

                const inviteUrl = window.location.origin + window.location.pathname + "?room=" + currentRoomId + "&subject=beee";
                
                firestore.collection("rooms").doc(currentRoomId).set({
                    roomId: currentRoomId,
                    subject: "beee",
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
                    document.getElementById('arenaTitle').innerText = "BEEE Live 1v1 Arena";
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
            
            beeeDataset.forEach((data, index) => {
                const card = document.createElement('div');
                card.style = "background:var(--surface); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid var(--border);";
                
                card.innerHTML = `
                    <div style="background:rgba(0, 210, 255, 0.1); padding:4px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--primary);">Question ${index+1} / 50</div>
                    <p style="font-weight:600; font-size:15px; margin-bottom:15px; line-height:1.5;">${data.q}</p>
                    <label class="option-label"><input type="radio" name="beeeQ_${index}" value="a" onclick="transmitRealtimeScore()"> A) ${data.a}</label>
                    <label class="option-label"><input type="radio" name="beeeQ_${index}" value="b" onclick="transmitRealtimeScore()"> B) ${data.b}</label>
                    <label class="option-label"><input type="radio" name="beeeQ_${index}" value="c" onclick="transmitRealtimeScore()"> C) ${data.c}</label>
                    <label class="option-label"><input type="radio" name="beeeQ_${index}" value="d" onclick="transmitRealtimeScore()"> D) ${data.d}</label>
                `;
                area.appendChild(card);
            });
        }

        function transmitRealtimeScore() {
            if(gameMode !== "multiplayer") return;
            
            let tempCorrect = 0;
            beeeDataset.forEach((item, index) => {
                const checked = document.querySelector(`input[name="beeeQ_${index}"]:checked`);
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
            beeeDataset.forEach((item, index) => {
                const sel = document.querySelector(`input[name="beeeQ_${index}"]:checked`);
                if (!sel) skip++;
                else if (sel.value === item.ans) corr++;
                else wrng++;
            });

            const finalPercent = Math.round((corr / beeeDataset.length) * 100);
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

        