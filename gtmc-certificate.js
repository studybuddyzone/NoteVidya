/* Swayam (GRAMIN Technical and Management Campus x ASTRA) certificate: browser preview + PNG / PDF download.
   Shared by event-gtmc.html (students), master.html (admin) and event-gtmc-certificate.html (design preview).
   The design is the picture /assets/swayam-cert-bg.jpg (same picture the server PDF uses: lib/gtmc-cert-bg.js).
   Only 5 values are printed on top of it: name, branch, year, PRN / EN, certificate ID. The Principal / Director signature is blank for now. */
(function (w) {
  var DW = 1536, DH = 1024;
  var imgs = { bg: '', tick: '', gtmc: '', astra: '' };
  var NAVY = '#15235a';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function toDataUrl(url) {
    return fetch(url).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (res) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.readAsDataURL(b); });
    }).catch(function () { return ''; });
  }

  // Text is shrunk (never stretched) so long names / branches stay inside their line. Same positions as lib/gtmc-certificate-pdf.js.
  var ctx = null;
  function textW(font, text) { ctx = ctx || document.createElement('canvas').getContext('2d'); ctx.font = font + ' 100px "Times New Roman", Times, "Liberation Serif", serif'; return ctx.measureText(text).width / 100; }
  function fit(font, text, p) { return Math.max(p.min, Math.min(p.max, p.maxW / Math.max(textW(font, text), 0.01))); }
  var POS = {
    name: { cx: 768, y: 588, max: 86, maxW: 640, min: 30 }, branch: { cx: 281, y: 752, max: 27, maxW: 215, min: 14 },
    year: { cx: 552, y: 753, max: 28, maxW: 200, min: 14 }, prn: { cx: 1222, y: 752, max: 23, maxW: 235, min: 12 }
  };

  // the site's OWN logos, round with a gold ring (same spots as lib/gtmc-certificate-pdf.js)
  function logo(href, id, cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="#b8861f" stroke-width="7"/>' +
      '<clipPath id="' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 6) + '"/></clipPath>' +
      (href ? '<image href="' + href + '" x="' + (cx - r + 6) + '" y="' + (cy - r + 6) + '" width="' + (2 * r - 12) + '" height="' + (2 * r - 12) + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + id + ')"/>' : '');
  }

  function stamp() {
    var d = new Date(Date.now() + 330 * 60000), p2 = function (n) { return String(n).padStart(2, '0'); }, h = d.getUTCHours();
    return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()) + ' ' + p2(h % 12 || 12) + ':' + p2(d.getUTCMinutes()) + ' ' + (h >= 12 ? 'PM' : 'AM') + ' IST';
  }

  function buildSvg(d, sample) {
    var name = esc(d.name), branch = esc(d.branch), year = esc(d.year), prn = esc(d.prn), cid = esc(d.certificate_id);
    var serif = 'font-family="\'Times New Roman\', Times, \'Liberation Serif\', serif" fill="' + NAVY + '" text-anchor="middle"';
    var sans = 'font-family="Helvetica, Arial, sans-serif" fill="#1f1f1f" font-size="15"';
    var t = function (p, str, font, weight, style) {
      var size = fit((style || '') + ' ' + (weight || '') + ' ', String(d[str]), p);
      return '<text x="' + p.cx + '" y="' + p.y + '" font-size="' + size.toFixed(1) + '"' + (weight ? ' font-weight="' + weight + '"' : '') + (style ? ' font-style="' + style + '"' : '') + ' ' + serif + '>' + esc(d[str]) + '</text>';
    };
    var cidSize = 18, cidW = textW('bold', String(d.certificate_id)) * cidSize, n = String(d.certificate_id).length;
    var cidSp = n > 1 ? Math.max(0, Math.min(3, (176 - cidW) / (n - 1))) : 0;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + DW + '" height="' + DH + '" viewBox="0 0 ' + DW + ' ' + DH + '">' +
      '<image href="' + imgs.bg + '" x="0" y="0" width="' + DW + '" height="' + DH + '"/>' +
      logo(imgs.gtmc, 'lg1', 226, 130, 80) + logo(imgs.astra, 'lg2', 1317, 140, 80) +
      t(POS.name, 'name', null, '', 'italic') + t(POS.branch, 'branch') + t(POS.year, 'year') + t(POS.prn, 'prn', null, 'bold') +
      '<text x="768" y="940" font-size="' + cidSize + '" font-weight="bold" letter-spacing="' + cidSp.toFixed(2) + '" ' + serif + '>' + cid + '</text>' +
      // left signature area: the "Digitally signed" stamp (the real cryptographic signature is only in the server PDF)
      '<text x="274" y="866" ' + sans + '>Digitally signed by</text><text x="274" y="887" ' + sans + '>SBPP Support</text><text x="274" y="908" ' + sans + '>Date: ' + stamp() + '</text>' +
      (imgs.tick ? '<image href="' + imgs.tick + '" x="' + (438 - 41) + '" y="844" width="82" height="84" preserveAspectRatio="xMidYMid meet" style="mix-blend-mode:multiply"/>' : '') +
      // right signature area (Principal / Director): intentionally blank
      (sample ? '<text x="768" y="640" text-anchor="middle" font-size="300" font-weight="700" fill="#b00020" opacity=".12" transform="rotate(-20 768 512)" font-family="Arial, sans-serif">SAMPLE</text>' : '') +
      '</svg>';
  }

  var ready = null;
  function load() {
    if (!ready) ready = Promise.all([toDataUrl('/assets/swayam-cert-bg.jpg'), toDataUrl('/assets/sbpp-tick.png'), toDataUrl('/assets/gtmc-logo.jpg'), toDataUrl('/assets/astra-logo.jpg')]).then(function (r) { imgs.bg = r[0]; imgs.tick = r[1]; imgs.gtmc = r[2]; imgs.astra = r[3]; });
    return ready;
  }
  function toCanvas(d, sample) {
    return load().then(function () {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(new Blob([buildSvg(d, sample)], { type: 'image/svg+xml;charset=utf-8' }));
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = DW * 2; c.height = DH * 2;
          var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
          x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c);
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('render')); };
        img.src = url;
      });
    });
  }
  function stem(d) { return 'Swayam_Certificate_' + String(d.name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  w.GtmcCert = {
    render: function (el, d, sample) { return load().then(function () { el.innerHTML = buildSvg(d, sample); }); },
    png: function (d, sample) {
      return toCanvas(d, sample).then(function (c) {
        c.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = stem(d) + '.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }, 'image/png');
      });
    },
    // Signed PDF: the SERVER builds the certificate from verified data and signs it with the .p12 (see lib/sign-pdf.js).
    signedPdf: function (action, body) {
      return fetch('/api/event?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) {
          if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.message || 'PDF nahi ban payi.'); });
          var name = ((r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/) || [])[1] || 'Swayam_Certificate.pdf';
          return r.blob().then(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); });
        });
    },
    pdf: function (d, sample) {
      if (!w.jspdf) return Promise.reject(new Error('pdf-lib'));
      return toCanvas(d, sample).then(function (c) {
        var pdf = new w.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: [297, 198] });
        pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 198);
        pdf.save(stem(d) + '.pdf');
      });
    }
  };
})(window);
