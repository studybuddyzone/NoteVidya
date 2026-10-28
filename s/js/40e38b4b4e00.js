
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
        // "key" must match the child node name under SY/entc/sem3subjects
        // in Supabase. Whatever link is stored there for that key will
        // override the "drive" value below automatically.
        //
        // Drive links reused from CS Sem III where subjects match:
        //   m3 (Math 3), edc (Electronic Device & Circuit), de (Digital Electronics)
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "m3",     name: "Engineering Mathematics-III",              desc: "इंजीनियरिंग मैथमेटिक्स-III — Semester III engineering mathematics notes", icon: "fa-calculator",          bg: "#e3f2fd", color: "#1e88e5" },
            { key: "edc",    name: "Electronic Devices & Circuits",            desc: "इलेक्ट्रॉनिक डिवाइसेस एंड सर्किट्स — Diodes, transistors & amplifier circuits", icon: "fa-bolt",                bg: "#fff3e0", color: "#ff7043" },
            { key: "de",     name: "Digital Electronics",                      desc: "डिजिटल इलेक्ट्रॉनिक्स — Logic gates, combinational & sequential circuits", icon: "fa-microchip",           bg: "#e0f7fa", color: "#00897b" },
            { key: "oe",     name: "Open Elective Bucket",                     desc: "ओपन इलेक्टिव बास्केट — University website के अनुसार", icon: "fa-shapes",              bg: "#e8eaf6", color: "#5c6bc0" },
            { key: "mdm",    name: "MDM Bucket",                               desc: "मल्टीडिसीप्लीनरी माइनर बास्केट — अन्य विभागों के अनुसार", icon: "fa-diagram-project",     bg: "#ede7f6", color: "#7c4dff" },
            { key: "esdie",  name: "Employability & Skill Dev. / Innovation & Entrepreneurship", desc: "इनमें से कोई एक subject", icon: "fa-briefcase",           bg: "#fff8e1", color: "#f9a825" },
            { key: "vec",    name: "Life of Chhatrapati Shivaji Maharaj",      desc: "Value Education Course — मूल्य शिक्षा पाठ्यक्रम", icon: "fa-crown",               bg: "#fbe9e7", color: "#d84315" },
            { key: "uhv2",   name: "Universal Human Values II",                desc: "यूनिवर्सल ह्यूमन वैल्यूज़ — UHV-II value education notes", icon: "fa-hand-holding-heart",  bg: "#fce4ec", color: "#c2185b" }
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

        renderSubjects();

        function openSubject(i) {
            const s = SUBJECTS[i];
            openSubjectPdfList(s.name, 'notes', s.name + ' Notes');
        }
    