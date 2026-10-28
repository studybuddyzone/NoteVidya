
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
        // "key" must match the child node name under SY/cs/sem3subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // Corrected as per actual CSE syllabus (Aug 2026 update):
        // removed "Electronic Device and Circuit" and "Law of Electricity"
        // (these were mismatched ECE subjects, not part of CSE syllabus),
        // added "Life of Chhatrapati Shivaji Maharaj" (real CSE subject —
        // shared with AIML, so uses the SAME Drive link as AIML's copy).
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "m3",   name: "Engineering Mathematics-III",  desc: "Laplace & Fourier transforms, PDEs, complex variables", icon: "fa-calculator",            bg: "#e3f2fd", color: "#1e88e5" },
            { key: "ds",   name: "Data Structures",              desc: "Trees, graphs, sorting & searching notes",         icon: "fa-database",              bg: "#e8eaf6", color: "#5c6bc0" },
            { key: "dm",   name: "Discrete Mathematics",          desc: "Sets, relations, graph theory & combinatorics",    icon: "fa-square-root-variable",  bg: "#ede7f6", color: "#7c4dff" },
            { key: "oop",  name: "Object-Oriented Programming",   desc: "OOP concepts, classes & Java notes",                icon: "fa-code",                  bg: "#e8f5e9", color: "#2e7d32" },
            { key: "de",   name: "Digital Electronics",           desc: "Logic gates, combinational & sequential circuits", icon: "fa-microchip",             bg: "#e0f7fa", color: "#00897b" },
            { key: "uhv2", name: "Universal Human Values-II",     desc: "UHV-II value education notes",                     icon: "fa-hand-holding-heart",     bg: "#fce4ec", color: "#c2185b" },
            { key: "lcsm", name: "Life of Chhatrapati Shivaji Maharaj", desc: "History & values — life of Chhatrapati Shivaji Maharaj", icon: "fa-shield-halved", bg: "#fff3e0", color: "#f57c00" }
        ];

        const grid = document.getElementById('subjectsGrid');

        // ── STEP 1: show loading state first (same as CS file's data page) ──
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
            openSubjectPdfList(s.name, 'notes', s.name + ' Notes');
        }
    