/*
  Shared "subject PDF list" picker — used on pages that used to link straight
  to a single Google Drive folder (answer keys, books, notes, etc). Instead,
  this fetches every PDF the admin has uploaded for a given subject+category
  from the dashboard's Management system, shows them as a tappable list, and
  opens whichever one the student picks using the existing PDF viewer modal
  (openPdfViewer, from pdf-viewer-modal.js — include that file too).

  Usage, after any role/permission check has already passed:
      openSubjectPdfList('BEE', 'answer-key', 'BEE Answer Keys');

  Category is a free-form string (matches whatever the admin picked in the
  dashboard's upload form) — e.g. 'answer-key', 'book', 'notes',
  'question-bank', 'answer-bank', or the '-mod' suffixed variant for
  moderator-only content (e.g. 'notes-mod').
*/
(function () {
  const BACKEND_URL = 'https://studybuddypro-psi.vercel.app/api/backend';

  // Lazy-loads offline-pdf-store.js next to this script (same pattern as
  // pdf-viewer-modal.js) purely to show "✓ Offline" badges on rows that
  // are already saved. Never throws — on a plain browser/Windows build,
  // or if the file is missing, badges simply never appear, nothing else
  // in this file is affected.
  const SELF_SRC = (document.currentScript && document.currentScript.src) || '';
  const OFFLINE_STORE_SRC = SELF_SRC
    ? SELF_SRC.replace(/[^/]*$/, '') + 'offline-pdf-store.js'
    : 'offline-pdf-store.js';
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
    if (document.getElementById('spl-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'spl-modal-styles';
    style.textContent = `
      #splOverlay { position: fixed; inset: 0; z-index: 99998; background: rgba(10,14,25,0.55); display: flex; align-items: flex-end; justify-content: center; }
      #splOverlay .spl-sheet { width: 100%; max-width: 520px; max-height: 80vh; overflow-y: auto; background: #14161f; border-radius: 20px 20px 0 0; padding: 18px 16px 28px; -webkit-overflow-scrolling: touch; }
      @media (min-width: 640px) { #splOverlay { align-items: center; } #splOverlay .spl-sheet { border-radius: 16px; max-height: 76vh; } }
      #splOverlay .spl-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
      #splOverlay .spl-title { font-size: 1rem; font-weight: 800; color: #eef0f6; font-family: 'Inter', -apple-system, sans-serif; }
      #splOverlay .spl-close { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #eef0f6; font-size: 15px; flex-shrink: 0; }
      #splOverlay .spl-row { display: flex; align-items: center; gap: 12px; padding: 13px 12px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; cursor: pointer; font-family: 'Inter', -apple-system, sans-serif; }
      #splOverlay .spl-row:active { background: rgba(255,255,255,0.08); }
      #splOverlay .spl-icon { font-size: 20px; flex-shrink: 0; }
      #splOverlay .spl-name { flex: 1; min-width: 0; font-size: 0.86rem; font-weight: 600; color: #eef0f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #splOverlay .spl-count { flex-shrink: 0; font-size: 0.72rem; font-weight: 700; color: #9aa0b4; background: rgba(255,255,255,0.06); padding: 2px 9px; border-radius: 999px; }
      #splOverlay .spl-msg { text-align: center; color: #9aa0b4; font-size: 0.88rem; padding: 40px 10px; font-family: 'Inter', -apple-system, sans-serif; }
      #splOverlay .spl-spin { width: 22px; height: 22px; margin: 0 auto 12px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #6f7bff; border-radius: 50%; animation: splSpin 0.8s linear infinite; }
      @keyframes splSpin { to { transform: rotate(360deg); } }
      #splOverlay .spl-offline-badge { flex-shrink: 0; font-size: 11px; color: #6be19a; }
    `;
    document.head.appendChild(style);
  }

  function escapeHtmlLocal(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // One fetch per subject, reused by both the category menu and the list —
  // so opening the menu then tapping a category doesn't fetch twice.
  const subjectFilesCache = {};
  async function fetchSubjectFiles(subject) {
    if (subjectFilesCache[subject]) return subjectFilesCache[subject];
    const res = await fetch(BACKEND_URL + '?action=management-list&subject=' + encodeURIComponent(subject));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');
    const files = data.files || [];
    subjectFilesCache[subject] = files;
    return files;
  }

  window.closeSubjectPdfList = function () {
    const el = document.getElementById('splOverlay');
    if (el) el.remove();
  };

  function openOverlay(title) {
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.id = 'splOverlay';
    overlay.onclick = function (e) { if (e.target === overlay) closeSubjectPdfList(); };
    overlay.innerHTML =
      '<div class="spl-sheet">' +
        '<div class="spl-header"><div class="spl-title"></div><button class="spl-close" onclick="closeSubjectPdfList()">✕</button></div>' +
        '<div class="spl-list"><div class="spl-msg"><div class="spl-spin"></div>Loading…</div></div>' +
      '</div>';
    overlay.querySelector('.spl-title').textContent = title;
    document.body.appendChild(overlay);
    return overlay.querySelector('.spl-list');
  }

  // Row click goes through this helper (reading data-* attributes) instead
  // of an inline object literal in the onclick string, so file names with
  // quotes/special characters can never break the markup.
  window.__splOpenRow = function (el) {
    closeSubjectPdfList();
    openPdfViewer(el.dataset.pdfUrl, el.dataset.pdfName, {
      id: el.dataset.pdfId || undefined,
      subject: el.dataset.pdfSubject || undefined,
      category: el.dataset.pdfCategory || undefined,
    });
  };

  // Marks each row with a small "✓ Offline" badge when that PDF is already
  // saved for offline reading. Runs after the list is on screen and never
  // blocks rendering — on a plain browser/Windows build (no offline-pdf-
  // store.js support) this is simply a no-op.
  function markOfflineBadges(listEl) {
    loadOfflineStore().then((eng) => {
      if (!eng || !eng.isSupported()) return;
      listEl.querySelectorAll('.spl-row[data-pdf-id]').forEach((row) => {
        eng.hasOfflineCopy(row.dataset.pdfId).then((has) => {
          if (!has) return;
          const badge = document.createElement('span');
          badge.className = 'spl-offline-badge';
          badge.title = 'Available offline';
          badge.textContent = '✓ Offline';
          row.appendChild(badge);
        });
      });
    });
  }

  function renderFileRows(listEl, files, subject, category) {
    if (!files.length) {
      listEl.innerHTML = '<div class="spl-msg">अभी तक कोई PDF upload नहीं हुई। जल्द ही आ जाएगी!</div>';
      return;
    }
    listEl.innerHTML = files.map((f) => `
      <div class="spl-row" data-pdf-url="${escapeHtmlLocal(f.url)}" data-pdf-name="${escapeHtmlLocal(f.name)}" data-pdf-id="${escapeHtmlLocal(f.id)}" data-pdf-subject="${escapeHtmlLocal(subject)}" data-pdf-category="${escapeHtmlLocal(f.category || category || '')}" onclick="__splOpenRow(this);">
        <span class="spl-icon">📄</span>
        <span class="spl-name">${escapeHtmlLocal(f.name)}</span>
      </div>
    `).join('');
    markOfflineBadges(listEl);
  }

  // Shows the PDFs for ONE specific category directly (used when a page
  // already knows exactly which section it wants — e.g. a dedicated
  // "Question Bank" card).
  // `category` can be one string ('notes'), a comma-list ('answer-bank,answer-key')
  // or an array (['answer-bank','answer-key']). Only files whose category is in
  // that list are shown — so Notes never leak into Question Bank / Answers & vice-versa.
  function normalizeCategories(category) {
    const list = Array.isArray(category) ? category : String(category == null ? '' : category).split(',');
    return list.map((c) => String(c).trim()).filter(Boolean);
  }

  window.openSubjectPdfList = async function (subject, category, title) {
    const listEl = openOverlay(title || subject);
    const cats = normalizeCategories(category);
    try {
      const files = await fetchSubjectFiles(subject);
      renderFileRows(listEl, files.filter((f) => cats.indexOf(f.category || 'question-bank') !== -1), subject, cats[0] || '');
    } catch (err) {
      listEl.innerHTML = '<div class="spl-msg">⚠️ Could not load: ' + escapeHtmlLocal(err.message) + '</div>';
    }
  };

  // Shows a menu of sections (Notes / PYQ / Question Bank / Answer Bank —
  // or whichever of these actually have files) for a subject, each with a
  // live count, so every category the admin uploads under is reachable —
  // not just whichever single one a page happened to hardcode before.
  const SUBJECT_SECTIONS = [
    { category: 'notes', icon: '🗒️', label: 'Notes' },
    { category: 'pyq', icon: '📄', label: 'PYQ' },
    { category: 'question-bank', icon: '📝', label: 'Question Bank' },
    { category: 'answer-bank', icon: '✅', label: 'Answer Bank' },
  ];

  window.openSubjectCategoryMenu = async function (subject, title) {
    const displayTitle = title || subject;
    const listEl = openOverlay(displayTitle);
    try {
      const files = await fetchSubjectFiles(subject);
      const counts = {};
      files.forEach((f) => {
        const cat = f.category || 'question-bank';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      // Any category that actually has files but isn't in the default 4
      // (e.g. 'book', 'answer-key') still shows up, so nothing uploaded is
      // ever hidden just because it wasn't anticipated here.
      const extraCats = Object.keys(counts).filter(
        (c) => !SUBJECT_SECTIONS.some((s) => s.category === c) && !c.endsWith('-mod')
      );
      const extraLabels = { book: ['📚', 'Book'], 'answer-key': ['🔑', 'Answer Key'] };
      const sections = SUBJECT_SECTIONS.concat(
        extraCats.map((c) => ({ category: c, icon: (extraLabels[c] || ['📁', c])[0], label: (extraLabels[c] || ['📁', c])[1] }))
      );

      listEl.innerHTML = sections.map((s) => {
        const count = counts[s.category] || 0;
        return `
          <div class="spl-row" onclick="openSubjectPdfList('${escapeHtmlLocal(subject)}', '${escapeHtmlLocal(s.category)}', '${escapeHtmlLocal(displayTitle)} — ${escapeHtmlLocal(s.label)}')">
            <span class="spl-icon">${s.icon}</span>
            <span class="spl-name">${escapeHtmlLocal(s.label)}</span>
            <span class="spl-count">${count}</span>
          </div>
        `;
      }).join('');
    } catch (err) {
      listEl.innerHTML = '<div class="spl-msg">⚠️ Could not load: ' + escapeHtmlLocal(err.message) + '</div>';
    }
  };
  // Shows SUBJECT cards for ONE section (e.g. Question Bank). Tapping a subject opens only that
  // subject's files of that category — nothing from the other sections is shown.
  //   openSubjectPicker('question-bank', [{ title:'Semester 3', items:['Engineering Mathematics-III', ...] }, ...], 'AIML Question Bank')
  // An item can also be { name, label } when the display label differs from the stored subject name.
  window.openSubjectPicker = function (category, sections, title) {
    const listEl = openOverlay(title || 'Subjects');
    const rows = [];
    (sections || []).forEach((sec) => {
      if (sec.title) rows.push('<div class="spl-msg" style="padding:10px 4px 6px;text-align:left;font-weight:800;">' + escapeHtmlLocal(sec.title) + '</div>');
      (sec.items || []).forEach((it) => {
        const name = typeof it === 'string' ? it : it.name;
        const label = typeof it === 'string' ? it : (it.label || it.name);
        rows.push(
          '<div class="spl-row" data-subject="' + escapeHtmlLocal(name) + '" data-label="' + escapeHtmlLocal(label) + '" data-category="' + escapeHtmlLocal(normalizeCategories(category).join(',')) + '" onclick="__splPickSubject(this)">' +
            '<span class="spl-icon">📘</span><span class="spl-name">' + escapeHtmlLocal(label) + '</span>' +
          '</div>'
        );
      });
    });
    listEl.innerHTML = rows.join('') || '<div class="spl-msg">कोई subject नहीं मिला।</div>';
  };
  window.__splPickSubject = function (el) {
    const subject = el.dataset.subject, label = el.dataset.label, category = el.dataset.category;
    closeSubjectPdfList();
    openSubjectPdfList(subject, category, label);
  };
})();
