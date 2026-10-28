
    const beeeData = [
        {section: "DC Circuits", q: "KCL is based on the law of conservation of?", a: "Energy", b: "Charge", c: "Mass", d: "Momentum", ans: "b"},
        {section: "DC Circuits", q: "KVL is based on the law of conservation of?", a: "Charge", b: "Energy", c: "Flux", d: "Resistance", ans: "b"},
        {section: "Magnetic Circuits", q: "The unit of Magnetic Flux is?", a: "Tesla", b: "Weber", c: "Ampere-turn", d: "Henry", ans: "b"},
        {section: "AC Circuits", q: "The ratio of RMS value to Average value is called?", a: "Peak Factor", b: "Form Factor", c: "Power Factor", d: "None", ans: "b"},
        {section: "AC Circuits", q: "In a purely capacitive circuit, current ___ the voltage by 90°.", a: "Lags", b: "Leads", c: "In phase", d: "None", ans: "b"},
        {section: "Transformers", q: "Transformer works on the principle of?", a: "Self induction", b: "Mutual induction", c: "Static induction", d: "None", ans: "b"},
        {section: "Transformers", q: "The core of a transformer is laminated to reduce?", a: "Hysteresis loss", b: "Eddy current loss", c: "Copper loss", d: "Friction loss", ans: "b"},
        {section: "Semiconductors", q: "A p-type semiconductor has majority carriers as?", a: "Electrons", b: "Holes", c: "Neutrons", d: "None", ans: "b"},
        {section: "Diodes", q: "A Zener diode is always connected in?", a: "Forward bias", b: "Reverse bias", c: "Series", d: "None", ans: "b"},
        {section: "Transistors", q: "In a BJT, which region is most heavily doped?", a: "Base", b: "Emitter", c: "Collector", d: "None", ans: "b"},
        {section: "DC Circuits", q: "Unit of conductance is?", a: "Ohm", b: "Siemens (Mho)", c: "Henry", d: "Farad", ans: "b"},
        {section: "AC Circuits", q: "Power Factor of a purely resistive circuit is?", a: "0", b: "1", c: "0.5", d: "Infinity", ans: "b"},
        {section: "AC Circuits", q: "Standard frequency of AC supply in India is?", a: "60 Hz", b: "50 Hz", c: "100 Hz", d: "230 Hz", ans: "b"},
        {section: "Magnetic Circuits", q: "The opposition offered by a magnetic circuit to flux is?", a: "Resistance", b: "Reluctance", c: "Permeance", d: "Inductance", ans: "b"},
        {section: "Transformers", q: "An ideal transformer has ___ efficiency.", a: "50%", b: "100%", c: "90%", d: "0%", ans: "b"},
        {section: "Digital Electronics", q: "Which gate is called a Universal Gate?", a: "AND", b: "NAND", c: "OR", d: "NOT", ans: "b"},
        {section: "Digital Electronics", q: "Binary equivalent of decimal 5 is?", a: "100", b: "101", c: "110", d: "111", ans: "b"},
        {section: "AC Circuits", q: "In a series RLC circuit at resonance, Impedance is?", a: "Maximum", b: "Minimum (Z=R)", c: "Zero", d: "Infinite", ans: "b"},
        {section: "Rectifiers", q: "A Bridge Rectifier uses ___ diodes.", a: "1", b: "2", c: "4", d: "3", ans: "c"},
        {section: "Semiconductors", q: "The pentavalent impurity added to Silicon creates?", a: "P-type", b: "N-type", c: "Intrinsic", d: "Insulator", ans: "b"},
        {section: "Measuring Instruments", q: "An Ammeter is always connected in?", a: "Parallel", b: "Series", c: "Both", d: "None", ans: "b"},
        {section: "Measuring Instruments", q: "A Voltmeter is always connected in?", a: "Series", b: "Parallel", c: "None", d: "Both", ans: "b"},
        {section: "DC Circuits", q: "According to Ohm's Law?", a: "V=IR", b: "I=VR", c: "R=VI", d: "None", ans: "a"},
        {section: "AC Circuits", q: "The reciprocal of Impedance is?", a: "Reactance", b: "Admittance", c: "Susceptance", d: "Conductance", ans: "b"},
        {section: "Transformers", q: "Transformer oil is used for?", a: "Lubrication", b: "Cooling & Insulation", c: "Cleaning", d: "None", ans: "b"},
        {section: "Diodes", q: "LED emits light in ___ bias.", a: "Reverse", b: "Forward", c: "Both", d: "None", ans: "b"},
        {section: "Digital Electronics", q: "The output of an OR gate is LOW only if?", a: "One input is HIGH", b: "Both inputs are LOW", c: "Both inputs are HIGH", d: "None", ans: "b"},
        {section: "Magnetic Circuits", q: "The unit of Magnetic Field Strength (H) is?", a: "Weber/m²", b: "Ampere-turns/meter", c: "Tesla", d: "Henry/m", ans: "b"},
        {section: "AC Circuits", q: "Active power in AC circuit is measured in?", a: "VAR", b: "Watts", c: "VA", d: "Ohms", ans: "b"},
        {section: "AC Circuits", q: "Apparent power is measured in?", a: "Watts", b: "VA", c: "VAR", d: "Henry", ans: "b"},
        {section: "DC Circuits", q: "Resistance of an ideal voltmeter is?", a: "Zero", b: "Infinite", c: "100 Ohm", d: "None", ans: "b"},
        {section: "DC Circuits", q: "Resistance of an ideal ammeter is?", a: "Infinite", b: "Zero", c: "1 Ohm", d: "None", ans: "b"},
        {section: "Semiconductors", q: "Forbidden energy gap in Germanium is approx?", a: "1.1 eV", b: "0.72 eV", c: "5 eV", d: "0 eV", ans: "b"},
        {section: "Diodes", q: "The width of depletion layer ___ in reverse bias.", a: "Decreases", b: "Increases", c: "Remains same", d: "Disappears", ans: "b"},
        {section: "Transistors", q: "The relation between α and β is?", a: "β = α/(1+α)", b: "β = α/(1-α)", c: "α = β/(1-β)", d: "None", ans: "b"},
        {section: "Transformers", q: "Open circuit test on transformer gives?", a: "Copper loss", b: "Core loss", c: "Friction loss", d: "None", ans: "b"},
        {section: "Transformers", q: "Short circuit test on transformer gives?", a: "Core loss", b: "Copper loss", c: "Windage loss", d: "None", ans: "b"},
        {section: "Digital Electronics", q: "Hexadecimal system has a base of?", a: "8", b: "16", c: "10", d: "2", ans: "b"},
        {section: "AC Circuits", q: "For a purely inductive circuit, the power factor is?", a: "1", b: "0 (lagging)", c: "0 (leading)", d: "0.5", ans: "b"},
        {section: "DC Circuits", q: "Superposition theorem is applicable only to?", a: "Non-linear circuits", b: "Linear bilateral circuits", c: "Complex circuits", d: "None", ans: "b"},
        {section: "Magnetic Circuits", q: "B-H curve for air is a?", a: "Circle", b: "Straight line through origin", c: "Parabola", d: "Hysteresis loop", ans: "b"},
        {section: "AC Circuits", q: "RMS value of sinewave with peak Vm is?", a: "Vm/2", b: "Vm/√2", c: "2Vm/π", d: "Vm", ans: "b"},
        {section: "Digital Electronics", q: "A half adder can add ___ bits.", a: "1", b: "2", c: "3", d: "4", ans: "b"},
        {section: "Digital Electronics", q: "Which gate performs logical multiplication?", a: "OR", b: "AND", c: "NOT", d: "XOR", ans: "b"},
        {section: "Diodes", q: "The arrow in diode symbol points towards?", a: "Anode (P)", b: "Cathode (N)", c: "Gate", d: "None", ans: "b"},
        {section: "DC Circuits", q: "Three 10 Ohm resistors in parallel give total resistance of?", a: "30 Ohm", b: "3.33 Ohm", c: "10 Ohm", d: "0.33 Ohm", ans: "b"},
        {section: "AC Circuits", q: "Quality Factor (Q) of series RLC circuit is?", a: "R/L", b: "(1/R) * √(L/C)", c: "L/CR", d: "None", ans: "b"},
        {section: "Transformers", q: "Which part of transformer carries flux?", a: "Windings", b: "Core", c: "Bushings", d: "Conservator", ans: "b"},
        {section: "Semiconductors", q: "Valence electrons in a Silicon atom are?", a: "2", b: "4", c: "8", d: "14", ans: "b"},
        {section: "Digital Electronics", q: "A byte consists of ___ bits.", a: "4", b: "8", c: "16", d: "32", ans: "b"}
    ];

    function openBeeeTest() {
        document.getElementById('beeeOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('beeeQuizArea');
        area.innerHTML = "";
        
        beeeData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            
            card.innerHTML = `
                <div style="background:#e3f2fd; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#1976d2; border-left:4px solid #00d2ff;">${data.section}</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="beeeq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="beeeq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="beeeq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="beeeq${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcBeeeResult() {
        let corr = 0, wrng = 0, skip = 0;
        beeeData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="beeeq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('beee-corr').innerText = corr;
        document.getElementById('beee-wrng').innerText = wrng;
        document.getElementById('beee-skip').innerText = skip;
        document.getElementById('perc-beee').innerText = Math.round((corr / beeeData.length) * 100) + "%";
        document.getElementById('res-modal-beee').style.display = 'flex';
    }

    function closeBeeeTest() {
        document.getElementById('beeeOverlay').style.display = 'none';
        document.getElementById('res-modal-beee').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
