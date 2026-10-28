
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

        // 50 Engineering Mechanics Dataset
        const mechanicsDataset = [
            {q: "Which law states that 'If two forces acting simultaneously on a particle are represented by the adjacent sides of a parallelogram, their resultant is represented by the diagonal'?", a: "Triangle Law", b: "Parallelogram Law", c: "Lami's Theorem", d: "Varignon's Theorem", ans: "b"},
            {q: "According to Newton's First Law of Motion, a body at rest will remain at rest unless acted upon by an ______.", a: "Internal Force", b: "External Unbalanced Force", c: "Frictional Force", d: "Gravitational Force", ans: "b"},
            {q: "The mathematical expression for Newton's Second Law of motion is given by ______.", a: "F = m/a", b: "F = m * a", c: "F = w * h", d: "F = m * v", ans: "b"},
            {q: "Lami's Theorem is applicable only for ______ forces.", a: "Parallel and concurrent", b: "Coplanar, concurrent and in equilibrium", c: "Non-coplanar and non-concurrent", d: "Unbalanced system", ans: "b"},
            {q: "The theorem stating 'The algebraic sum of moments of a system of coplanar forces about any point is equal to the moment of their resultant about the same point' is called ______.", a: "Lami's Theorem", b: "Varignon's Theorem", c: "Lame's Equation", d: "D'Alembert's Principle", ans: "b"},
            {q: "The principle of transmissibility states that the force can be applied at any point along its ______ without altering the external effect.", a: "Point of application", b: "Line of action", c: "Center of gravity", d: "Perpendicular axis", ans: "b"},
            {q: "A rigid body is in a state of static equilibrium if the summation of all forces ($\Sigma F$) and summation of all moments ($\Sigma M$) are equal to ______.", a: "One", b: "Zero", c: "Infinity", d: "Constant value", ans: "b"},
            {q: "The force which opposes the relative motion between two contact surfaces is known as ______.", a: "Tensile Force", b: "Frictional Force", c: "Normal Reaction", d: "Shear Force", ans: "b"},
            {q: "The maximum value of static friction that comes into play when a body just begins to slide over another surface is called ______ friction.", a: "Kinetic", b: "Limiting", c: "Rolling", d: "Dynamic", ans: "b"},
            {q: "The ratio of limiting friction ($F$) to the normal reaction ($R_n$) is defined as the ______.", a: "Angle of Friction", b: "Coefficient of Friction", c: "Angle of Repose", d: "Efficiency", ans: "b"},
            {q: "The center of gravity of a solid right circular cone of height 'h' lies at a distance of ______ from its base along the vertical axis.", a: "h/3", b: "h/4", c: "h/2", d: "2h/3", ans: "b"},
            {q: "The center of gravity of a hemisphere of radius 'r' lies at a distance of ______ from its base diametral axis.", a: "4r/3\u03c0", b: "3r/8", c: "r/2", d: "2r/3", ans: "b"},
            {q: "The moment of inertia of a rectangular section of width 'b' and depth 'd' about its base axis passing through the centroid ($I_{xx}$) is ______.", a: "bd\u00b3/36", b: "bd\u00b3/12", c: "db\u00b3/12", d: "bd\u00b3/3", ans: "b"},
            {q: "The moment of inertia of a circular section of diameter 'd' about its central axis is ______.", a: "\u03c0d\u2074/32", b: "\u03c0d\u2074/64", c: "\u03c0d\u00b3/64", d: "\u03c0d\u2074/12", ans: "b"},
            {q: "According to the Parallel Axis Theorem, the moment of inertia about any axis parallel to the centroidal axis ($I$) is equal to ______.", a: "I_g - Ah\u00b2", b: "I_g + Ah\u00b2", c: "I_g + Ax", d: "I_g * Ah", ans: "b"},
            {q: "The Perpendicular Axis Theorem is applicable for ______ bodies.", a: "3D Spherical", b: "2D Lamina / Plane surfaces", c: "Long slender beams", d: "Flexible cables", ans: "b"},
            {q: "A force system whose lines of action of all forces pass through a single common point is called a ______ force system.", a: "Parallel", b: "Concurrent", c: "Non-concurrent", d: "Collinear", ans: "b"},
            {q: "If two equal and opposite parallel forces act along different lines of action on a body, they form a ______.", a: "Resultant", b: "Couple", c: "Equilibrant", d: "Moment arm", ans: "b"},
            {q: "The SI unit of moment of a force or a couple is ______.", a: "N/m", b: "N\u00b7m", c: "N\u00b7m\u00b2", d: "Kg\u00b7m", ans: "b"},
            {q: "A single force which can replace a complete system of forces and produce the exact same external effect is called the ______ force.", a: "Equilibrant", b: "Resultant", c: "Component", d: "Normal", ans: "b"},
            {q: "A single force which brings a system of forces into complete equilibrium state is called the ______.", a: "Resultant", b: "Equilibrant", c: "Couple", d: "Reaction", ans: "b"},
            {q: "The equilibrant force is equal to the resultant force in magnitude but ______ in direction.", a: "Same", b: "Opposite", c: "Perpendicular", d: "Inclined at 45 degrees", ans: "b"},
            {q: "If three forces form a closed loop of a triangle taken in sequence, their resultant is ______.", a: "Maximum", b: "Zero", c: "Sum of all three", d: "Product of forces", ans: "b"},
            {q: "Angle of repose is numerically ______ the angle of friction.", a: "Greater than", b: "Equal to", c: "Less than", d: "Twice of", ans: "b"},
            {q: "The point through which the entire weight of a body acts regardless of its orientation is the ______.", a: "Centroid", b: "Center of Gravity", c: "Metacenter", d: "Center of Buoyancy", ans: "b"},
            {q: "The term 'Centroid' is used for figures representing ______.", a: "Mass", b: "Area or Volume (Geometric centers)", c: "Weight profiles", d: "Density outlines", ans: "b"},
            {q: "The centroid of a triangle of base 'b' and height 'h' lies at a vertical distance of ______ from its vertex.", a: "h/3", b: "2h/3", c: "h/2", d: "h/4", ans: "b"},
            {q: "The centroid of a semicircular lamina of radius 'r' from its base diameter line is ______.", a: "2r/3", b: "4r/3\u03c0", c: "3r/8", d: "r/3", ans: "b"},
            {q: "Radius of gyration ($k$) is calculated using which formula?", a: "k = \u221a(A/I)", b: "k = \u221a(I/A)", c: "k = I * A", d: "k = I/A\u00b2", ans: "b"},
            {q: "The moment of inertia is also commonly referred to as the ______.", a: "First moment of area", b: "Second moment of area", c: "Mass momentum", d: "Product of inertia", ans: "b"},
            {q: "The unit of second moment of area in SI units is ______.", a: "mm\u00b3", b: "mm\u2074", c: "mm\u00b2", d: "N\u00b7mm", ans: "b"},
            {q: "A perfect frame or truss with 'j' joints and 'm' members satisfies which mathematical relation?", a: "m = 2j - 4", b: "m = 2j - 3", m: "m = 3j - 2", d: "m = j + 2", ans: "b"},
            {q: "If in a truss, $m < 2j - 3$, then the truss structure is categorized as ______.", a: "Redundant truss", b: "Deficient truss", c: "Perfect frame", d: "Statically indeterminate", ans: "b"},
            {q: "If in a truss structure, $m > 2j - 3$, it is called a ______ truss.", a: "Deficient", b: "Redundant", c: "Perfect", d: "Unstable", ans: "b"},
            {q: "In a truss analysis using the Method of Joints, we can apply a maximum of ______ equilibrium equations per joint.", a: "Three", b: "Two (\u03a3Fx=0, \u03a3Fy=0)", c: "Four", d: "One", ans: "b"},
            {q: "Dynamic equilibrium of a body in motion is explained by which principle using inertia forces?", a: "Varignon's Theorem", b: "D'Alembert's Principle", c: "Work-Energy Theorem", d: "Archimedes Principle", ans: "b"},
            {q: "Work done by a force is calculated as the dot product of force vector and ______ vector.", a: "Velocity", b: "Displacement", c: "Acceleration", d: "Time", ans: "b"},
            {q: "The kinetic energy of a body of mass 'm' moving with velocity 'v' is given by ______.", a: "m * v\u00b2", b: "0.5 * m * v\u00b2", c: "m * g * h", d: "0.5 * m\u00b2 * v", ans: "b"},
            {q: "The potential energy of a body elevated to a height 'h' under gravity is given by ______.", a: "0.5 * m * v\u00b2", b: "m * g * h", c: "w * v", d: "m * a", ans: "b"},
            {q: "The law of conservation of momentum states that total momentum remains constant if net external force is ______.", a: "Maximum", b: "Zero", c: "Positive", d: "Infinite", ans: "b"},
            {q: "The ratio of relative velocity of separation to relative velocity of approach during an impact is called coefficient of ______.", a: "Friction", b: "Restitution", c: "Elasticity", d: "Rigidity", ans: "b"},
            {q: "For a perfectly elastic collision, the value of coefficient of restitution ($e$) is ______.", a: "Zero", b: "One", c: "0.5", d: "Infinity", ans: "b"},
            {q: "For a perfectly plastic or inelastic collision, the value of coefficient of restitution ($e$) is ______.", a: "One", b: "Zero", c: "0.75", d: "-1", ans: "b"},
            {q: "A machine whose efficiency is less than 50% is called a ______ machine.", a: "Reversible", b: "Non-reversible / Self-locking", c: "Ideal", d: "Overhauling", ans: "b"},
            {q: "The velocity ratio (VR) of a first system of pulleys with 'n' movable pulleys is ______.", a: "2n", b: "2\u207f", c: "n\u00b2", d: "n + 1", ans: "b"},
            {q: "Mechanical Advantage (MA) of a simple lifting machine is defined as the ratio of ______.", a: "Effort to Load", b: "Load to Effort (W/P)", c: "Distance of effort to distance of load", d: "Output to input", ans: "b"},
            {q: "Efficiency of a machine ($\eta$) is given by which ratio?", a: "VR / MA", b: "MA / VR", c: "Load / Effort", d: "Input / Output", ans: "b"},
            {q: "The law of a machine is represented by which linear equation?", a: "P = m/W + C", b: "P = mW + C", c: "W = mP + C", d: "P = mW - C", ans: "b"},
            {q: "The frictional force for an ideal lifting machine is equal to ______.", a: "Maximum", b: "Zero", c: "Constant", d: "Load value", ans: "b"},
            {q: "Newton's Law of Universal Gravitation states that force is inversely proportional to the ______.", a: "Product of masses", b: "Square of the distance between them", c: "Sum of masses", d: "Time interval", ans: "b"}
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
            
            if(room && sub === 'mechanics') {
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
                    document.getElementById('arenaTitle').innerText = "Mechanics Solo Mode";
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

                const inviteUrl = window.location.origin + window.location.pathname + "?room=" + currentRoomId + "&subject=mechanics";
                
                firestore.collection("rooms").doc(currentRoomId).set({
                    roomId: currentRoomId,
                    subject: "mechanics",
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
                    document.getElementById('arenaTitle').innerText = "Mechanics Live 1v1 Arena";
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
            
            mechanicsDataset.forEach((data, index) => {
                const card = document.createElement('div');
                card.style = "background:var(--surface); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid var(--border);";
                
                card.innerHTML = `
                    <div style="background:rgba(245, 158, 11, 0.1); padding:4px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--primary);">Question ${index+1} / 50</div>
                    <p style="font-weight:600; font-size:15px; margin-bottom:15px; line-height:1.5;">${data.q}</p>
                    <label class="option-label"><input type="radio" name="mechQ_${index}" value="a" onclick="transmitRealtimeScore()"> A) ${data.a}</label>
                    <label class="option-label"><input type="radio" name="mechQ_${index}" value="b" onclick="transmitRealtimeScore()"> B) ${data.b}</label>
                    <label class="option-label"><input type="radio" name="mechQ_${index}" value="c" onclick="transmitRealtimeScore()"> C) ${data.c}</label>
                    <label class="option-label"><input type="radio" name="mechQ_${index}" value="d" onclick="transmitRealtimeScore()"> D) ${data.d}</label>
                `;
                area.appendChild(card);
            });
        }

        function transmitRealtimeScore() {
            if(gameMode !== "multiplayer") return;
            
            let tempCorrect = 0;
            mechanicsDataset.forEach((item, index) => {
                const checked = document.querySelector(`input[name="mechQ_${index}"]:checked`);
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
            mechanicsDataset.forEach((item, index) => {
                const sel = document.querySelector(`input[name="mechQ_${index}"]:checked`);
                if (!sel) skip++;
                else if (sel.value === item.ans) corr++;
                else wrng++;
            });

            const finalPercent = Math.round((corr / mechanicsDataset.length) * 100);
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

        