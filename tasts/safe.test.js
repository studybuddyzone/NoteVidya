const test = require("node:test");
const assert = require("node:assert");
const { sbzEsc, sbzUrl, sbzJs } = require("../js/sbz-safe");

test("sbzEsc escapes html + quotes", () => {
  assert.equal(sbzEsc('<img src=x onerror="a()">'), "&lt;img src=x onerror=&quot;a()&quot;&gt;");
  assert.equal(sbzEsc(null), ""); assert.equal(sbzEsc(0), "0");
});
test("sbzUrl blocks script schemes (even obfuscated) but keeps normal and deep links", () => {
  assert.equal(sbzUrl("javascript:alert(1)"), "#");
  assert.equal(sbzUrl(" Java\tScript:alert(1)"), "#");
  assert.equal(sbzUrl("data:text/html,<script>1</script>"), "#");
  assert.equal(sbzUrl("https://a.com/x?y=1&z=2"), "https://a.com/x?y=1&amp;z=2");
  assert.equal(sbzUrl("upi://pay?pa=a@b"), "upi://pay?pa=a@b");
  assert.equal(sbzUrl("note-bee"), "note-bee");
  assert.ok(sbzUrl("data:image/png;base64,AAA").startsWith("data:image/png"));
  assert.equal(sbzUrl('x" onerror="a()'), "x&quot; onerror=&quot;a()");
});
test("sbzJs is safe inside onclick='fn(\\'..\\')'", () => {
  const out = sbzJs("a');alert(1);//");
  assert.ok(!out.includes("'"));
  assert.ok(out.includes("\\"));
});
