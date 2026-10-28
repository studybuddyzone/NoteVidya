
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

        // 50 Computer & Programming (C/Python) Dataset
        const programmingDataset = [
            {q: "Who is known as the father of C language?", a: "James Gosling", b: "Dennis Ritchie", c: "Guido van Rossum", d: "Bjarne Stroustrup", ans: "b"},
            {q: "Which of the following is an invalid variable name in C?", a: "int roll_no;", b: "int 2_roll_no;", c: "int _roll_no;", d: "int rollNo;", ans: "b"},
            {q: "What is the correct format specifier for a double value in C language?", a: "%d", b: "%lf", c: "%f", d: "%c", ans: "b"},
            {q: "Which of the following data type has the highest range in C?", a: "float", b: "double", c: "int", d: "long int", ans: "b"},
            {q: "What is the size of an 'int' data type in a standard 32-bit C compiler?", a: "1 Byte", b: "4 Bytes", c: "2 Bytes", d: "8 Bytes", ans: "b"},
            {q: "Which of the following operator in C has the highest precedence?", a: "+", b: "()", c: "*", d: "&&", ans: "b"},
            {q: "What is the output of the C expression: 5 + 3 * 2?", a: "16", b: "11", c: "13", d: "10", ans: "b"},
            {q: "In C, strings are technically defined as an array of characters ending with which character?", a: "\\n", b: "\\0", c: "\\t", d: ";", ans: "b"},
            {q: "Which loop in C language guarantees that the code block executes at least once?", a: "for loop", b: "do-while loop", c: "while loop", d: "nested-if", ans: "b"},
            {q: "Which keyword is used to stop the execution of a loop or switch case instantly?", a: "continue", b: "break", c: "return", d: "exit", ans: "b"},
            {q: "What will happen if you don't add a 'break' statement at the end of a switch case block?", a: "Compiler Error", b: "Fall-through to next case", c: "Infinite loop", d: "Program crashes", ans: "b"},
            {q: "A pointer in C is a special variable that stores the ______ of another variable.", a: "Value", b: "Memory Address", c: "Data Type", d: "Binary representation", ans: "b"},
            {q: "Which operator is used as the 'Address-of' operator in C programming?", a: "*", b: "&", c: "&&", d: "->", ans: "b"},
            {q: "Which function is used to dynamically allocate a single block of memory in C?", a: "free()", b: "malloc()", c: "calloc()", d: "realloc()", ans: "b"},
            {q: "The process of a function calling itself repeatedly is called ______.", a: "Iteration", b: "Recursion", c: "Looping", d: "Overloading", ans: "b"},
            {q: "Which file extension is used to save a standard C source code file?", a: ".cpp", b: ".c", c: ".obj", d: ".exe", ans: "b"},
            {q: "Who developed the Python programming language?", a: "Dennis Ritchie", b: "Guido van Rossum", c: "Linus Torvalds", d: "Tim Berners-Lee", ans: "b"},
            {q: "Which of the following is NOT a core built-in data type in Python?", a: "List", b: "Array", c: "Dictionary", d: "Tuple", ans: "b"},
            {q: "How do you define a block of code (like loops or functions) in Python?", a: "Using Curly Braces {}", b: "Using Indentation", c: "Using Parentheses ()", d: "Using brackets []", ans: "b"},
            {q: "Which keyword is used to create or define a function in Python?", a: "function", b: "def", c: "func", d: "define", ans: "b"},
            {q: "What is the output of print(type([]) ) in Python?", a: "<class 'dict'>", b: "<class 'list'>", c: "<class 'tuple'>", d: "<class 'set'>", ans: "b"},
            {q: "Which data structure in Python is immutable (cannot be modified after creation)?", a: "List", b: "Tuple", c: "Dictionary", d: "Set", ans: "b"},
            {q: "What is the output of print(2 ** 3) in Python?", a: "6", b: "8", c: "9", d: "5", ans: "b"},
            {q: "Which of the following is used to read user input as a string in Python 3?", a: "scanf()", b: "input()", c: "raw_input()", d: "get()", ans: "b"},
            {q: "What does the expression 7 // 2 evaluate to in Python?", a: "3.5", b: "3", c: "4", d: "1", ans: "b"},
            {q: "Which method is used to add an element to the end of a list in Python?", a: "add()", b: "append()", c: "insert()", d: "push()", ans: "b"},
            {q: "What is the index of the first element in both C and Python arrays/lists?", a: "1", b: "0", c: "-1", d: "Depends on user", ans: "b"},
            {q: "Which of the following allows storing key-value pairs in Python?", a: "List", b: "Dictionary", c: "Tuple", d: "String", ans: "b"},
            {q: "Which symbol is used for writing single-line comments in Python?", a: "//", b: "#", c: "/*", d: "--", ans: "b"},
            {q: "What will print(len('Hello')) output in Python?", a: "4", b: "5", c: "6", d: "0", ans: "b"},
            {q: "Which component of a computer system is known as its brain?", a: "RAM", b: "CPU", c: "Hard Disk", d: "Motherboard", ans: "b"},
            {q: "What type of memory is RAM?", a: "Non-volatile / Permanent", b: "Volatile / Temporary", c: "Secondary Storage", d: "Optical Cache", ans: "b"},
            {q: "1 Megabyte (MB) is equal to how many Kilobytes (KB)?", a: "1000 KB", b: "1024 KB", c: "512 KB", d: "2048 KB", ans: "b"},
            {q: "Which of the following is an open-source operating system?", a: "Windows 11", b: "Linux", c: "macOS", d: "iOS", ans: "b"},
            {q: "What is a compiler?", a: "A hardware device", b: "Software that translates high-level code to machine code", c: "A text editor tool", d: "A networking device", ans: "b"},
            {q: "Which numbering system uses base-16 symbols?", a: "Binary", b: "Hexadecimal", c: "Octal", d: "Decimal", ans: "b"},
            {q: "The structural design representation of an algorithm using graphical shapes is called a ______.", a: "Pseudo-code", b: "Flowchart", c: "Structure chart", d: "Logic Matrix", ans: "b"},
            {q: "In a flowchart, an oval or rounded rectangle symbol represents ______.", a: "Process", b: "Start/End", c: "Decision Box", d: "Input/Output", ans: "b"},
            {q: "In a standard flowchart, a diamond shape indicates a ______.", a: "Process execution", b: "Decision/Condition checking", c: "Connector", d: "Data input", ans: "b"},
            {q: "An explicit step-by-step logical procedure used to solve a specific problem is called an ______.", a: "Application", b: "Algorithm", c: "Compiler trace", d: "Data flow", ans: "b"},
            {q: "Which error is caught by the compiler during compilation?", a: "Runtime Error", b: "Syntax Error", c: "Logical Error", d: "Infinite loops", ans: "b"},
            {q: "Dividing a number by zero will trigger which type of error during program execution?", a: "Syntax Error", b: "Runtime Error", c: "Logical Error", d: "Linker Error", ans: "b"},
            {q: "What is the decimal equivalent of the binary number 1010?", a: "8", b: "10", c: "12", d: "6", ans: "b"},
            {q: "Which memory layer operates fastest in a computer architecture?", a: "RAM", b: "Registers / Cache", c: "SSD", d: "Magnetic Disk", ans: "b"},
            {q: "What is the purpose of the 'return 0;' statement in the main function of a C program?", a: "Clears memory", b: "Indicates successful program termination", c: "Restarts the loop", d: "Passes values to hardware", ans: "b"},
            {q: "Which Python function removes all whitespace characters from both ends of a string?", a: "clear()", b: "strip()", c: "split()", d: "slice()", ans: "b"},
            {q: "Which keyword in C is used to define a custom user-defined data type block?", a: "class", b: "struct", c: "union", d: "typedef", ans: "b"},
            {q: "What is the maximum value that can be represented by a single 8-bit byte?", a: "128", b: "255", c: "256", d: "1024", ans: "b"},
            {q: "Which protocol is primarily used to securely transfer web pages over the internet?", a: "FTP", b: "HTTPS", c: "SMTP", d: "SSH", ans: "b"},
            {q: "What is the primary function of an Operating System (OS)?", a: "To write code scripts", b: "To manage hardware resources and user applications", c: "To scan viruses", d: "To compute mathematical equations directly", ans: "b"}
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
            
            if(room && sub === 'programming') {
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
                    document.getElementById('arenaTitle').innerText = "Programming Solo Mode";
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

                const inviteUrl = window.location.origin + window.location.pathname + "?room=" + currentRoomId + "&subject=programming";
                
                firestore.collection("rooms").doc(currentRoomId).set({
                    roomId: currentRoomId,
                    subject: "programming",
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
                    document.getElementById('arenaTitle').innerText = "Programming Live 1v1 Arena";
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
                    
                    // मैच ख़त्म होने के बाद 30 सेकंड का रिवर्स टाइमर शुरू करें
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
                label.style.color = "#10b981";
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
                    
                    // 30 सेकंड ख़त्म होते ही माइक और चैनल बंद कर दें
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
            
            programmingDataset.forEach((data, index) => {
                const card = document.createElement('div');
                card.style = "background:var(--surface); border-radius:16px; padding:20px; margin-bottom:20px; border:1px solid var(--border);";
                
                card.innerHTML = `
                    <div style="background:rgba(16, 185, 129, 0.1); padding:4px 12px; border-radius:8px; display:inline-block; margin-bottom:12px; font-size:11px; font-weight:700; color:var(--primary);">Question ${index+1} / 50</div>
                    <p style="font-weight:600; font-size:15px; margin-bottom:15px; line-height:1.5; white-space: pre-wrap;">${escapeHtml(data.q)}</p>
                    <label class="option-label"><input type="radio" name="progQ_${index}" value="a" onclick="transmitRealtimeScore()"> A) ${escapeHtml(data.a)}</label>
                    <label class="option-label"><input type="radio" name="progQ_${index}" value="b" onclick="transmitRealtimeScore()"> B) ${escapeHtml(data.b)}</label>
                    <label class="option-label"><input type="radio" name="progQ_${index}" value="c" onclick="transmitRealtimeScore()"> C) ${escapeHtml(data.c)}</label>
                    <label class="option-label"><input type="radio" name="progQ_${index}" value="d" onclick="transmitRealtimeScore()"> D) ${escapeHtml(data.d)}</label>
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
            programmingDataset.forEach((item, index) => {
                const checked = document.querySelector(`input[name="progQ_${index}"]:checked`);
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
            programmingDataset.forEach((item, index) => {
                const sel = document.querySelector(`input[name="progQ_${index}"]:checked`);
                if (!sel) skip++;
                else if (sel.value === item.ans) corr++;
                else wrng++;
            });

            const finalPercent = Math.round((corr / programmingDataset.length) * 100);
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
            
            // अगर 30 सेकंड वाला वॉयस काउंटडाउन एक्टिव है तो उसे बंद करें
            if (voiceCloseInterval) {
                clearInterval(voiceCloseInterval);
                voiceCloseInterval = null;
            }
            
            closeAgoraVoiceChat(); // माइक और चैनल क्लोज करें
            
            if(roomUnsubscribeFunc) { roomUnsubscribeFunc(); roomUnsubscribeFunc = null; }
            document.getElementById('gameOverlay').style.display = 'none';
            document.getElementById('resultModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    