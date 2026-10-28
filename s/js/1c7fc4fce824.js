
    (function() {
        // ---- CONFIG ----
        const IDLE_WARN_AFTER_MS  = 60 * 1000;   // 1 min → show warning
        const AUTO_SUBMIT_AFTER_S = 30;            // 30s countdown then submit
        const OPP_NOTIFY_BEFORE_S = 2;             // Notify opponent 2s before submit

        // ---- STATE ----
        let idleWarnTimer     = null;
        let idleCountdownInt  = null;
        let idleCountLeft     = AUTO_SUBMIT_AFTER_S;
        let idleActive        = false;
        let oppPopupTimeout   = null;

        // ---- FIRESTORE FIELD NAMES ----
        // host → "hostIdleAt", player2 → "player2IdleAt"
        function myIdleField()  { return (typeof myRole !== 'undefined' && myRole === 'host') ? 'hostIdleAt'    : 'player2IdleAt';    }
        function oppIdleField() { return (typeof myRole !== 'undefined' && myRole === 'host') ? 'player2IdleAt' : 'hostIdleAt'; }

        // ---- RESET: user touched screen ----
        window.resetIdleTimer = function() {
            // Hide warning overlay
            document.getElementById('idleWarningOverlay').style.display = 'none';
            idleActive = false;

            // Clear any running timers
            clearTimeout(idleWarnTimer);
            clearInterval(idleCountdownInt);
            idleCountLeft = AUTO_SUBMIT_AFTER_S;
            document.getElementById('idleCountdownNum').innerText = AUTO_SUBMIT_AFTER_S;

            // Tell Firestore: I'm active again (clear idleAt)
            writeIdleStatus(null);

            // Restart the 1-minute idle watch
            idleWarnTimer = setTimeout(onIdleDetected, IDLE_WARN_AFTER_MS);
        };

        // ---- CALLED when user goes 1 min without touch ----
        function onIdleDetected() {
            if (typeof gameMode === 'undefined' || gameMode !== 'multiplayer') {
                // Not in multiplayer → still restart for next cycle
                idleWarnTimer = setTimeout(onIdleDetected, IDLE_WARN_AFTER_MS);
                return;
            }

            idleActive = true;
            idleCountLeft = AUTO_SUBMIT_AFTER_S;

            // Show warning to THIS user
            const overlay = document.getElementById('idleWarningOverlay');
            overlay.style.display = 'flex';
            document.getElementById('idleCountdownNum').innerText = idleCountLeft;

            // Write timestamp to Firestore so opponent knows
            writeIdleStatus(Date.now());

            // Start 30-second countdown
            idleCountdownInt = setInterval(function() {
                idleCountLeft--;
                document.getElementById('idleCountdownNum').innerText = idleCountLeft;

                if (idleCountLeft <= 0) {
                    clearInterval(idleCountdownInt);
                    idleActive = false;
                    document.getElementById('idleWarningOverlay').style.display = 'none';
                    // Auto-submit!
                    if (typeof submitGameAnswers === 'function') {
                        submitGameAnswers();
                    }
                }
            }, 1000);
        }

        // ---- Write idleAt field to Firestore ----
        function writeIdleStatus(timestamp) {
            if (typeof currentRoomId === 'undefined' || !currentRoomId) return;
            if (typeof firestore === 'undefined') return;
            const update = {};
            update[myIdleField()] = timestamp;
            firestore.collection('rooms').doc(currentRoomId).update(update).catch(function(){});
        }

        // ---- Watch opponent's idle field in Firestore ----
        // Called once when multiplayer room becomes active
        window.startOpponentIdleWatch = function() {
            if (typeof firestore === 'undefined' || !currentRoomId) return;
            firestore.collection('rooms').doc(currentRoomId).onSnapshot(function(doc) {
                if (!doc.exists) return;
                const data = doc.data();
                const oppTs = data[oppIdleField()];

                if (oppTs && typeof oppTs === 'number') {
                    // Opponent went idle
                    const elapsed = Date.now() - oppTs;
                    const remaining = Math.max(0, AUTO_SUBMIT_AFTER_S * 1000 - elapsed);
                    const remainSec = Math.ceil(remaining / 1000);

                    // Show popup to us (the watching user)
                    const popup = document.getElementById('oppOfflinePopup');
                    document.getElementById('oppOfflineMsg').innerText =
                        'Opponent offline हो गया है! ' + remainSec + 's में auto-submit होगा।';
                    popup.style.display = 'block';

                    // Auto-hide popup after submit time
                    clearTimeout(oppPopupTimeout);
                    oppPopupTimeout = setTimeout(function() {
                        popup.style.display = 'none';
                    }, remaining + 3000);
                } else {
                    // Opponent came back online → hide popup
                    document.getElementById('oppOfflinePopup').style.display = 'none';
                    clearTimeout(oppPopupTimeout);
                }
            });
        };

        // ---- HOOK INTO listenToRoomChanges ----
        // Patch: when room becomes active, start our idle timer + opp watch
        const _origListen = window.listenToRoomChanges;
        if (typeof _origListen === 'function') {
            window.listenToRoomChanges = function() {
                _origListen.apply(this, arguments);
                // Also start watching opponent idle
                window.startOpponentIdleWatch();
            };
        }

        // ---- HOOK INTO startLiveCountdown ----
        // When quiz actually starts, begin idle detection
        const _origStart = window.startLiveCountdown;
        if (typeof _origStart === 'function') {
            window.startLiveCountdown = function() {
                _origStart.apply(this, arguments);
                // Reset & start idle timer
                clearTimeout(idleWarnTimer);
                idleWarnTimer = setTimeout(onIdleDetected, IDLE_WARN_AFTER_MS);
            };
        }

        // ---- TOUCH / CLICK events on document ----
        ['touchstart', 'touchmove', 'mousedown', 'mousemove', 'keydown', 'scroll'].forEach(function(evt) {
            document.addEventListener(evt, function() {
                // Only reset if quiz is active multiplayer
                if (typeof gameMode !== 'undefined' && gameMode === 'multiplayer' && idleWarnTimer !== null) {
                    resetIdleTimer();
                }
            }, { passive: true });
        });

    })();
    