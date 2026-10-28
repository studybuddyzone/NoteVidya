
        // ── THEME ──
        document.documentElement.setAttribute('data-theme','light');
        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', cur==='dark'?'light':'dark');
            document.getElementById('themeIcon').className = cur==='dark'?'fa-solid fa-moon':'fa-solid fa-sun';
        }

        // ── READ URL PARAMS ──
        const params = new URLSearchParams(window.location.search);
        const orderId     = params.get('order_id') || params.get('cf_order_id') || '—';
        const payStatus   = params.get('payment_status') || 'FAILED';

        const studentName = sessionStorage.getItem('sbz_name') || params.get('name') || 'Student';
        const studentPRN  = sessionStorage.getItem('sbz_prn')  || params.get('prn')  || '—';
        const selectedRole = sessionStorage.getItem('sbz_role') || params.get('role') || '';

        // Fill details
        document.getElementById('detStudentName').textContent = studentName;
        document.getElementById('detPRN').textContent         = studentPRN !== '—' ? 'PRN: ' + studentPRN : '—';
        document.getElementById('detOrderId').textContent     = orderId;

        // Status badge & reason
        const statusEl = document.getElementById('statusBadge');
        const reasonEl = document.getElementById('reasonText');
        const subEl    = document.getElementById('failSub');
        const status   = payStatus.toUpperCase();

        if (status === 'CANCELLED' || status === 'USER_DROPPED') {
            statusEl.textContent = '⚠️ CANCELLED';
            reasonEl.textContent = 'Payment बीच में cancel हो गई। अगर balance deduct हुआ है तो 5-7 दिनों में refund आएगा।';
            subEl.innerHTML = `<strong>${sbzEsc(studentName)}</strong>, payment cancel हो गई।<br>फिर से try करो, कोई issue नहीं!`;
        } else if (status === 'PENDING') {
            statusEl.textContent = '⏳ PENDING';
            statusEl.style.background = '#fef3c7';
            statusEl.style.color = '#92400e';
            reasonEl.textContent = 'Payment pending है। थोड़ी देर में automatically update होगा। अगर 1 घंटे बाद भी pending है तो support से contact करो।';
            subEl.innerHTML = `<strong>${sbzEsc(studentName)}</strong>, payment pending state में है।<br>1-2 घंटे wait करो।`;
        } else {
            statusEl.textContent = '❌ FAILED';
            reasonEl.textContent = 'Bank या payment gateway से transaction decline हुई। Balance, limit या network issue हो सकता है। फिर से try करो।';
            subEl.innerHTML = `<strong>${sbzEsc(studentName)}</strong>, payment fail हो गई।<br>घबराओ मत — फिर से try करो!`;
        }

        // Retry button — pass plan back so premium-get pre-selects the same subscription
        const retryBtn = document.getElementById('retryBtn');
        const retryParams = new URLSearchParams({});
        if (selectedRole) retryParams.set('plan', selectedRole);
        retryBtn.href = 'premium-get' + (retryParams.toString() ? ('?' + retryParams.toString()) : '');
    