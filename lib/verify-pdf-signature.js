"use strict";
/**
 * Dependency-free check of a signed PDF's cryptographic signature (adbe.pkcs7.detached), using only Node's built-in crypto.
 *
 *   const { verifySignedPdf } = require("./verify-pdf-signature");
 *   const r = verifySignedPdf(pdfBuffer);   // -> { ok: true, signer, digest } or { ok: false, reason }
 *
 * What "ok" means: (1) the signature covers the WHOLE file (nothing appended / changed after signing),
 * (2) the SHA digest of the signed byte ranges equals the digest inside the signature, and
 * (3) the RSA/ECDSA signature over the signed attributes verifies with the public key of a certificate embedded in the signature.
 * What it does NOT mean: that the certificate is trusted by Adobe or issued by a recognised CA (a self-signed one never is).
 */
const crypto = require("crypto");

const OID = {
  "2.16.840.1.101.3.4.2.1": "sha256", "2.16.840.1.101.3.4.2.2": "sha384", "2.16.840.1.101.3.4.2.3": "sha512", "1.3.14.3.2.26": "sha1",
};
const OID_MESSAGE_DIGEST = "1.2.840.113549.1.9.4";

function readTlv(buf, pos) {
  if (pos + 2 > buf.length) throw new Error("DER: truncated");
  const tag = buf[pos]; let len = buf[pos + 1], hdr = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4) throw new Error("DER: unsupported length form");
    len = 0; for (let i = 0; i < n; i++) len = len * 256 + buf[pos + 2 + i];
    hdr = 2 + n;
  }
  const start = pos + hdr, end = start + len;
  if (end > buf.length) throw new Error("DER: length past end");
  return { tag, hdr, start, end, pos };
}
function children(buf, node) { const out = []; let p = node.start; while (p < node.end) { const c = readTlv(buf, p); out.push(c); p = c.end; } return out; }
function oidOf(buf, node) {
  const b = buf.subarray(node.start, node.end); const parts = [Math.floor(b[0] / 40), b[0] % 40]; let v = 0;
  for (let i = 1; i < b.length; i++) { v = v * 128 + (b[i] & 0x7f); if (!(b[i] & 0x80)) { parts.push(v); v = 0; } }
  return parts.join(".");
}

function verifySignedPdf(pdf) {
  try {
    if (!Buffer.isBuffer(pdf)) pdf = Buffer.from(pdf);
    const text = pdf.toString("latin1");
    const all = [...text.matchAll(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g)];
    if (!all.length) return { ok: false, reason: "no signature (ByteRange) found" };
    const [a, b, c, d] = all[all.length - 1].slice(1).map(Number);
    if (a !== 0 || b > c || c + d !== pdf.length) return { ok: false, reason: "signature does not cover the whole file (changed or appended after signing)" };

    const gap = text.slice(b, c).trim();                       // "<hex...>"
    if (gap[0] !== "<" || gap[gap.length - 1] !== ">") return { ok: false, reason: "signature /Contents not found at ByteRange gap" };
    const cms = Buffer.from(gap.slice(1, -1).replace(/\s+/g, ""), "hex");
    const signedBytes = Buffer.concat([pdf.subarray(0, b), pdf.subarray(c, c + d)]);

    const ci = readTlv(cms, 0);                                    // ContentInfo
    const [, content0] = children(cms, ci);                        // [0] EXPLICIT
    const sd = children(cms, content0)[0];                         // SignedData
    const sdc = children(cms, sd);
    const certsNode = sdc.find((n) => n.tag === 0xa0);
    const signerInfos = sdc[sdc.length - 1];                       // SET OF SignerInfo
    const si = children(cms, children(cms, signerInfos)[0]);       // first SignerInfo fields
    const digestAlg = OID[oidOf(cms, children(cms, si[2])[0])];
    if (!digestAlg) return { ok: false, reason: "unsupported digest algorithm" };
    const attrs = si.find((n) => n.tag === 0xa0);
    if (!attrs) return { ok: false, reason: "signature has no signed attributes" };
    const sigValue = cms.subarray(si[si.length - 1].start, si[si.length - 1].end);

    // (2) digest of the signed byte ranges must equal the messageDigest attribute
    const docDigest = crypto.createHash(digestAlg).update(signedBytes).digest();
    let attrDigest = null;
    for (const at of children(cms, attrs)) {
      const [t, vals] = children(cms, at);
      if (oidOf(cms, t) === OID_MESSAGE_DIGEST) { const v = children(cms, vals)[0]; attrDigest = cms.subarray(v.start, v.end); }
    }
    if (!attrDigest || !docDigest.equals(attrDigest)) return { ok: false, reason: "document digest mismatch (content was changed after signing)" };

    // (3) signature over the DER of the signed attributes (tag A0 -> 31 SET) with the embedded certificate's public key
    const toVerify = Buffer.from(cms.subarray(attrs.pos, attrs.end)); toVerify[0] = 0x31;
    if (!certsNode) return { ok: false, reason: "no certificate embedded in signature" };
    for (const cn of children(cms, certsNode)) {
      try {
        const x509 = new crypto.X509Certificate(cms.subarray(cn.pos, cn.end));
        if (crypto.verify(digestAlg, toVerify, x509.publicKey, sigValue)) return { ok: true, signer: x509.subject.replace(/\n/g, ", "), digest: digestAlg };
      } catch (e) { /* try next certificate */ }
    }
    return { ok: false, reason: "signature value does not match any embedded certificate" };
  } catch (e) {
    return { ok: false, reason: "could not parse signature: " + (e && e.message) };
  }
}

module.exports = { verifySignedPdf };
