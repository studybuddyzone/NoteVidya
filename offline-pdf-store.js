/* offline-pdf-store.js
 * StudyBuddy — Smart Offline PDF Storage engine.
 *
 * Pure vanilla JS, no build step, no new page. Works alongside the existing
 * pdf-viewer-modal.js / subject-pdf-list-modal.js without changing how
 * either one talks to the backend or renders PDFs — it only adds a local
 * save/read layer on top.
 *
 * WHERE FILES GO (Android app only — see isSupported() below)
 * -------------------------------------------------------------
 * Every saved PDF is written through Capacitor's Filesystem plugin into the
 * app's own private storage (Directory.Data — Android's getFilesDir()):
 *   - created at runtime on the student's device, never at build time
 *   - never touches this website's repo, GitHub, or the APK/AAB — so
 *     downloading PDFs can NEVER make the app bundle bigger
 *   - private to the app (no storage permission prompt needed)
 *   - survives app restarts and "Clear cache" (this is not the WebView
 *     cache) — only removed by deleteOfflineCopy() or an actual uninstall /
 *     "Clear app data"
 *   - independent per device/user automatically, since it is local device
 *     storage, not a shared/synced location
 *
 * OUTSIDE THE APP (normal mobile/desktop browser, or the Windows build,
 * which is a plain WebView2 app with no Capacitor bridge)
 * -------------------------------------------------------------
 * window.Capacitor / the Filesystem plugin simply won't exist there, so
 * isSupported() returns false and every function in this file degrades to
 * a safe no-op / rejects with a NOT_SUPPORTED code. Callers (see the
 * updated pdf-viewer-modal.js) already check isSupported() before showing
 * any "Download for Offline" UI, so on the website/Windows app nothing
 * changes at all — PDFs keep opening exactly as before.
 *
 * Requires "@capacitor/filesystem" in the Android wrapper repo's
 * package.json (already added) — no other native/workflow change needed,
 * since the existing build-android.yml already runs `npx cap sync android`
 * on every build, which wires up any Capacitor plugin automatically.
 */
(function (global) {
  "use strict";

  var ROOT_DIR = "offline-pdfs";
  var FILES_DIR = ROOT_DIR + "/files";
  var INDEX_PATH = ROOT_DIR + "/index.json";
  var DIRECTORY_DATA = "DATA"; // Capacitor's Directory.Data, by raw string (stable across SDK versions)

  var inFlight = {}; // id -> in-progress download promise (duplicate-download guard)
  var indexCache = null; // in-memory cache of the metadata index

  // ---------------------------------------------------------------------
  // Capacitor availability
  // ---------------------------------------------------------------------

  function getCapacitor() {
    return global.Capacitor || null;
  }

  function isNativeApp() {
    var cap = getCapacitor();
    return !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
  }

  function getFilesystem() {
    var cap = getCapacitor();
    if (!cap || !cap.Plugins || !cap.Plugins.Filesystem) return null;
    return cap.Plugins.Filesystem;
  }

  // True only when we're inside the native app AND the Filesystem plugin is
  // actually present (i.e. the APK was built after @capacitor/filesystem
  // was added + `npx cap sync android` ran). This is the single check every
  // caller should use before showing any offline UI.
  function isSupported() {
    return isNativeApp() && !!getFilesystem();
  }

  function isOnline() {
    return typeof navigator !== "undefined" ? navigator.onLine !== false : true;
  }

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------

  // Stable, filesystem-safe id for a PDF. Prefers an explicit id (the
  // database row id from the management-list API, when the caller has it).
  // Falls back to the URL with any query string stripped — safe even for
  // Supabase signed URLs, whose ?token=... changes every request but whose
  // path (which file it points to) does not.
  function stableId(urlOrId) {
    var base = String(urlOrId || "").split("?")[0].split("#")[0];
    var hash = 0;
    for (var i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) | 0;
    }
    return "id" + Math.abs(hash) + "_" + base.replace(/[^a-zA-Z0-9]+/g, "").slice(-24);
  }

  function safeFileName(id) {
    return String(id).replace(/[^a-zA-Z0-9_\-.]/g, "_") + ".pdf";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function () {
        var result = reader.result || "";
        var comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function base64ToUint8Array(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    var units = ["B", "KB", "MB", "GB"];
    var i = 0;
    var n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n = n / 1024;
      i++;
    }
    return n.toFixed(i === 0 ? 0 : 1) + " " + units[i];
  }

  // ---------------------------------------------------------------------
  // Metadata index — PDF id, title, subject, category/course, local file
  // ref, file size, download date, source/version, all in one small JSON
  // file next to the PDFs themselves.
  // ---------------------------------------------------------------------

  function readIndex() {
    if (indexCache) return Promise.resolve(indexCache);
    var fs = getFilesystem();
    if (!fs) return Promise.resolve({});

    return fs
      .readFile({ path: INDEX_PATH, directory: DIRECTORY_DATA, encoding: "utf8" })
      .then(function (res) {
        try {
          indexCache = JSON.parse(res.data) || {};
        } catch (e) {
          indexCache = {};
        }
        return indexCache;
      })
      .catch(function () {
        indexCache = {}; // first run — index doesn't exist yet
        return indexCache;
      });
  }

  function writeIndex(index) {
    var fs = getFilesystem();
    if (!fs) return Promise.resolve();
    indexCache = index;
    return fs
      .mkdir({ path: ROOT_DIR, directory: DIRECTORY_DATA, recursive: true })
      .catch(function () {})
      .then(function () {
        return fs.writeFile({
          path: INDEX_PATH,
          directory: DIRECTORY_DATA,
          data: JSON.stringify(index),
          encoding: "utf8",
        });
      });
  }

  function getMetadata(pdfId) {
    return readIndex().then(function (index) {
      return index[pdfId] || null;
    });
  }

  function listOfflinePdfs() {
    return readIndex().then(function (index) {
      return Object.keys(index)
        .map(function (id) { return index[id]; })
        .sort(function (a, b) { return (b.downloadedAt || "").localeCompare(a.downloadedAt || ""); });
    });
  }

  function getStorageUsed() {
    return readIndex().then(function (index) {
      return Object.keys(index).reduce(function (total, id) {
        return total + (index[id].fileSize || 0);
      }, 0);
    });
  }

  // ---------------------------------------------------------------------
  // Local existence check — pure local, never touches the network.
  // ---------------------------------------------------------------------

  function hasOfflineCopy(pdfId) {
    var fs = getFilesystem();
    if (!fs) return Promise.resolve(false);
    return getMetadata(pdfId).then(function (meta) {
      if (!meta) return false;
      return fs
        .stat({ path: FILES_DIR + "/" + meta.localFileName, directory: DIRECTORY_DATA })
        .then(function () { return true; })
        .catch(function () { return false; });
    });
  }

  // Reads the saved PDF back as raw bytes (Uint8Array), ready to hand to
  // pdfjsLib.getDocument({ data: bytes }) — the exact same pattern the
  // existing pdf-viewer-modal.js already uses for openPdfViewerFromBase64,
  // so no new rendering path is introduced.
  function getOfflineBytes(pdfId) {
    var fs = getFilesystem();
    if (!fs) return Promise.reject({ code: "NOT_SUPPORTED", message: "Offline storage is only available inside the app." });
    return getMetadata(pdfId).then(function (meta) {
      if (!meta) throw { code: "NOT_FOUND", message: "No offline copy saved for this PDF." };
      return fs
        .readFile({ path: FILES_DIR + "/" + meta.localFileName, directory: DIRECTORY_DATA, encoding: "base64" })
        .then(function (res) {
          return base64ToUint8Array(res.data);
        });
    });
  }

  // ---------------------------------------------------------------------
  // Download for Offline
  // ---------------------------------------------------------------------

  /**
   * @param {{id?:string,url:string,title?:string,subject?:string,category?:string,version?:string}} pdf
   * @param {{onProgress?: (percent:number)=>void}} [opts]
   * @returns {Promise<object>} the saved metadata record
   */
  function downloadForOffline(pdf, opts) {
    opts = opts || {};
    var fs = getFilesystem();
    if (!fs) {
      return Promise.reject({ code: "NOT_SUPPORTED", message: "Offline storage is only available inside the app." });
    }
    if (!pdf || !pdf.url) {
      return Promise.reject({ code: "INVALID_PDF", message: "A PDF url is required." });
    }
    var pdfId = pdf.id || stableId(pdf.url);
    if (!isOnline()) {
      return Promise.reject({ code: "OFFLINE", message: "No internet connection. Connect to download this PDF." });
    }

    // Duplicate-download guard.
    if (inFlight[pdfId]) return inFlight[pdfId];

    var fileName = safeFileName(pdfId);

    var task = fetch(pdf.url)
      .then(function (response) {
        if (!response.ok) throw { code: "HTTP_ERROR", message: "Server returned " + response.status };

        var contentLength = Number(response.headers.get("Content-Length")) || 0;

        if (!response.body || !response.body.getReader || !opts.onProgress) {
          return response.blob();
        }

        var reader = response.body.getReader();
        var chunks = [];
        var received = 0;

        function pump() {
          return reader.read().then(function (res) {
            if (res.done) return new Blob(chunks, { type: "application/pdf" });
            chunks.push(res.value);
            received += res.value.length;
            if (contentLength && opts.onProgress) {
              opts.onProgress(Math.min(99, Math.round((received / contentLength) * 100)));
            }
            return pump();
          });
        }
        return pump();
      })
      .then(function (blob) {
        return blobToBase64(blob).then(function (base64) {
          return fs
            .mkdir({ path: FILES_DIR, directory: DIRECTORY_DATA, recursive: true })
            .catch(function () {})
            .then(function () {
              return fs.writeFile({
                path: FILES_DIR + "/" + fileName,
                directory: DIRECTORY_DATA,
                data: base64,
                recursive: true,
              });
            })
            .then(function () {
              return fs.stat({ path: FILES_DIR + "/" + fileName, directory: DIRECTORY_DATA });
            })
            .then(function (stat) {
              var record = {
                id: pdfId,
                title: pdf.title || "",
                subject: pdf.subject || "",
                category: pdf.category || "",
                sourceUrl: pdf.url,
                version: pdf.version || null,
                localFileName: fileName,
                fileSize: stat.size || blob.size,
                downloadedAt: nowIso(),
              };
              return readIndex().then(function (index) {
                index[pdfId] = record;
                return writeIndex(index).then(function () {
                  if (opts.onProgress) opts.onProgress(100);
                  return record;
                });
              });
            });
        });
      })
      .catch(function (err) {
        var message = (err && err.message) || "Download failed";
        var code = (err && err.code) || "DOWNLOAD_FAILED";
        if (/no space|enospc|disk full|quota/i.test(message)) {
          code = "INSUFFICIENT_STORAGE";
          message = "Not enough space on this device to save this PDF.";
        }
        throw { code: code, message: message };
      })
      .finally(function () {
        delete inFlight[pdfId];
      });

    inFlight[pdfId] = task;
    return task;
  }

  function redownload(pdf) {
    return downloadForOffline(pdf);
  }

  function hasUpdateAvailable(pdf) {
    var pdfId = pdf.id || stableId(pdf.url);
    return getMetadata(pdfId).then(function (meta) {
      if (!meta) return false;
      if (!pdf.version || !meta.version) return false;
      return pdf.version !== meta.version;
    });
  }

  // ---------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------

  function deleteOfflineCopy(pdfId) {
    var fs = getFilesystem();
    if (!fs) return Promise.resolve();
    return getMetadata(pdfId).then(function (meta) {
      var removeFile = meta
        ? fs.deleteFile({ path: FILES_DIR + "/" + meta.localFileName, directory: DIRECTORY_DATA }).catch(function () {})
        : Promise.resolve();
      return removeFile.then(function () {
        return readIndex().then(function (index) {
          delete index[pdfId];
          return writeIndex(index);
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  // Network-priority resolver — exact spec order:
  //   1. valid offline copy exists -> open local PDF (no network touched)
  //   2. no offline copy, internet available -> open online PDF
  //   3. no offline copy, no internet -> "Available Online Only"
  //   4. "Download for Offline" is a separate explicit user action, not
  //      part of this resolver (see downloadForOffline above)
  // ---------------------------------------------------------------------

  function resolvePdfSource(pdf) {
    var pdfId = pdf.id || stableId(pdf.url);
    if (!isSupported()) {
      // Outside the app (plain browser / Windows build): behave exactly
      // like before this feature existed.
      return Promise.resolve({ mode: "online", url: pdf.url, id: pdfId });
    }
    return hasOfflineCopy(pdfId).then(function (hasOffline) {
      if (hasOffline) {
        return getOfflineBytes(pdfId).then(function (bytes) {
          return { mode: "offline", bytes: bytes, id: pdfId };
        });
      }
      if (isOnline()) {
        return { mode: "online", url: pdf.url, id: pdfId };
      }
      return {
        mode: "unavailable",
        id: pdfId,
        reason: "Available Online Only. Connect to the internet to view this PDF, or download it for offline use when you're back online.",
      };
    });
  }

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  global.SBZOffline = {
    isSupported: isSupported,
    isOnline: isOnline,
    stableId: stableId,

    resolvePdfSource: resolvePdfSource,
    hasOfflineCopy: hasOfflineCopy,
    hasUpdateAvailable: hasUpdateAvailable,
    getOfflineBytes: getOfflineBytes,

    downloadForOffline: downloadForOffline,
    redownload: redownload,
    deleteOfflineCopy: deleteOfflineCopy,

    listOfflinePdfs: listOfflinePdfs,
    getMetadata: getMetadata,
    getStorageUsed: getStorageUsed,
    formatBytes: formatBytes,
  };
})(typeof window !== "undefined" ? window : this);
