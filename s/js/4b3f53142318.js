
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
        // "key" must match the child node name under SY/aiml/sem4language
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // NOTE: Language is a subject COMMON with CS — these use the SAME
        // Google Drive links as SY-cs's language on purpose.
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "hindi",    name: "Hindi",    desc: "Hindi language notes & study material",    icon: "fa-book",        bg: "#fff3e0", color: "#ff7043", drive: "Hindi" },
            { key: "marathi",  name: "Marathi",  desc: "Marathi language notes & study material",  icon: "fa-book-open",   bg: "#e8f5e9", color: "#2e7d32", drive: "Marathi" },
            { key: "sanskrit", name: "Sanskrit", desc: "Sanskrit language notes & study material", icon: "fa-om",          bg: "#ede7f6", color: "#7c4dff", drive: "Sanskrit" }
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
                            <i class="fa-brands fa-google-drive"></i> Drive
                        </span>
                    </div>
                </div>
            `).join('');
        }

        renderSubjects();

        function openSubject(i) {
            const s = SUBJECTS[i];
            openSubjectPdfList(s.drive, 'notes', s.name + ' Notes');
        }
    