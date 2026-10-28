
        document.documentElement.setAttribute('data-theme', 'light');
        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
            document.getElementById('themeIcon').className = cur === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }
        function showToast(msg) {
            const t = document.getElementById('toast');
            document.getElementById('toastMsg').textContent = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2800);
        }

        // ── ROLE PRICING (subscription only — branch is free & selected separately on Second Year page) ──
        const ROLE_PRICES = { silver: 49, gold: 89, diamond: 162, lifetime: 3038 };

        // ── AUTO-SELECT PLAN FROM URL PARAM (?plan=gold, passed from a branch page's "Get Gold/Diamond" button) ──
        (function autoSelectPlan() {
            const params = new URLSearchParams(window.location.search);
            const plan = (params.get('plan') || '').toLowerCase();
            if (plan && ROLE_PRICES[plan]) {
                const radio = document.querySelector('input[name="planRadio"][value="' + plan + '"]');
                if (radio) radio.checked = true;
            }
        })();

        // ── PER-MONTH PRICE + PROGRESS STEPS ──
        (function fillPerMonth() {
            const MONTHS = 6;
            let min = Infinity;
            Object.keys(ROLE_PRICES).filter(r => r !== 'lifetime').forEach(role => {
                const pm = Math.round(ROLE_PRICES[role] / MONTHS);
                min = Math.min(min, pm);
                const el = document.querySelector('[data-pm="' + role + '"]');
                if (el) el.textContent = '≈ ₹' + pm + '/month';
            });
            const t = document.getElementById('teaserPM'); if (t) t.textContent = '₹' + min;
            const h = document.getElementById('heroPM');   if (h) h.textContent = '₹' + min;
        })();

        function setStep(n) {
            [1, 2, 3].forEach(i => {
                const el = document.getElementById('stp' + i);
                el.classList.toggle('done', i < n);
                el.classList.toggle('active', i === n);
                el.querySelector('.step-dot').innerHTML = (i < n) ? '<i class="fa-solid fa-check"></i>' : String(i);
            });
            document.getElementById('stpLine1').classList.toggle('done', n > 1);
            document.getElementById('stpLine2').classList.toggle('done', n > 2);
        }

        // ── STUDENT PRN VERIFICATION ──
        let verifiedPRN = null;
        let verifiedStudentName = null;
        let verifiedUid = null;
        let existingRole = '';

        function resetPrnStatus() {
            verifiedPRN = null;
            verifiedStudentName = null;
            verifiedUid = null;
            existingRole = '';
            document.getElementById('prnStatus').textContent = '';
            document.getElementById('prnStatus').className = 'prn-status';
            document.getElementById('prnVerifiedCard').classList.remove('show');
            document.getElementById('planSection').classList.remove('show');
            document.getElementById('currentRoleNote').style.display = 'none';
            setStep(1);
        }

        async function verifyStudentPRN() {
            const prn = document.getElementById('studentPrnInput').value.trim();
            if (!prn) { showToast('PRN दर्ज करें।'); return; }
            if (prn.length !== 16) { showToast('⚠️ PRN exactly 16 digits का होना चाहिए।'); return; }
            const btn = document.getElementById('studentVerifyBtn');
            const btnLabel = '<i class="fa-solid fa-shield-halved"></i> Verify';
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            const statusEl = document.getElementById('prnStatus');
            statusEl.textContent = '';
            statusEl.className = 'prn-status';
            document.getElementById('prnVerifiedCard').classList.remove('show');

            try {
                // Payment is tied to the logged-in account (Supabase session), not to a typed PRN.
                const profile = await SBZAuth.getMyProfile();
                btn.disabled = false; btn.innerHTML = btnLabel;

                if (!profile) {
                    statusEl.textContent = '🔒 पहले login करें, फिर यहाँ वापस आकर payment करें।';
                    statusEl.className = 'prn-status error';
                    setTimeout(() => { window.location.href = '/?next=' + encodeURIComponent('premium-get' + window.location.search); }, 1500);
                    return;
                }
                if (profile.prn !== prn) {
                    statusEl.textContent = '❌ यह PRN आपके login किए हुए account से match नहीं करता।';
                    statusEl.className = 'prn-status error';
                    return;
                }

                verifiedPRN = prn;
                verifiedStudentName = profile.full_name || 'Student';
                verifiedUid = profile.id;
                const tierActive = profile.tier && (!profile.tier_expires_at || new Date(profile.tier_expires_at) > new Date());
                existingRole = (profile.role && profile.role !== 'student') ? profile.role : (tierActive ? profile.tier : 'student');

                statusEl.textContent = '✅ PRN Verified!';
                statusEl.className = 'prn-status success';

                document.getElementById('prnStudentName').textContent = verifiedStudentName;
                document.getElementById('prnStudentSub').textContent = 'PRN: ' + prn + ' • Verified ✅';
                document.getElementById('prnVerifiedCard').classList.add('show');

                if (existingRole && existingRole !== 'student') {
                    document.getElementById('currentRoleNote').style.display = 'block';
                    document.getElementById('currentRoleNote').innerHTML = 'आपकी Current Subscription: <strong>' + existingRole.toUpperCase() + '</strong>';
                } else {
                    document.getElementById('currentRoleNote').style.display = 'none';
                }

                document.getElementById('planSection').classList.add('show');
                updateTotals();
                setStep(2);
            } catch (err) {
                btn.disabled = false; btn.innerHTML = btnLabel;
                showToast('कुछ गड़बड़ हुई, दोबारा try करें।');
            }
        }

        // ── NEW USER REGISTRATION (same flow as / signup, year = 2) ──

        function toggleRegForm() {
            document.getElementById('regForm').classList.toggle('show');
        }
        function toggleRegPass() {
            const inp = document.getElementById('regPassword');
            const ic  = document.getElementById('regEyeIcon');
            const show = inp.type === 'password';
            inp.type = show ? 'text' : 'password';
            ic.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        }
        function regError(msg) {
            const el = document.getElementById('regStatus');
            el.textContent = '❌ ' + msg;
            el.className = 'prn-status error';
        }

        async function submitRegistration() {
            const name     = document.getElementById('regName').value.trim();
            const prn      = document.getElementById('regPRN').value.trim();
            const mobile   = document.getElementById('regMobile').value.trim();
            const email    = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const year     = '2';
            const role     = 'student';

            const statusEl = document.getElementById('regStatus');
            statusEl.textContent = ''; statusEl.className = 'prn-status';

            if (!name)                                  return regError('नाम दर्ज करें।');
            if (!/^\d{16}$/.test(prn))                  return regError('PRN exactly 16 digits का होना चाहिए।');
            if (!/^\d{10}$/.test(mobile))               return regError('Mobile number exactly 10 digits का होना चाहिए।');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return regError('सही Email ID दर्ज करें।');
            if (password.length < 6)                    return regError('Password कम से कम 6 characters का होना चाहिए।');

            const btn = document.getElementById('regSubmitBtn');
            const btnLabel = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            try {
                // Auth account + profile row are created atomically (DB trigger); duplicate PRN is rejected inside signUp.
                const { user, needsEmailConfirmation } = await SBZAuth.signUp({ name, mobile, prn, email, year, password, referCode: '' });

                fetch('https://manager-public.vercel.app/api/notify-new-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: user.id, email })
                }).catch(() => {});

                if (needsEmailConfirmation) {
                    const st = document.getElementById('regStatus');
                    st.textContent = '✅ Account बन गया! Email verify करें (Inbox/Spam), फिर login करके यहाँ वापस आएँ।';
                    st.className = 'prn-status success';
                    btn.disabled = false; btn.innerHTML = btnLabel;
                    return;
                }

                // Registered + logged in = verified → go straight to plan selection
                verifiedPRN = prn;
                verifiedStudentName = name;
                verifiedUid = user.id;
                existingRole = 'student';
                document.getElementById('studentPrnInput').value = prn;
                document.getElementById('prnStatus').textContent = '✅ Registration Successful!';
                document.getElementById('prnStatus').className = 'prn-status success';
                document.getElementById('prnStudentName').textContent = name;
                document.getElementById('prnStudentSub').textContent = 'PRN: ' + prn + ' • Registered ✅';
                document.getElementById('prnVerifiedCard').classList.add('show');
                document.getElementById('currentRoleNote').style.display = 'none';
                document.getElementById('regForm').classList.remove('show');
                document.getElementById('newUserBtn').style.display = 'none';
                document.getElementById('planSection').classList.add('show');
                updateTotals();
                setStep(2);
                showToast('✅ Registered! अब Subscription select करें');
                document.getElementById('planSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (err) {
                regError((err && err.userMessage) || SBZAuth.friendlyError(err));
                btn.disabled = false;
                btn.innerHTML = btnLabel;
            }
        }

        function getSelectedRole() {
            const selected = document.querySelector('input[name="planRadio"]:checked');
            return selected ? selected.value : 'silver';
        }

        function updateTotals() {
            const role = getSelectedRole();
            const amount = ROLE_PRICES[role] || ROLE_PRICES.silver;
            document.getElementById('totalAmount').textContent = '₹' + amount.toLocaleString('en-IN');
            const btn = document.getElementById('payBtn');
            if (!btn.disabled) {
                btn.innerHTML = '<i class="fa-solid fa-lock"></i> Pay ₹' + amount.toLocaleString('en-IN');
            }
            document.querySelectorAll('.plan-item').forEach(el => {
                const radio = el.querySelector('input[type="radio"]');
                el.classList.toggle('selected', radio.checked);
            });
        }
        function onPlanChange() { updateTotals(); if (verifiedPRN) setStep(3); }

        async function payOnline() {
            if (!verifiedPRN) { showToast('पहले PRN verify करें।'); return; }

            const selectedRole = getSelectedRole();
            const amount = ROLE_PRICES[selectedRole] || ROLE_PRICES.silver;
            const btn = document.getElementById('payBtn');
            const restoreLabel = '<i class="fa-solid fa-lock"></i> Pay ₹' + amount.toLocaleString('en-IN');

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
            try {
                const sess = await window.sbz.auth.getSession();
                const token = sess.data && sess.data.session && sess.data.session.access_token;
                if (!token) {
                    showToast('🔒 Session expire हो गया — दोबारा login करें।');
                    setTimeout(() => { window.location.href = '/?next=' + encodeURIComponent('premium-get' + window.location.search); }, 1500);
                    btn.disabled = false; btn.innerHTML = restoreLabel;
                    return;
                }
                // Only the plan is sent. Identity comes from the token; the price comes from the database.
                const res = await fetch('https://studybuddypro-psi.vercel.app/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ role: selectedRole })
                });
                const data = await res.json();
                if (!data.payment_session_id) {
                    showToast('❌ ' + (data.message || 'Order नहीं बन पाया, दोबारा try करें।'));
                    btn.disabled = false;
                    btn.innerHTML = restoreLabel;
                    return;
                }
                sessionStorage.setItem('sbz_prn',  verifiedPRN);
                sessionStorage.setItem('sbz_name', verifiedStudentName);
                sessionStorage.setItem('sbz_role', selectedRole);

                const cashfree = Cashfree({ mode: "production" });
                cashfree.checkout({
                    paymentSessionId: data.payment_session_id,
                    redirectTarget: "_self"
                });
            } catch (err) {
                showToast('❌ Network error');
                btn.disabled = false;
                btn.innerHTML = restoreLabel;
            }
        }
        window.payOnline = payOnline;

    