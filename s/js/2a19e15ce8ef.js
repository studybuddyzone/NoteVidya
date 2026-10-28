
        document.documentElement.setAttribute('data-theme','light');
        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme');
            const icon = document.getElementById('themeIcon');
            if (cur === 'dark') { document.documentElement.setAttribute('data-theme','light'); icon.className = 'fa-solid fa-moon'; }
            else { document.documentElement.setAttribute('data-theme','dark'); icon.className = 'fa-solid fa-sun'; }
        }
        function showToast() {
            const toast = document.getElementById('universalPremiumToast');
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 2500);
        }

        // ════════════════════════════════════════════════════════════
        // ⭐ DEFAULT SUBJECT DATA ⭐
        // "key" must match the child node name under TY/cs/sem6subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        // ════════════════════════════════════════════════════════════
        // 🚧 STRUCTURE ONLY — Semester VI subject names/links pending syllabus.
        // Just update "name", "desc" and "drive" below once the syllabus is shared;
        // "key" values can stay as-is or be renamed to match subject codes.
        const SUBJECTS = [
            { key: "sub1", name: "Subject 1", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book",  bg: "#e0f7fa", color: "#00897b", drive: "" },
            { key: "sub2", name: "Subject 2", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book",  bg: "#e8eaf6", color: "#5c6bc0", drive: "" },
            { key: "sub3", name: "Subject 3", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book",  bg: "#ffebee", color: "#e53935", drive: "" },
            { key: "sub4", name: "Subject 4", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book",  bg: "#ede7f6", color: "#7c4dff", drive: "" },
            { key: "sub5", name: "Subject 5", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book",  bg: "#fff3e0", color: "#ff7043", drive: "" },
            { key: "sub6", name: "Subject 6", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book",  bg: "#fce4ec", color: "#c2185b", drive: "" }
        ];

        const grid = document.getElementById('subjectsGrid');

        // ── STEP 1: show loading state first (same as CS file's data loading) ──
        grid.innerHTML = `<div class="grid-loading"><i class="fa-solid fa-circle-notch fa-spin"></i><span>Loading subjects...</span></div>`;

        // ── STEP 2: render subject cards ──
        function renderSubjects() {
            grid.innerHTML = SUBJECTS.map((s, i) => `
                <div class="subject-card" onclick="openSubject(${i})">
                    <div class="subject-card-icon" style="background:${s.bg};color:${s.color};"><i class="fa-solid ${s.icon}"></i></div>
                    <div class="subject-card-name">${s.name}</div>
                    <div class="subject-card-desc">${s.desc}</div>
                    <div class="subject-card-meta">
                        <span class="subject-card-badge" style="background:${s.bg};color:${s.color};">
                            <i class="${s.type === 'redirect' ? 'fa-solid fa-layer-group' : 'fa-brands fa-google-drive'}"></i> ${s.type === 'redirect' ? '3 Subjects' : 'Drive'}
                        </span>
                    </div>
                </div>
            `).join('');
        }

        // ── STEP 3: fetch live data from Supabase (same DB as TY-cs) ──
        const rtdb = SBZLegacy.database();

        rtdb.ref('TY/cs/sem6subjects').on('value', snap => {
            if (snap.exists()) {
                const data = snap.val();
                SUBJECTS.forEach(s => {
                    const remote = data[s.key];
                    if (remote) {
                        if (typeof remote === 'string') { s.drive = remote; }
                        else {
                            if (remote.drive) s.drive = remote.drive;
                            if (remote.name)  s.name  = remote.name;
                            if (remote.desc)  s.desc  = remote.desc;
                        }
                    }
                });
            }
            renderSubjects();
        }, () => {
            // If Supabase read fails for any reason, still show the defaults
            renderSubjects();
        });

        function openSubject(i) {
            const subject = SUBJECTS[i];
            if (subject.type === 'redirect' && subject.link) {
                window.location.href = subject.link;
                return;
            }
            const url = subject.drive;
            if (url && url.trim() !== "") {
                window.open(url, '_blank', 'noopener');
            } else {
                showToast();
            }
        }
    