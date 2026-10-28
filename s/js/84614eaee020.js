
    const graphData = [
        {q:"Which pencil is used for drawing dark outlines?", a:"H", b:"2H", c:"HB", d:"3H", ans:"c"},
        {q:"The angle between Isometric axes is?", a:"90°", b:"120°", c:"60°", d:"180°", ans:"b"},
        {q:"In first angle projection, the object is kept in?", a:"1st Quadrant", b:"2nd Quadrant", c:"3rd Quadrant", d:"4th Quadrant", ans:"a"},
        {q:"The Front View of an object is projected on?", a:"Horizontal Plane (HP)", b:"Vertical Plane (VP)", c:"Profile Plane", d:"None", ans:"b"},
        {q:"A line parallel to both HP and VP will show its true length in?", a:"Front View", b:"Top View", c:"Both a & b", d:"Side View", ans:"c"},
        {q:"Isometric scale is ____ of the actual scale.", a:"82%", b:"100%", c:"50%", d:"120%", ans:"a"},
        {q:"Which line is used for hidden parts?", a:"Continuous thick", b:"Dashed thin", c:"Chain thin", d:"Continuous thin", ans:"b"},
        {q:"A point lies on both HP and VP. Where is its Front View?", a:"Above XY", b:"Below XY", c:"On XY line", d:"None", ans:"c"},
        {q:"Representing a 3D object on a 2D plane is called?", a:"Isometric", b:"Orthographic Projection", c:"Perspective", d:"Sketching", ans:"b"},
        {q:"The Side View is projected on which plane?", a:"VP", b:"HP", c:"Profile Plane (PP)", d:"Auxiliary Plane", ans:"c"},
        {q:"A circle in isometric projection appears as?", a:"Circle", b:"Ellipse", c:"Square", d:"Parabola", ans:"b"},
        {q:"Which projection method is used in India (per BIS)?", a:"1st Angle", b:"3rd Angle", c:"2nd Angle", d:"None", ans:"a"},
        {q:"In 3rd angle projection, Top View is drawn ____ Front View.", a:"Below", b:"Above", c:"Left", d:"Right", ans:"b"},
        {q:"A cube has how many faces?", a:"4", b:"6", c:"8", d:"12", ans:"b"},
        {q:"Section lines are usually inclined at?", a:"30°", b:"45°", c:"60°", d:"90°", ans:"b"},
        {q:"Scale 1:5 means it is a?", a:"Full scale", b:"Reducing scale", c:"Enlarging scale", d:"None", ans:"b"},
        {q:"Which instrument is used to draw curves which are not circular?", a:"Compass", b:"French Curves", d:"Divider", c:"Protracter", ans:"b"},
        {q:"The Top View of a vertical cylinder is a?", a:"Rectangle", b:"Circle", c:"Triangle", d:"Ellipse", ans:"b"},
        {q:"Size of A4 drawing sheet is?", a:"210x297 mm", b:"297x420 mm", c:"420x594 mm", d:"594x841 mm", ans:"a"},
        {q:"A line inclined to HP and parallel to VP shows true length in?", a:"Top View", b:"Front View", c:"Side View", d:"None", ans:"b"},
        {q:"Which line is used for Center lines?", a:"Dashed", b:"Chain thin", c:"Thick", d:"Zig-zag", ans:"b"},
        {q:"Projection of a point 20mm below HP and 30mm behind VP is in?", a:"1st Quad", b:"2nd Quad", c:"3rd Quad", d:"4th Quad", ans:"c"},
        {q:"If a plane is parallel to HP, its Front View is a?", a:"True shape", b:"Line parallel to XY", c:"Point", d:"None", ans:"b"},
        {q:"The angle of a regular hexagon is?", a:"90°", b:"108°", c:"120°", d:"60°", ans:"c"},
        {q:"Representative Fraction (RF) is?", a:"Length on drawing / Actual length", b:"Actual / Drawing", c:"Length²", d:"None", ans:"a"},
        {q:"A tetrahedron has ____ triangular faces.", a:"3", b:"4", c:"5", d:"6", ans:"b"},
        {q:"When a cone is cut parallel to its base, the section is a?", a:"Ellipse", b:"Circle", c:"Triangle", d:"Parabola", ans:"b"},
        {q:"Isometric view of a sphere is?", a:"Circle", b:"Ellipse", c:"Point", d:"None", ans:"a"},
        {q:"Short break lines are drawn?", a:"Straight", b:"Freehand wavy", c:"Chain thin", d:"Dashed", ans:"b"},
        {q:"A prism is named based on its?", a:"Height", b:"Base shape", c:"Weight", d:"Color", ans:"b"},
        {q:"Angle between HP and VP is?", a:"0°", b:"90°", c:"180°", d:"45°", ans:"b"},
        {q:"If RF > 1, the scale is?", a:"Reducing", b:"Enlarging", c:"Full", d:"None", ans:"b"},
        {q:"Dimension lines should be at least ____ mm away from outlines.", a:"2", b:"8", c:"20", d:"50", ans:"b"},
        {q:"Development of surfaces of a cylinder is a?", a:"Circle", b:"Rectangle", c:"Triangle", d:"Sector", ans:"b"},
        {q:"A point in 4th quadrant is?", a:"Above HP, In front VP", b:"Below HP, In front VP", c:"Below HP, Behind VP", d:"Above HP, Behind VP", ans:"b"},
        {q:"Front View of a square pyramid resting on its base on HP is?", a:"Square", b:"Triangle", c:"Rectangle", d:"Circle", ans:"b"},
        {q:"Sectional views are used to show?", a:"Outer details", b:"Internal details", c:"Color", d:"Weight", ans:"b"},
        {q:"Length of an Isometric line in Isometric drawing is?", a:"Actual", b:"Reduced", c:"Enlarged", d:"Zero", ans:"a"},
        {q:"Hatching lines are another name for?", a:"Hidden lines", b:"Section lines", c:"Center lines", d:"Outlines", ans:"b"},
        {q:"How many principal planes of projection are there?", a:"1", b:"2", c:"3", d:"4", ans:"c"},
        {q:"The intersection of HP and VP is called?", a:"Origin", b:"Reference Line (XY)", c:"Point", d:"None", ans:"b"},
        {q:"Leader lines are used for?", a:"Drawing object", b:"Indicating dimensions/notes", c:"Hidden parts", d:"None", ans:"b"},
        {q:"An equilateral triangle has all angles equal to?", a:"45°", b:"60°", c:"90°", d:"120°", ans:"b"},
        {q:"Which type of scale shows three units (m, dm, cm)?", a:"Plain scale", b:"Diagonal scale", c:"Vernier scale", d:"None", ans:"b"},
        {q:"Traces of a line are?", a:"Points of intersection with planes", b:"Lengths", c:"Angles", d:"None", ans:"a"},
        {q:"Development of a cone is a?", a:"Triangle", b:"Sector of a circle", c:"Rectangle", d:"Square", ans:"b"},
        {q:"Auxiliary planes are used for?", a:"True shape of inclined surfaces", b:"Front view", c:"Top view", d:"None", ans:"a"},
        {q:"Which is the largest drawing sheet size?", a:"A0", b:"A1", c:"A4", d:"A5", ans:"a"},
        {q:"Perspective projection is used by?", a:"Architects", b:"Engineers", c:"Artists", d:"All of these", ans:"d"},
        {q:"Full form of CAD?", a:"Computer Aided Design", b:"Code Aided Data", c:"Complex Auto Drawing", d:"None", ans:"a"}
    ];

    function openGraphTest() {
        document.getElementById('graphOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('graphQuizArea');
        area.innerHTML = "";
        
        graphData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            
            card.innerHTML = `
                <div style="background:#eceff1; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#455a64; border-left:4px solid #607d8b;">Engineering Graphics</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#f5f7f8; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="graphq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#f5f7f8; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="graphq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#f5f7f8; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="graphq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#f5f7f8; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="graphq${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcGraphResult() {
        let corr = 0, wrng = 0, skip = 0;
        graphData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="graphq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('graph-corr').innerText = corr;
        document.getElementById('graph-wrng').innerText = wrng;
        document.getElementById('graph-skip').innerText = skip;
        document.getElementById('perc-graph').innerText = Math.round((corr / graphData.length) * 100) + "%";
        document.getElementById('res-modal-graph').style.display = 'flex';
    }

    function closeGraphTest() {
        document.getElementById('graphOverlay').style.display = 'none';
        document.getElementById('res-modal-graph').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
