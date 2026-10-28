
  // Safety net: if pdf-viewer-modal.js failed to load (cache/network/CSP
  // issue), show a visible alert instead of silently doing nothing on tap —
  // makes the failure obvious instead of looking like a dead button.
  window.addEventListener("load", function () {
    if (typeof window.openPdfViewer !== "function") {
      window.openPdfViewer = function () {
        alert("PDF viewer script failed to load. Please check your internet connection and try again, or reinstall/update the app.");
      };
    }
  });
