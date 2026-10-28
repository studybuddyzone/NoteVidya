
    const commData = [
        {q:"Communication is a non-stop ____.", a:"Paper", b:"Process", c:"Program", d:"Plan", ans:"b"},
        {q:"The person who transmits the message is called?", a:"Receiver", b:"Driver", c:"Sender", d:"Cleaner", ans:"c"},
        {q:"What is the first step in the communication cycle?", a:"Encoding", b:"Decoding", c:"Ideation", d:"Feedback", ans:"c"},
        {q:"Encoding is the process of?", a:"Hearing", b:"Converting ideas into symbols", c:"Understanding", d:"Feedback", ans:"b"},
        {q:"Body language, gestures, and facial expressions are examples of?", a:"Verbal", b:"Non-verbal", c:"Written", d:"Oral", ans:"b"},
        {q:"Which of these is a barrier to communication?", a:"Clarity", b:"Active listening", c:"Noise", d:"Empathy", ans:"c"},
        {q:"Oral communication is also known as?", a:"Verbal", b:"Non-verbal", c:"Written", d:"Visual", ans:"a"},
        {q:"Feedback is the _____ given by the receiver.", a:"Question", b:"Response", c:"Symbol", d:"Noise", ans:"b"},
        {q:"Horizontal communication takes place between?", a:"Superior and Subordinate", b:"Subordinate and Superior", c:"Employees of equal rank", d:"Company and Customers", ans:"c"},
        {q:"Which of these is a 7C of communication?", a:"Character", b:"Clarity", c:"Cloud", d:"Chat", ans:"b"},
        {q:"Listening is an ____ process.", a:"Active", b:"Passive", c:"Optional", d:"Automatic", ans:"a"},
        {q:"Communication within oneself is called?", a:"Interpersonal", b:"Intrapersonal", c:"Group", d:"Mass", ans:"b"},
        {q:"Postures and gestures belong to?", a:"Kinesics", b:"Proxemics", c:"Chronemics", d:"Haptics", ans:"a"},
        {q:"Study of space in communication is?", a:"Kinesics", b:"Proxemics", c:"Haptics", d:"Vocalics", ans:"b"},
        {q:"An example of written communication is?", a:"Meeting", b:"Report", c:"Handshake", d:"Phone call", ans:"b"},
        {q:"Grapevine communication is _____.", a:"Formal", b:"Informal", c:"Official", d:"Vertical", ans:"b"},
        {q:"What is 'Decoding'?", a:"Creating message", b:"Interpreting message", c:"Sending message", d:"Blocking message", ans:"b"},
        {q:"Which of these is a visual communication?", a:"Traffic lights", b:"Music", c:"Speech", d:"Texting", ans:"a"},
        {q:"The 'You' attitude means focusing on?", a:"Self", b:"The Receiver", c:"The Sender", d:"The Product", ans:"b"},
        {q:"Proxemics refers to?", a:"Time", b:"Body movement", c:"Space/Distance", d:"Touch", ans:"c"},
        {q:"Paralanguage includes?", a:"Words", b:"Tone and Pitch", c:"Writing", d:"E-mails", ans:"b"},
        {q:"Diagonal communication flows?", a:"Upward", b:"Downward", c:"Across different levels/departments", d:"Same level", ans:"c"},
        {q:"Semantic barriers are related to?", a:"Technology", b:"Language and Meaning", c:"Distance", d:"Emotion", ans:"b"},
        {q:"A memo is an example of?", a:"External comm", b:"Internal comm", c:"Informal comm", d:"Mass comm", ans:"b"},
        {q:"What is the most essential part of effective communication?", a:"English", b:"Feedback", c:"Smartphones", d:"Long messages", ans:"b"},
        {q:"Public speaking is an example of?", a:"One-to-one", b:"One-to-many", c:"Many-to-one", d:"None", ans:"b"},
        {q:"Which is not a type of non-verbal communication?", a:"Facial expression", b:"E-mail", c:"Eye contact", d:"Gestures", ans:"b"},
        {q:"Chronemics is the study of ____ in communication.", a:"Sound", b:"Time", c:"Color", d:"Silence", ans:"b"},
        {q:"Upward communication flows from?", a:"Boss to Worker", b:"Worker to Boss", c:"Worker to Worker", d:"Boss to Customer", ans:"b"},
        {q:"Conciseness in communication means?", a:"Long details", b:"Short and to the point", c:"Using difficult words", d:"Being polite", ans:"b"},
        {q:"Psychological barriers include?", a:"Bad internet", b:"Fear and Prejudice", c:"Accent", d:"Physical distance", ans:"b"},
        {q:"What is Haptics?", a:"Study of space", b:"Study of touch", c:"Study of voice", d:"Study of time", ans:"b"},
        {q:"Formal communication is usually?", a:"Planned and recorded", b:"Spontaneous", c:"Unreliable", d:"Random", ans:"a"},
        {q:"Eye contact is also known as?", a:"Haptics", b:"Oculesics", c:"Proxemics", d:"Vocalics", ans:"b"},
        {q:"Soft skills include?", a:"Coding", b:"Communication and Teamwork", c:"Machine operation", d:"Typing speed", ans:"b"},
        {q:"An agenda is prepared ____ a meeting.", a:"During", b:"After", c:"Before", d:"Never", ans:"c"},
        {q:"Minutes of a meeting are written?", a:"Before", b:"After", c:"During only", d:"None", ans:"b"},
        {q:"Group discussions help to evaluate?", a:"IQ only", b:"Leadership and communication", c:"Handwriting", d:"Physical strength", ans:"b"},
        {q:"The 'Medium' in communication is also called?", a:"Noise", b:"Channel", b:"Feedback", d:"Source", ans:"b"},
        {q:"Communication through colors is?", a:"Colorics", b:"Chromatics", c:"Chronemics", d:"Vocalics", ans:"b"},
        {q:"Which 7C ensures that the message is polite?", a:"Correctness", b:"Courtesy", c:"Clarity", d:"Completeness", ans:"b"},
        {q:"Internal communication is for?", a:"Media", b:"Stakeholders within the organization", c:"General public", d:"Competitors", ans:"b"},
        {q:"Effective listening involves?", a:"Judging the speaker", b:"Interrupting often", c:"Paying attention and responding", d:"Daydreaming", ans:"c"},
        {q:"Mass communication requires?", a:"Single person", b:"Large audience and technical medium", c:"Two friends", d:"Silence", ans:"b"},
        {q:"Personal appearance is a part of?", a:"Verbal", b:"Non-verbal", c:"Written", d:"None", ans:"b"},
        {q:"A resume should be?", a:"10 pages long", b:"Brief and accurate", c:"Full of lies", d:"Handwritten only", ans:"b"},
        {q:"Jargon refers to?", a:"Specialized technical language", b:"Common slang", c:"Polite words", d:"Grammar", ans:"a"},
        {q:"The tone of a formal letter should be?", a:"Aggressive", b:"Polite and Professional", c:"Sarcastic", d:"Emotional", ans:"b"},
        {q:"Brainstorming is a technique for?", a:"Sleeping", b:"Generating ideas", c:"Fighting", d:"Data entry", ans:"b"},
        {q:"A good listener stays?", a:"Distracted", b:"Focused", c:"Silent forever", d:"Aggressive", ans:"b"}
    ];

    function openCommTest() {
        document.getElementById('commOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('commQuizArea');
        area.innerHTML = "";
        
        commData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            
            card.innerHTML = `
                <div style="background:#e7f3ff; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#0056b3; border-left:4px solid #007bff;">Communication Skills</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#f8f9fa; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="commq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#f8f9fa; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="commq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#f8f9fa; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="commq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#f8f9fa; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="commq${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcCommResult() {
        let corr = 0, wrng = 0, skip = 0;
        commData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="commq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('comm-corr').innerText = corr;
        document.getElementById('comm-wrng').innerText = wrng;
        document.getElementById('comm-skip').innerText = skip;
        document.getElementById('perc-comm').innerText = Math.round((corr / commData.length) * 100) + "%";
        document.getElementById('res-modal-comm').style.display = 'flex';
    }

    function closeCommTest() {
        document.getElementById('commOverlay').style.display = 'none';
        document.getElementById('res-modal-comm').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
