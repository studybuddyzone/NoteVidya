
        document.documentElement.setAttribute('data-theme','light');
        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', cur==='dark'?'light':'dark');
            document.getElementById('themeIcon').className = cur==='dark'?'fa-solid fa-moon':'fa-solid fa-sun';
        }
        function showToast(msg) {
            const t = document.getElementById('toast');
            document.getElementById('toastMsg').textContent = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        // ── READ URL PARAMS (passed from premium-get) ──
        const params = new URLSearchParams(window.location.search);
        const studentPRN      = params.get('prn') || '';
        const studentName     = params.get('name') || 'Student';
        const branchCode      = params.get('branch') || '';
        const branchName      = params.get('branchName') || 'Branch Unlock';
        const studentUid      = params.get('uid') || '';
        let branchOwned        = params.get('branchOwned') === 'true';
        const existingRole    = (params.get('existingRole') || '').toLowerCase();

        // If no PRN, redirect back
        if (!studentPRN || !branchCode) {
            window.location.href = 'premium-get';
        }

        // Show student info
        document.getElementById('studentInfoName').textContent = studentName;
        document.getElementById('studentInfoPrn').textContent = 'PRN: ' + studentPRN;
        document.getElementById('orderBranchName').textContent = branchName + ' Unlock';

        // ── PRICING STATE ──
        const BRANCH_PRICE = 39, SKIP_PRICE = 5;
        const ROLE_PRICES  = { silver: 49, gold: 89, diamond: 162 };
        let roleSkipped = false;

        // If branch is already owned (skipped on previous screen) — show ₹5 + relabel + tick checkbox
        document.getElementById('skipBranchCheckboxGateway').checked = branchOwned;
        if (branchOwned) {
            document.getElementById('orderBranchSub').textContent = 'पहले से Owned • Skip Charge';
        }

        function toggleBranchSkipGateway() {
            branchOwned = document.getElementById('skipBranchCheckboxGateway').checked;
            document.getElementById('orderBranchSub').textContent = branchOwned ? 'पहले से Owned • Skip Charge' : 'SY Engineering • 1 Year Valid';
            updateTotals();
        }

        // Show correct skip box based on whether student already has a subscription role
        if (existingRole) {
            document.getElementById('currentRoleNote').style.display = 'block';
            document.getElementById('currentRoleNote').innerHTML = 'आपकी Current Subscription: <strong>' + existingRole.toUpperCase() + '</strong>';
            document.getElementById('skipRoleBox').style.display = 'block';
        } else {
            document.getElementById('skipRoleBoxNoRole').style.display = 'block';
        }

        function getBranchCharge() { return branchOwned ? SKIP_PRICE : BRANCH_PRICE; }

        function getRoleCharge() {
            if (roleSkipped) return SKIP_PRICE;
            const selected = document.querySelector('input[name="planRadio"]:checked');
            return selected ? (ROLE_PRICES[selected.value] || SKIP_PRICE) : SKIP_PRICE;
        }

        function getSelectedRole() {
            const selected = document.querySelector('input[name="planRadio"]:checked');
            return selected ? selected.value : 'silver';
        }

        function updateTotals() {
            const branchCharge = getBranchCharge();
            const roleCharge   = getRoleCharge();
            const total        = branchCharge + roleCharge;

            document.getElementById('orderBranchPrice').textContent = '₹' + branchCharge;
            document.getElementById('totalAmount').textContent = '₹' + total;

            const btn = document.getElementById('onlinePayBtn');
            if (!btn.disabled) {
                btn.innerHTML = '⚡ Online Pay करें — ₹' + total + ' (Instant)';
            }

            // Highlight selected plan card
            document.querySelectorAll('.plan-item').forEach(el => {
                const radio = el.querySelector('input[type="radio"]');
                el.classList.toggle('selected', radio.checked && !roleSkipped);
            });
        }

        function onPlanChange() { updateTotals(); }

        function toggleRoleSkip() {
            const cb1 = document.getElementById('skipRoleCheckbox');
            const cb2 = document.getElementById('skipRoleCheckboxNoRole');
            // Keep both checkboxes (whichever is visible) in sync
            roleSkipped = (cb1 && cb1.checked) || (cb2 && cb2.checked);
            if (cb1) cb1.checked = roleSkipped;
            if (cb2) cb2.checked = roleSkipped;

            document.querySelectorAll('#planList input[type="radio"]').forEach(r => r.disabled = roleSkipped);
            document.getElementById('planList').style.opacity = roleSkipped ? '0.45' : '1';
            document.getElementById('planList').style.pointerEvents = roleSkipped ? 'none' : 'auto';

            updateTotals();
        }

        // Initial total render
        updateTotals();


        // Cashfree SDK load
        const cfScript = document.createElement('script');
        cfScript.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        document.head.appendChild(cfScript);

        async function payOnline() {
          const cashfree = Cashfree({ mode: "production" });
          const btn = document.getElementById('onlinePayBtn');
          const branchCharge = getBranchCharge();
          const roleCharge   = getRoleCharge();
          const total        = branchCharge + roleCharge;
          const selectedRole = getSelectedRole();
          const restoreLabel = '⚡ Online Pay करें — ₹' + total + ' (Instant)';

          btn.disabled = true;
          btn.innerHTML = '⏳ Loading...';
          try {
            const res = await fetch('https://studybuddypro-psi.vercel.app/api/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prn: studentPRN || 'TEST001',
                name: studentName || 'Student',
                branch: branchCode || 'TEST',
                branchName: branchName || 'Branch',
                amount: total,
                role: selectedRole,
                branchOwned: branchOwned,
                roleSkipped: roleSkipped
              })
            });
            const data = await res.json();
            if (!data.payment_session_id) {
              showToast('❌ Error: ' + JSON.stringify(data));
              btn.disabled = false;
              btn.innerHTML = restoreLabel;
              return;
            }
            // Save student info before redirect so success/failed pages can read it
            sessionStorage.setItem('sbz_prn',        studentPRN);
            sessionStorage.setItem('sbz_name',       studentName);
            sessionStorage.setItem('sbz_branch',     branchCode);
            sessionStorage.setItem('sbz_branchName', branchName);
            sessionStorage.setItem('sbz_role',       selectedRole);
            sessionStorage.setItem('sbz_branchOwned', String(branchOwned));
            sessionStorage.setItem('sbz_roleSkipped', String(roleSkipped));
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
    