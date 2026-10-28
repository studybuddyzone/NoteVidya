
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

        // 50 Communication Skills Dataset
        const commsDataset = [
            {q: "Communication is a ______ process of exchanging information, ideas, and feelings.", a: "One-way", b: "Two-way", c: "Three-way", d: "Static", ans: "b"},
            {q: "The person who converts a thought into a message and initiates communication is called the ______.", a: "Receiver", b: "Sender", c: "Decoder", d: "Channel", ans: "b"},
            {q: "Transforming internal ideas and thoughts into a symbolic language or code is known as ______.", a: "Decoding", b: "Encoding", c: "Feedback", d: "Filtering", ans: "b"},
            {q: "The response or reaction given by the receiver back to the sender is termed as ______.", a: "Noise", b: "Feedback", c: "Context", d: "Channel", ans: "b"},
            {q: "Any disturbance or barrier that degrades or interferes with the transmission of a message is called ______.", a: "Medium", b: "Noise", c: "Decoder", d: "Protocol", ans: "b"},
            {q: "Which type of communication involves using spoken or written words to share information?", a: "Non-verbal", b: "Verbal", c: "Visual", d: "Paralinguistic", ans: "b"},
            {q: "Body movements, facial expressions, eye contact, and gestures fall under ______ communication.", a: "Verbal", b: "Non-verbal", c: "Written", d: "Formal", ans: "b"},
            {q: "The study of body language, postures, gestures, and facial expressions is technically called ______.", a: "Proxemics", b: "Kinesics", c: "Chronemics", d: "Haptics", ans: "b"},
            {q: "The study of how space and distance between people affect communication is known as ______.", a: "Kinesics", b: "Proxemics", c: "Haptics", d: "Chronemics", ans: "b"},
            {q: "Communication through touch (e.g., handshakes, pats on the back) is studied under ______.", a: "Proxemics", b: "Haptics", c: "Chronemics", d: "Vocalics", ans: "b"},
            {q: "The study of how time is used and perceived in non-verbal communication is called ______.", a: "Kinesics", b: "Chronemics", c: "Haptics", d: "Proxemics", ans: "b"},
            {q: "Tone of voice, pitch, speed of speaking, and volume are elements of ______.", a: "Verbal Text", b: "Paralanguage / Vocalics", c: "Kinesics", d: "Chronemics", ans: "b"},
            {q: "Which of the following is considered an official, documented channel of communication in companies?", a: "Grapevine", b: "Formal Communication", c: "Informal chat", d: "Rumor mill", ans: "b"},
            {q: "Informal, unstructured communication inside an organization is popularly known as ______.", a: "Vertical channel", b: "Grapevine", c: "Horizontal matrix", d: "Statutory flow", ans: "b"},
            {q: "When a manager issues an instruction or policy guidelines to subordinates, it is ______ communication.", a: "Downward", b: "Upward", c: "Horizontal", d: "External", ans: "b"},
            {q: "When an employee submits a progress report or grievance to higher management, it is ______ communication.", a: "Downward", b: "Upward", c: "Horizontal", d: "Lateral", ans: "b"},
            {q: "Communication taking place between peers or employees working at the same hierarchy level is ______.", a: "Downward", b: "Horizontal / Lateral", c: "Upward", d: "Diagonal", ans: "b"},
            {q: "Communication that crosses both functional sections and organizational hierarchies is called ______.", a: "Vertical", b: "Diagonal / Cross-functional", c: "Horizontal", d: "Linear", ans: "b"},
            {q: "Physical barriers to communication include which of the following?", a: "Emotional stress", b: "Distance and loud background noise", c: "Language differences", d: "Cultural bias", ans: "b"},
            {q: "An individual's personal biases, stereotypes, or emotional state create ______ barriers.", a: "Physical", b: "Psychological / Emotional", c: "Technical", d: "Environmental", ans: "b"},
            {q: "Barriers caused due to differences in vocabulary, grammar, languages, or jargon are called ______.", a: "Psychological", b: "Semantic / Linguistic", c: "Socio-cultural", d: "Organizational", ans: "b"},
            {q: "Using overly complex words or industry-specific technical jargon can act as a ______ barrier.", a: "Physical", b: "Semantic", c: "Mechanical", d: "Chronemic", ans: "b"},
            {q: "Which of the following is an effective way to minimize or overcome communication barriers?", a: "Using ambiguous text", b: "Active listening and seeking clarification", c: "Ignoring feedback", d: "Speaking rapidly", ans: "b"},
            {q: "Hearing is a passive physical process, whereas Listening is an ______ mental process.", a: "Involuntary", b: "Active and cognitive", c: "Accidental", d: "Subconscious", ans: "b"},
            {q: "An active listener does which of the following?", a: "Interrupts frequently", b: "Maintains eye contact and nods appropriately", c: "Formulates counter-arguments while listening", d: "Looks around the room constantly", ans: "b"},
            {q: "Listening to a speech or pitch specifically to evaluate, judge, and analyze the logic is ______ listening.", a: "Appreciative", b: "Critical / Evaluative", c: "Empathetic", d: "Passive", ans: "b"},
            {q: "Listening with the intent to deeply understand and share the speaker's emotions and feelings is ______.", a: "Informational", b: "Empathetic", c: "Critical", d: "Superficial", ans: "b"},
            {q: "The acronym used to describe the 7 fundamental principles of effective communication is the ______.", a: "5Ws", b: "7 Cs of Communication", c: "SMART rules", d: "PDCA cycle", ans: "b"},
            {q: "In the 7 Cs, 'Concision' or being 'Concise' means ______.", a: "Providing lengthy details", b: "Expressing ideas in the fewest words possible without losing impact", c: "Using abstract symbols", d: "Repeating data for clarity", ans: "b"},
            {q: "Which 'C' states that all facts, figures, and grammar in the message must be accurate?", a: "Clarity", b: "Correctness", c: "Completeness", d: "Consideration", ans: "b"},
            {q: "The principle of 'Consideration' emphasizes adopting a ______ approach towards the audience.", a: "Self-centered", b: "You-attitude", c: "Neutral-attitude", d: "Critical-attitude", ans: "b"},
            {q: "A professional business email should always contain a clear, relevant ______ line.", a: "Signature", b: "Subject", c: "Salutation", d: "Disclaimer", ans: "b"},
            {q: "What does the abbreviation 'Bcc' stand for in corporate email clients?", a: "Business Carbon Copy", b: "Blind Carbon Copy", c: "Brief Core Communication", d: "Backup Carbon Copy", ans: "b"},
            {q: "Writing an entire email or chat message in ALL CAPITAL LETTERS is considered ______ in digital etiquette.", a: "Highly professional", b: "Rude or equivalent to shouting", c: "Urgent", d: "Creative", ans: "b"},
            {q: "A short text appended at the end of an email containing contact info and designation is called a ______.", a: "Header", b: "Signature Block", c: "Salutation", d: "Eclosures", ans: "b"},
            {q: "Which of the following is considered an appropriate formal salutation for a business letter?", a: "Hey dude,", b: "Dear Sir/Madam,", c: "Yo,", d: "What's up,", ans: "b"},
            {q: "During a professional presentation, the slide content should ideally consist of ______.", a: "Full paragraphs copied directly", b: "Key bullet points and visual aids", c: "No text at all", d: "Random decorative images", ans: "b"},
            {q: "What is the primary purpose of a Group Discussion (GD) in professional recruitment?", a: "To prove oneself as the loudest speaker", b: "To evaluate interpersonal, leadership, and team skills", c: "To argue and defeat others", d: "To test individual spelling memory", ans: "b"},
            {q: "If you disagree with another participant in a Group Discussion, you should say ______.", a: "You are completely wrong.", b: "I see your point, but I respectfully look at it differently because...", c: "Shut up and listen to me.", d: "Your data makes no sense.", ans: "b"},
            {q: "Before a job interview, conducting thorough research about the company is an example of ______.", a: "Wasting time", b: "Proactive interview preparation", c: "Over-confidence", d: "Informal networking", ans: "b"},
            {q: "During an interview, your posture should ideally be ______.", a: "Slouched back comfortably", b: "Straight up but relaxed, leaning slightly forward", c: "Stiff with crossed arms", d: "Constantly moving", ans: "b"},
            {q: "Which type of report is prepared at fixed, regular intervals (e.g., weekly, monthly)?", a: "Special Report", b: "Periodic / Routine Report", c: "Informal Memo", d: "Ad-hoc Report", ans: "b"},
            {q: "The list of topics or items to be discussed systematically in an upcoming meeting is called the ______.", a: "Minutes", b: "Agenda", c: "Circular", d: "Notice", ans: "b"},
            {q: "The official written record of discussions, decisions, and resolutions passed in a meeting is called ______.", a: "Memorandum", b: "Minutes of the Meeting", c: "Agenda sheet", d: "Prospectus", ans: "b"},
            {q: "A brief, informal internal written message shared within the same office building is a ______.", a: "Business Letter", b: "Memorandum (Memo)", c: "Press Release", d: "Tender Notice", ans: "b"},
            {q: "Proxemics states that the 'Intimate Zone' typically ranges from ______.", a: "4 feet to 12 feet", b: "0 to 18 inches", c: "12 feet to 25 feet", d: "4 inches to 4 feet", ans: "b"},
            {q: "Interpersonal communication involves communication between ______.", a: "An individual and a mass audience", b: "Two or more individuals face-to-face", c: "An individual with themselves", d: "Computers via routers", ans: "b"},
            {q: "Intrapersonal communication refers to communication with ______.", a: "External clients", b: "Oneself (internal thinking/journaling)", c: "Board of Directors", d: "Media reporters", ans: "b"},
            {q: "Which of the following describes high-quality feedback?", a: "Vague and delayed", b: "Specific, constructive, and timely", c: "Negative and destructive", d: "One-word evaluations", ans: "b"},
            {q: "The final step in the communication loop or process that completes the circuit is ______.", a: "Transmission", b: "Feedback verification", c: "Decoding symbols", d: "Media selection", ans: "b"}
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
            
            if(room && sub === 'communication') {
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
                    document.getElementById('arenaTitle').innerText = "Communication Solo Mode";
                    document.getElementById('lobbyPanel').style.display = "none";
                    document.getElementById('scoreboard').style.display = "none";
                    document.getElementById('micControlBox').style.display = "none"; // Hide Mic in Solo
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
                document.getElementById('micControlBox').style.display = "none"; // Hide mic during waiting
                document.getElementById('gameOverlay').style.display = "block";
                document.body.style.overflow = "hidden";

                const inviteUrl = window.location.origin + window.location.pathname + "?room=" + currentRoomId + "&subject=communication";
                
                firestore.collection("rooms").doc(currentRoomId).set({
                    roomId: currentRoomId,
                    subject: "communication",
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
                    document.getElementById('arenaTitle').innerText = "Communication Live 1v1 Arena";
                    document.getElementById('lobbyPanel').style.display = "none";
                    document.getElementById('gameOverlay').style.display = "block";
                    document.body.style.overflow = "hidden";
                    
                    return firestore.collection("rooms").doc(roomId).update({ 
                        status: "active",
                        player2Prn: myPrnNumber
                    });
                } else {
                    triggerCustomAlert("EXPIRED ROOM", "यह ROOM अमान्य है या मैच पहले ही समाप्त हो चुका है!", "danger");
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
                    
                    // बदलाव: मैच ख़त्म होने के बाद 30 सेकंड का टाइमर शुरू करें
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

                // Join the Agora Audio Channel (using currentRoomId as channel name)
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
            if (voiceCloseInterval) return; // Prevent double trigger

            let secondsLeftForVoice = 30;
            const label = document.getElementById('micStatusLabel');
            
            if (label) {
                label.innerText = `Voice closing in ${secondsLeftForVoice}s`;
                label.style.color = "var(--warning)";
            }

            voiceCloseInterval = setInterval(() => {
                secondsLeftForVoice--;
                
                if (label) {
                    label.innerText = `Voice closing in ${secondsLeftForVoice}s`;
                }

                if (secondsLeftForVoice <= 0) {
                    clearInterval(voiceCloseInterval);
                    voiceCloseInterval = null;
                    
                    // 30 सेकंड ख़त्म होते ही माइक बंद कर दें
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
            
            commsDataset.forEach((data, index) => {
                const card = document.createElement('div');
                card.style = "background:var(--surface); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid var(--border);";
                
                card.innerHTML = `
                    <div style="background:rgba(6, 182, 212, 0.1); padding:4px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--primary);">Question ${index+1} / 50</div>
                    <p style="font-weight:600; font-size:15px; margin-bottom:15px; line-height:1.5;">${data.q}</p>
                    <label class="option-label"><input type="radio" name="commQ_${index}" value="a" onclick="transmitRealtimeScore()"> A) ${data.a}</label>
                    <label class="option-label"><input type="radio" name="commQ_${index}" value="b" onclick="transmitRealtimeScore()"> B) ${data.b}</label>
                    <label class="option-label"><input type="radio" name="commQ_${index}" value="c" onclick="transmitRealtimeScore()"> C) ${data.c}</label>
                    <label class="option-label"><input type="radio" name="commQ_${index}" value="d" onclick="transmitRealtimeScore()"> D) ${data.d}</label>
                `;
                area.appendChild(card);
            });
        }

        function transmitRealtimeScore() {
            if(gameMode !== "multiplayer") return;
            
            let tempCorrect = 0;
            commsDataset.forEach((item, index) => {
                const checked = document.querySelector(`input[name="commQ_${index}"]:checked`);
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
            commsDataset.forEach((item, index) => {
                const sel = document.querySelector(`input[name="commQ_${index}"]:checked`);
                if (!sel) skip++;
                else if (sel.value === item.ans) corr++;
                else wrng++;
            });

            const finalPercent = Math.round((corr / commsDataset.length) * 100);
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
            
            // अगर 30 सेकंड वाला वॉयस काउंटडाउन एक्टिव है तो उसे रोकें
            if (voiceCloseInterval) {
                clearInterval(voiceCloseInterval);
                voiceCloseInterval = null;
            }
            
            closeAgoraVoiceChat(); // माइक बंद करें
            
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

        