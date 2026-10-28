
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
        // ⭐ SUBJECT DATA — SY Civil, Semester III (DBATU NEP 2020 syllabus) ⭐
        // "name" MUST match the subject name in sy-resources.js (BRANCHES.civil)
        // — notes are uploaded from the dashboard under this exact name.
        // ════════════════════════════════════════════════════════════
        const SUBJECTS = [
            { key: "m3", name: "Engineering Mathematics-III", desc: "Laplace & Fourier transforms, PDEs, complex variables", icon: "fa-calculator", bg: "#e3f2fd", color: "#1e88e5" },
            { key: "mos", name: "Mechanics of Solids", desc: "Stress-strain, SFD/BMD, beam stresses, columns & torsion", icon: "fa-bridge", bg: "#fff3e0", color: "#ef6c00" },
            { key: "sur", name: "Surveying", desc: "Chain, compass, levelling, theodolite & engineering surveys", icon: "fa-location-crosshairs", bg: "#e8f5e9", color: "#2e7d32" },
            { key: "bc", name: "Building Construction", desc: "Masonry, RCC, doors & windows, roofs, prefab & low-cost", icon: "fa-building", bg: "#e8eaf6", color: "#5c6bc0" },
            { key: "oe1", name: "Open Elective-I", desc: "Building Materials / Design of Masonry Structures / Energy Efficient Buildings", icon: "fa-layer-group", bg: "#ede7f6", color: "#7c4dff" },
            { key: "md1", name: "Multi-Disciplinary Minor-I", desc: "Site Planning / Introduction to Engineering Geology", icon: "fa-puzzle-piece", bg: "#e0f7fa", color: "#00838f" },
            { key: "coi", name: "Constitution of India", desc: "Constitution, Union & State government, local administration", icon: "fa-landmark", bg: "#fce4ec", color: "#c2185b" },
            { key: "ambedkar", name: "Life of Dr. Babasaheb Ambedkar", desc: "History & values — life of Dr. Babasaheb Ambedkar", icon: "fa-book", bg: "#e0f2f1", color: "#00695c" },
            { key: "mil", name: "Modern Indian Language", desc: "Marathi, Hindi & Sanskrit — language notes", icon: "fa-language", bg: "#fff8e1", color: "#f9a825" }
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
    