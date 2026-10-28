
    const mechData = [
        {q:"Mechanics which deals with bodies at rest is called?", a:"Dynamics", b:"Statics", c:"Kinematics", d:"Kinetics", ans:"b"},
        {q:"A force is completely defined by its?", a:"Magnitude", b:"Direction", c:"Point of application", d:"All of these", ans:"d"},
        {q:"The unit of force in SI units is?", a:"Kilogram", b:"Newton", c:"Watt", d:"Joule", ans:"b"},
        {q:"Principle of Transmissibility states that force can be moved along its?", a:"Line of action", b:"Perpendicular axis", c:"Parallel axis", d:"None", ans:"a"},
        {q:"A couple produces?", a:"Translational motion", b:"Rotational motion", c:"Both", d:"None", ans:"b"},
        {q:"Lami’s theorem is applicable for how many concurrent forces?", a:"2", b:"3", c:"4", d:"5", ans:"b"},
        {q:"Resultant of two equal forces P at 120° is?", a:"2P", b:"P", c:"P√2", d:"Zero", ans:"b"},
        {q:"Friction force always acts ___ to the direction of motion.", a:"Parallel", b:"Opposite", c:"Perpendicular", d:"Inclined", ans:"b"},
        {q:"Coefficient of friction (μ) depends on?", a:"Area of contact", b:"Shape of bodies", c:"Nature of surfaces", d:"Weight of body", ans:"c"},
        {q:"Centroid of a circle lies at its?", a:"Circumference", b:"Center", c:"Anywhere", d:"Radius", ans:"b"},
        {q:"Moment of Inertia is also called?", a:"First moment of area", b:"Second moment of area", c:"Mass moment", d:"None", ans:"b"},
        {q:"Theorem used to find MI about a parallel axis?", a:"Lami's", b:"Varignon's", c:"Parallel axis theorem", d:"Pascal's", ans:"c"},
        {q:"Point of application of total weight of a body is?", a:"Centroid", b:"Center of Gravity", c:"Metacenter", d:"Center of Pressure", ans:"b"},
        {q:"A perfect truss has m = ?", a:"2j - 3", b:"j - 2", c:"3j - 2", d:"2j + 3", ans:"a"},
        {q:"Angle of repose is equal to?", a:"Angle of friction", b:"90°", c:"0°", d:"Double the angle of friction", ans:"a"},
        {q:"Force acting on a body from a surface is called?", a:"Tension", b:"Normal Reaction", c:"Weight", d:"Friction", ans:"b"},
        {q:"Varignon's theorem deals with?", a:"Mass", b:"Moments", c:"Velocity", d:"Acceleration", ans:"b"},
        {q:"A scalar quantity has?", a:"Only magnitude", b:"Only direction", c:"Both", d:"None", ans:"a"},
        {q:"Resolution of a force is?", a:"Combining forces", b:"Splitting force into components", c:"Finding resultants", d:"None", ans:"b"},
        {q:"Equilibrium means Resultant force is?", a:"Maximum", b:"Minimum", c:"Zero", d:"Constant", ans:"c"},
        {q:"Unit of Moment of Inertia (Area)?", a:"mm²", b:"mm³", c:"mm⁴", d:"mm", ans:"c"},
        {q:"Friction in a body at rest is called?", a:"Dynamic", b:"Static", c:"Rolling", d:"Kinetic", ans:"b"},
        {q:"The CG of a solid hemisphere from base is?", a:"3r/8", b:"4r/3π", c:"r/2", d:"r/3", ans:"a"},
        {q:"Work done is the product of Force and?", a:"Time", b:"Velocity", c:"Displacement", d:"Mass", ans:"c"},
        {q:"Potential energy is due to?", a:"Motion", b:"Position", c:"Heat", d:"Light", ans:"b"},
        {q:"D’Alembert’s principle is used for?", a:"Statics", b:"Dynamics (Inertia forces)", c:"Fluid mechanics", d:"None", ans:"b"},
        {q:"Impact of two bodies follows which law?", a:"Conservation of Momentum", b:"Newton’s 2nd Law", c:"Hooke’s Law", d:"Pascal’s Law", ans:"a"},
        {q:"Coefficient of restitution for perfectly elastic bodies?", a:"0", b:"0.5", c:"1", d:"Infinity", ans:"c"},
        {q:"The path traced by a projectile is?", a:"Circle", b:"Parabola", c:"Straight line", d:"Ellipse", ans:"b"},
        {q:"Centroid of a triangle from base is?", a:"h/2", b:"h/3", c:"h/4", d:"2h/3", ans:"b"},
        {q:"Power is defined as?", a:"Rate of doing work", b:"Total work", c:"Energy stored", d:"Force x Time", ans:"a"},
        {q:"Moment of a force about a point on its line of action is?", a:"Maximum", b:"Minimum", c:"Zero", d:"Unity", ans:"c"},
        {q:"Concurrent forces meet at?", a:"Two points", b:"One point", c:"Infinity", d:"Different planes", ans:"b"},
        {q:"Law of polygon of forces is used for?", a:"2 forces", b:"More than 2 forces", c:"Only parallel forces", d:"None", ans:"b"},
        {q:"Kinematics deals with motion?", a:"With forces", b:"Without considering forces", c:"At rest", d:"None", ans:"b"},
        {q:"Unit of angular velocity?", a:"m/s", b:"rad/s", c:"rad/s²", d:"degree", ans:"b"},
        {q:"FBD stands for?", a:"Full Body Design", b:"Free Body Diagram", c:"Force Body Data", d:"None", ans:"b"},
        {q:"Reaction of a smooth surface is always ___ to surface.", a:"Parallel", b:"Normal", c:"Inclined", d:"Horizontal", ans:"b"},
        {q:"A truss is redundant if m >?", a:"2j - 3", b:"2j + 3", c:"j - 3", d:"3j - 2", ans:"a"},
        {q:"Mechanical advantage (MA) is?", a:"Effort/Load", b:"Load/Effort", c:"Input/Output", d:"None", ans:"b"},
        {q:"Velocity Ratio (VR) of a simple wheel and axle is?", a:"D/d", b:"d/D", c:"D+d", d:"D-d", ans:"a"},
        {q:"Efficiency of a machine is?", a:"MA x VR", b:"MA / VR", c:"VR / MA", d:"Output + Input", ans:"b"},
        {q:"A machine is reversible if efficiency is?", a:"> 50%", b:"< 50%", c:"100%", d:"0%", ans:"a"},
        {q:"Law of machine is?", a:"P = mW + C", b:"W = mP + C", c:"P = W/m", d:"None", ans:"a"},
        {q:"Polar Moment of Inertia is about which axis?", a:"X", b:"Y", c:"Z (Perpendicular)", d:"Base", ans:"c"},
        {q:"Weight of 1kg mass on earth is approx?", a:"1 N", b:"9.81 N", c:"10 N", d:"0.1 N", ans:"b"},
        {q:"Relative velocity of A wrt B is?", a:"Va + Vb", b:"Va - Vb", c:"Va * Vb", d:"Va / Vb", ans:"b"},
        {q:"Center of curvature is related to?", a:"Rectilinear motion", b:"Curvilinear motion", c:"Statics", d:"Truss", ans:"b"},
        {q:"Force required to keep a body in motion is ___ than to start it.", a:"More", b:"Less", c:"Same", d:"Zero", ans:"b"},
        {q:"Newton's Third Law states?", a:"F=ma", b:"Action = Reaction", c:"Inertia", d:"None", ans:"b"}
    ];

    function openMechTest() {
        document.getElementById('mechOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('mechQuizArea');
        area.innerHTML = "";
        
        mechData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            
            card.innerHTML = `
                <div style="background:#FFF3E0; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#BF360C; border-left:4px solid #FF5722;">Engineering Mechanics</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#FFF3E0; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="mechq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#FFF3E0; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="mechq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#FFF3E0; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="mechq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#FFF3E0; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="mechq${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcMechResult() {
        let corr = 0, wrng = 0, skip = 0;
        mechData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="mechq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('mech-corr').innerText = corr;
        document.getElementById('mech-wrng').innerText = wrng;
        document.getElementById('mech-skip').innerText = skip;
        document.getElementById('perc-mech').innerText = Math.round((corr / mechData.length) * 100) + "%";
        document.getElementById('res-modal-mech').style.display = 'flex';
    }

    function closeMechTest() {
        document.getElementById('mechOverlay').style.display = 'none';
        document.getElementById('res-modal-mech').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
