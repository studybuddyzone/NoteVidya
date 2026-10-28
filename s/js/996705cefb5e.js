
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
        // "key" must match the child node name under SY/aiml/sem3subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // NOTE: ds, dm, m3, uhv2 are subjects COMMON with CS — they use the
        // SAME Google Drive link as SY-cs's sem3-subjects on purpose.
        // ai, pe are AIML-only subjects — left with drive:"" (empty/default)
        // until a Drive link is provided.
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "m3",   name: "Engineering Mathematics-III",  desc: "Laplace & Fourier transforms, PDEs, complex variables", icon: "fa-calculator",           bg: "#e3f2fd", color: "#1e88e5" },
            { key: "ds",   name: "Data Structures",              desc: "Arrays, stacks, queues, linked lists, trees & graphs",  icon: "fa-database",             bg: "#e8eaf6", color: "#5c6bc0" },
            { key: "dm",   name: "Discrete Mathematics",          desc: "Logic, sets, combinatorics & algebraic structures",     icon: "fa-square-root-variable", bg: "#ede7f6", color: "#7c4dff" },
            { key: "ai",   name: "Artificial Intelligence",       desc: "Intelligent agents, search, reasoning & planning",      icon: "fa-robot",                bg: "#fce4ec", color: "#e91e63" },
            { key: "pe",   name: "Prompt Engineering",            desc: "LLMs, tokens, prompting techniques & AI safety",        icon: "fa-comment-dots",         bg: "#fff3e0", color: "#ff7043" },
            { key: "uhv2", name: "Universal Human Values-II",     desc: "UHV-II value education notes",                          icon: "fa-hand-holding-heart",   bg: "#fce4ec", color: "#c2185b" },
            { key: "lcsm", name: "Life of Chhatrapati Shivaji Maharaj", desc: "History & values — life of Chhatrapati Shivaji Maharaj", icon: "fa-shield-halved",     bg: "#fff3e0", color: "#f57c00" }
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
    