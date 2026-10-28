
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
        // "key" must match the child node name under SY/aiml/sem4subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // NOTE: ps and lang are subjects COMMON with CS — ps uses the SAME
        // Google Drive link as SY-cs's sem4-subjects.html, and lang uses the
        // SAME shared language redirect. os, da, fsd are AIML-only
        // subjects — left with drive:"" (empty/default) until a Drive link
        // is provided.
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "os",   name: "Intro to Operating Systems",   desc: "Process scheduling, synchronization, memory & storage", icon: "fa-microchip",       bg: "#e0f7fa", color: "#00897b" },
            { key: "da",   name: "Data Analytics",                desc: "Data cleaning, EDA, hypothesis testing & stats tests",  icon: "fa-database",         bg: "#e8f5e9", color: "#2e7d32" },
            { key: "ps",   name: "Probability and Statistics",    desc: "Probability theory, distributions & correlation",       icon: "fa-chart-simple",     bg: "#ede7f6", color: "#7c4dff" },
            { key: "fsd",  name: "Full Stack Development",        desc: "Frontend (Bootstrap/JS/jQuery) & backend (PHP/MySQL/Laravel)", icon: "fa-code", bg: "#e3f2fd", color: "#1e88e5" },
            { key: "ambedkar", name: "Life of Dr. Babasaheb Ambedkar", desc: "History & values — life of Dr. Babasaheb Ambedkar", icon: "fa-book",              bg: "#e0f2f1", color: "#00695c" },
            { key: "lang", name: "Modern Indian Languages",        desc: "Marathi, Hindi & Sanskrit — subject-wise notes",         icon: "fa-language",         bg: "#fce4ec", color: "#c2185b", type: "redirect", link: "language-aiml" }
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

        renderSubjects();

        function openSubject(i) {
            const subject = SUBJECTS[i];
            if (subject.type === 'redirect' && subject.link) {
                window.location.href = subject.link;
                return;
            }
            openSubjectPdfList(subject.name, 'notes', subject.name + ' Notes');
        }
    