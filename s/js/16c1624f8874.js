
    const cmData = [
        // Civil Section
        {q:"Which of the following is a sedimentary rock?", a:"Granite", b:"Sandstone", c:"Marble", d:"Quartzite", ans:"b"},
        {q:"Standard size of a modular brick is?", a:"19x9x9 cm", b:"20x10x10 cm", c:"22x11x7 cm", d:"18x8x8 cm", ans:"a"},
        {q:"Initial setting time of Ordinary Portland Cement is?", a:"10 mins", b:"30 mins", c:"60 mins", d:"600 mins", ans:"b"},
        {q:"The scale used for measuring very small distances is?", a:"Plain scale", b:"Diagonal scale", c:"Vernier scale", d:"None", ans:"b"},
        {q:"Which of these is a surveying instrument?", a:"Theodolite", b:"Multimeter", c:"Manometer", d:"Anemometer", ans:"a"},
        {q:"The foundation used for weak soil is?", a:"Spread footing", b:"Raft foundation", c:"Isolated footing", d:"None", ans:"b"},
        {q:"DPC stands for?", a:"Damp Proof Course", b:"Dry Proof Concrete", c:"Durable Portland Cement", d:"None", ans:"a"},
        {q:"Bearing capacity of soil is measured in?", a:"kN/m", b:"kN/m²", c:"kN", d:"kg", ans:"b"},
        {q:"Fine aggregate is also known as?", a:"Gravel", b:"Sand", c:"Cement", d:"Slag", ans:"b"},
        {q:"A building used for education is categorized as?", a:"Group A", b:"Group B", c:"Group C", d:"Group D", ans:"c"},
        {q:"BHK stands for?", a:"Big Hall Kitchen", b:"Bedroom Hall Kitchen", c:"Bathroom Hall Kitchen", d:"None", ans:"b"},
        {q:"RCC stands for?", a:"Role Compact Concrete", b:"Reinforced Cement Concrete", c:"Raw Cement Concrete", d:"None", ans:"b"},
        {q:"Slump test is used to measure?", a:"Strength", b:"Workability", c:"Durability", d:"Weight", ans:"b"},
        {q:"Le-Chatelier apparatus is used for testing ____ of cement.", a:"Fineness", b:"Soundness", c:"Consistency", d:"Strength", ans:"b"},
        {q:"Contour lines show places of equal ____.", a:"Distance", b:"Elevation", c:"Temperature", d:"Pressure", ans:"b"},
        
        // Mechanical Section
        {q:"Thermodynamics deals with?", a:"Heat and Work", b:"Fluids only", c:"Solids only", d:"Chemicals", ans:"a"},
        {q:"An IC engine works on?", a:"External Combustion", b:"Internal Combustion", c:"No Combustion", d:"Steam", ans:"b"},
        {q:"In a 4-stroke engine, one cycle is completed in ____ revolutions of crankshaft.", a:"1", b:"2", c:"3", d:"4", ans:"b"},
        {q:"Which part connects piston to crankshaft?", a:"Cylinder", b:"Connecting Rod", c:"Spark Plug", d:"Valve", ans:"b"},
        {q:"A device used to convert mechanical energy into electrical is?", a:"Motor", b:"Generator", c:"Pump", d:"Turbine", ans:"b"},
        {q:"Refrigerant used in domestic fridges is usually?", a:"Water", b:"R134a", c:"Mercury", d:"Petrol", ans:"b"},
        {q:"Brake power is measured at?", a:"Piston", b:"Engine Shaft", c:"Fuel tank", d:"Exhaust", ans:"b"},
        {q:"Pumps are used to handle?", a:"Gases", b:"Liquids", c:"Solids", d:"Plasma", ans:"b"},
        {q:"The function of a Governor is to control?", a:"Temperature", b:"Mean Speed", c:"Pressure", d:"Volume", ans:"b"},
        {q:"A boiler is used to produce?", a:"Electricity", b:"Steam", c:"Water", d:"Fuel", ans:"b"},
        {q:"Which is a non-renewable source of energy?", a:"Solar", b:"Coal", c:"Wind", d:"Tidal", ans:"b"},
        {q:"A lathe machine is used for?", a:"Milling", b:"Turning", c:"Drilling only", d:"Grinding", ans:"b"},
        {q:"Unit of Power is?", a:"Joule", b:"Watt", c:"Pascal", d:"Newton", ans:"b"},
        {q:"Pascal's Law is used in?", a:"Gear box", b:"Hydraulic Lift", c:"IC Engine", d:"Steam Turbine", ans:"b"},
        {q:"Transmission of power using belts is?", a:"Friction drive", b:"Positive drive", c:"Gear drive", d:"Chain drive", ans:"a"},
        
        // Combined & Mixed
        {q:"1 Ton of refrigeration is equal to?", a:"3.5 kW", b:"5 kW", c:"1 kW", d:"10 kW", ans:"a"},
        {q:"Viscosity is a property of?", a:"Solids", b:"Fluids", c:"Metals", d:"None", ans:"b"},
        {q:"Which gear is used for intersecting shafts?", a:"Spur gear", b:"Bevel gear", c:"Helical gear", d:"Worm gear", ans:"b"},
        {q:"Properties of a material to resist scratching is?", a:"Ductility", b:"Hardness", c:"Malleability", d:"Elasticity", ans:"b"},
        {q:"Renewable energy source is?", a:"Natural gas", b:"Biomass", c:"Petrol", d:"Diesel", ans:"b"},
        {q:"The process of joining metals by melting a filler is?", a:"Drilling", b:"Welding", c:"Turning", d:"Milling", ans:"b"},
        {q:"Function of a Flywheel is to?", a:"Control speed", b:"Store energy during fluctuations", c:"Generate heat", d:"Stop the engine", ans:"b"},
        {q:"Density of water is approx?", a:"100 kg/m³", b:"1000 kg/m³", c:"500 kg/m³", d:"10 kg/m³", ans:"b"},
        {q:"Which valve is used for controlling liquid flow?", a:"Gate valve", b:"Check valve", c:"Safety valve", d:"None", ans:"a"},
        {q:"Modulus of elasticity is the ratio of?", a:"Stress to Strain", b:"Strain to Stress", c:"Force to Area", d:"None", ans:"a"},
        {q:"Superstructure is the part of building?", a:"Below ground", b:"Above ground", c:"Inside ground", d:"None", ans:"b"},
        {q:"Curing is done to?", a:"Heat the concrete", b:"Keep concrete moist", c:"Dry the concrete", d:"Color the concrete", ans:"b"},
        {q:"Compass surveying uses?", a:"Magnetic needle", b:"Telescope", c:"Laser", d:"None", ans:"a"},
        {q:"Ductility is the property to form?", a:"Sheets", b:"Wires", c:"Powder", d:"Blocks", ans:"b"},
        {q:"Newton's Law of Cooling is related to?", a:"Conduction", b:"Convection", c:"Radiation", d:"None", ans:"b"},
        {q:"Specific gravity of cement is approx?", a:"2.15", b:"3.15", c:"1.15", d:"4.15", ans:"b"},
        {q:"Efficiency of a Carnot cycle depends on?", a:"Working fluid", b:"Temperature limits", c:"Pressure", d:"Engine size", ans:"b"},
        {q:"Which engine is more efficient?", a:"Diesel", b:"Petrol", c:"Steam", d:"None", ans:"a"},
        {q:"The most common type of cement is?", a:"OPC", b:"White cement", c:"Colored cement", d:"None", ans:"a"},
        {q:"First Law of Thermodynamics is related to?", a:"Mass", b:"Energy conservation", c:"Entropy", d:"Gravity", ans:"b"}
    ];

    function openCivilMechTest() {
        document.getElementById('cmOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('cmQuizArea');
        area.innerHTML = "";
        
        cmData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:#1e1e1e; border: 1px solid #333; border-radius:5px; padding:30px; margin-bottom:25px; color:white; transition: 0.3s; position:relative; overflow:hidden;";
            
            card.innerHTML = `
                <div style="color:#d4af37; font-size:12px; margin-bottom:10px; font-weight:bold; letter-spacing:2px;">MODULE_EXAM_${index < 15 ? 'CIVIL' : 'MECH'}</div>
                <p style="font-weight:600; font-size:18px; margin-bottom:20px; color:#efefef;">${index+1}. ${data.q}</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    <label style="display:block; background:#262626; padding:15px; border:1px solid #444; border-radius:3px; cursor:pointer; font-size:14px;"><input type="radio" name="cmq${index}" value="a"> ${data.a}</label>
                    <label style="display:block; background:#262626; padding:15px; border:1px solid #444; border-radius:3px; cursor:pointer; font-size:14px;"><input type="radio" name="cmq${index}" value="b"> ${data.b}</label>
                    <label style="display:block; background:#262626; padding:15px; border:1px solid #444; border-radius:3px; cursor:pointer; font-size:14px;"><input type="radio" name="cmq${index}" value="c"> ${data.c}</label>
                    <label style="display:block; background:#262626; padding:15px; border:1px solid #444; border-radius:3px; cursor:pointer; font-size:14px;"><input type="radio" name="cmq${index}" value="d"> ${data.d}</label>
                </div>`;
            area.appendChild(card);
        });
    }

    function calcCMResult() {
        let corr = 0, wrng = 0, skip = 0;
        cmData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="cmq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('cm-corr').innerText = corr;
        document.getElementById('cm-wrng').innerText = wrng;
        document.getElementById('cm-skip').innerText = skip;
        document.getElementById('perc-cm').innerText = Math.round((corr / cmData.length) * 100) + "%";
        document.getElementById('res-modal-cm').style.display = 'flex';
    }

    function closeCivilMechTest() {
        document.getElementById('cmOverlay').style.display = 'none';
        document.getElementById('res-modal-cm').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
