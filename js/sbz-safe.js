// js/sbz-safe.js — tiny XSS helpers shared by all pages (load BEFORE any inline script that renders user data).
//   sbzEsc(x)  -> HTML-escapes text   (use for text nodes AND quoted attribute values inside innerHTML templates)
//   sbzUrl(x)  -> URL safe to put inside src="..." / href="..." (blocks javascript:, vbscript:, data:text/html; escapes quotes)
//   sbzJs(x)   -> value safe inside an inline handler string:  onclick="fn('${sbzJs(id)}')"
(function (root) {
  var MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
  function sbzEsc(v) {
    return String(v == null ? "" : v).replace(/[&<>"'`]/g, function (c) { return MAP[c]; });
  }
  function sbzUrl(v) {
    var s = String(v == null ? "" : v).trim();
    var probe = s.replace(/[\u0000-\u0020\u007f-\u009f]/g, "").toLowerCase();   // browsers ignore tabs/newlines inside the scheme
    if (/^(javascript|vbscript):/.test(probe)) return "#";
    if (/^data:/.test(probe) && !/^data:image\/(png|jpe?g|gif|webp|bmp|avif);/.test(probe)) return "#";
    return sbzEsc(s);
  }
  function sbzJs(v) {
    // escape for a JS single-quoted string that itself sits inside an HTML attribute
    return sbzEsc(String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\r\n]/g, " "));
  }
  var api = { sbzEsc: sbzEsc, sbzUrl: sbzUrl, sbzJs: sbzJs };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) { root.sbzEsc = sbzEsc; root.sbzUrl = sbzUrl; root.sbzJs = sbzJs; }
})(typeof window !== "undefined" ? window : null);
