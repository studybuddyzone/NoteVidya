/*
  Shared "PDF viewer modal" — opens a PDF as a full-screen overlay INSIDE the
  current page using PDF.js, with zero page navigation (no new URL, no <a>
  navigation at all). Include this script on any page, then use:

      <a href="javascript:void(0)"
         data-pdf-url="..." data-pdf-name="..."
         onclick="openPdfViewer(this.dataset.pdfUrl, this.dataset.pdfName)">

  Why: the app's WebView was silently blocking navigation between pages on
  the same site (worked fine in a normal mobile browser, did nothing in the
  app). Since this never navigates anywhere, it can't be blocked the same way.

  OFFLINE SUPPORT
  ----------------
  openPdfViewer() now takes an optional 3rd argument with extra identifying
  info: openPdfViewer(url, name, { id, subject, category }). This is used
  only to key the offline save (see offline-pdf-store.js); everything else
  behaves exactly as before. Without it, a stable id is derived from the
  url itself, so every existing call site keeps working untouched.

  When offline-pdf-store.js is loadable and we're running inside the
  Capacitor Android app (SBZOffline.isSupported()), the header gets a small
  download button that can save the PDF for offline reading, and opening a
  PDF that was already saved reads it straight from local device storage —
  no network request at all. Outside the app (plain browser, Windows build)
  nothing changes: the button never appears and every PDF opens online
  exactly like before this feature existed.

  NOTE: this file loads offline-pdf-store.js itself (same lazy pattern as
  PDF.js below), so just dropping offline-pdf-store.js next to this file on
  the server is enough — no page's <script> tags need to be touched.
*/
(function () {
  const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // Resolve offline-pdf-store.js next to THIS script, whatever path/query
  // string this page happened to load pdf-viewer-modal.js with (some pages
  // use a cache-busted "?v=..." suffix).
  const SELF_SRC = (document.currentScript && document.currentScript.src) || '';
  const OFFLINE_STORE_SRC = SELF_SRC
    ? SELF_SRC.replace(/[^/]*$/, '') + 'offline-pdf-store.js'
    : 'offline-pdf-store.js';

  function loadPdfJs() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(); return; }
      const s = document.createElement('script');
      s.src = PDFJS_SRC;
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        resolve();
      };
      s.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(s);
    });
  }

  // Loads offline-pdf-store.js at most once. Resolves (never rejects) even
  // if the file 404s or errors — offline support just silently stays
  // unavailable on that page, same as if the file were never added.
  let offlineStorePromise = null;
  function loadOfflineStore() {
    if (window.SBZOffline) return Promise.resolve(window.SBZOffline);
    if (offlineStorePromise) return offlineStorePromise;
    offlineStorePromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = OFFLINE_STORE_SRC;
      s.onload = () => resolve(window.SBZOffline || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return offlineStorePromise;
  }

  function ensureStyles() {
    if (document.getElementById('pdf-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'pdf-modal-styles';
    style.textContent = `
      #pdfModalOverlay { position: fixed; inset: 0; z-index: 99999; background: #14161f; display: flex; flex-direction: column; }
      #pdfModalOverlay .pvm-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; padding-top: calc(12px + env(safe-area-inset-top, 0px)); background: #1b1e2c; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
      #pdfModalOverlay .pvm-back { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; background: rgba(255,255,255,0.06); border: none; color: #eef0f6; font-size: 16px; }
      #pdfModalOverlay .pvm-title { flex: 1; min-width: 0; font-size: 0.85rem; font-weight: 700; color: #eef0f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #pdfModalOverlay .pvm-pages { font-size: 0.72rem; color: #9aa0b4; flex-shrink: 0; }
      #pdfModalBody { flex: 1; overflow: auto; padding: 10px 8px 40px; display: flex; flex-direction: column; align-items: flex-start; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-x pan-y; }
      #pdfModalBody .pvm-doc { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 0 auto; flex-shrink: 0; position: relative; transform-origin: 0 0; }
      #pdfModalBody .pvm-pg { flex-shrink: 0; overflow: hidden; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,0.35); border-radius: 4px; }
      #pdfModalBody .pvm-pg canvas { display: block; width: 100%; height: 100%; }
      .pvm-msg { text-align: center; color: #9aa0b4; font-size: 0.88rem; padding: 60px 20px; font-family: 'Inter', -apple-system, sans-serif; }
      .pvm-spin { width: 24px; height: 24px; margin: 0 auto 12px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #6f7bff; border-radius: 50%; animation: pvmSpin 0.8s linear infinite; }
      @keyframes pvmSpin { to { transform: rotate(360deg); } }
      .pvm-fallback { display: inline-block; margin-top: 14px; padding: 10px 18px; background: #6f7bff; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.85rem; }

      /* Offline download button + states — same circular icon-button
         language as .pvm-back, so it reads as part of the existing header. */
      #pdfModalOverlay .pvm-offline-btn { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; background: rgba(255,255,255,0.06); border: none; color: #eef0f6; font-size: 14px; display: flex; align-items: center; justify-content: center; position: relative; }
      #pdfModalOverlay .pvm-offline-btn.pvm-offline-ready { background: rgba(80,200,120,0.18); color: #6be19a; }
      #pdfModalOverlay .pvm-offline-btn.pvm-offline-failed { background: rgba(240,90,90,0.18); color: #ff8080; }
      #pdfModalOverlay .pvm-offline-btn[disabled] { opacity: 0.5; }
      #pdfModalOverlay .pvm-offline-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; }
      #pdfModalOverlay .pvm-list-btn { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; background: rgba(255,255,255,0.06); border: none; color: #eef0f6; font-size: 14px; }
      .pvm-offline-banner { font-size: 0.72rem; color: #6be19a; text-align: center; padding: 6px 10px 0; font-family: 'Inter', -apple-system, sans-serif; }

      /* "My Offline PDFs" bottom sheet — same visual language as the
         existing subject-pdf-list-modal.js bottom sheet, kept self
         contained here so this file works even on pages that don't
         include that one. */
      #sopOverlay { position: fixed; inset: 0; z-index: 100000; background: rgba(10,14,25,0.55); display: flex; align-items: flex-end; justify-content: center; }
      #sopOverlay .sop-sheet { width: 100%; max-width: 520px; max-height: 80vh; overflow-y: auto; background: #14161f; border-radius: 20px 20px 0 0; padding: 18px 16px 28px; -webkit-overflow-scrolling: touch; font-family: 'Inter', -apple-system, sans-serif; }
      @media (min-width: 640px) { #sopOverlay { align-items: center; } #sopOverlay .sop-sheet { border-radius: 16px; max-height: 76vh; } }
      #sopOverlay .sop-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
      #sopOverlay .sop-title { font-size: 1rem; font-weight: 800; color: #eef0f6; }
      #sopOverlay .sop-close { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #eef0f6; font-size: 15px; flex-shrink: 0; }
      #sopOverlay .sop-storage { font-size: 0.74rem; color: #9aa0b4; margin-bottom: 14px; }
      #sopOverlay .sop-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
      #sopOverlay .sop-icon { font-size: 18px; flex-shrink: 0; }
      #sopOverlay .sop-info { flex: 1; min-width: 0; }
      #sopOverlay .sop-name { font-size: 0.84rem; font-weight: 600; color: #eef0f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #sopOverlay .sop-meta { font-size: 0.68rem; color: #9aa0b4; margin-top: 2px; }
      #sopOverlay .sop-del { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(240,90,90,0.15); color: #ff8080; font-size: 13px; }
      #sopOverlay .sop-msg { text-align: center; color: #9aa0b4; font-size: 0.86rem; padding: 40px 10px; }
    `;
    document.head.appendChild(style);
  }

  window.closePdfViewer = function () {
    const el = document.getElementById('pdfModalOverlay');
    if (el) el.remove();
    document.body.style.overflow = '';
  };

  // Renders the PDF with real zoom support:
  //  - two-finger pinch (live preview while pinching, then a crisp re-render at the new zoom)
  //  - double-tap to zoom in / back out, Ctrl+wheel on desktop
  //  - pages are rendered lazily (only near the screen) so zoomed-in pages stay sharp without blowing phone memory.
  async function renderLoadedPdf(loadingTask, body, pagesLabel) {
    const pdf = await loadingTask.promise;
    body.innerHTML = '';
    pagesLabel.textContent = pdf.numPages + ' page' + (pdf.numPages === 1 ? '' : 's');

    const MIN_ZOOM = 1, MAX_ZOOM = 5, MAX_PIXELS = 12e6;   // MAX_PIXELS caps canvas size so low-end phones don't run out of memory
    const dpr = window.devicePixelRatio || 1;
    const fitWidth = () => Math.max(200, Math.min(body.clientWidth - 16, 900));
    let cssW = fitWidth();       // width of a page at zoom 1 (CSS px)
    let zoom = 1;
    let pumping = false, curTask = null, rafId = 0;

    const doc = document.createElement('div');
    doc.className = 'pvm-doc';
    body.appendChild(doc);
    const pages = [];

    const sizeWrap = (p) => {
      const w = cssW * zoom;
      p.wrap.style.width = w + 'px';
      p.wrap.style.height = (w * p.h / p.w) + 'px';
    };
    const layout = () => pages.forEach(sizeWrap);
    const needs = (p) => p.zoomDone !== zoom || p.widthDone !== cssW;

    function classify() {
      const r = body.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const todo = [];
      for (const p of pages) {
        const pr = p.wrap.getBoundingClientRect();
        const near = !(pr.bottom < r.top - r.height || pr.top > r.bottom + r.height);
        const far = pr.bottom < r.top - r.height * 3 || pr.top > r.bottom + r.height * 3;
        if (far && p.canvas) { p.canvas.remove(); p.canvas = null; p.zoomDone = 0; }   // free memory
        if (near && needs(p)) todo.push({ p, d: Math.abs((pr.top + pr.bottom) / 2 - mid) });
      }
      todo.sort((x, y) => x.d - y.d);
      return todo.map((t) => t.p);
    }

    async function renderPage(p) {
      const z = zoom, cw = cssW;
      let scale = ((cw * z) / p.w) * dpr;
      const px = p.w * scale * p.h * scale;
      if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px);
      const vp = p.page.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      const task = p.page.render({ canvasContext: c.getContext('2d'), viewport: vp });
      curTask = task;
      try { await task.promise; }
      catch (e) { if (e && e.name === 'RenderingCancelledException') return; throw e; }
      finally { if (curTask === task) curTask = null; }
      if (z !== zoom || cw !== cssW) return;           // zoom changed meanwhile — the loop will redo this page
      if (p.canvas) p.canvas.remove();
      p.wrap.appendChild(c);
      p.canvas = c; p.zoomDone = z; p.widthDone = cw;
    }

    async function pump() {
      if (pumping) return;
      pumping = true;
      try {
        while (body.isConnected) {
          const todo = classify();
          if (!todo.length) break;
          try { await renderPage(todo[0]); }
          catch (e) { console.error('[PDF Viewer Modal] page render', e); todo[0].zoomDone = zoom; todo[0].widthDone = cssW; }
        }
      } finally { pumping = false; }
    }
    const schedule = () => { if (rafId) return; rafId = requestAnimationFrame(() => { rafId = 0; pump(); }); };

    // Apply a new zoom, keeping the document point (px,py) — measured in doc coordinates — under screen point (cx,cy).
    function commitZoom(newZoom, px, py, cx, cy) {
      newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      if (newZoom < 1.05) newZoom = 1;
      doc.style.transform = ''; doc.style.willChange = '';
      if (Math.abs(newZoom - zoom) < 0.01) return;
      const k = newZoom / zoom;
      zoom = newZoom;
      layout();
      const r = doc.getBoundingClientRect();
      body.scrollLeft += (r.left + px * k) - cx;
      body.scrollTop += (r.top + py * k) - cy;
      if (curTask) { try { curTask.cancel(); } catch (e) {} }
      schedule();
    }

    // ---- page placeholders (sizes first, so scrolling/zooming is stable), first page renders right away
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const vp = page.getViewport({ scale: 1 });
      const wrap = document.createElement('div');
      wrap.className = 'pvm-pg';
      doc.appendChild(wrap);
      const p = { page, w: vp.width, h: vp.height, wrap, canvas: null, zoomDone: 0, widthDone: 0 };
      pages.push(p); sizeWrap(p);
      if (n === 1) schedule();
    }
    schedule();
    body.addEventListener('scroll', schedule, { passive: true });

    // ---- pinch + double-tap (touch)
    let pinch = null, lastTap = { t: 0, x: 0, y: 0 }, tapStart = null;
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    body.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const a = e.touches[0], b = e.touches[1];
        const mx = (a.clientX + b.clientX) / 2, my = (a.clientY + b.clientY) / 2;
        const r = doc.getBoundingClientRect();
        pinch = { d0: dist(a, b), z0: zoom, px: mx - r.left, py: my - r.top, mx0: mx, my0: my, s: 1, mx, my };
        doc.style.transformOrigin = pinch.px + 'px ' + pinch.py + 'px';
        doc.style.willChange = 'transform';
        tapStart = null;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        tapStart = { t: Date.now(), x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else { tapStart = null; }
    }, { passive: false });
    body.addEventListener('touchmove', (e) => {
      if (tapStart && e.touches[0] && Math.hypot(e.touches[0].clientX - tapStart.x, e.touches[0].clientY - tapStart.y) > 10) tapStart = null;
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const a = e.touches[0], b = e.touches[1];
      pinch.s = Math.min(MAX_ZOOM / pinch.z0, Math.max(MIN_ZOOM / pinch.z0, dist(a, b) / pinch.d0));
      pinch.mx = (a.clientX + b.clientX) / 2; pinch.my = (a.clientY + b.clientY) / 2;
      doc.style.transform = 'translate(' + (pinch.mx - pinch.mx0) + 'px,' + (pinch.my - pinch.my0) + 'px) scale(' + pinch.s + ')';
    }, { passive: false });
    const endTouch = (e) => {
      if (pinch && e.touches.length < 2) {
        const pz = pinch; pinch = null;
        commitZoom(pz.z0 * pz.s, pz.px, pz.py, pz.mx, pz.my);
        return;
      }
      if (tapStart && e.touches.length === 0 && e.changedTouches[0] && Date.now() - tapStart.t < 250) {
        const x = e.changedTouches[0].clientX, y = e.changedTouches[0].clientY, now = Date.now();
        if (now - lastTap.t < 300 && Math.hypot(x - lastTap.x, y - lastTap.y) < 30) {
          const r = doc.getBoundingClientRect();
          commitZoom(zoom > 1.2 ? 1 : 2.5, x - r.left, y - r.top, x, y);   // double-tap: zoom in / back to fit
          lastTap = { t: 0, x: 0, y: 0 };
        } else { lastTap = { t: now, x, y }; }
      }
      tapStart = null;
    };
    body.addEventListener('touchend', endTouch, { passive: true });
    body.addEventListener('touchcancel', () => { if (pinch) { const pz = pinch; pinch = null; commitZoom(pz.z0, pz.px, pz.py, pz.mx0, pz.my0); } tapStart = null; }, { passive: true });

    // ---- desktop: Ctrl + wheel / trackpad pinch
    let wheelTimer = 0;
    body.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = doc.getBoundingClientRect();
      commitZoom(zoom * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
      clearTimeout(wheelTimer); wheelTimer = setTimeout(schedule, 120);
    }, { passive: false });

    // ---- rotate / resize
    const onResize = () => {
      if (!body.isConnected) { window.removeEventListener('resize', onResize); return; }
      const w = fitWidth();
      if (w === cssW) return;
      cssW = w; layout(); schedule();
    };
    window.addEventListener('resize', onResize);
  }

  function buildOverlay(name) {
    ensureStyles();
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'pdfModalOverlay';
    overlay.innerHTML =
      '<div class="pvm-header">' +
        '<button class="pvm-back" onclick="closePdfViewer()">←</button>' +
        '<div class="pvm-title"></div>' +
        '<div class="pvm-pages" id="pdfModalPages"></div>' +
        '<button class="pvm-list-btn" id="pdfModalListBtn" title="My Offline PDFs" onclick="openOfflinePdfsList()">📂</button>' +
        '<span id="pdfModalOfflineBtnSlot"></span>' +
      '</div>' +
      '<div id="pdfModalOfflineBanner"></div>' +
      '<div id="pdfModalBody"><div class="pvm-msg"><div class="pvm-spin"></div>Loading PDF…</div></div>';
    overlay.querySelector('.pvm-title').textContent = name || 'Document';
    document.body.appendChild(overlay);

    // Hide the "My Offline PDFs" shortcut by default; openPdfViewer()
    // reveals it once it has actually confirmed offline storage is
    // available here (plain browser / Windows build keep it hidden).
    const listBtn = document.getElementById('pdfModalListBtn');
    if (listBtn) listBtn.style.display = 'none';

    return {
      body: document.getElementById('pdfModalBody'),
      pagesLabel: document.getElementById('pdfModalPages'),
      offlineBtnSlot: document.getElementById('pdfModalOfflineBtnSlot'),
      banner: document.getElementById('pdfModalOfflineBanner'),
    };
  }

  // Renders the download/downloading/offline-ready/retry button into the
  // header slot for the given pdf descriptor, and wires its click handler.
  // `eng` here is the already-resolved SBZOffline (caller has confirmed
  // isSupported() before calling this).
  function renderOfflineButton(eng, slot, pdf, pdfId) {
    if (!slot) return;

    function setState(state, pct) {
      let inner = '⬇';
      let cls = 'pvm-offline-btn';
      let title = 'Save for offline';
      if (state === 'downloading') { inner = '<span class="pvm-offline-pct">' + (pct || 0) + '</span>'; title = 'Downloading… ' + (pct || 0) + '%'; }
      else if (state === 'ready') { inner = '✓'; cls += ' pvm-offline-ready'; title = 'Available offline — tap to remove'; }
      else if (state === 'failed') { inner = '⟳'; cls += ' pvm-offline-failed'; title = 'Download failed — tap to retry'; }
      slot.innerHTML = '<button class="' + cls + '" id="pvmOfflineBtn" title="' + title + '">' + inner + '</button>';
      document.getElementById('pvmOfflineBtn').onclick = onClick;
    }

    function onClick() {
      eng.hasOfflineCopy(pdfId).then((has) => {
        if (has) {
          if (!confirm('Remove this PDF from offline storage?')) return;
          eng.deleteOfflineCopy(pdfId).then(() => setState('idle'));
          return;
        }
        if (!eng.isOnline()) {
          alert('No internet connection. Connect to the internet to download this PDF for offline use.');
          return;
        }
        setState('downloading', 0);
        eng.downloadForOffline(
          { id: pdfId, url: pdf.url, title: pdf.title, subject: pdf.subject, category: pdf.category },
          { onProgress: (pct) => setState('downloading', pct) }
        ).then(() => setState('ready')).catch((err) => {
          console.error('[Offline PDF]', err);
          setState('failed');
        });
      });
    }

    eng.hasOfflineCopy(pdfId).then((has) => setState(has ? 'ready' : 'idle'));
  }

  // meta: optional { id, subject, category } — see file header comment.
  window.openPdfViewer = async function (url, name, meta) {
    if (!url) return;
    meta = meta || {};

    const { body, pagesLabel, offlineBtnSlot, banner } = buildOverlay(name);

    function showError(msg) {
      body.innerHTML =
        '<div class="pvm-msg">⚠️ ' + msg + '<br />' +
        '<a class="pvm-fallback" href="' + url + '">Open in browser instead</a></div>';
    }

    function showUnavailable(reason) {
      body.innerHTML = '<div class="pvm-msg">📡 ' + reason + '</div>';
    }

    try {
      // Fetch PDF.js and offline-pdf-store.js in parallel — the offline
      // store load never throws (see loadOfflineStore), so a missing/failed
      // offline-pdf-store.js can never block a PDF from opening online.
      const [, eng] = await Promise.all([loadPdfJs(), loadOfflineStore()]);

      const supported = !!(eng && eng.isSupported());
      const pdfId = meta.id || (eng ? eng.stableId(url) : url);
      const pdf = { id: pdfId, url, title: name, subject: meta.subject, category: meta.category };

      if (supported) {
        const listBtn = document.getElementById('pdfModalListBtn');
        if (listBtn) listBtn.style.display = '';
        renderOfflineButton(eng, offlineBtnSlot, pdf, pdfId);

        const resolved = await eng.resolvePdfSource(pdf);
        if (resolved.mode === 'offline') {
          if (banner) banner.innerHTML = '<div class="pvm-offline-banner">✓ Opened from offline storage — no data used</div>';
          await renderLoadedPdf(window.pdfjsLib.getDocument({ data: resolved.bytes }), body, pagesLabel);
          return;
        }
        if (resolved.mode === 'unavailable') {
          showUnavailable(resolved.reason);
          return;
        }
        // mode === 'online' — fall through to the normal streamed render below.
      }

      // NOTE: an earlier version tried to hand off to the OS via an
      // "intent://" URL here for the Android app specifically, but that
      // scheme isn't understood by this app's WebView without a native
      // plugin (net::ERR_UNKNOWN_URL_SCHEME) — so every platform now uses
      // this same in-page renderer, which needs no navigation at all.
      await renderLoadedPdf(window.pdfjsLib.getDocument({ url, withCredentials: false }), body, pagesLabel);
    } catch (err) {
      console.error('[PDF Viewer Modal]', err);
      showError('Could not load this PDF. ' + (err && err.message ? err.message : ''));
    }
  };

  // Same modal, but fed raw PDF bytes (base64) instead of a URL — used when
  // the PDF is proxied through our own backend rather than fetched directly
  // from wherever it's actually stored (e.g. a Cloudinary account whose
  // security settings block direct public delivery of PDFs).
  window.openPdfViewerFromBase64 = async function (base64, name) {
    if (!base64) return;
    const { body, pagesLabel } = buildOverlay(name);
    const listBtn = document.getElementById('pdfModalListBtn');
    if (listBtn) listBtn.style.display = 'none'; // no stable URL/id to key offline storage off of here

    function showError(msg) {
      body.innerHTML = '<div class="pvm-msg">⚠️ ' + msg + '</div>';
    }

    try {
      await loadPdfJs();
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      await renderLoadedPdf(window.pdfjsLib.getDocument({ data: bytes }), body, pagesLabel);
    } catch (err) {
      console.error('[PDF Viewer Modal]', err);
      showError('Could not load this PDF. ' + (err && err.message ? err.message : ''));
    }
  };

  // ------------------------------------------------------------------
  // "My Offline PDFs" — storage-used summary + per-file delete, reusing
  // the same bottom-sheet visual language as subject-pdf-list-modal.js.
  // ------------------------------------------------------------------

  window.closeOfflinePdfsList = function () {
    const el = document.getElementById('sopOverlay');
    if (el) el.remove();
  };

  function escapeHtmlLocal(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  window.openOfflinePdfsList = async function () {
    const eng = await loadOfflineStore();
    if (!eng || !eng.isSupported()) return;
    ensureStyles();

    const overlay = document.createElement('div');
    overlay.id = 'sopOverlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeOfflinePdfsList(); };
    overlay.innerHTML =
      '<div class="sop-sheet">' +
        '<div class="sop-header"><div class="sop-title">📂 My Offline PDFs</div><button class="sop-close" onclick="closeOfflinePdfsList()">✕</button></div>' +
        '<div class="sop-storage" id="sopStorage">Loading…</div>' +
        '<div class="sop-list" id="sopList"><div class="sop-msg"><div class="pvm-spin"></div>Loading…</div></div>' +
      '</div>';
    document.body.appendChild(overlay);

    const listEl = document.getElementById('sopList');
    const storageEl = document.getElementById('sopStorage');

    function refresh() {
      Promise.all([eng.listOfflinePdfs(), eng.getStorageUsed()]).then(([files, used]) => {
        storageEl.textContent = files.length
          ? files.length + ' PDF' + (files.length === 1 ? '' : 's') + ' saved · ' + eng.formatBytes(used) + ' used'
          : 'No PDFs saved offline yet';
        if (!files.length) {
          listEl.innerHTML = '<div class="sop-msg">Downloaded PDFs will appear here and open instantly — even without internet.</div>';
          return;
        }
        listEl.innerHTML = files.map((f) => `
          <div class="sop-row" data-id="${escapeHtmlLocal(f.id)}">
            <span class="sop-icon">📄</span>
            <div class="sop-info">
              <div class="sop-name">${escapeHtmlLocal(f.title || 'Document')}</div>
              <div class="sop-meta">${escapeHtmlLocal([f.subject, f.category].filter(Boolean).join(' · '))}${f.subject || f.category ? ' · ' : ''}${eng.formatBytes(f.fileSize)}</div>
            </div>
            <button class="sop-del" title="Delete offline copy">🗑</button>
          </div>
        `).join('');
        listEl.querySelectorAll('.sop-row').forEach((row) => {
          row.querySelector('.sop-del').onclick = () => {
            if (!confirm('Delete this offline PDF?')) return;
            eng.deleteOfflineCopy(row.dataset.id).then(refresh);
          };
        });
      });
    }

    refresh();
  };
})();
