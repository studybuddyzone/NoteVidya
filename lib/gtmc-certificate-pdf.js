"use strict";
/**
 * Builds the Swayam (GTMC x ASTRA) participation certificate as a real, vector A4-landscape PDF on the SERVER
 * (so the digital signature in lib/sign-pdf.js can be applied to a document the server itself created from verified data).
 * Same design as gtmc-certificate.js (browser preview). Design units are 1/10 mm (2970 x 2100), converted to PDF points.
 *
 *   const pdf = await buildCertificatePdf({ name, branch, year, prn, certificate_id });   // -> Buffer (unsigned)
 */
const { PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, moveTo, appendBezierCurve, closePath, clip, endPath, BlendMode, degrees } = require("pdf-lib");
const { ASTRA_JPG_BASE64, GTMC_JPG_BASE64 } = require("./gtmc-logos");
const { TICK_PNG_BASE64 } = require("./sbpp-tick");

const W = 841.89, H = 595.28, K = W / 2970;
const SIGNER_LABEL = "SBPP Support";
const X = (x) => x * K, Y = (y) => H - y * K;
const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const COL = { maroon: hex("#5a0f2b"), green: hex("#0a7a33"), gold: hex("#bd8b25"), goldDark: hex("#a97a16"), goldLight: hex("#d9b655"), ink: hex("#6a4350"), cream: hex("#fffaf3"), white: hex("#ffffff"), pillLabel: hex("#f5cdd8"), pillId: hex("#ffe08a") };

function fit(text, sizes) { const n = String(text).length; for (const [max, size] of sizes) if (n <= max) return size; return sizes[sizes.length - 1][1]; }
// Standard PDF fonts only know Latin characters; anything else becomes "?" instead of crashing.
function safe(font, str) { return Array.from(String(str)).map((ch) => { try { font.widthOfTextAtSize(ch, 10); return ch; } catch (e) { return "?"; } }).join(""); }

function put(page, font, text, o) {
  const str = safe(font, text), size = o.size * K, sp = (o.sp || 0) * K, chars = Array.from(str);
  const w = chars.reduce((a, ch) => a + font.widthOfTextAtSize(ch, size), 0) + sp * Math.max(chars.length - 1, 0);
  let x = o.anchor === "end" ? X(o.x) - w : o.anchor === "start" ? X(o.x) : X(o.x) - w / 2;
  if (!sp) return page.drawText(str, { x, y: Y(o.y), size, font, color: o.color });
  for (const ch of chars) { page.drawText(ch, { x, y: Y(o.y), size, font, color: o.color }); x += font.widthOfTextAtSize(ch, size) + sp; }
}
const line = (page, x1, y1, x2, y2, w, color) => page.drawLine({ start: { x: X(x1), y: Y(y1) }, end: { x: X(x2), y: Y(y2) }, thickness: w * K, color });
const path = (page, d, opts) => page.drawSvgPath(d, Object.assign({ x: 0, y: H, scale: K }, opts));
const roundRect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

// pdf-lib's embedJpg() builds `new DataView(imageData.buffer)` and ignores `byteOffset`, so a Node Buffer that is only a VIEW into a
// larger/shared ArrayBuffer (Buffer pool, slice, concat) makes its JPEG check read the wrong bytes and throw "SOI not found in JPEG".
// `new Uint8Array(buffer)` always copies into a standalone ArrayBuffer (byteOffset 0, exact length), which is what pdf-lib needs.
function jpegBytes(b64) {
  const raw = Buffer.from(String(b64 || "").replace(/\s+/g, ""), "base64");
  const bytes = new Uint8Array(raw);
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("logo image is not a valid JPEG (missing SOI marker)");
  return bytes;
}
async function embedLogo(pdf, b64) {
  try { return await pdf.embedJpg(jpegBytes(b64)); }
  catch (e) { const err = new Error("logo embed failed: " + (e && e.message)); err.stage = "build"; throw err; }
}

// ---- helpers for the navy/gold design ----
const NAVY = hex("#0b2147"), GOLD = hex("#b8862b"), GOLD_L = hex("#dcb85e"), GOLD_D = hex("#8f6a1c"), PAPER = hex("#fbf9f3"), LAUREL = hex("#c9b27a");
// design size (units) so that text of `target` units width fits, given letter spacing `sp` (units)
function fitSize(font, text, sp, target) {
  const chars = Array.from(safe(font, text)); const w1 = chars.reduce((a, ch) => a + font.widthOfTextAtSize(ch, 1), 0);
  return (target - sp * Math.max(chars.length - 1, 0)) / w1;
}
// letter-spaced line made of coloured pieces: pieces = [[font, text, color], ...]
function putPieces(page, pieces, y, size, sp, cx) {
  const items = []; for (const [font, text, color] of pieces) for (const ch of Array.from(safe(font, text))) items.push([font, ch, color]);
  const ws = items.map(([f, ch]) => f.widthOfTextAtSize(ch, size * K)); const total = ws.reduce((a, b) => a + b, 0) + sp * K * (items.length - 1);
  let x = X(cx) - total / 2; items.forEach(([f, ch, color], i) => { page.drawText(ch, { x, y: Y(y), size: size * K, font: f, color }); x += ws[i] + sp * K; });
}
// text on a circle (PDF coordinates computed from design units); top = reads clockwise over the top, else along the bottom
function arcText(page, font, text, cx, cy, r, size, top, sp, color) {
  const chars = Array.from(safe(font, text)); const adv = chars.map((ch) => font.widthOfTextAtSize(ch, size * K) / K + sp);
  const total = adv.reduce((a, b) => a + b, 0) - sp, half = total / 2 / r;   // radians
  let acc = 0;
  chars.forEach((ch, i) => {
    const cw = font.widthOfTextAtSize(ch, size * K) / K, mid = acc + cw / 2; acc += adv[i];
    const th = top ? Math.PI / 2 + half - mid / r : 1.5 * Math.PI - half + mid / r;           // angle (math, y up)
    const rot = top ? th - Math.PI / 2 : th + Math.PI / 2;
    const px = X(cx) + r * K * Math.cos(th), py = (H - Y(cy)) * 0 + (Y(cy)) + r * K * Math.sin(th);
    page.drawText(ch, { x: px - (cw / 2) * K * Math.cos(rot), y: py - (cw / 2) * K * Math.sin(rot), size: size * K, font, color, rotate: degrees(rot * 180 / Math.PI) });
  });
}
const diamond = (page, cx, cy, s, color) => path(page, `M${cx} ${cy - s}L${cx + s} ${cy}L${cx} ${cy + s}L${cx - s} ${cy}Z`, { color });
function corner(page, ox, oy, sx, sy, a) {
  const b = a * 0.9, P = (x, y) => `${ox + sx * x} ${oy + sy * y}`;
  const tri = (a2, b2) => `M${P(0, 0)}L${P(a2, 0)}L${P(0, b2)}Z`;
  path(page, tri(a + 70, b + 63), { color: GOLD });
  path(page, tri(a + 38, b + 34), { color: GOLD_L });
  path(page, tri(a, b), { color: NAVY });
  const s0 = a * 0.52, s1 = s0 + 26; path(page, `M${P(s0, 0)}L${P(s1, 0)}L${P(0, s1 * 0.9)}L${P(0, s0 * 0.9)}Z`, { color: GOLD });
  const q0 = a * 0.7, q1 = q0 + 10; path(page, `M${P(q0, 0)}L${P(q1, 0)}L${P(0, q1 * 0.9)}L${P(0, q0 * 0.9)}Z`, { color: GOLD_L });
  line(page, ox + sx * (a + 125), oy, ox, oy + sy * (b + 112), 5, GOLD);
}
function laurel(page, cx, cy, R, a0, a1) {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t = a0 + ((a1 - a0) * i) / (n - 1), rad = (t * Math.PI) / 180, px = cx + R * Math.cos(rad), py = cy - R * Math.sin(rad);
    for (const side of [-1, 1]) {
      const ang = t + side * 38;
      page.drawEllipse({ x: X(px + side * 24 * Math.cos(rad)), y: Y(py - side * 24 * Math.sin(rad)), xScale: 20 * K, yScale: 52 * K, rotate: degrees(ang), color: LAUREL, opacity: 0.16 });
    }
  }
}

async function buildCertificatePdf(d, opts = {}) {
  const withStamp = !!(opts && opts.stamp);   // stamp + green tick only for the SIGNED pdf; any unsigned build stays without them
  const data = { name: String(d.name || "").trim(), branch: String(d.branch || "").trim(), year: String(d.year || "").trim(), prn: String(d.prn || "").trim(), cid: String(d.certificate_id || "").trim() };
  const pdf = await PDFDocument.create();
  pdf.setTitle("Swayam Certificate - " + safe(await pdf.embedFont(StandardFonts.Helvetica), data.name));
  pdf.setAuthor("Gramin Technical and Management Campus x ASTRA");
  pdf.setSubject("Certificate of Participation - Swayam (Website Designing)");
  pdf.setProducer("StudyBuddyZone");
  pdf.setCreator("StudyBuddyZone certificate service");
  const page = pdf.addPage([W, H]);
  const sans = await pdf.embedFont(StandardFonts.Helvetica), sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman), serifB = await pdf.embedFont(StandardFonts.TimesRomanBold), serifI = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  // background, frame, watermark laurels, corner bands
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  page.drawRectangle({ x: X(50), y: Y(2050), width: 2870 * K, height: 2000 * K, borderColor: GOLD, borderWidth: 9 * K });
  page.drawRectangle({ x: X(86), y: Y(2014), width: 2798 * K, height: 1928 * K, borderColor: GOLD_L, borderWidth: 3 * K });
  laurel(page, 1485, 1010, 830, 152, 208); laurel(page, 1485, 1010, 830, -28, 28);
  corner(page, 0, 0, 1, 1, 340); corner(page, 2970, 0, -1, 1, 340); corner(page, 0, 2100, 1, -1, 560); corner(page, 2970, 2100, -1, -1, 560);

  // logos: college (left) and ASTRA (right), round with gold ring
  const logo = async (b64, cx, cy, r) => {
    const img = await embedLogo(pdf, b64), k = 0.5523 * r;
    page.drawCircle({ x: X(cx), y: Y(cy), size: (r + 10) * K, color: hex("#ffffff"), borderColor: GOLD, borderWidth: 9 * K });
    page.pushOperators(pushGraphicsState(), moveTo(X(cx + r), Y(cy)),
      appendBezierCurve(X(cx + r), Y(cy - k), X(cx + k), Y(cy - r), X(cx), Y(cy - r)), appendBezierCurve(X(cx - k), Y(cy - r), X(cx - r), Y(cy - k), X(cx - r), Y(cy)),
      appendBezierCurve(X(cx - r), Y(cy + k), X(cx - k), Y(cy + r), X(cx), Y(cy + r)), appendBezierCurve(X(cx + k), Y(cy + r), X(cx + r), Y(cy + k), X(cx + r), Y(cy)),
      closePath(), clip(), endPath());
    page.drawImage(img, { x: X(cx - r), y: Y(cy + r), width: 2 * r * K, height: 2 * r * K });
    page.pushOperators(popGraphicsState());
  };
  await logo(GTMC_JPG_BASE64, 440, 262, 138); await logo(ASTRA_JPG_BASE64, 2540, 282, 148);

  // heading
  const hs = fitSize(serifB, "GRAMIN TECHNICAL AND", 5, 1330);
  put(page, serifB, "GRAMIN TECHNICAL AND", { x: 1485, y: 182, size: hs, sp: 5, color: NAVY });
  put(page, serifB, "MANAGEMENT CAMPUS", { x: 1485, y: 288, size: hs, sp: 5, color: NAVY });
  put(page, serif, "VISHNUPURI, NANDED", { x: 1485, y: 369, size: fitSize(serif, "VISHNUPURI, NANDED", 10, 716), sp: 10, color: NAVY });
  line(page, 835, 349, 1083, 349, 4, GOLD); line(page, 1886, 349, 2134, 349, 4, GOLD);

  // SWAYAM wordmark (gold "A"), directed by ASTRA
  const ws = fitSize(sansB, "SWAYAM", 8, 770);
  putPieces(page, [[sansB, "SW", NAVY], [sansB, "A", GOLD], [sansB, "Y", NAVY], [sansB, "A", GOLD], [sansB, "M", NAVY]], 548, ws, 8, 1485);
  put(page, serif, "DIRECTED BY ASTRA", { x: 1485, y: 607, size: fitSize(serif, "DIRECTED BY ASTRA", 14, 700), sp: 14, color: NAVY });
  line(page, 934, 582, 1093, 582, 4, GOLD); line(page, 1876, 582, 2036, 582, 4, GOLD);

  // CERTIFICATE / OF PARTICIPATION
  put(page, serifB, "CERTIFICATE", { x: 1485, y: 806, size: fitSize(serifB, "CERTIFICATE", 6, 1216), sp: 6, color: GOLD });
  put(page, serifB, "OF PARTICIPATION", { x: 1485, y: 892, size: fitSize(serifB, "OF PARTICIPATION", 18, 896), sp: 18, color: NAVY });
  line(page, 1354, 937, 1450, 937, 4, GOLD); line(page, 1520, 937, 1616, 937, 4, GOLD); diamond(page, 1485, 937, 16, GOLD); diamond(page, 1340, 937, 8, GOLD); diamond(page, 1630, 937, 8, GOLD);
  put(page, serif, "THIS CERTIFICATE IS PROUDLY PRESENTED TO", { x: 1485, y: 1019, size: fitSize(serif, "THIS CERTIFICATE IS PROUDLY PRESENTED TO", 7, 1164), sp: 7, color: NAVY });
  put(page, serifI, data.name, { x: 1485, y: 1190, size: fit(data.name, [[14, 170], [20, 140], [28, 110], [36, 88], [48, 68], [999, 54]]), color: NAVY });
  line(page, 830, 1243, 2140, 1243, 4, GOLD); diamond(page, 1485, 1243, 13, GOLD); diamond(page, 812, 1243, 8, GOLD); diamond(page, 2158, 1243, 8, GOLD);

  // body text (line 1 has a bold part)
  const bs = fitSize(serif, "organised by Gramin Technical and Management Campus in association with ASTRA.", 0, 1773);
  putPieces(page, [[serif, "for participating in the ", NAVY], [serifB, "Website Designing", NAVY], [serif, " competition of Swayam,", NAVY]], 1331, bs, 0, 1485);
  put(page, serif, "organised by Gramin Technical and Management Campus in association with ASTRA.", { x: 1485, y: 1403, size: bs, color: NAVY });

  // branch / year / PRN
  const cell = (cx, lw, label, value, font, size) => {
    put(page, font, value, { x: cx, y: 1541, size, color: NAVY });
    line(page, cx - lw / 2, 1569, cx + lw / 2, 1569, 4, NAVY);
    put(page, serif, label, { x: cx, y: 1625, size: 30, sp: 3, color: NAVY });
  };
  cell(545, 440, "BRANCH", data.branch, serif, fit(data.branch, [[14, 52], [22, 42], [32, 34], [999, 28]]));
  cell(1069, 420, "YEAR", data.year, serif, fit(data.year, [[14, 52], [22, 42], [999, 34]]));
  cell(2364, 480, "PRN / EN NO.", data.prn, sansB, fit(data.prn, [[16, 42], [24, 36], [999, 30]]));

  // seal
  const SX = 1485, SY = 1620;
  for (let i = 0; i < 32; i++) { const t = (i / 32) * 2 * Math.PI; page.drawCircle({ x: X(SX + 160 * Math.cos(t)), y: Y(SY + 160 * Math.sin(t)), size: 15 * K, color: GOLD }); }
  page.drawCircle({ x: X(SX), y: Y(SY), size: 162 * K, color: GOLD });
  page.drawCircle({ x: X(SX), y: Y(SY), size: 150 * K, color: GOLD_L }); page.drawCircle({ x: X(SX), y: Y(SY), size: 142 * K, color: NAVY });
  page.drawCircle({ x: X(SX), y: Y(SY), size: 128 * K, borderColor: GOLD, borderWidth: 3 * K });
  arcText(page, sansB, "SWAYAM", SX, SY, 100, 30, true, 5, GOLD_L); arcText(page, sansB, "DIRECTED BY ASTRA", SX, SY, 122, 17, false, 3, GOLD_L);
  put(page, sansB, "2026", { x: SX, y: SY + 25, size: 62, color: GOLD_L });
  for (let i = -2; i <= 2; i++) diamond(page, SX + i * 26, SY - 42, 6, GOLD_L);
  [[1262, 1], [1708, -1]].forEach(([x]) => diamond(page, x, 1632, 9, GOLD)); line(page, 1200, 1632, 1246, 1632, 3, GOLD); line(page, 1724, 1632, 1770, 1632, 3, GOLD);

  // certificate id (bottom centre)
  put(page, serif, "CERTIFICATE ID", { x: 1485, y: 1877, size: 28, sp: 3, color: NAVY });
  put(page, serifB, data.cid, { x: 1485, y: 1935, size: fitSize(serifB, data.cid || "SWY26-XXXXXXXX", 6, 520), sp: 6, color: NAVY });
  diamond(page, 1253, 1868, 9, GOLD); diamond(page, 1717, 1868, 9, GOLD); line(page, 1131, 1868, 1238, 1868, 3, GOLD); line(page, 1732, 1868, 1839, 1868, 3, GOLD);

  // signature areas: left = our verified digital-signature stamp, right = principal (blank for now, signature image to be added later)
  line(page, 482, 1821, 977, 1821, 3, NAVY); line(page, 1996, 1821, 2528, 1821, 3, NAVY);
  put(page, serifB, "PRINCIPAL / DIRECTOR", { x: 2262, y: 1868, size: 32, sp: 2, color: NAVY });
  put(page, sansB, "SIGNED BY", { x: 2262, y: 1910, size: 20, sp: 4, color: NAVY });
  put(page, serif, "Authorized Signatory", { x: 2262, y: 1948, size: 28, color: NAVY });

  if (withStamp) {
    // Visible signature stamp (left). The real cryptographic signature field is placed over the same rectangle (SIGN_WIDGET_RECT) by lib/sign-pdf.js.
    const stamp = new Date(Date.now() + 330 * 60000);   // IST (UTC+5:30), formatted from the UTC fields below
    const p2 = (n) => String(n).padStart(2, "0"), hr = stamp.getUTCHours();
    const when = stamp.getUTCFullYear() + "-" + p2(stamp.getUTCMonth() + 1) + "-" + p2(stamp.getUTCDate()) + " " + p2(hr % 12 || 12) + ":" + p2(stamp.getUTCMinutes()) + " " + (hr >= 12 ? "PM" : "AM") + " IST";
    const INK = hex("#1f1f1f");
    put(page, sans, "Digitally signed by", { x: 512, y: 1690, size: 31, color: INK, anchor: "start" });
    put(page, sans, SIGNER_LABEL, { x: 512, y: 1736, size: 31, color: INK, anchor: "start" });
    put(page, sans, "Date: " + when, { x: 512, y: 1782, size: 31, color: INK, anchor: "start" });
    // Green tick (own artwork). The server only hands this PDF out after verifying the signature (see lib/gtmc-handlers.js).
    const tick = await pdf.embedPng(new Uint8Array(Buffer.from(TICK_PNG_BASE64, "base64")));
    const TH = 150, TW = TH * (tick.width / tick.height);
    page.drawImage(tick, { x: X(790 - TW / 2), y: Y(1735 + TH / 2), width: TW * K, height: TH * K, blendMode: BlendMode.Multiply });   // multiply: tick stays strongly green, text underneath still shows

  }

  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

// Signature field rectangle in PDF points [x1, y1, x2, y2] (origin bottom-left) = the visible stamp area above.
const SIGN_WIDGET_RECT = [482 * K, H - 1835 * K, 990 * K, H - 1620 * K];

module.exports = { buildCertificatePdf, SIGN_WIDGET_RECT };
