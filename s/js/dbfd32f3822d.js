
    const m1Data = [
        {section: "Matrices", q: "A square matrix A is called symmetric if?", a: "A' = -A", b: "A' = A", c: "A = 0", d: "A is singular", ans: "b"},
        {section: "Matrices", q: "If the determinant of a matrix is zero, it is called?", a: "Identity matrix", b: "Singular matrix", c: "Non-singular", d: "Orthogonal", ans: "b"},
        {section: "Matrices", q: "The rank of a unit matrix of order n is?", a: "0", b: "1", c: "n", d: "n-1", ans: "c"},
        {section: "Matrices", q: "The Eigen values of a real symmetric matrix are always?", a: "Complex", b: "Real", c: "Zero", d: "Imaginary", ans: "b"},
        {section: "Calculus", q: "The derivative of log(sec x) is?", a: "sec x", b: "tan x", c: "cot x", d: "cos x", ans: "b"},
        {section: "Successive Differentiation", q: "The nth derivative of e^(ax) is?", a: "e^(ax)", b: "a^n e^(ax)", c: "a e^(ax)", d: "n! e^(ax)", ans: "b"},
        {section: "Partial Differentiation", q: "Euler's theorem is applicable to?", a: "Implicit functions", b: "Homogeneous functions", c: "Explicit functions", d: "All functions", ans: "b"},
        {section: "Complex Numbers", q: "The value of i^2 is?", a: "1", b: "-1", c: "0", d: "i", ans: "b"},
        {section: "Complex Numbers", q: "The polar form of a complex number z = x + iy is?", a: "r(cos θ - i sin θ)", b: "r(cos θ + i sin θ)", c: "r sin θ", d: "None", ans: "b"},
        {section: "Expansion of Functions", q: "Taylor's series expansion is about x = ?", a: "0", b: "a", c: "Infinity", d: "1", ans: "b"},
        {section: "Matrices", q: "Characteristic equation of matrix A is given by?", a: "|A - λI| = 0", b: "Aλ = I", c: "A = λI", d: "|A| = λ", ans: "a"},
        {section: "Matrices", q: "Trace of a matrix is the sum of its?", a: "Rows", b: "Diagonal elements", c: "Columns", d: "All elements", ans: "b"},
        {section: "Successive Differentiation", q: "Leibnitz's theorem is used to find the nth derivative of?", a: "Sum of two functions", b: "Product of two functions", c: "Quotient", d: "None", ans: "b"},
        {section: "Partial Differentiation", q: "If u = f(x,y), then ∂²u/∂x∂y is equal to?", a: "∂²u/∂y²", b: "∂²u/∂y∂x", c: "∂u/∂x", d: "0", ans: "b"},
        {section: "Linear Systems", q: "Cramer's rule is used for solving?", a: "Quadratic equations", b: "System of linear equations", c: "Integrals", d: "Limits", ans: "b"},
        {section: "Complex Numbers", q: "De Moivre's Theorem states (cos θ + i sin θ)^n = ?", a: "cos nθ - i sin nθ", b: "cos nθ + i sin nθ", c: "n(cos θ + i sin θ)", d: "None", ans: "b"},
        {section: "Expansion of Functions", q: "Maclaurin's series is Taylor's series when a = ?", a: "1", b: "0", c: "-1", d: "π", ans: "b"},
        {section: "Indeterminate Forms", q: "L'Hospital's rule is applied to forms like?", a: "0/0 or ∞/∞", b: "1/0", c: "∞/0", d: "0/1", ans: "a"},
        {section: "Matrices", q: "A matrix A is orthogonal if?", a: "AA' = I", b: "A = A'", c: "A = -A'", d: "Det(A) = 0", ans: "a"},
        {section: "Matrices", q: "Inverse of a matrix A exists only if?", a: "|A| = 0", b: "|A| ≠ 0", c: "A is square", d: "Both b and c", ans: "d"},
        {section: "Partial Differentiation", q: "If u = x^n f(y/x) is homogeneous of degree n, then x(∂u/∂x) + y(∂u/∂y) = ?", a: "0", b: "nu", c: "(n-1)u", d: "u", ans: "b"},
        {section: "Jacobians", q: "The Jacobian J(u,v/x,y) is defined as a?", a: "Matrix", b: "Determinant", c: "Vector", d: "Limit", ans: "b"},
        {section: "Complex Numbers", q: "Real part of e^(iθ) is?", a: "sin θ", b: "cos θ", c: "tan θ", d: "1", ans: "b"},
        {section: "Complex Numbers", q: "Imaginary part of e^(iθ) is?", a: "cos θ", b: "sin θ", c: "0", d: "e", ans: "b"},
        {section: "Matrices", q: "The Eigen values of a triangular matrix are its?", a: "Zero elements", b: "Diagonal elements", c: "Trace", d: "None", ans: "b"},
        {section: "Calculus", q: "Radius of curvature for a straight line is?", a: "0", b: "Infinite", c: "1", d: "Constant", ans: "b"},
        {section: "Indeterminate Forms", q: "Value of lim (x→0) (sin x / x) is?", a: "0", b: "1", c: "∞", d: "-1", ans: "b"},
        {section: "Successive Differentiation", q: "nth derivative of log(ax+b) is?", a: "1/(ax+b)", b: "(-1)^(n-1) (n-1)! a^n / (ax+b)^n", c: "n!/(ax+b)", d: "None", ans: "b"},
        {section: "Matrices", q: "Cayley-Hamilton theorem states every square matrix satisfies its own?", a: "Rank", b: "Characteristic equation", c: "Inverse", d: "Adjoint", ans: "b"},
        {section: "Complex Numbers", q: "Logarithm of a complex number is?", a: "Single valued", b: "Multi-valued", c: "Always real", d: "Zero", ans: "b"},
        {section: "Calculus", q: "Point where curvature changes sign is called?", a: "Stationary point", b: "Point of inflexion", c: "Node", d: "Cusp", ans: "b"},
        {section: "Partial Differentiation", q: "Total derivative du for u(x,y) is?", a: "(∂u/∂x)dx + (∂u/∂y)dy", b: "(∂u/∂x)dx", c: "(∂u/∂y)dy", d: "0", ans: "a"},
        {section: "Jacobians", q: "If u, v are functions of x, y and J ≠ 0, then u, v are?", a: "Dependent", b: "Independent", c: "Constant", d: "Zero", ans: "b"},
        {section: "Matrices", q: "Product of Eigen values is equal to?", a: "Trace", b: "Determinant", c: "Rank", d: "0", ans: "b"},
        {section: "Matrices", q: "Sum of Eigen values is equal to?", a: "Determinant", b: "Trace", c: "1", d: "n", ans: "b"},
        {section: "Expansion", q: "Expansion of e^x is?", a: "1 - x + x²/2!...", b: "1 + x + x²/2! + x³/3!...", c: "x - x²/2...", d: "None", ans: "b"},
        {section: "Complex Numbers", q: "Modulus of 3 + 4i is?", a: "7", b: "5", c: "25", d: "1", ans: "b"},
        {section: "Complex Numbers", q: "Argument of 1 + i is?", a: "0", b: "π/4", c: "π/2", d: "π", ans: "b"},
        {section: "Matrices", q: "An idempotent matrix satisfies?", a: "A² = I", b: "A² = A", c: "A' = A", d: "A = 0", ans: "b"},
        {section: "Matrices", q: "A nilpotent matrix of index k satisfies?", a: "A^k = I", b: "A^k = 0", c: "A = kI", d: "None", ans: "b"},
        {section: "Partial Differentiation", q: "If f(x,y) has a maximum at (a,b), then f_x and f_y are?", a: "1", b: "0", c: "Infinite", d: "Undefined", ans: "b"},
        {section: "Calculus", q: "The curve y = cos x is symmetric about?", a: "Origin", b: "Y-axis", c: "X-axis", d: "Line y=x", ans: "b"},
        {section: "Complex Numbers", q: "Hyperbolic function sinh x is?", a: "(e^x + e^-x)/2", b: "(e^x - e^-x)/2", c: "e^x", d: "cos ix", ans: "b"},
        {section: "Complex Numbers", q: "cosh²x - sinh²x = ?", a: "0", b: "1", c: "-1", d: "2", ans: "b"},
        {section: "Matrices", q: "For a system AX=B, if |A|≠0, the system has?", a: "No solution", b: "Unique solution", c: "Infinite solutions", d: "None", ans: "b"},
        {section: "Matrices", q: "Crout's method is used for?", a: "Integration", b: "Matrix Factorization (LU)", c: "Differentiation", d: "None", ans: "b"},
        {section: "Expansion", q: "Expansion of sin x starts with?", a: "1", b: "x", c: "x²", d: "cos x", ans: "b"},
        {section: "Expansion", q: "Expansion of cos x contains only?", a: "Odd powers of x", b: "Even powers of x", c: "Constant", d: "None", ans: "b"},
        {section: "Jacobians", q: "If x = r cos θ, y = r sin θ, then J(x,y/r,θ) is?", a: "1", b: "r", c: "r²", d: "0", ans: "b"},
        {section: "Successive Differentiation", q: "nth derivative of (ax+b)^m where m > n is?", a: "0", b: "m!/(m-n)! * a^n * (ax+b)^(m-n)", c: "m! a^n", d: "None", ans: "b"}
    ];

    function openM1Test() {
        document.getElementById('m1Overlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('m1QuizArea');
        area.innerHTML = "";
        
        m1Data.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:white; border-radius:20px; padding:25px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.1); color:black;";
            
            card.innerHTML = `
                <div style="background:#e3f2fd; padding:5px 15px; border-radius:10px; display:inline-block; margin-bottom:10px; font-size:12px; font-weight:bold; color:#1565c0; border-left:4px solid #2980b9;">${data.section}</div>
                <p style="font-weight:800; font-size:17px;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m1q${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m1q${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m1q${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; background:#f1f8ff; padding:12px; border-radius:12px; cursor:pointer;"><input type="radio" name="m1q${index}" value="d"> D) ${data.d}</label>`;
            area.appendChild(card);
        });
    }

    function calcM1Result() {
        let corr = 0, wrng = 0, skip = 0;
        m1Data.forEach((item, index) => {
            const sel = document.querySelector(`input[name="m1q${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('m1-corr').innerText = corr;
        document.getElementById('m1-wrng').innerText = wrng;
        document.getElementById('m1-skip').innerText = skip;
        document.getElementById('perc-m1').innerText = Math.round((corr / m1Data.length) * 100) + "%";
        document.getElementById('res-modal-m1').style.display = 'flex';
    }

    function closeM1Test() {
        document.getElementById('m1Overlay').style.display = 'none';
        document.getElementById('res-modal-m1').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
