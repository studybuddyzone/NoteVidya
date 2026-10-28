
    const m2Data = [
        {q: "The order of differential equation (d²y/dx²)³ + (dy/dx)⁴ + y = 0 is?", a: "3", b: "2", c: "4", d: "1", ans: "b"},
        {q: "The degree of differential equation d²y/dx² = [1+(dy/dx)²]^{3/2} is?", a: "2", b: "3", c: "1", d: "Not defined", ans: "a"},
        {q: "Complementary function (C.F.) for (D²-6D+9)y = 0 is?", a: "(C1+C2x)e³ˣ", b: "C1e³ˣ + C2e⁻³ˣ", c: "C1 cos 3x", d: "None", ans: "a"},
        {q: "Particular Integral (P.I.) of (D-1)y = eˣ is?", a: "eˣ", b: "xeˣ", c: "x²eˣ", d: "0", ans: "b"},
        {q: "The general solution of dy/dx + Py = Q is?", a: "y(IF) = ∫Q(IF)dx + c", b: "y = ∫Q dx", c: "x(IF) = ∫Q dy", d: "None", ans: "a"},
        {q: "Solution of (D²+4)y = 0 is?", a: "C1 cos 2x + C2 sin 2x", b: "C1e²ˣ", c: "C1+C2x", d: "e²ˣ(C1+C2)", ans: "a"},
        {q: "Integrating factor (I.F.) for dy/dx + (1/x)y = x² is?", a: "log x", b: "x", c: "eˣ", d: "1/x", ans: "b"},
        {q: "Differential equation of all circles passing through origin is of order?", a: "1", b: "2", c: "3", d: "0", ans: "b"},
        {q: "PI for (D²+1)y = sin x is?", a: "-x/2 cos x", b: "x/2 sin x", c: "cos x", d: "0", ans: "a"},
        {q: "Roots of AE for (D²-1)y = 0 are?", a: "1, -1", b: "1, 1", c: "i, -i", d: "0, 1", ans: "a"},
        {q: "The value of a₀ in Fourier series for f(x) in (c, c+2L) is?", a: "1/L ∫f(x)dx", b: "1/2L ∫f(x)dx", c: "2/L ∫f(x)dx", d: "∫f(x)dx", ans: "a"},
        {q: "If f(x) is an even function in (-π, π), then?", a: "bn = 0", b: "an = 0", c: "a₀ = 0", d: "None", ans: "a"},
        {q: "If f(x) is an odd function, then Fourier series contains?", a: "Only Sine terms", b: "Only Cosine terms", c: "Both", d: "None", ans: "a"},
        {q: "The period of function f(x) = sin(2x) is?", a: "2π", b: "π", c: "π/2", d: "4π", ans: "b"},
        {q: "For function f(x) = x² in (-π, π), bn is?", a: "π", b: "0", c: "1", d: "-1", ans: "b"},
        {q: "Half range sine series for f(x) in (0, L) has?", a: "Only bn", b: "Only an", c: "a₀ and an", d: "None", ans: "a"},
        {q: "Value of ∫ sin(nx) dx from -π to π is?", a: "2π", b: "0", c: "π", d: "1", ans: "b"},
        {q: "Dirichlet's conditions are sufficient for?", a: "Convergence of Fourier series", b: "Differentiation", c: "Limits", d: "Integration", ans: "a"},
        {q: "RMS value of f(x) in (a, b) is?", a: "√[1/(b-a) ∫f²(x)dx]", b: "∫f(x)dx", c: "1/(b-a)", d: "None", ans: "a"},
        {q: "If f(x) = |x|, it is an?", a: "Even function", b: "Odd function", c: "Neither", d: "Constant", ans: "a"},
        {q: "Value of Γ(1/2) is equal to?", a: "π", b: "√π", c: "1", d: "1/2", ans: "b"},
        {q: "Relation between Beta and Gamma is β(m,n) = ?", a: "ΓmΓn / Γ(m+n)", b: "Γm + Γn", c: "Γ(m+n)", d: "1", ans: "a"},
        {q: "Value of Γ(1) is?", a: "0", b: "1", c: "∞", d: "π", ans: "b"},
        {q: "Γ(n+1) for any real n > 0 is?", a: "n!", b: "n Γn", c: "Both A and B", d: "None", ans: "b"},
        {q: "Value of β(1,1) is?", a: "1", b: "0", c: "1/2", d: "2", ans: "a"},
        {q: "Value of Γ(3/2) is?", a: "√π / 2", b: "√π", c: "1/2", d: "π", ans: "a"},
        {q: "Integral ∫ (0 to ∞) e⁻ˣ xⁿ⁻¹ dx is?", a: "Γn", b: "βn", c: "eⁿ", d: "0", ans: "a"},
        {q: "Value of β(1/2, 1/2) is?", a: "π", b: "√π", c: "1", d: "0", ans: "a"},
        {q: "Γ(n) is convergent for?", a: "n > 0", b: "n < 0", c: "n = 0", d: "Always", ans: "a"},
        {q: "Value of Γ(5) is?", a: "24", b: "120", c: "5", d: "4", ans: "a"},
        {q: "If u = f(x,y) is homogeneous of degree n, then xux + yuy = ?", a: "u", b: "nu", c: "0", d: "n(n-1)u", ans: "b"},
        {q: "Total derivative of u(x,y) is du = ?", a: "ux dx + uy dy", b: "ux + uy", c: "dx + dy", d: "0", ans: "a"},
        {q: "If u = sin(x/y), then degree n is?", a: "1", b: "0", c: "2", d: "-1", ans: "b"},
        {q: "Euler's theorem for second order is x²uxx + 2xyuxy + y²uyy = ?", a: "n(n-1)u", b: "nu", c: "n²u", d: "u", ans: "a"},
        {q: "Jacobian ∂(u,v)/∂(x,y) is also called?", a: "Functional determinant", b: "Limit", c: "Matrix", d: "None", ans: "a"},
        {q: "If x = r cosθ, y = r sinθ, then Jacobian J is?", a: "r", b: "r²", c: "1", d: "0", ans: "a"},
        {q: "Condition for u and v to be functionally dependent is J = ?", a: "1", b: "0", c: "Infinite", d: "-1", ans: "b"},
        {q: "If u = x + y, v = xy, then ∂u/∂x is?", a: "1", b: "y", c: "0", d: "x", ans: "a"},
        {q: "Partial derivative of u with respect to x means?", a: "Treat y as constant", b: "Treat x as constant", c: "Differentiate both", d: "None", ans: "a"},
        {q: "Maximum/Minimum occurs when ux and uy are?", a: "1", b: "0", c: "Infinite", d: "-1", ans: "b"},
        {q: "Area of region R in double integral is?", a: "∫∫ dxdy", b: "∫∫ x dxdy", c: "∫ dx", d: "∫ y dy", ans: "a"},
        {q: "Volume of solid is given by?", a: "∫∫∫ dx dy dz", b: "∫∫ dx dy", c: "∫ dx", d: "None", ans: "a"},
        {q: "In triple integral, order of integration?", a: "Depends on limits", b: "Always dz dy dx", c: "Is fixed", d: "None", ans: "a"},
        {q: "Change of variables in double integral uses?", a: "Jacobian", b: "Limit", c: "Derivative", d: "None", ans: "a"},
        {q: "Value of ∫(0 to 1) ∫(0 to 1) dx dy is?", a: "1", b: "0", c: "0.5", d: "2", ans: "a"},
        {q: "Value of ∫(0 to π) ∫(0 to sinθ) r dr dθ represents?", a: "Area", b: "Volume", c: "Length", d: "None", ans: "a"},
        {q: "Polar coordinates are (r, θ), then dx dy becomes?", a: "dr dθ", b: "r dr dθ", c: "r² dr dθ", d: "None", ans: "b"},
        {q: "Double integral over a circle x²+y²=a² is easier in?", a: "Polar form", b: "Cartesian form", c: "Matrix form", d: "None", ans: "a"},
        {q: "Integration of constant 1 over region R gives?", a: "Area of R", b: "0", c: "1", d: "None", ans: "a"},
        {q: "Gamma function is used to solve integrals of type?", a: "e⁻ˣ xⁿ", b: "sin x", c: "log x", d: "None", ans: "a"}
    ];

    function openMathsTest() {
        document.getElementById('mathsOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('quizDisplayArea');
        area.innerHTML = "";
        m2Data.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            card.innerHTML = `<p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#fff0f5; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m2q${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#fff0f5; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m2q${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#fff0f5; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m2q${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#fff0f5; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m2q${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcM2Result() {
        let corr = 0, wrng = 0, skip = 0;
        m2Data.forEach((item, index) => {
            const sel = document.querySelector(`input[name="m2q${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('corr-count').innerText = corr;
        document.getElementById('wrng-count').innerText = wrng;
        document.getElementById('skip-count').innerText = skip;
        document.getElementById('perc-m2').innerText = Math.round((corr / m2Data.length) * 100) + "%";
        document.getElementById('res-modal-m2').style.display = 'flex';
    }

    function closeMathsTest() {
        document.getElementById('mathsOverlay').style.display = 'none';
        document.getElementById('res-modal-m2').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
