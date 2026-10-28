

        const auth = SBZLegacy.auth();

        // सेशन सुरक्षा लॉक
        auth.onAuthStateChanged((user) => {
            if (!user) {
                alert("Security Alert: Invalid or expired session.");
                window.location.href = "/";
            } else {
                if(user.email) {
                    document.getElementById('userDisplayNode').innerText = "Session ID: " + user.email;
                }
            }
        });

        /* =========================================================================
           📂 फ़ाइल एड्रेस सेट करने की जगह (REDIRECT FUNCTIONS)
           यहाँ नीचे उद्धरण चिन्हों "" के अंदर आप अपनी फाइलों के नाम डाल सकते हैं।
           ========================================================================= */

        // 1. AI Pattern Predictor का एड्रेस यहाँ डालें
        function goToAIPredictor() {
            window.location.href = "ai-predictor"; // 👈 यहाँ अपनी फ़ाइल का नाम बदलें
        }

        // 2. Advanced Mock Engine का एड्रेस यहाँ डालें
        function goToMockEngine() {
            window.location.href = "mock-engine";   // 👈 यहाँ अपनी फ़ाइल का नाम बदलें
        }

        // 3. Premium Source Vault का एड्रेस यहाँ डालें
        function goToSourceVault() {
            window.location.href = "source-vault"; // 👈 यहाँ अपनी फ़ाइल का नाम बदलें
        }

        // 4. Interactive Formula Sheets का एड्रेस यहाँ डालें
        function goToFormulaSheets() {
            window.location.href = "formula-sheets"; // 👈 यहाँ अपनी फ़ाइल का नाम बदलें
        }

        // 5. Revision Analytics Logs का एड्रेस यहाँ डालें
        function goToRevisionLogs() {
            window.location.href = "revision-logs"; // 👈 यहाँ अपनी फ़ाइल का नाम बदलें
        }

        // वापस होम डैशबोर्ड जाने के लिए
        function returnToDashboard() {
            window.location.href = "/";
        }
    