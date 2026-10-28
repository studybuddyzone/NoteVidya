
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
        // ⭐ SUBJECT DATA — SY Civil, Semester IV (DBATU NEP 2020 syllabus) ⭐
        // "name" MUST match the subject name in sy-resources.js (BRANCHES.civil)
        // — notes are uploaded from the dashboard under this exact name.
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "sm1", name: "Structural Mechanics-I", desc: "Beam deflection, energy methods, moment distribution, slope-deflection", icon: "fa-diagram-project", bg: "#e3f2fd", color: "#1e88e5" },
            { key: "ct", name: "Concrete Technology", desc: "Cement, aggregates, fresh & hardened concrete, admixtures, mix design", icon: "fa-cubes", bg: "#eceff1", color: "#546e7a" },
            { key: "he", name: "Hydraulics Engineering", desc: "Fluid statics, kinematics & dynamics, laminar/turbulent flow, pipes", icon: "fa-water", bg: "#e0f7fa", color: "#00838f" },
            { key: "bpd", name: "Building Planning & Drawing", desc: "Planning, plumbing & electrification, ventilation, fire safety, green building", icon: "fa-drafting-compass", bg: "#e8f5e9", color: "#2e7d32" },
            { key: "oe2", name: "Open Elective-II", desc: "Advanced Surveying / Modern Surveying", icon: "fa-layer-group", bg: "#ede7f6", color: "#7c4dff" },
            { key: "md2", name: "Multi-Disciplinary Minor-II", desc: "Fundamentals of Urban Design / Town and Urban Planning", icon: "fa-puzzle-piece", bg: "#e0f7fa", color: "#00838f" },
            { key: "uhv2", name: "Universal Human Values-II", desc: "UHV-II value education notes", icon: "fa-hand-holding-heart", bg: "#fce4ec", color: "#c2185b" },
            { key: "lcsm", name: "Life of Chhatrapati Shivaji Maharaj", desc: "History & values — life of Chhatrapati Shivaji Maharaj", icon: "fa-shield-halved", bg: "#fff3e0", color: "#f57c00" },
            { key: "edp", name: "Entrepreneurship Development Process", desc: "Entrepreneurship, innovation, business plans & venture creation", icon: "fa-lightbulb", bg: "#fff8e1", color: "#f9a825" }
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
            openSubjectPdfList(s.name, 'notes', s.name + ' Notes');
        }
    