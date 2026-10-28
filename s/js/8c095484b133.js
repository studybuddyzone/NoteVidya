
        const database = SBZLegacy.database();

        let detectedPrn = localStorage.getItem('userPRN') || localStorage.getItem('PRN') || localStorage.getItem('studentPRN') || localStorage.getItem('user_prn');
        const prnField = document.getElementById('studentPrn');

        if (detectedPrn && detectedPrn.trim() !== "") {
            applyLockedState(detectedPrn.trim());
            checkUserRoleAndLockFields(detectedPrn.trim());
        } else {
            prnField.placeholder = "Enter your 16-digit PRN Number";
            document.getElementById('prnLabel').innerText = "PRN / Student Key Identifier (Required Once)";
            prnField.style.borderColor = "rgba(255,255,255,0.15)";
            
            prnField.addEventListener('input', function() {
                if (this.value.trim().length === 16) {
                    const typedPrn = this.value.trim();
                    localStorage.setItem('userPRN', typedPrn);
                    triggerGlassNotification("Key Synced", "PRN Verification successfully locked.", "success");
                    applyLockedState(typedPrn);
                    checkUserRoleAndLockFields(typedPrn);
                }
            });
        }

        // 🛡️ User ka database status check karke Dropdown lock karne wala logic
        function checkUserRoleAndLockFields(prn) {
            fetch('https://studybuddypro-psi.vercel.app/api/backend?action=verify-prn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prn: prn, mode: 'admin' })
            })
            .then(r => r.json())
            .then((result) => {
                if (result && result.role === 'master') {
                    const roleSelect = document.getElementById('updateRole');
                    roleSelect.setAttribute('disabled', true);
                    roleSelect.style.cursor = "not-allowed";
                    roleSelect.style.opacity = "0.6";
                    roleSelect.options[0].text = "Locked (Master Rank Active)";
                    triggerGlassNotification("Security Active", "Master privileges detected. Hierarchy restricted.", "success");
                }
            }).catch(err => console.error("Verification Fail:", err));
        }

        function applyLockedState(value) {
            prnField.value = value;
            prnField.setAttribute('readonly', true);
            prnField.style.opacity = "0.85";
            prnField.style.background = "rgba(56,189,248,0.03)";
            prnField.style.borderStyle = "dashed";
            prnField.style.borderColor = "var(--primary)";
            prnField.style.color = "var(--primary)";
            prnField.style.cursor = "not-allowed";
            document.getElementById('prnIcon').style.color = "var(--primary)";
            document.getElementById('prnLabel').innerText = "PRN / Student Key Identifier (Locked & Verified)";
        }

        function triggerGlassNotification(title, message, type) {
            const toast = document.getElementById('customGlassToast');
            const icon = document.getElementById('toastIconBlock');
            document.getElementById('toastTitleBlock').innerText = title;
            document.getElementById('toastMessageBlock').innerText = message;
            toast.className = (type === 'success') ? "premium-toast-panel toast-success-node active" : "premium-toast-panel toast-error-node active";
            icon.className = (type === 'success') ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";
            setTimeout(() => { toast.classList.remove('active'); }, 3500);
        }

        function dispatchUpdateRequest(event) {
            event.preventDefault();
            const prnInput = prnField.value.trim();
            const newName = document.getElementById('updateName').value.trim();
            const newEmail = document.getElementById('updateEmail').value.trim();
            const newPhone = document.getElementById('updatePhone').value.trim();
            const newDOB = document.getElementById('updateDOB').value;
            const newYear = document.getElementById('updateYear').value;
            const roleSelect = document.getElementById('updateRole');
            const newRole = roleSelect.value;

            document.getElementById('prnError').style.display = 'none';

            if (prnInput.length !== 16) {
                document.getElementById('prnError').style.display = 'block';
                triggerGlassNotification("Validation Error", "PRN key must be exactly 16 digits.", "error");
                return;
            }

            if(!newName && !newEmail && !newPhone && !newDOB && !newYear && !newRole) {
                triggerGlassNotification("No Changes", "Please modify at least one field.", "error");
                return;
            }

            fetch('https://studybuddypro-psi.vercel.app/api/backend?action=submit-profile-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prn: prnInput,
                    newName, newEmail, newPhone, newDOB, newYear, newRole
                })
            })
            .then(r => r.json())
            .then((result) => {
                if (result && result.success) {
                    triggerGlassNotification("Sync Successful", "Data queued into Master Deck Stream!", "success");
                    document.getElementById('updateRequestForm').reset();
                    setTimeout(() => { window.location.href = "fy"; }, 2200);
                } else {
                    triggerGlassNotification("Request Failed", (result && result.error) || "Kuch galat ho gaya", "error");
                }
            })
            .catch(err => triggerGlassNotification("Node Error", err.message, "error"));
        }
    