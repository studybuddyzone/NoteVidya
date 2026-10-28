const test = require("node:test");
const assert = require("node:assert");
const { addSri, pinned } = require("../scripts/add-sri");
const fake = () => "sha384-TEST";

test("pinned CDN scripts get integrity + crossorigin", () => {
  const r = addSri('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>', fake);
  assert.match(r.html, /integrity="sha384-TEST" crossorigin="anonymous"><\/script>/);
  assert.equal(r.changed.length, 1);
});
test("stylesheet links are covered, other links are not", () => {
  const css = addSri('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">', fake);
  assert.match(css.html, /integrity=/);
  const icon = addSri('<link rel="icon" href="https://cdnjs.cloudflare.com/ajax/libs/x/1.0.0/i.png">', fake);
  assert.doesNotMatch(icon.html, /integrity/);
});
test("unpinned / dynamic third-party URLs are skipped", () => {
  for (const u of ["https://cdn.jsdelivr.net/npm/chart.js", "https://cdn.jsdelivr.net/npm/x@latest/a.js", "https://sdk.cashfree.com/js/v3/cashfree.js", "https://cdn.tailwindcss.com"])
    assert.equal(pinned(u), false, u);
  assert.equal(pinned("https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"), true);
  assert.equal(pinned("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"), true);
});
test("tags that already have integrity or a local src are untouched; existing crossorigin is not duplicated", () => {
  const a = '<script src="https://cdn.jsdelivr.net/npm/x@1.2.3/a.js" integrity="sha384-ORIG" crossorigin="anonymous"></script>';
  assert.equal(addSri(a, fake).html, a);
  const b = '<script src="/js/auth.js"></script>';
  assert.equal(addSri(b, fake).html, b);
  const c = addSri('<script src="https://cdn.jsdelivr.net/npm/x@1.2.3/a.js" crossorigin="anonymous"></script>', fake).html;
  assert.equal((c.match(/crossorigin/g) || []).length, 1);
});
