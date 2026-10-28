
        function hideAuthGateLoader() {
            const loader = document.getElementById('authGateLoader');
            if (!loader || loader.classList.contains('agl-fade-out')) return;
            loader.classList.add('agl-fade-out');
            setTimeout(() => loader.remove(), 350);
        }
        // Safety net: never let a network hiccup trap the user on a blank spinner forever.
        setTimeout(hideAuthGateLoader, 8000);

        /* ===================================================== */
        /* ===== PROFILE PHOTO UPLOAD (routed via backend) ====== */
        /* ===================================================== */

        const BACKEND_BASE_URL = 'https://studybuddypro-psi.vercel.app/api/backend';
        const PHOTO_TARGET_SIZE = 500;
        const PHOTO_JPEG_QUALITY = 0.85;
        const PHOTO_MAX_ORIGINAL_MB = 8;

        function applyUserPhotoEverywhere(photoURL) {
            window._userPhotoURL = photoURL || null;
            const sheetAvatar = document.getElementById('profileSheetAvatar');
            const sidebarAvatar = document.getElementById('sidebarAvatarWrap');
            const helloAvatar = document.getElementById('helloAvatar');
            if (photoURL) {
                if (sheetAvatar) sheetAvatar.innerHTML = `<img src="${sbzUrl(photoURL)}" alt="Profile photo" loading="lazy" decoding="async">`;
                if (sidebarAvatar) sidebarAvatar.innerHTML = `<img src="${sbzUrl(photoURL)}" alt="Profile photo" loading="lazy" decoding="async">`;
                if (helloAvatar) helloAvatar.innerHTML = `<img src="${sbzUrl(photoURL)}" alt="Profile photo" loading="lazy" decoding="async">`;
            } else {
                if (sheetAvatar) sheetAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
                if (sidebarAvatar) sidebarAvatar.innerHTML = `<i class="fa-solid fa-circle-user" style="color:#5c6bc0;"></i>`;
                if (helloAvatar) helloAvatar.innerHTML = `<i class="fa-solid fa-graduation-cap"></i>`;
            }
        }

        function resizeImageFileToBase64(file, onDone) {
            if (!file.type.startsWith('image/')) {
                showPremiumNotification("Invalid File", "Please select a valid image file (JPG, PNG or WEBP).", true);
                return;
            }
            if (file.size > PHOTO_MAX_ORIGINAL_MB * 1024 * 1024) {
                showPremiumNotification("File Too Large", `Please choose an image under ${PHOTO_MAX_ORIGINAL_MB}MB. It will be auto-resized to ${PHOTO_TARGET_SIZE}×${PHOTO_TARGET_SIZE}px anyway.`, true);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const side = Math.min(img.width, img.height);
                    const sx = (img.width - side) / 2;
                    const sy = (img.height - side) / 2;
                    const canvas = document.createElement('canvas');
                    canvas.width = PHOTO_TARGET_SIZE;
                    canvas.height = PHOTO_TARGET_SIZE;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, sx, sy, side, side, 0, 0, PHOTO_TARGET_SIZE, PHOTO_TARGET_SIZE);
                    onDone(canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY));
                };
                img.onerror = () => showPremiumNotification("Image Error", "Couldn't read this image. Please try a different file.", true);
                img.src = e.target.result;
            };
            reader.onerror = () => showPremiumNotification("File Error", "Couldn't read the selected file.", true);
            reader.readAsDataURL(file);
        }

        function triggerProfileSheetPhotoUpload() {
            if (!window._userUid) {
                showPremiumNotification("Sign In Required", "Please sign in first to update your profile photo.", true);
                return;
            }
            document.getElementById('profileSheetPhotoInput').click();
        }

        function handleProfilePhotoSelect(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = "";
            if (!file) return;
            resizeImageFileToBase64(file, (finalBase64) => {
                const sheetAvatar = document.getElementById('profileSheetAvatar');
                if (sheetAvatar) sheetAvatar.innerHTML = `<img src="${finalBase64}" alt="Preview" loading="lazy" decoding="async">`;
                uploadProfilePhotoToBackend(finalBase64, { wrapSelector: '.profile-sheet-avatar-wrap' });
            });
        }

        function triggerMandatoryPhotoUpload() {
            document.getElementById('mandatoryPhotoInput').click();
        }

        let pendingMandatoryPhotoBase64 = null;

        function handleMandatoryPhotoSelect(event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = "";
            if (!file) return;
            resizeImageFileToBase64(file, (finalBase64) => {
                pendingMandatoryPhotoBase64 = finalBase64;
                const mAvatar = document.getElementById('mandatoryPhotoAvatar');
                if (mAvatar) mAvatar.innerHTML = `<img src="${finalBase64}" alt="Preview" loading="lazy" decoding="async">`;
                const pickBtn = document.getElementById('mandatoryPhotoPickBtn');
                const submitBtn = document.getElementById('mandatoryPhotoSubmitBtn');
                if (pickBtn) pickBtn.innerText = 'Change Photo';
                if (submitBtn) submitBtn.style.display = '';
            });
        }

        function submitMandatoryPhoto() {
            const statusEl = document.getElementById('mandatoryPhotoStatus');
            if (statusEl) { statusEl.style.color = ''; statusEl.innerText = ''; }

            if (!pendingMandatoryPhotoBase64) {
                if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.innerText = 'Pehle ek photo chuno, phir Submit karo.'; }
                return;
            }
            const submitBtn = document.getElementById('mandatoryPhotoSubmitBtn');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Uploading...'; }
            if (statusEl) { statusEl.style.color = ''; statusEl.innerText = 'Uploading photo, please wait...'; }

            uploadProfilePhotoToBackend(pendingMandatoryPhotoBase64, {
                wrapSelector: '.mandatory-photo-wrap',
                onSuccess: () => {
                    pendingMandatoryPhotoBase64 = null;
                    if (statusEl) { statusEl.style.color = '#10b981'; statusEl.innerText = 'Photo saved! Closing...'; }
                    hideMandatoryPhotoOverlay();
                },
                onError: (message) => {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Submit Photo'; }
                    if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.innerText = 'Failed: ' + message; }
                }
            });
        }

        function uploadProfilePhotoToBackend(imageBase64, options) {
            options = options || {};
            const wrap = options.wrapSelector ? document.querySelector(options.wrapSelector) : null;
            if (wrap) wrap.classList.add('profile-photo-uploading');
            showPremiumNotification("Uploading...", "Syncing your new profile photo to the server.", false);

            // Returns the underlying promise so callers (like the mandatory photo gate)
            // can show their OWN inline success/error text — toasts can be visually hidden
            // behind full-screen overlays, so don't rely on them alone for critical feedback.
            return fetch(`${BACKEND_BASE_URL}?action=upload-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: window._userUid, image: imageBase64 })
            })
            .then(async (r) => {
                let result = null;
                try { result = await r.json(); } catch (e) { /* non-JSON response */ }

                if (wrap) wrap.classList.remove('profile-photo-uploading');

                if (r.ok && result && result.success && result.photoURL) {
                    applyUserPhotoEverywhere(result.photoURL);
                    showPremiumNotification("Photo Updated", "Your profile photo has been updated successfully!", false);
                    // Keep Social Mode's Supabase profile in sync with this same photo
                    if (window.socialSyncToBackend) window.socialSyncToBackend({ photoURL: result.photoURL });
                    if (typeof options.onSuccess === 'function') options.onSuccess();
                    return { ok: true };
                }

                const serverMsg = (result && (result.message || result.error)) || `Server error (HTTP ${r.status}).`;
                showPremiumNotification("Upload Failed", "Server couldn't save your photo. Please try again.", true);
                if (typeof options.onError === 'function') options.onError(serverMsg);
                return { ok: false, message: serverMsg };
            })
            .catch((err) => {
                if (wrap) wrap.classList.remove('profile-photo-uploading');
                showPremiumNotification("Connection Error", "Couldn't reach the server to upload your photo.", true);
                const msg = "Connection error — couldn't reach the photo server. Check your internet and try again.";
                if (typeof options.onError === 'function') options.onError(msg);
                return { ok: false, message: msg };
            });
        }

        /* ===================================================== */
        /* ===== MANDATORY PHOTO GATE (first login, one-time) === */
        /* ===================================================== */

        function showMandatoryPhotoOverlay() {
            const overlay = document.getElementById('mandatoryPhotoOverlay');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideMandatoryPhotoOverlay() {
            const overlay = document.getElementById('mandatoryPhotoOverlay');
            if (overlay) overlay.classList.remove('active');
            if (!document.querySelector('.mandatory-photo-overlay.active')) document.body.style.overflow = '';
        }

        // Called every time user data loads. Runs BOTH mandatory gates in sequence:
        // 1) Photo gate first (existing behaviour) — blocks until a photoURL exists.
        // 2) Once photo is set, S ID gate — blocks until a unique S ID is created.
        // The RTDB listener re-fires after either write, so gates advance automatically.
        function runMandatoryGates(photoURL, sid) {
            if (!window._userUid) {
                hideMandatoryPhotoOverlay();
                hideMandatorySidOverlay();
                return;
            }
            if (!photoURL) {
                hideMandatorySidOverlay();
                showMandatoryPhotoOverlay();
            } else if (!sid) {
                hideMandatoryPhotoOverlay();
                showMandatorySidOverlay();
                prefillSidSuggestionIfEmpty();
            } else {
                hideMandatoryPhotoOverlay();
                hideMandatorySidOverlay();
            }
        }

        /* ===================================================== */
        /* ===== MANDATORY S ID GATE (one-time, after photo) ==== */
        /* ===================================================== */

        function showMandatorySidOverlay() {
            const overlay = document.getElementById('mandatorySidOverlay');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideMandatorySidOverlay() {
            const overlay = document.getElementById('mandatorySidOverlay');
            if (overlay) overlay.classList.remove('active');
            if (!document.querySelector('.mandatory-photo-overlay.active')) document.body.style.overflow = '';
        }

        function sanitizeSidValue(v) {
            return (v || '').toLowerCase().replace(/[^a-z0-9._]/g, '');
        }

        let sidCheckTimer = null;

        function handleSidInputChange() {
            const input = document.getElementById('sidInput');
            const cleaned = sanitizeSidValue(input.value);
            if (cleaned !== input.value) input.value = cleaned;

            const statusEl = document.getElementById('sidStatusMsg');
            const submitBtn = document.getElementById('sidSubmitBtn');
            submitBtn.disabled = true;
            clearTimeout(sidCheckTimer);

            const val = input.value.trim();
            if (val.length === 0) { statusEl.innerText = ''; statusEl.className = 'sid-status'; return; }
            if (val.length < 3) {
                statusEl.innerText = 'कम से कम 3 characters चाहिए।';
                statusEl.className = 'sid-status sid-status-error';
                return;
            }
            if (val.includes('..') || val.startsWith('.') || val.endsWith('.')) {
                statusEl.innerText = '"." शुरू/अंत में या लगातार दो बार नहीं आ सकता।';
                statusEl.className = 'sid-status sid-status-error';
                return;
            }

            statusEl.innerText = 'Checking availability...';
            statusEl.className = 'sid-status';
            sidCheckTimer = setTimeout(() => checkSidAvailability(val), 500);
        }

        function checkSidAvailability(sid) {
            const statusEl = document.getElementById('sidStatusMsg');
            const submitBtn = document.getElementById('sidSubmitBtn');
            fetch(`${BACKEND_BASE_URL}?action=check-sid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid })
            })
            .then(r => r.json())
            .then((result) => {
                if (document.getElementById('sidInput').value.trim() !== sid) return;
                if (result && result.valid && result.available) {
                    statusEl.innerText = '✅ यह S ID उपलब्ध है!';
                    statusEl.className = 'sid-status sid-status-ok';
                    submitBtn.disabled = false;
                } else if (result && result.valid && !result.available) {
                    statusEl.innerText = '❌ यह S ID पहले से लिया जा चुका है।';
                    statusEl.className = 'sid-status sid-status-error';
                    submitBtn.disabled = true;
                } else {
                    statusEl.innerText = '❌ Invalid S ID format।';
                    statusEl.className = 'sid-status sid-status-error';
                    submitBtn.disabled = true;
                }
            })
            .catch(() => {
                statusEl.innerText = 'Connection error, दोबारा कोशिश करें।';
                statusEl.className = 'sid-status sid-status-error';
            });
        }

        function suggestSid() {
            const base = sanitizeSidValue((window._userName || 'user').replace(/\s+/g, '.'));
            const candidate = ((base || 'user').slice(0, 14) + '.' + Math.floor(1000 + Math.random() * 9000)).slice(0, 20);
            const input = document.getElementById('sidInput');
            input.value = candidate;
            handleSidInputChange();
        }

        function prefillSidSuggestionIfEmpty() {
            const input = document.getElementById('sidInput');
            if (input && input.value.trim() === '') suggestSid();
        }

        function submitSid() {
            const input = document.getElementById('sidInput');
            const sid = input.value.trim();
            const submitBtn = document.getElementById('sidSubmitBtn');
            submitBtn.disabled = true; submitBtn.innerText = 'Setting...';

            fetch(`${BACKEND_BASE_URL}?action=create-sid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: window._userUid, sid })
            })
            .then(r => r.json())
            .then((result) => {
                if (result && result.success) {
                    window._userSid = result.sid;
                    const sidDisplay = document.getElementById('profileSheetSid');
                    if (sidDisplay) sidDisplay.textContent = '@' + result.sid;
                    hideMandatorySidOverlay();
                    showPremiumNotification('S ID Set', 'आपका S ID @' + result.sid + ' सफलतापूर्वक बन गया!', false);
                    submitBtn.innerText = 'S ID Set करें';
                    // Keep Social Mode's Supabase/Supabase profile's public username in sync
                    if (window.socialSyncToBackend) window.socialSyncToBackend({ username: result.sid });
                } else {
                    const statusEl = document.getElementById('sidStatusMsg');
                    statusEl.innerText = (result && result.error) || 'S ID set नहीं हो पाया।';
                    statusEl.className = 'sid-status sid-status-error';
                    submitBtn.disabled = false; submitBtn.innerText = 'S ID Set करें';
                }
            })
            .catch(() => {
                const statusEl = document.getElementById('sidStatusMsg');
                statusEl.innerText = 'Connection error, दोबारा कोशिश करें।';
                statusEl.className = 'sid-status sid-status-error';
                submitBtn.disabled = false; submitBtn.innerText = 'S ID Set करें';
            });
        }
    