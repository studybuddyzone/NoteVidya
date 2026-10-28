
    const chemData = [
        {section: "Water Treatment", q: "Hardness of water is conventionally expressed in terms of equivalent amount of?", a: "MgCO3", b: "CaCO3", c: "CaSO4", d: "MgCl2", ans: "b"},
        {section: "Water Treatment", q: "Temporary hardness is caused by?", a: "Chlorides", b: "Sulfates", c: "Bicarbonates of Ca and Mg", d: "Nitrates", ans: "c"},
        {section: "Water Treatment", q: "EDTA method is used to determine?", a: "Alkalinity", b: "Hardness", c: "TDS", d: "Chlorine content", ans: "b"},
        {section: "Water Treatment", q: "Calgon is a trade name for?", a: "Sodium Hexametaphosphate", b: "Sodium Zeolite", c: "Calcium Carbonate", d: "Magnesium Sulfate", ans: "a"},
        {section: "Water Treatment", q: "The unit 'ppm' stands for?", a: "Parts per meter", b: "Parts per million", c: "Pure per million", d: "None", ans: "b"},
        {section: "Corrosion", q: "Rusting of iron is an example of?", a: "Reduction", b: "Oxidation", c: "Neutralization", d: "None", ans: "b"},
        {section: "Corrosion", q: "Galvanization is the coating of iron with?", a: "Copper", b: "Tin", c: "Zinc", d: "Chromium", ans: "c"},
        {section: "Corrosion", q: "Sacrificial anodic protection is used for?", a: "Underground pipelines", b: "Ships", c: "Both a and b", d: "None", ans: "c"},
        {section: "Polymers", q: "Buna-S is a copolymer of 1,3-butadiene and?", a: "Styrene", b: "Acrylonitrile", c: "Vinyl chloride", d: "Isoprene", ans: "a"},
        {section: "Polymers", q: "Vulcanization of rubber involves heating it with?", a: "Sulfur", b: "Nitrogen", c: "Oxygen", d: "Hydrogen", ans: "a"},
        {section: "Polymers", q: "Bakelite is an example of?", a: "Thermoplastic", b: "Thermosetting polymer", c: "Elastomer", d: "Fiber", ans: "b"},
        {section: "Lubricants", q: "Flash point is the temperature at which oil gives off?", a: "Continuous fire", b: "Enough vapor to give a momentary flash", c: "Solid crystals", d: "Smoke", ans: "b"},
        {section: "Lubricants", q: "Saponification value is used for?", a: "Mineral oils", b: "Vegetable oils", c: "Synthetic oils", d: "Greases", ans: "b"},
        {section: "Lubricants", q: "Graphite is used as a?", a: "Liquid lubricant", b: "Solid lubricant", c: "Gas lubricant", d: "Semi-solid lubricant", ans: "b"},
        {section: "Fuels", q: "Calorific value of fuel is highest for?", a: "Coal", b: "Hydrogen", c: "Methane", d: "Petrol", ans: "b"},
        {section: "Fuels", q: "Octane number is used for?", a: "Diesel", b: "Petrol", c: "Kerosene", d: "LPG", ans: "b"},
        {section: "Fuels", q: "Cetane number is used for?", a: "Petrol", b: "Diesel", c: "Coal", d: "Gas", ans: "b"},
        {section: "Fuels", q: "Main constituent of LPG is?", a: "Methane", b: "Butane", c: "Ethane", d: "Acetylene", ans: "b"},
        {section: "Phase Rule", q: "The number of phases in a mixture of oil and water is?", a: "1", b: "2", c: "3", d: "0", ans: "b"},
        {section: "Phase Rule", q: "Gibbs Phase Rule equation is?", a: "F = C - P + 2", b: "F = C + P - 2", c: "F = P - C + 2", d: "F = C - P + 1", ans: "a"},
        {section: "Phase Rule", q: "At triple point of water, the degrees of freedom is?", a: "1", b: "0", c: "2", d: "3", ans: "b"},
        {section: "Water Treatment", q: "Zeolite is a?", a: "Hydrated sodium aluminosilicate", b: "Calcium carbonate", c: "Ion exchange resin", d: "Coagulant", ans: "a"},
        {section: "Water Treatment", q: "Desalination by reverse osmosis uses?", a: "Semi-permeable membrane", b: "Heat", c: "Chemicals", d: "Zeolite", ans: "a"},
        {section: "Corrosion", q: "Pilling-Bedworth rule is related to?", a: "Hardness", b: "Oxide film protective nature", c: "Polymerization", d: "Lubrication", ans: "b"},
        {section: "Corrosion", q: "Which metal is used as a cathode in Cathodic Protection?", a: "The metal to be protected", b: "Magnesium", c: "Zinc", d: "Aluminum", ans: "a"},
        {section: "Polymers", q: "Natural rubber is a polymer of?", a: "Isoprene", b: "Chloroprene", c: "Ethylene", d: "Butadiene", ans: "a"},
        {section: "Polymers", q: "Teflon is used for?", a: "Non-stick cookware", b: "Tires", c: "Pipes", d: "Paint", ans: "a"},
        {section: "Polymers", q: "PVC stands for?", a: "Polyvinyl chloride", b: "Polyvinyl carbonate", c: "Pure vinyl chloride", d: "None", ans: "a"},
        {section: "Lubricants", q: "The resistance to flow of a liquid is?", a: "Density", b: "Viscosity", c: "Surface tension", d: "Volatility", ans: "b"},
        {section: "Lubricants", q: "Viscosity Index of an oil should be?", a: "Low", b: "High", c: "Zero", d: "Negative", ans: "b"},
        {section: "Lubricants", q: "Cloud point is the temperature at which oil becomes?", a: "Clear", b: "Cloudy/Hazy", c: "Solid", d: "Gas", ans: "b"},
        {section: "Fuels", q: "Bomb calorimeter is used to find?", a: "Flash point", b: "Calorific value of solid/liquid fuels", c: "Octane number", d: "Viscosity", ans: "b"},
        {section: "Fuels", q: "Bio-diesel is obtained from?", a: "Crude oil", b: "Vegetable oils/Animal fats", c: "Coal", d: "Uranium", ans: "b"},
        {section: "Fuels", q: "Main component of Natural Gas is?", a: "Ethane", b: "Methane", c: "Propane", d: "Carbon dioxide", ans: "b"},
        {section: "Phase Rule", q: "Number of phases for ice-water-vapor system is?", a: "1", b: "2", c: "3", d: "0", ans: "c"},
        {section: "Spectroscopy", q: "Beer-Lambert's law is related to?", a: "Hardness", b: "Absorbance of light", c: "Corrosion", d: "Lubrication", ans: "b"},
        {section: "Spectroscopy", q: "IR spectroscopy is useful for identifying?", a: "Atomic weight", b: "Functional groups", c: "Color", d: "Hardness", ans: "b"},
        {section: "Water Treatment", q: "Alum is used in water treatment as a?", a: "Disinfectant", b: "Coagulant", c: "Softener", d: "Filter", ans: "b"},
        {section: "Water Treatment", q: "Sterilization of water can be done by?", a: "Chlorination", b: "Ozonization", c: "UV radiation", d: "All of these", ans: "d"},
        {section: "Corrosion", q: "Anodic area in differential aeration corrosion is?", a: "Well oxygenated", b: "Poorly oxygenated", c: "Dry", d: "Hot", ans: "b"},
        {section: "Polymers", q: "Nylon 6,6 is a?", a: "Polyester", b: "Polyamide", c: "Polyether", d: "Polyolefin", ans: "b"},
        {section: "Polymers", q: "PMMA is commonly known as?", a: "Plexiglass", b: "Bakelite", c: "Teflon", d: "Nylon", ans: "a"},
        {section: "Lubricants", q: "Grease is a mixture of oil and?", a: "Water", b: "Soap", c: "Graphite", d: "Sulfur", ans: "b"},
        {section: "Fuels", q: "Proximate analysis of coal determines?", a: "C, H, N, S", b: "Moisture, Volatile matter, Ash, Fixed Carbon", c: "Viscosity", d: "None", ans: "b"},
        {section: "Water Treatment", q: "Ion exchange resins are regenerated using?", a: "HCl or NaOH", b: "Water", c: "Sand", d: "Oxygen", ans: "a"},
        {section: "Corrosion", q: "Dry corrosion is also called?", a: "Electrochemical corrosion", b: "Chemical corrosion", c: "Pitting", d: "Erosion", ans: "b"},
        {section: "Polymers", q: "Kevlar is used for making?", a: "Bulletproof vests", b: "Tires", c: "Toys", d: "Bottles", ans: "a"},
        {section: "Lubricants", q: "Fire point is usually ___ than flash point?", a: "Higher", b: "Lower", c: "Equal", d: "None", ans: "a"},
        {section: "Fuels", q: "Power alcohol is a mixture of petrol and?", a: "Methanol", b: "Ethanol", c: "Water", d: "Diesel", ans: "b"},
        {section: "Phase Rule", q: "In a one-component system, max degrees of freedom is?", a: "0", b: "1", c: "2", d: "3", ans: "c"}
    ];

    function openChemTest() {
        document.getElementById('chemOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('chemQuizArea');
        area.innerHTML = "";
        chemData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            card.innerHTML = `<div style="background:#f3ebf7; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#8e44ad; border-left:4px solid #9b59b6;">${data.section}</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#f3ebf7; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="chemq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#f3ebf7; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="chemq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#f3ebf7; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="chemq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#f3ebf7; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="chemq${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcChemResult() {
        let corr = 0, wrng = 0, skip = 0;
        chemData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="chemq${index}"]:checked`);
            if (!sel) skip++; else if (sel.value === item.ans) corr++; else wrng++;
        });
        document.getElementById('chem-corr').innerText = corr;
        document.getElementById('chem-wrng').innerText = wrng;
        document.getElementById('chem-skip').innerText = skip;
        document.getElementById('perc-chem').innerText = Math.round((corr / chemData.length) * 100) + "%";
        document.getElementById('res-modal-chem').style.display = 'flex';
    }

    function closeChemTest() {
        document.getElementById('chemOverlay').style.display = 'none';
        document.getElementById('res-modal-chem').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
