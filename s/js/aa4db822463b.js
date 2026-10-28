
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
        // "key" must match the child node name under TY/entc/sem5subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // Drive links reused from CS Sem III where subjects match:
        //   m3 (Math 3), edc (Electronic Device & Circuit), de (Digital Electronics)
        // ════════════════════════════════════════════════════════════
        // 🚧 STRUCTURE ONLY — subject names/links pending syllabus.
        const SUBJECTS = [
            { key: "sub1", name: "Subject 1", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#e3f2fd", color: "#1e88e5", drive: "" },
            { key: "sub2", name: "Subject 2", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#fff3e0", color: "#ff7043", drive: "" },
            { key: "sub3", name: "Subject 3", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#e0f7fa", color: "#00897b", drive: "" },
            { key: "sub4", name: "Subject 4", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#e8eaf6", color: "#5c6bc0", drive: "" },
            { key: "sub5", name: "Subject 5", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#ede7f6", color: "#7c4dff", drive: "" },
            { key: "sub6", name: "Subject 6", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#fff8e1", color: "#f9a825", drive: "" },
            { key: "sub7", name: "Subject 7", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#fbe9e7", color: "#d84315", drive: "" },
            { key: "sub8", name: "Subject 8", desc: "Syllabus को जल्द update किया जाएगा", icon: "fa-book", bg: "#fce4ec", color: "#c2185b", drive: "" }
        ];

        const grid = document.getElementById('subjectsGrid');

        // ── STEP 1: show loading state first ──
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
                            <i class="fa-brands fa-google-drive"></i> Drive
                        </span>
                    </div>
                </div>
            `).join('');
        }

        // ── STEP 3: fetch live data from Supabase (same DB as TY-entc) ──
        const rtdb = SBZLegacy.database();

        rtdb.ref('TY/entc/sem5subjects').on('value', snap => {
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
            const url = SUBJECTS[i].drive;
            if (url && url.trim() !== "") {
                window.open(url, '_blank', 'noopener');
            } else {
                showToast();
            }
        }
    