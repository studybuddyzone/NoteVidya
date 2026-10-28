
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

        // 50 Basic Civil Engineering Dataset
        const civilDataset = [
            {q: "The branch of surveying used to find the elevations of points with respect to a datum is?", a: "Plane Surveying", b: "Levelling", c: "Geodetic Surveying", d: "Topographic Surveying", ans: "b"},
            {q: "Which type of surveying takes into account the curvature of the earth's surface?", a: "Plane Surveying", b: "Geodetic Surveying", c: "Chain Surveying", d: "Compass Surveying", ans: "b"},
            {q: "The standard size of a modular clay brick as per BIS standards is?", a: "19 cm x 9 cm x 9 cm", b: "20 cm x 10 cm x 10 cm", c: "18 cm x 9 cm x 9 cm", d: "19 cm x 19 cm x 9 cm", ans: "a"},
            {q: "Which cement ingredient imparts strength and can cause flash setting if in excess?", a: "Silica", b: "Lime", c: "Alumina", d: "Iron oxide", ans: "b"},
            {q: "The process of maintaining moisture and temperature conditions in concrete for hydration is?", a: "Mixing", b: "Curing", c: "Compaction", d: "Placing", ans: "b"},
            {q: "Initial setting time of ordinary Portland cement (OPC) should not be less than?", a: "10 minutes", b: "30 minutes", c: "60 minutes", d: "600 minutes", ans: "b"},
            {q: "The lowest load-bearing component of a structure built below ground level is?", a: "Superstructure", b: "Foundation (Substructure)", c: "Plinth", d: "Beams", ans: "b"},
            {q: "Which foundation type is best suited for low bearing capacity soil with heavy structural loads?", a: "Isolated footing", b: "Raft or Mat foundation", c: "Strip footing", d: "Combined footing", ans: "b"},
            {q: "The vertical distance between two consecutive steps in a staircase is called?", a: "Tread", b: "Riser", c: "Going", d: "Flight", ans: "b"},
            {q: "What component prevents moisture from rising from the ground into the building walls?", a: "Lintel", b: "Damp Proof Course (DPC)", c: "Plinth beam", d: "Parapet wall", ans: "b"},
            {q: "A horizontal structural member placed over openings like doors and windows to support upper walls is?", a: "Slab", b: "Lintel", c: "Column", d: "Chajja", ans: "b"},
            {q: "The structures designed to cross over obstacles like rivers or valleys without closing the way underneath are?", a: "Dams", b: "Bridges", c: "Retaining walls", d: "Culverts", ans: "b"},
            {q: "The branch of transportation that deals purely with the planning, design, and geometric features of roads is?", a: "Railway Engineering", b: "Highway Engineering", c: "Airport Engineering", d: "Traffic Engineering", ans: "b"},
            {q: "The cross-sectional slope or curvature provided to the road surface to drain off rainwater is?", a: "Gradient", b: "Camber", c: "Super-elevation", d: "Kerb", ans: "b"},
            {q: "The raise of the outer edge of a road over its inner edge along a curve to counter centrifugal force is?", a: "Camber", b: "Super-elevation", c: "Gradient", d: "Transition curve", ans: "b"},
            {q: "The steel rails in railway tracks are laid over transverse supports known as?", a: "Ballast", b: "Sleepers", c: "Fish plates", d: "Fasteners", ans: "b"},
            {q: "The crushed stone or gravel packed around and beneath sleepers to distribute load is?", a: "Subgrade", b: "Ballast", c: "Base course", d: "Sub-base", ans: "b"},
            {q: "A massive barrier constructed across a river to store water and regulate its flow is a?", a: "Weir", b: "Dam", c: "Barrage", d: "Aqueduct", ans: "b"},
            {q: "The specific portion of a dam designed to safely discharge surplus floodwater downstream is?", a: "Sluice gate", b: "Spillway", c: "Crest", d: "Gallery", ans: "b"},
            {q: "Environmental Engineering aims primarily to control and manage which aspect?", a: "Traffic problems", b: "Public health and ecosystems", c: "Soil mechanics", d: "Structural stability", ans: "b"},
            {q: "The process of removing suspended particles from water by letting it settle under gravity is?", a: "Filtration", b: "Sedimentation", c: "Disinfection", d: "Coagulation", ans: "b"},
            {q: "The final process of killing pathogenic bacteria and microorganisms in drinking water is?", a: "Aeration", b: "Disinfection (Chlorination)", c: "Sedimentation", d: "Filtration", ans: "b"},
            {q: "The water supply pipe installed to carry water from the main water mains directly into a building is?", a: "Sewer line", b: "Service pipe", c: "Vent pipe", d: "Distributor", ans: "b"},
            {q: "The liquid waste or domestic sewage generated from community households is carried out by?", a: "Aqueducts", b: "Sewers", c: "Canals", d: "Open drains", ans: "b"},
            {q: "A structure designed to treat wastewater so it can be safely discharged into environment is?", a: "Water treatment plant", b: "Sewage Treatment Plant (STP)", c: "Hydropower house", d: "Reservoir", ans: "b"},
            {q: "The component of a building that remains completely visible above the ground level is?", a: "Foundation", b: "Superstructure", c: "Substructure", d: "Footing", ans: "b"},
            {q: "An example of a smart and sustainable green building material is?", a: "Traditional plastics", b: "Fly ash bricks", c: "Asbestos sheets", d: "Lead paints", ans: "b"},
            {q: "The property of a concrete mix by which it can easily flow, be compacted, and finished is?", a: "Segregation", b: "Workability", c: "Bleeding", d: "Durability", ans: "b"},
            {q: "The fundamental unit of measurement used for calculating plastering work on walls is?", a: "Cubic meters", b: "Square meters", c: "Running meters", d: "Kilograms", ans: "b"},
            {q: "The line of sights generated from a dumpy level instrument during field levelling is always?", a: "Vertical", b: "Horizontal", c: "Inclined", d: "Curved", ans: "b"},
            {q: "The primary purpose of providing intelligent zoning and green areas in town planning is?", a: "Increasing land costs", b: "Sustainable living environment", c: "Congestion of traffic", d: "Industrial dominance", ans: "b"},
            {q: "Which architectural element is built at the top edge of flat roofs to ensure the safety of people?", a: "Plinth beam", b: "Parapet wall", c: "Chajja", d: "Soffit", ans: "b"},
            {q: "The system of plumbing that contains only one single pipe line for all types of waste collection is?", a: "Two-pipe system", b: "One-pipe system", c: "Partially ventilated system", d: "Dual system", ans: "b"},
            {q: "The reference permanent point of known elevation used as a base during levelling operations is?", a: "Station", b: "Benchmark", c: "Datum line", d: "Change point", ans: "b"},
            {q: "The test carried out in a laboratory to evaluate the consistency and workability of fresh concrete is?", a: "Compressive test", b: "Slump cone test", c: "Vicat needle test", d: "Soundness test", ans: "b"},
            {q: "The survey method executed to prepare maps showing detailed natural features like rivers and hills is?", a: "Cadastral survey", b: "Topographical survey", c: "Engineering survey", d: "Astronomical survey", ans: "b"},
            {q: "The horizontal member of a stair step where a person places their foot while climbing is?", a: "Riser", b: "Tread", c: "Nosing", d: "Stringer", ans: "b"},
            {q: "Which stone type exhibits excellent durability and is widely used for heavy monumental structures?", a: "Chalk", b: "Granite", c: "Laterite", d: "Shale", ans: "b"},
            {q: "The phenomenon where water separate out from fresh concrete mix and rises to the top surface is?", a: "Segregation", b: "Bleeding", c: "Creep", d: "Shrinkage", ans: "b"},
            {q: "The minimum standard height of a residential building room as per National Building Code is?", a: "2.0 meters", b: "2.75 meters", c: "4.0 meters", d: "1.5 meters", ans: "b"},
            {q: "The instrument used in chain surveying to measure perpendicular offsets from a survey line is?", a: "Prismatic compass", b: "Optical square / Cross staff", c: "Plumb bob", d: "Dumpy level", ans: "b"},
            {q: "The chemical process that takes place when water is mixed into cement particles is?", a: "Carbonation", b: "Hydration", c: "Oxidation", d: "Evaporation", ans: "b"},
            {q: "The survey done for determining boundary lines of houses, fields, and estates is called?", a: "City survey", b: "Cadastral survey", c: "Topographic survey", d: "Hydrographic survey", ans: "b"},
            {q: "The main purpose of reinforcement (steel bars) in a reinforced cement concrete (RCC) structure is to resist?", a: "Compression", b: "Tension", c: "Shear only", d: "Torsion only", ans: "b"},
            {q: "A bridge with a small span up to 6 meters used to clear small water channels or drains is a?", a: "Viaduct", b: "Culvert", c: "Flyover", d: "Suspension bridge", ans: "b"},
            {q: "The system implemented to collect and divert storm water and surface runoff during heavy rains is?", a: "Water supply system", b: "Storm water drainage system", c: "Sewerage system", d: "Irrigation network", ans: "b"},
            {q: "An ideal aggregate used for creating high strength concrete should have which shape?", a: "Elongated", b: "Angular", c: "Flaky", d: "Rounded", ans: "b"},
            {q: "The vertical load-bearing member of a structural frame system is known as?", a: "Beam", b: "Column", c: "Slab", d: "Foundation footing", ans: "b"},
            {q: "The standard scale unit used mostly for engineering drawings of large regions is?", a: "Graphical scale", b: "Representative Fraction (RF)", c: "Diagonal scale", d: "Comparative scale", ans: "b"},
            {q: "The structural element built projecting out over window openings to protect them from sun and rain is?", a: "Lintel", b: "Chajja (Canopy)", c: "Slab", d: "Plinth", ans: "b"}
        ];

        // Global Engine State
        let gameMode = "solo";
        let currentRoomId = null;
        let myRole = "host"; 
        let myPrnNumber = "";
        let matchTimerInterval = null;
        let roomUnsubscribeFunc = null;
        let pendingRoomIdToJoin = null;

        // AGORA AUDIO STATE VARIABLES
        const agoraAppId = "40bcc907d60d45d29c37321ed5311a79"; 
        let agoraClient = null;
        let localAudioTrack = null;
        let isMuted = false;
        let voiceCloseInterval = null;

        // Auto Joining URL Detector
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const room = urlParams.get('room');
            const sub = urlParams.get('subject');
            
            if(room && sub === 'civil') {
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
                    document.getElementById('arenaTitle').innerText = "Civil Solo Mode";
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
                document.getElementById('micControlBox').style.display = "none"; // Hide mic during waiting state
                document.getElementById('lobbyPanel').style.display = "block";
                document.getElementById('gameOverlay').style.display = "block";
                document.body.style.overflow = "hidden";

                const inviteUrl = window.location.origin + window.location.pathname + "?room=" + currentRoomId + "&subject=civil";
                
                firestore.collection("rooms").doc(currentRoomId).set({
                    roomId: currentRoomId,
                    subject: "civil",
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
                    document.getElementById('arenaTitle').innerText = "Civil Live 1v1 Arena";
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
                        // Initialize and Start Agora Voice Chat when room turns active
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
                    
                    // Start 30 seconds countdown for voice shutdown
                    startVoiceCloseTimeout();
                }
            });
        }

        // AGORA ENGINE FUNCTIONS
        async function initAgoraVoiceChat(channelId) {
            try {
                // Show Voice Control Box
                document.getElementById('micControlBox').style.display = "flex";
                
                // Initialize Client Object
                agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

                // Event listener to catch and play Opponent's Audio
                agoraClient.on("user-published", async (user, mediaType) => {
                    await agoraClient.subscribe(user, mediaType);
                    if (mediaType === "audio") {
                        user.audioTrack.play();
                    }
                });

                // Join the Agora Audio Channel
                await agoraClient.join(agoraAppId, channelId, null, null);

                // Create local audio stream from user mic
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

                // Publish audio so the opponent can hear it
                await agoraClient.publish([localAudioTrack]);
                
                isMuted = false;
                updateMicUI();
                console.log("Agora Voice Connected Successfully!");
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
                label.style.color = "var(--primary)";
            }
        }

        // 30 Seconds Auto Disconnect Engine After Match Ends
        function startVoiceCloseTimeout() {
            if (voiceCloseInterval) return; 

            let secondsLeftForVoice = 30;
            const label = document.getElementById('micStatusLabel');
            
            if (label) {
                label.innerText = `Closing in ${secondsLeftForVoice}s`;
                label.style.color = "var(--warning)";
            }

            voiceCloseInterval = setInterval(() => {
                secondsLeftForVoice--;
                
                if (label) {
                    label.innerText = `Closing in ${secondsLeftForVoice}s`;
                }

                if (secondsLeftForVoice <= 0) {
                    clearInterval(voiceCloseInterval);
                    voiceCloseInterval = null;
                    
                    // Close mic and channel once 30 seconds finish
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

        function renderQuizQuestions() {
            const area = document.getElementById('dynamicQuizArea');
            area.innerHTML = "";
            
            civilDataset.forEach((data, index) => {
                const card = document.createElement('div');
                card.style = "background:var(--surface); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid var(--border);";
                
                card.innerHTML = `
                    <div style="background:rgba(14, 165, 233, 0.1); padding:4px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--primary);">Question ${index+1} / 50</div>
                    <p style="font-weight:600; font-size:15px; margin-bottom:15px; line-height:1.5;">${escapeHtml(data.q)}</p>
                    <label class="option-label"><input type="radio" name="civilQ_${index}" value="a" onclick="transmitRealtimeScore()"> A) ${escapeHtml(data.a)}</label>
                    <label class="option-label"><input type="radio" name="civilQ_${index}" value="b" onclick="transmitRealtimeScore()"> B) ${escapeHtml(data.b)}</label>
                    <label class="option-label"><input type="radio" name="civilQ_${index}" value="c" onclick="transmitRealtimeScore()"> C) ${escapeHtml(data.c)}</label>
                    <label class="option-label"><input type="radio" name="civilQ_${index}" value="d" onclick="transmitRealtimeScore()"> D) ${escapeHtml(data.d)}</label>
                `;
                area.appendChild(card);
            });
        }

        function escapeHtml(str) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        function transmitRealtimeScore() {
            if(gameMode !== "multiplayer") return;
            
            let tempCorrect = 0;
            civilDataset.forEach((item, index) => {
                const checked = document.querySelector(`input[name="civilQ_${index}"]:checked`);
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
            civilDataset.forEach((item, index) => {
                const sel = document.querySelector(`input[name="civilQ_${index}"]:checked`);
                if (!sel) skip++;
                else if (sel.value === item.ans) corr++;
                else wrng++;
            });

            const finalPercent = Math.round((corr / civilDataset.length) * 100);
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
            
            if (voiceCloseInterval) {
                clearInterval(voiceCloseInterval);
                voiceCloseInterval = null;
            }
            
            closeAgoraVoiceChat(); // Close mic and connection
            
            if(roomUnsubscribeFunc) { roomUnsubscribeFunc(); roomUnsubscribeFunc = null; }
            document.getElementById('gameOverlay').style.display = 'none';
            document.getElementById('resultModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    