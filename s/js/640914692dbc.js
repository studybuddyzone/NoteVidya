
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
        // "key" must match the child node name under SY/cs/sem4subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // Corrected as per actual CSE syllabus (Aug 2026 update):
        // removed "Law 2" and "Signal and System" (these were mismatched
        // ECE subjects, not part of CSE syllabus), added "Python
        // Programming" (real CSE subject, no link yet) and "Life of Dr.
        // Babasaheb Ambedkar" (real CSE subject — shared with AIML, so
        // uses the SAME Drive link as AIML's copy).
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "daa",  name: "Design and Analysis of Algorithms",      desc: "Algorithm design, complexity & optimization notes", icon: "fa-diagram-project",       bg: "#e8eaf6", color: "#5c6bc0" },
            { key: "coa",  name: "Computer Architecture and Organisation", desc: "CPU design, memory hierarchy & instruction sets", icon: "fa-microchip",             bg: "#e0f7fa", color: "#00897b" },
            { key: "ps",   name: "Probability and Statistics",             desc: "Probability theory, distributions & statistics",   icon: "fa-chart-simple",          bg: "#ede7f6", color: "#7c4dff" },
            { key: "python", name: "Python Programming",                    desc: "Python basics, data structures & SQLite/SQL",       icon: "fa-terminal",               bg: "#fff3e0", color: "#ff7043" },
            { key: "lang", name: "Language",                                desc: "Hindi, Marathi & Sanskrit — subject-wise notes",   icon: "fa-language",              bg: "#fce4ec", color: "#c2185b", type: "redirect", link: "language" },
            { key: "ambedkar", name: "Life of Dr. Babasaheb Ambedkar",     desc: "History & values — life of Dr. Babasaheb Ambedkar", icon: "fa-book",                  bg: "#e0f2f1", color: "#00695c" }
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
    