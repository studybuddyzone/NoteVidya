
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
        // "key" must match the child node name under SY/entc/sem4subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // NOTE: lang and ambedkar are subjects COMMON with CS/AIML — they
        // use the SAME Google Drive links / redirect on purpose.
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "sns",    name: "Signals and Systems",       desc: "सिग्नल्स एंड सिस्टम्स — LTI systems, convolution, Fourier & Laplace transforms", icon: "fa-wave-square",     bg: "#fff3e0", color: "#ff7043" },
            { key: "mp",     name: "Microprocessors",           desc: "माइक्रोप्रोसेसर्स — 8085/8086 architecture, interrupts & interfacing", icon: "fa-microchip",       bg: "#e0f7fa", color: "#00897b" },
            { key: "nt",     name: "Network Theory",            desc: "नेटवर्क थ्योरी — Circuit theorems, transient analysis & two-port networks", icon: "fa-diagram-project", bg: "#e8eaf6", color: "#5c6bc0" },
            { key: "mdm",    name: "MDM Bucket",                desc: "मल्टीडिसीप्लीनरी माइनर बास्केट — अन्य विभागों के अनुसार", icon: "fa-shapes",          bg: "#ede7f6", color: "#7c4dff" },
            { key: "ipr",    name: "Patents and IPR",           desc: "पेटेंट्स एंड IPR — Intellectual property rights & patent basics", icon: "fa-scale-balanced",  bg: "#fff8e1", color: "#f9a825" },
            { key: "oe",     name: "Open Elective Bucket",      desc: "ओपन इलेक्टिव बास्केट — University website के अनुसार", icon: "fa-layer-group",     bg: "#fbe9e7", color: "#d84315" },
            { key: "ambedkar", name: "Life of Bharatratna Dr. Babasaheb Ambedkar", desc: "History & values — life of Dr. Babasaheb Ambedkar", icon: "fa-book", bg: "#e0f2f1", color: "#00695c" },
            { key: "lang",   name: "Modern Indian Languages",   desc: "मराठी, हिंदी व संस्कृत — subject-wise notes", icon: "fa-language",        bg: "#fce4ec", color: "#c2185b", type: "redirect", link: "language-entc" }
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
    