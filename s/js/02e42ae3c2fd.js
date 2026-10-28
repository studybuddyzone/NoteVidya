
        // Supabase Setup

        // हर subject अब dashboard के Management system से PDFs लाता है
        // (वही data जो note-XXX.html pages दिखाते हैं)
        const driveLinks = {
            'BEEE': 'BEE',
            'Maths-I': 'M1',
            'Maths-II': 'M2',
            'Physics': 'Physics',
            'Chemistry': 'Chemistry',
            'Python/CP': 'PNPS',
            'Graphics': 'Graphics',
            'Mechanics': 'Mechanics',
            'Comm. Skills': 'Communication',
            'Civil/Mech': 'Civil'
        };

        // थीम स्विच करने का लॉजिक (लाइट/डार्क मोड एनीमेशन)
        document.documentElement.setAttribute('data-theme', 'light');
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            
            const themeIcon = document.querySelector('#themeToggleBtn i');
            themeIcon.className = newTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }

        // हर subject के notes अब Management system से overlay में दिखते हैं
        function openDirectDrive(subjectKey) {
            const subject = driveLinks[subjectKey];
            if (subject) {
                openSubjectPdfList(subject, 'notes', subject + ' Notes');
            } else {
                alert("Drive Link assignment missing for this module.");
            }
        }
    