
    const phyData = [
        {section: "Optics", q: "Newton's rings are formed due to the phenomenon of?", a: "Diffraction", b: "Interference", c: "Polarization", d: "Refraction", ans: "b"},
        {section: "Optics", q: "In Newton's rings experiment, the central spot is always?", a: "Bright", b: "Dark", c: "Colored", d: "None", ans: "b"},
        {section: "Lasers", q: "The process of population inversion is essential for?", a: "X-rays", b: "Laser action", c: "Photoelectric effect", d: "Diffraction", ans: "b"},
        {section: "Lasers", q: "Laser light is highly?", a: "Incoherent", b: "Coherent and Monochromatic", c: "Divergent", d: "Polychromatic", ans: "b"},
        {section: "Fiber Optics", q: "Optical fiber works on the principle of?", a: "Refraction", b: "Total Internal Reflection", c: "Dispersion", d: "Scattering", ans: "b"},
        {section: "Fiber Optics", q: "The core of an optical fiber has a refractive index ___ than the cladding.", a: "Lower", b: "Higher", c: "Equal", d: "Zero", ans: "b"},
        {section: "Quantum Physics", q: "According to De-Broglie, a moving particle is associated with?", a: "Light wave", b: "Matter wave", c: "Sound wave", d: "None", ans: "b"},
        {section: "Quantum Physics", q: "Heisenberg's Uncertainty Principle is given by?", a: "E = mc^2", b: "Δx.Δp ≥ h/4π", c: "λ = h/mv", d: "F = ma", ans: "b"},
        {section: "Semiconductors", q: "The Fermi level in an intrinsic semiconductor lies?", a: "In conduction band", b: "Middle of the band gap", c: "In valence band", d: "None", ans: "b"},
        {section: "Semiconductors", q: "Hall effect is used to determine?", a: "Type of semiconductor", b: "Carrier concentration", c: "Mobility", d: "All of these", ans: "d"},
        {section: "Superconductivity", q: "The temperature at which a material becomes a superconductor is?", a: "Critical Temperature", b: "Curie Temperature", c: "Absolute Zero", d: "Boiling point", ans: "a"},
        {section: "Superconductivity", q: "The expulsion of magnetic field from a superconductor is called?", a: "Hall Effect", b: "Meissner Effect", c: "Compton Effect", d: "Zeeman Effect", ans: "b"},
        {section: "Ultrasonics", q: "The frequency of ultrasonic waves is?", a: "Below 20 Hz", b: "Above 20,000 Hz", c: "Between 20-20,000 Hz", d: "Zero", ans: "b"},
        {section: "Ultrasonics", q: "Piezoelectric effect is used to produce?", a: "X-rays", b: "Ultrasonic waves", c: "Laser", d: "Light", ans: "b"},
        {section: "Modern Physics", q: "Photoelectric effect proves the ___ nature of light.", a: "Wave", b: "Particle", c: "Transverse", d: "Longitudinal", ans: "b"},
        {section: "Acoustics", q: "The persistence of sound even after the source is stopped is?", a: "Echo", b: "Reverberation", c: "Resonance", d: "Pitch", ans: "b"},
        {section: "Acoustics", q: "Sabine's formula is used to calculate?", a: "Sound intensity", b: "Reverberation time", c: "Frequency", d: "Velocity", ans: "b"},
        {section: "Crystallography", q: "The smallest repetitive unit of a crystal is?", a: "Atom", b: "Unit Cell", c: "Molecule", d: "Lattice", ans: "b"},
        {section: "Crystallography", q: "Miller indices for a plane parallel to X and Y axes are?", a: "(100)", b: "(001)", c: "(110)", d: "(111)", ans: "b"},
        {section: "Lasers", q: "Ruby laser is a ___ level laser system.", a: "Two", b: "Three", c: "Four", d: "Five", ans: "b"},
        {section: "Lasers", q: "He-Ne laser produces light of wavelength?", a: "632.8 nm", b: "500 nm", c: "400 nm", d: "1000 nm", ans: "a"},
        {section: "Fiber Optics", q: "Numerical Aperture (NA) is a measure of fiber's?", a: "Length", b: "Light gathering capacity", c: "Weight", d: "Cost", ans: "b"},
        {section: "Optics", q: "A thin film shows colors due to?", a: "Dispersion", b: "Interference", c: "Diffraction", d: "Absorption", ans: "b"},
        {section: "Dielectrics", q: "The unit of Dipole Moment is?", a: "Farad", b: "Debye", c: "Tesla", d: "Henry", ans: "b"},
        {section: "Magnetic Materials", q: "Materials with negative susceptibility are?", a: "Paramagnetic", b: "Diamagnetic", c: "Ferromagnetic", d: "None", ans: "b"},
        {section: "X-rays", q: "Bragg's Law is given by?", a: "nλ = 2d sinθ", b: "E = hν", c: "λ = h/p", d: "None", ans: "a"},
        {section: "Nanoscience", q: "1 nanometer is equal to?", a: "10^-6 m", b: "10^-9 m", c: "10^-12 m", d: "10^-3 m", ans: "b"},
        {section: "Nanoscience", q: "In nanomaterials, the surface to volume ratio is?", a: "Very small", b: "Extremely large", c: "Zero", d: "Constant", ans: "b"},
        {section: "Quantum Physics", q: "Schrödinger's wave equation is used to find?", a: "Position", b: "Wave function (ψ)", c: "Force", d: "Velocity", ans: "b"},
        {section: "Optics", q: "Diffraction at a single slit is called?", a: "Fresnel diffraction", b: "Fraunhofer diffraction", c: "Young's diffraction", d: "None", ans: "b"},
        {section: "Superconductivity", q: "Type-I superconductors are also called?", a: "Hard", b: "Soft", c: "Perfect", d: "Ideal", ans: "b"},
        {section: "Crystallography", q: "Atomic packing factor for BCC structure is?", a: "0.52", b: "0.68", c: "0.74", d: "1.0", ans: "b"},
        {section: "Crystallography", q: "Atomic packing factor for FCC structure is?", a: "0.52", b: "0.74", c: "0.68", d: "0.90", ans: "b"},
        {section: "Dielectrics", q: "Dielectric constant of vacuum is?", a: "0", b: "1", c: "Infinity", d: "8.85", ans: "b"},
        {section: "Modern Physics", q: "The energy of a photon is?", a: "mc^2", b: "hν", c: "1/2 mv^2", d: "p^2/2m", ans: "b"},
        {section: "Lasers", q: "Active medium in He-Ne laser is?", a: "Helium", b: "Neon", c: "Gas mixture", d: "Solid", ans: "c"},
        {section: "Fiber Optics", q: "The cladding in optical fiber is usually made of?", a: "Copper", b: "Glass or Plastic", c: "Steel", d: "Rubber", ans: "b"},
        {section: "Ultrasonics", q: "Magnetostriction method is used to produce?", a: "X-rays", b: "Ultrasonic waves", c: "Microwaves", d: "None", ans: "b"},
        {section: "Optics", q: "Grating element is the distance between?", a: "Two slits", b: "Center of one slit and center of next", c: "Length of grating", d: "None", ans: "b"},
        {section: "Crystallography", q: "Co-ordination number for Simple Cubic is?", a: "12", b: "6", c: "8", d: "4", ans: "b"},
        {section: "Magnetic Materials", q: "Above Curie temperature, ferromagnetic material becomes?", a: "Diamagnetic", b: "Paramagnetic", c: "Superconductor", d: "None", ans: "b"},
        {section: "Quantum Physics", q: "Planck's constant (h) has the unit of?", a: "Energy", b: "Angular Momentum (J-s)", c: "Frequency", d: "Mass", ans: "b"},
        {section: "Semiconductors", q: "Conductivity of semiconductor ___ with temperature.", a: "Decreases", b: "Increases", c: "Remains same", d: "None", ans: "b"},
        {section: "X-rays", q: "X-rays are ___ waves.", a: "Mechanical", b: "Electromagnetic", c: "Acoustic", d: "Matter", ans: "b"},
        {section: "Fiber Optics", q: "Acceptance angle depends on?", a: "Refractive indices of core & cladding", b: "Length of fiber", c: "Color of light", d: "None", ans: "a"},
        {section: "Optics", q: "Resolving power of telescope increases with?", a: "Smaller aperture", b: "Larger aperture", c: "Longer wavelength", d: "None", ans: "b"},
        {section: "Dielectrics", q: "Polarization in dielectrics is due to?", a: "Free electrons", b: "Displacement of charges", c: "Heating", d: "None", ans: "b"},
        {section: "Nanoscience", q: "Carbon nanotubes (CNTs) are made of?", a: "Silicon", b: "Carbon", c: "Iron", d: "Gold", ans: "b"},
        {section: "Modern Physics", q: "Work function is measured in?", a: "Joules", b: "Electron-Volt (eV)", c: "Watts", d: "Amperes", ans: "b"},
        {section: "Superconductivity", q: "High temperature superconductors were discovered in?", a: "Metals", b: "Ceramics", c: "Polymers", d: "Gases", ans: "b"}
    ];

    function openPhyTest() {
        document.getElementById('phyOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('phyQuizArea');
        area.innerHTML = "";
        
        phyData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            
            card.innerHTML = `
                <div style="background:#e0f2f2; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#006666; border-left:4px solid #008080;">${data.section}</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#f0f9f9; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="phyq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#f0f9f9; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="phyq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#f0f9f9; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="phyq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#f0f9f9; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="phyq${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcPhyResult() {
        let corr = 0, wrng = 0, skip = 0;
        phyData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="phyq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('phy-corr').innerText = corr;
        document.getElementById('phy-wrng').innerText = wrng;
        document.getElementById('phy-skip').innerText = skip;
        document.getElementById('perc-phy').innerText = Math.round((corr / phyData.length) * 100) + "%";
        document.getElementById('res-modal-phy').style.display = 'flex';
    }

    function closePhyTest() {
        document.getElementById('phyOverlay').style.display = 'none';
        document.getElementById('res-modal-phy').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
