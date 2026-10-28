
// 🚀 "Continue to your branch" shortcut on the TY dashboard
window.updateMyBranchCta = function () {
    var b = window._userBranch || '';
    var files = { civil:'TY-civil', cs:'TY-cs', aiml:'TY-aiml', entc:'TY-entc', electrical:'TY-electrical' };
    var names = { civil:'Civil Engineering', cs:'Computer Science & Engineering', aiml:'AI/ML & AI/DS', entc:'Electronics & Telecom Engg.', electrical:'Electrical Engineering' };
    var el = document.getElementById('myBranchCta');
    if (!el) return;
    if (files[b]) {
        el.href = files[b];
        document.getElementById('mbcName').textContent = names[b];
        el.style.display = 'flex';
    } else { el.style.display = 'none'; }
};
