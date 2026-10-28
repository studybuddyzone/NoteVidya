"use strict";
/**
 * Digitally signs a PDF (Buffer in -> signed PDF Buffer out) with a PKCS#12 (.p12 / .pfx) identity.
 *
 * Signature type: adbe.pkcs7.detached (PKCS#7 / CMS, SHA-256) — the format Adobe Acrobat / Reader
 * validate and show under "Signature Properties". (This is PKCS#7, not the stricter ETSI "PAdES-Baseline"
 * profile; for that you would need a CAdES signer or pyHanko.)
 *
 * Dependencies:  npm i pdf-lib @signpdf/signpdf @signpdf/placeholder-pdf-lib @signpdf/signer-p12
 *
 * Usage:
 *   const { signPdf } = require("./lib/sign-pdf");
 *   const signed = await signPdf(pdfBuffer);                       // p12 + password read from env (see below)
 *   const signed = await signPdf(pdfBuffer, { p12: buf, passphrase: "..." });   // or pass them explicitly
 *
 * Environment variables (Vercel -> Project Settings -> Environment Variables):
 *   SIGN_P12_BASE64      base64 of certificate.p12            (base64 -w0 certificate.p12)
 *   SIGN_P12_PASSWORD    the .p12 passphrase
 *   SIGN_P12_PATH        (local dev only) path to a .p12 file, used when SIGN_P12_BASE64 is not set
 * Never commit the .p12 file or its password to GitHub.
 */
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const { pdflibAddPlaceholder } = require("@signpdf/placeholder-pdf-lib");
const { P12Signer } = require("@signpdf/signer-p12");
const signpdfModule = require("@signpdf/signpdf");
const signpdf = signpdfModule.default || signpdfModule;

const DEFAULTS = {
  reason: "Official Event Certificate Authentication",
  name: "Authorized Signatory / Event Lead",
  contactInfo: "support@yourdomain.com",   // <- change to your real support e-mail
  location: "India",
  signatureLength: 8192,                    // size of the /Contents placeholder (8192 hex chars = 4096 bytes of PKCS#7; a single self-signed cert needs ~2 KB)
};

function loadP12(opts) {
  if (opts.p12) return Buffer.isBuffer(opts.p12) ? opts.p12 : Buffer.from(opts.p12);
  if (process.env.SIGN_P12_BASE64) {
    // Vercel env values are often pasted with quotes / line breaks / a data: prefix; strip them before decoding.
    const clean = String(process.env.SIGN_P12_BASE64).trim().replace(/^["']|["']$/g, "").replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
    const buf = Buffer.from(clean, "base64");
    if (!buf.length || buf[0] !== 0x30) throw new Error("SIGN_P12_BASE64 is not valid base64 of a PKCS#12 (.p12) file (expected DER SEQUENCE).");
    return buf;
  }
  const path = opts.p12Path || process.env.SIGN_P12_PATH;
  if (path) return fs.readFileSync(path);
  throw new Error("No .p12 provided: pass { p12 } or set SIGN_P12_BASE64 (or SIGN_P12_PATH for local use).");
}

/**
 * @param {Buffer|Uint8Array} pdfBuffer   the finished certificate PDF
 * @param {object} [opts]
 * @param {Buffer} [opts.p12]             .p12 file contents (default: env SIGN_P12_BASE64)
 * @param {string} [opts.passphrase]      .p12 password (default: env SIGN_P12_PASSWORD)
 * @param {string} [opts.reason] [opts.name] [opts.contactInfo] [opts.location] [opts.signatureLength]
 * @returns {Promise<Buffer>} signed PDF
 */
async function signPdf(pdfBuffer, opts = {}) {
  if (!pdfBuffer || !pdfBuffer.length) throw new Error("signPdf: empty PDF buffer.");
  const o = { ...DEFAULTS, ...opts };
  const passphrase = opts.passphrase !== undefined ? opts.passphrase : String(process.env.SIGN_P12_PASSWORD || "").replace(/^["']|["']$/g, "").replace(/[\r\n]+$/, "");
  const p12 = loadP12(opts);

  // 1) Add an (invisible) signature field + placeholder. pdf-lib must NOT use object streams, or signpdf cannot patch the file.
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdflibAddPlaceholder({
    pdfDoc,
    reason: o.reason,
    name: o.name,
    contactInfo: o.contactInfo,
    location: o.location,
    signatureLength: o.signatureLength,
  });
  const withPlaceholder = Buffer.from(await pdfDoc.save({ useObjectStreams: false }));

  // 2) Sign: fills the placeholder with the detached PKCS#7 signature over the document's byte range.
  const signer = new P12Signer(Buffer.from(p12), { passphrase });
  try {
    return Buffer.from(await signpdf.sign(withPlaceholder, signer));
  } catch (e) {
    if (/exceeds placeholder length/i.test(String(e && e.message)))
      throw new Error("Signature is bigger than the placeholder (signatureLength " + o.signatureLength + "). Use a larger value, e.g. signPdf(buf, { signatureLength: 16384 }) — needed when the .p12 contains a certificate chain.");
    throw e;
  }
}

module.exports = { signPdf, SIGN_DEFAULTS: DEFAULTS };
