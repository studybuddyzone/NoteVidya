
        const BACKEND = 'https://studybuddypro-psi.vercel.app/api/backend';

        // 🔒 Access-gate — URL me admin ki verified identity (PRN ya uid) aana zaroori hai.
        // Yeh index.html/fy ke Master Login ke baad hi milti hai. Bina iske page
        // access hi nahi hoga — pehle jaisa localStorage-based fake 'master' default
        // yahan se hata diya gaya hai (woh sabse bada security gap tha).
        const params = new URLSearchParams(window.location.search);
        const adminPrn = params.get('adminPrn') || '';
        const adminUid = params.get('adminUid') || '';

        if (!adminPrn && !adminUid) {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#ef4444;font-size:16px;text-align:center;padding:20px;">Access Denied — is page ko sidha nahi khola ja sakta.<br>Kripya Master Login se aayein.</div>';
            throw new Error('No admin identity in URL — halting script.');
        }

        let currentAdminRole = null; // Server se verify hone ke baad set hota hai

        function adminIdentityBody(extra) {
            return Object.assign({ adminPrn, adminUid }, extra || {});
        }

        async function callBackend(action, extra) {
            const res = await fetch(BACKEND + '?action=' + action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminIdentityBody(extra))
            });
            return res.json();
        }

        const roleWeight = {
            'master': 100, 'superadmin': 80, 'admin': 60, 'moderator': 40,
            'diamond': 20, 'gold': 15, 'silver': 10, 'student': 0
        };

        function triggerAdminNotification(title, message, type) {
            const toast = document.getElementById('adminGlassToast');
            const icon = document.getElementById('toastIconBlock');
            document.getElementById('toastTitleBlock').innerText = title;
            document.getElementById('toastMessageBlock').innerText = message;
            toast.className = type === 'success' ? "premium-toast-panel toast-success-node active" : "premium-toast-panel toast-error-node active";
            icon.className = type === 'success' ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation";
            setTimeout(() => { toast.classList.remove('active'); }, 3500);
        }

        const formatYear = (yr) => {
            if(yr === 'first_year') return 'First Year (FY)';
            if(yr === 'second_year') return 'Second Year (SY)';
            if(yr === 'third_year') return 'Third Year (TY)';
            if(yr === 'final_year') return 'Final Year';
            return yr || '—';
        };

        // ➕ मैन्युअल अकाउंट क्रिएशन
        function injectNewStudentAccount(event) {
            event.preventDefault();
            const prn = document.getElementById('newPRN').value.trim();
            const name = document.getElementById('newName').value.trim();
            const email = document.getElementById('newEmail').value.trim();
            const phone = document.getElementById('newPhone').value.trim();
            const dob = document.getElementById('newDOB').value;
            const year = document.getElementById('newYear').value;
            const password = document.getElementById('newPassword').value.trim();
            const targetRole = document.getElementById('newRole').value;

            if (roleWeight[currentAdminRole] <= roleWeight[targetRole] && currentAdminRole !== 'master') {
                triggerAdminNotification("Security Fault", "You cannot create an account with equal or higher status!", "error");
                return;
            }
            if(prn.length !== 16) {
                triggerAdminNotification("PRN Error", "PRN key must be exactly 16 characters!", "error");
                return;
            }

            callBackend('master-create-account', { prn, name, email, phone, dob, year, password, targetRole })
            .then((result) => {
                if (result && result.success) {
                    triggerAdminNotification("Success", "Account Node Injected Live!", "success");
                    document.getElementById('manualCreateForm').reset();
                    syncLiveUsersDeck();
                } else {
                    triggerAdminNotification("Failure", (result && result.error) || "Database Write Blocked.", "error");
                }
            }).catch(() => { triggerAdminNotification("Failure", "Database Write Blocked.", "error"); });
        }

        // 🔄 2. लाइव प्रोफाइल चेंज अप्रूवल क्यू (FIXED FIELD ENGINE)
        function syncLiveApprovalRequests() {
            const container = document.getElementById('approvalRequestsContainer');
            callBackend('master-list-requests').then((result) => {
                container.innerHTML = "";
                let pendingCount = 0;
                if (result && result.success && result.requests) {
                    const allRequests = result.requests;
                    for (let prn in allRequests) {
                        const req = allRequests[prn];
                        if (req.status !== 'pending') continue;
                        pendingCount++;
                        
                        // डेटाबेस की फ़ील्ड्स को सुरक्षित क्लीन डैश (—) के साथ लोड करना
                        const oldName = req.oldName || req.name || '—';
                        const newName = req.newName || '—';
                        
                        const oldEmail = req.oldEmail || req.email || '—';
                        const newEmail = req.newEmail || '—';
                        
                        const oldPhone = req.oldPhone || req.phone || '—';
                        const newPhone = req.newPhone || '—';
                        
                        const oldDOB = req.oldDOB || req.dob || '—';
                        const newDOB = req.newDOB || '—';
                        
                        const oldYear = formatYear(req.oldYear || req.year);
                        const newYear = formatYear(req.newYear);
                        
                        const oldRole = req.oldRole || req.role || '—';
                        const newRole = req.newRole || '—';

                        const card = document.createElement('div');
                        card.className = "request-approval-card";
                        card.innerHTML = `
                            <div class="card-top-identity">
                                <div class="prn-badge-wrapper"><i class="fa-solid fa-fingerprint"></i><span class="prn-string-key">${sbzEsc(prn)}</span></div>
                                <span class="status-pending-tag">Review</span>
                            </div>
                            <div class="data-comparison-matrix">
                                <div class="matrix-row"><span class="matrix-field-label">Name</span><div class="matrix-values-node"><span class="old-value-striked">${sbzEsc(oldName)}</span><i class="fa-solid fa-arrow-right"></i><span class="new-value-highlight">${sbzEsc(newName)}</span></div></div>
                                <div class="matrix-row"><span class="matrix-field-label">Email</span><div class="matrix-values-node"><span class="old-value-striked">${sbzEsc(oldEmail)}</span><i class="fa-solid fa-arrow-right"></i><span class="new-value-highlight">${sbzEsc(newEmail)}</span></div></div>
                                <div class="matrix-row"><span class="matrix-field-label">Contact</span><div class="matrix-values-node"><span class="old-value-striked">${sbzEsc(oldPhone)}</span><i class="fa-solid fa-arrow-right"></i><span class="new-value-highlight">${sbzEsc(newPhone)}</span></div></div>
                                <div class="matrix-row"><span class="matrix-field-label">DOB</span><div class="matrix-values-node"><span class="old-value-striked">${sbzEsc(oldDOB)}</span><i class="fa-solid fa-arrow-right"></i><span class="new-value-highlight">${sbzEsc(newDOB)}</span></div></div>
                                <div class="matrix-row"><span class="matrix-field-label">Year</span><div class="matrix-values-node"><span class="old-value-striked">${sbzEsc(oldYear)}</span><i class="fa-solid fa-arrow-right"></i><span class="new-value-highlight">${sbzEsc(newYear)}</span></div></div>
                                <div class="matrix-row"><span class="matrix-field-label">Role</span><div class="matrix-values-node"><span class="old-value-striked" style="text-transform: capitalize;">${sbzEsc(oldRole)}</span><i class="fa-solid fa-arrow-right"></i><span class="new-value-highlight" style="text-transform: capitalize; color:#f59e0b;">${sbzEsc(newRole)}</span></div></div>
                            </div>
                            <div class="card-action-deck">
                                <button class="btn-deck btn-deck-reject" onclick="processApprovalRequest('${sbzJs(prn)}', 'rejected')"><i class="fa-solid fa-ban"></i> Reject</button>
                                <button class="btn-deck btn-deck-approve" onclick="processApprovalRequest('${sbzJs(prn)}', 'approved')"><i class="fa-solid fa-circle-check"></i> Approve & Deploy</button>
                            </div>
                        `;
                        container.appendChild(card);
                    }
                }
                if (pendingCount === 0) container.innerHTML = `<div class="no-data-alert"><i class="fa-solid fa-folder-open"></i> No pending updates found in the pipeline.</div>`;
            });
        }

        function processApprovalRequest(prn, action) {
            callBackend('master-process-request', { prn, action }).then((result) => {
                if (result && result.success) {
                    triggerAdminNotification(action === 'approved' ? "Approved" : "Rejected", action === 'approved' ? "Core Node synchronized successfully!" : "Request discarded.", action === 'approved' ? "success" : "error");
                    syncLiveApprovalRequests();
                    syncLiveUsersDeck();
                } else {
                    triggerAdminNotification("Failed", (result && result.error) || "Action fail ho gaya", "error");
                }
            });
        }

        // 👑 3. लाइव यूजर डेक
        function syncLiveUsersDeck() {
            const container = document.getElementById('systemUsersContainer');
            callBackend('master-list-users').then((result) => {
                container.innerHTML = "";
                if(result && result.success && result.users && Object.keys(result.users).length) {
                    const users = result.users;
                    for(let prn in users) {
                        const u = users[prn];
                        const userRole = u.role || 'student';
                        const isMaster = (userRole === 'master');
                        
                        const card = document.createElement('div');
                        card.className = isMaster ? "user-profile-node-card immortal-shield" : "user-profile-node-card";
                        
                        let controlHtml = '';
                        if (isMaster) {
                            controlHtml = `<span class="shield-badge"><i class="fa-solid fa-infinity"></i> Immortal Core</span>`;
                        } else {
                            const canManage = (currentAdminRole === 'master') || (roleWeight[currentAdminRole] > roleWeight[userRole]);
                            if (canManage) {
                                controlHtml = `
                                    <select class="role-modifier-dropdown" onchange="modifyUserRole('${sbzJs(prn)}', this.value, '${sbzJs(userRole)}')">
                                        <option value="" disabled selected>Alter Rank Hierarchy</option>
                                        <option value="student">Demote to Student</option>
                                        <option value="silver">Silver User</option>
                                        <option value="gold">Gold User</option>
                                        <option value="diamond">Diamond Member</option>
                                        <option value="moderator">Promote: Moderator</option>
                                        <option value="admin">Promote: Admin</option>
                                        ${currentAdminRole === 'master' ? '<option value="superadmin">Promote: Superadmin</option>' : ''}
                                    </select>
                                    <button class="btn-node-delete" onclick="terminateUserAccount('${sbzJs(prn)}', '${sbzJs(userRole)}')"><i class="fa-solid fa-trash-can"></i> Wipe</button>
                                `;
                            } else {
                                controlHtml = `<span style="font-size:11px; color:var(--error); font-weight:600;"><i class="fa-solid fa-lock"></i> Authority High: Access Denied</span>`;
                            }
                        }

                        card.innerHTML = `
                            <div class="card-top-identity">
                                <div class="prn-badge-wrapper"><i class="fa-solid fa-user-gear" style="${isMaster ? 'color:#f59e0b;' : ''}"></i><span class="prn-string-key">${sbzEsc(u.name || '—')}</span></div>
                                <span class="status-pending-tag" style="${isMaster ? 'color:#f59e0b; background:rgba(217,119,6,0.15);' : 'color:var(--primary); background:rgba(56,189,248,0.1);'}">${sbzEsc(userRole)}</span>
                            </div>
                            <div class="user-info-matrix">
                                <div class="matrix-row"><span class="matrix-field-label">PRN Key</span><div class="matrix-values-node"><span class="static-value-text">${sbzEsc(prn)}</span></div></div>
                                <div class="matrix-row"><span class="matrix-field-label">Academic</span><div class="matrix-values-node"><span class="static-value-text">${formatYear(u.year)}</span></div></div>
                            </div>
                            <div class="card-action-deck" style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                                ${controlHtml}
                            </div>
                        `;
                        container.appendChild(card);
                    }
                } else {
                    container.innerHTML = `<div class="no-data-alert">No records found.</div>`;
                }
            });
        }

        function modifyUserRole(prn, selectedRole, currentTargetRole) {
            if(!selectedRole) return;
            if (currentTargetRole === 'master') {
                triggerAdminNotification("Security Denied", "Fatal Error: Master Node is Immortal!", "error");
                return;
            }
            if (currentTargetRole === 'superadmin' && currentAdminRole !== 'master') {
                triggerAdminNotification("Access Denied", "Only the Core Master can demote a Superadmin!", "error");
                return;
            }
            if (roleWeight[currentAdminRole] <= roleWeight[selectedRole] && currentAdminRole !== 'master') {
                triggerAdminNotification("Hierarchy Violation", "You cannot promote anyone to your own rank or higher!", "error");
                return;
            }

            callBackend('master-modify-role', { targetPrn: prn, newRole: selectedRole, currentTargetRole }).then((result) => {
                if (result && result.success) {
                    triggerAdminNotification("Rank Shifted", `User compiled to '${selectedRole}' status successfully.`, "success");
                    syncLiveUsersDeck();
                } else {
                    triggerAdminNotification("Failure", (result && result.error) || "Database synchronization blocked.", "error");
                }
            });
        }

        function terminateUserAccount(prn, targetRole) {
            if (targetRole === 'master') {
                triggerAdminNotification("Security Alert", "Critical Protection: Master Engine cannot be deleted!", "error");
                return;
            }
            if (targetRole === 'superadmin' && currentAdminRole !== 'master') {
                triggerAdminNotification("Security Alert", "Unauthorized: Only the Master can wipe a Superadmin Node!", "error");
                return;
            }

            if(confirm(`Are you absolutely sure you want to erase data node: ${prn}?`)) {
                callBackend('master-terminate-account', { targetPrn: prn, targetRole }).then((result) => {
                    if (result && result.success) {
                        triggerAdminNotification("Wiped", "Account node completely erased from core tree.", "error");
                        syncLiveUsersDeck();
                    } else {
                        triggerAdminNotification("Failure", (result && result.error) || "Delete blocked.", "error");
                    }
                });
            }
        }

        // 📢 NOTIFICATION BAR EDITOR FUNCTIONS
        function loadCurrentNotification(cachedText) {
            const preview = document.getElementById('currentNotiPreview');
            if (cachedText) {
                preview.textContent = cachedText;
                preview.style.color = '#f59e0b';
            } else {
                preview.textContent = '(कोई notification set नहीं है)';
                preview.style.color = 'var(--text-muted)';
            }
        }

        function updateLiveNotification() {
            const newText = document.getElementById('newNotificationInput').value.trim();
            if (!newText) {
                triggerAdminNotification("Empty Field", "Notification text खाली है! कुछ type करें।", "error");
                return;
            }
            callBackend('master-update-notification', { text: newText }).then((result) => {
                if (result && result.success) {
                    triggerAdminNotification("Broadcasted! 📢", "Notification live हो गई — fy पर realtime update!", "success");
                    document.getElementById('newNotificationInput').value = '';
                    loadCurrentNotification(newText);
                } else {
                    triggerAdminNotification("Failed", (result && result.error) || "Database write blocked. Try again.", "error");
                }
            });
        }

        function clearLiveNotification() {
            if (!confirm('क्या आप current notification clear करना चाहते हैं?')) return;
            callBackend('master-clear-notification').then((result) => {
                if (result && result.success) {
                    triggerAdminNotification("Cleared", "Notification bar reset हो गई।", "success");
                    loadCurrentNotification(null);
                } else {
                    triggerAdminNotification("Failed", (result && result.error) || "Clear operation failed.", "error");
                }
            });
        }

        // 🔧 MAINTENANCE MODE CONTROLLER
        const maintenanceYears = [
            { key: 'fy', label: 'First Year', short: 'FY' },
            { key: 'sy', label: 'Second Year', short: 'SY' },
            { key: 'ty', label: 'Third Year', short: 'TY' },
            { key: 'ffy', label: 'Final Year', short: 'FFY' },
        ];

        function renderMaintenanceGrid() {
            const grid = document.getElementById('maintenanceGrid');
            grid.innerHTML = '';
            maintenanceYears.forEach(yr => {
                const card = document.createElement('div');
                card.className = 'maintenance-toggle-card';
                card.id = `maintCard_${yr.key}`;
                card.innerHTML = `
                    <div class="maint-card-left">
                        <div class="maint-year-icon" id="maintIcon_${yr.key}">${yr.short}</div>
                        <div class="maint-card-info">
                            <h4>${yr.label}</h4>
                            <div class="maint-status-text" id="maintStatus_${yr.key}">Live ✓</div>
                        </div>
                    </div>
                    <label class="toggle-switch" title="Toggle Maintenance for ${yr.label}">
                        <input type="checkbox" id="maintToggle_${yr.key}" onchange="toggleMaintenanceMode('${yr.key}', '${yr.label}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                `;
                grid.appendChild(card);
            });
        }

        function applyMaintenanceStatus(maintObj) {
            maintenanceYears.forEach(yr => {
                const isOn = maintObj && maintObj[yr.key] === true;
                const toggle = document.getElementById(`maintToggle_${yr.key}`);
                const card = document.getElementById(`maintCard_${yr.key}`);
                const status = document.getElementById(`maintStatus_${yr.key}`);
                if (!toggle) return;
                toggle.checked = isOn;
                if (isOn) {
                    card.classList.add('active-maintenance');
                    status.textContent = '🔧 Under Maintenance';
                } else {
                    card.classList.remove('active-maintenance');
                    status.textContent = 'Live ✓';
                }
            });
        }

        function toggleMaintenanceMode(yearKey, yearLabel, isOn) {
            callBackend('master-toggle-maintenance', { yearKey, isOn }).then((result) => {
                if (result && result.success) {
                    triggerAdminNotification(
                        isOn ? "Maintenance ON 🔧" : "Maintenance OFF ✅",
                        `${yearLabel} site ${isOn ? 'Under Maintenance में गई!' : 'Live हो गई!'}`,
                        isOn ? "error" : "success"
                    );
                } else {
                    triggerAdminNotification("Failed", (result && result.error) || "Database write blocked. Retry.", "error");
                    document.getElementById(`maintToggle_${yearKey}`).checked = !isOn;
                }
            });
        }

        let mcData = null;
        function toggleManualCert() {
            const p = document.getElementById('mcPanel');
            p.style.display = p.style.display === 'block' ? 'none' : 'block';
        }
        async function makeManualCert() {
            const msg = document.getElementById('mcMsg'), btn = document.getElementById('mcGo');
            const say = (t, k) => { msg.className = 'mc-msg ' + k; msg.textContent = t; };
            const body = { name: document.getElementById('mcName').value, prn: document.getElementById('mcPrn').value, branch: document.getElementById('mcBranch').value, year: document.getElementById('mcYear').value };
            if (!body.name.trim() || !body.prn.trim() || !body.branch.trim() || !body.year.trim()) return say('Name, PRN/EN, Branch aur Year sab bharein.', 'err');
            btn.disabled = true; say('Please wait...', 'ok');
            try {
                const r = await fetch('/api/event?action=gtmc-manual-certificate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                const j = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(j.message || 'Error');
                mcData = j;
                await GtmcCert.render(document.getElementById('mcPreview'), j, false);
                document.getElementById('mcPreview').style.display = 'block';
                document.getElementById('mcDl').style.display = 'grid';
                say('Ready ✔ Certificate ID: ' + j.certificate_id, 'ok');
            } catch (e) { say(e.message || 'Kuch gadbad ho gayi.', 'err'); }
            btn.disabled = false;
        }
        async function mcDownload(kind) {
            if (!mcData) return;
            const btn = event && event.currentTarget; const label = btn ? btn.innerHTML : '';
            try {
                if (kind === 'pdf') {
                    if (btn) { btn.disabled = true; btn.innerHTML = 'Signing...'; }
                    await GtmcCert.signedPdf('gtmc-manual-certificate-pdf', { name: mcData.name, prn: mcData.prn, branch: mcData.branch, year: mcData.year });
                } else { await GtmcCert.png(mcData, false); }
            } catch (e) { alert(e.message || 'Download nahi hua. Dobara try karein.'); }
            if (btn) { btn.disabled = false; btn.innerHTML = label; }
        }

        function applyCertStatus(isOn) {
            document.getElementById('certToggle').checked = isOn;
            document.getElementById('certCard').classList.toggle('active-maintenance', isOn);
            document.getElementById('certStatus').textContent = isOn ? '🎓 ON — students download kar sakte hain' : 'OFF ✓ (बंद)';
        }

        function toggleCertificates(isOn) {
            if (isOn && !confirm('Certificate ON karein? Students turant certificate download kar payenge.')) { applyCertStatus(false); return; }
            callBackend('master-gtmc-certificates', { open: isOn }).then((result) => {
                if (result && result.success) {
                    applyCertStatus(!!result.open);
                    triggerAdminNotification(result.open ? "Certificates ON 🎓" : "Certificates OFF ✅", result.open ? 'Students ab certificate download kar sakte hain.' : 'Certificate download band hai.', result.open ? "success" : "error");
                } else {
                    triggerAdminNotification("Failed", (result && result.error) || "Save nahi hua. Retry.", "error");
                    applyCertStatus(!isOn);
                }
            });
        }

        renderMaintenanceGrid();

        // 🔐 Sabse pehle khud ka role server-side verify hota hai — tabhi aage
        // koi bhi panel data load hota hai. Yeh access-control ki asli jagah hai.
        callBackend('master-verify-self').then((result) => {
            if (!result || !result.authorized) {
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#ef4444;font-size:16px;text-align:center;padding:20px;">Access Denied — Aapka role is panel ke liye authorized nahi hai.</div>';
                return;
            }
            currentAdminRole = result.role;

            callBackend('master-get-site-config').then((cfg) => {
                if (cfg && cfg.success) {
                    loadCurrentNotification(cfg.notification);
                    applyMaintenanceStatus(cfg.maintenance);
                    applyCertStatus(cfg.gtmcCertificates === true);
                }
            });

            syncLiveApprovalRequests();
            syncLiveUsersDeck();

            // Har 10 second me refresh — pehle jaisa instant-live to nahi, par
            // near-real-time updates ke liye kaafi hai
            setInterval(() => {
                syncLiveApprovalRequests();
                syncLiveUsersDeck();
            }, 10000);
        });
    