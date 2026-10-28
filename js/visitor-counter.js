// js/visitor-counter.js — shows the global visit total on payment.html.
// One POST per real page load. No retries (a retry after an ambiguous failure could double count).
// Counts every real page load. Completely independent of the payment code: every error is swallowed here.
(function () {
  "use strict";
  var card = document.getElementById("visitorCounter");
  var numEl = document.getElementById("visitorCounterNum");
  var labelEl = document.getElementById("visitorCounterSuffix");
  if (!card || !numEl) return;

  // Back/forward-cache restores re-show the old DOM without a new load: nothing to do, no recount.
  if (window.__sbzVisitorCounterSent) return;
  window.__sbzVisitorCounterSent = true;

  function fail() {
    card.classList.remove("is-loading");
    card.classList.add("is-error");
    numEl.textContent = "—";
    if (labelEl) labelEl.textContent = "Counter temporarily unavailable";
  }

  function show(count) {
    card.classList.remove("is-loading", "is-error");
    var target = Math.floor(count), fmt = function (n) { return n.toLocaleString("en-IN"); };
    if (labelEl) labelEl.textContent = target === 1 ? "Total Visit" : "Total Visits";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target < 20) { numEl.textContent = fmt(target); return; }
    var start = Math.max(0, target - Math.min(target, 40)), t0 = null, dur = 700;
    (function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      numEl.textContent = fmt(Math.round(start + (target - start) * k));
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  // Live updates: while the page is open, re-read the shared total every 30 s with GET
  // (read-only, never increments). Paused while the tab is hidden; failures are ignored.
  var LIVE_MS = 30000, busy = false;
  function startLive() {
    setInterval(function () {
      if (busy || document.hidden || card.classList.contains("is-error")) return;
      busy = true;
      fetch("/api/visitor-counter", { method: "GET", cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); return r.json(); })
        .then(function (d) {
          if (d && d.ok === true && isFinite(Number(d.count))) {
            var n = Math.floor(Number(d.count));
            numEl.textContent = n.toLocaleString("en-IN");
          }
        })
        .catch(function () {})
        .then(function () { busy = false; });
    }, LIVE_MS);
  }

  var ctrl = typeof AbortController === "function" ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 10000);

  fetch("/api/visitor-counter", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: ctrl ? ctrl.signal : undefined
  })
    .then(function (r) { if (!r.ok) throw new Error("bad status"); return r.json(); })
    .then(function (d) {
      clearTimeout(timer);
      if (!d || d.ok !== true || !isFinite(Number(d.count))) throw new Error("bad body");
      show(Number(d.count));
      try { startLive(); } catch (e) { /* live refresh is optional */ }
    })
    .catch(function () { clearTimeout(timer); fail(); });
})();
