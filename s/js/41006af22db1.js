
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
        // ⭐ SEMESTER V — CSE (DBATU NEP, AY 2026-27) ⭐
        // `name` MUST match the subject name used in the Manager dashboard
        // (database.html → MGMT_GROUPS → CSE → Semester 5). Notes uploaded
        // there with category "notes" show up here automatically.
        // ════════════════════════════════════════════════════════════
        const CORE = [
            { name: "Machine Learning",            desc: "Supervised & unsupervised learning, model evaluation, neural nets", icon: "fa-brain",           bg: "#e8eaf6", color: "#5c6bc0" },
            { name: "Theory of Computations",      desc: "Automata, regular & context-free languages, Turing machines",     icon: "fa-diagram-project", bg: "#ede7f6", color: "#7c4dff" },
            { name: "Operating Systems",           desc: "Processes, scheduling, synchronization, memory & file systems",   icon: "fa-microchip",       bg: "#e0f7fa", color: "#00897b" },
            { name: "Database Management Systems", desc: "ER model, SQL, normalization, transactions & concurrency",       icon: "fa-database",        bg: "#fff3e0", color: "#ff7043" }
        ];

        // Open Elective (OE-3): student picks ONE. Only that subject's notes are shown.
        const OE = {
            id: "oe", storeKey: "sbz_ty_cs_sem5_oe", label: "Open Elective (OE-3)",
            icon: "fa-shapes", bg: "#e3f2fd", color: "#1e88e5",
            sheetTitle: "Choose your Open Elective",
            sheetSub: "आपने जो Open Elective लिया है वही चुनें — सिर्फ़ उसी के notes दिखेंगे। बाद में कभी भी बदल सकते हैं।",
            options: [
                { name: "Computer Graphics",                 desc: "Rasterization, transformations, clipping, 3D viewing, shading", icon: "fa-cube",         bg: "#e3f2fd", color: "#1e88e5" },
                { name: "Introduction to Quantum Technologies", desc: "Qubits, quantum gates, algorithms & quantum communication",  icon: "fa-atom",         bg: "#ede7f6", color: "#7c4dff" }
            ]
        };

        // MDM Bucket (Minor in Computer Engg., Sem V). Same subjects/notes as the core
        // ones, so options reuse those names — no duplicate uploads needed.
        const MDM = {
            id: "mdm", storeKey: "sbz_ty_cs_sem5_mdm", label: "MDM Bucket (Minor)",
            icon: "fa-diagram-project", bg: "#fce4ec", color: "#c2185b",
            sheetTitle: "Choose your Minor (MDM) course",
            sheetSub: "Minor Degree Program में आपने जो Sem V course लिया है वह चुनें।",
            options: [
                { name: "Operating Systems",           desc: "MDM option A", icon: "fa-microchip", bg: "#e0f7fa", color: "#00897b" },
                { name: "Database Management Systems", desc: "MDM option B", icon: "fa-database",  bg: "#fff3e0", color: "#ff7043" },
                { name: "Theory of Computations",      desc: "MDM option C", icon: "fa-diagram-project", bg: "#ede7f6", color: "#7c4dff" }
            ]
        };
        const BUCKETS = { oe: OE, mdm: MDM };

        const grid = document.getElementById('subjectsGrid');

        function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
        function getPick(b){ try { const v = localStorage.getItem(b.storeKey); return b.options.find(o => o.name === v) || null; } catch(e){ return null; } }
        function setPick(b, name){ try { localStorage.setItem(b.storeKey, name); } catch(e){} }

        function coreCard(s, i) {
            return `
                <div class="subject-card" onclick="openCore(${i})">
                    <div class="subject-card-icon" style="background:${s.bg};color:${s.color};"><i class="fa-solid ${s.icon}"></i></div>
                    <div class="subject-card-name">${esc(s.name)}</div>
                    <div class="subject-card-desc">${esc(s.desc)}</div>
                    <div class="subject-card-meta">
                        <span class="subject-card-badge" style="background:${s.bg};color:${s.color};"><i class="fa-solid fa-book-open"></i> Notes</span>
                    </div>
                </div>`;
        }

        function bucketCard(b) {
            const pick = getPick(b);
            return `
                <div class="subject-card" onclick="openBucket('${b.id}')">
                    <div class="subject-card-icon" style="background:${b.bg};color:${b.color};"><i class="fa-solid ${b.icon}"></i></div>
                    <div class="subject-card-name">${esc(b.label)}</div>
                    <div class="subject-card-desc">${pick ? '' : 'अपना course चुनें — फिर उसी के notes खुलेंगे'}</div>
                    <div class="picked-name ${pick ? '' : 'none'}" style="${pick ? 'color:'+b.color : ''}">
                        <i class="fa-solid ${pick ? 'fa-circle-check' : 'fa-hand-pointer'}"></i> ${pick ? esc(pick.name) : 'Not selected yet'}
                    </div>
                    <div class="subject-card-meta">
                        <span class="subject-card-badge" style="background:${b.bg};color:${b.color};"><i class="fa-solid fa-book-open"></i> ${pick ? 'Open Notes' : 'Select'}</span>
                        ${pick ? `<span class="pick-chip" style="color:${b.color};" onclick="event.stopPropagation();openChooser('${b.id}')"><i class="fa-solid fa-repeat"></i> Change</span>` : ''}
                    </div>
                </div>`;
        }

        function renderSubjects() {
            grid.innerHTML =
                '<div class="section-label">Core Subjects</div>' +
                CORE.map(coreCard).join('') +
                '<div class="section-label">Elective &amp; Minor</div>' +
                bucketCard(OE) + bucketCard(MDM);
        }

        function openNotes(name) { openSubjectPdfList(name, 'notes', name + ' Notes'); }
        function openCore(i) { openNotes(CORE[i].name); }

        // Bucket tap: if a course is already chosen → open ITS notes only; else ask first.
        function openBucket(id) {
            const b = BUCKETS[id], pick = getPick(b);
            if (pick) openNotes(pick.name); else openChooser(id);
        }

        function openChooser(id) {
            const b = BUCKETS[id], pick = getPick(b);
            document.getElementById('chooserTitle').textContent = b.sheetTitle;
            document.getElementById('chooserSub').textContent = b.sheetSub;
            document.getElementById('chooserOptions').innerHTML = b.options.map((o, i) => `
                <div class="chooser-opt ${pick && pick.name === o.name ? 'sel' : ''}" onclick="choose('${id}', ${i})">
                    <div class="chooser-opt-icon" style="background:${o.bg};color:${o.color};"><i class="fa-solid ${o.icon}"></i></div>
                    <div><div class="chooser-opt-name">${esc(o.name)}</div><div class="chooser-opt-desc">${esc(o.desc)}</div></div>
                    <i class="fa-solid fa-circle-check"></i>
                </div>`).join('');
            document.getElementById('chooserBackdrop').classList.add('active');
        }
        function closeChooser() { document.getElementById('chooserBackdrop').classList.remove('active'); }
        function choose(id, i) {
            const b = BUCKETS[id];
            setPick(b, b.options[i].name);
            closeChooser();
            renderSubjects();
            openNotes(b.options[i].name);
        }

        renderSubjects();
    