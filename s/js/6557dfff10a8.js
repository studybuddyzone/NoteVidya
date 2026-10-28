
  // ⚠️ Change this to match the subject name exactly as typed in the
  // dashboard's Management upload form.
  const SUBJECT = "AI";
  const BACKEND_URL = "https://studybuddypro-psi.vercel.app/api/backend";

  const listEl = document.getElementById('pdfList');

  function escapeHtml(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function render(files) {
    if (!files || !files.length) {
      listEl.innerHTML = '<div class="state-msg">No PDFs uploaded yet. Check back soon!</div>';
      return;
    }
    listEl.innerHTML = '<div class="pdf-grid">' + files.map((f) => `
      <a class="pdf-card" href="javascript:void(0)" data-pdf-url="${escapeHtml(f.url)}" data-pdf-name="${escapeHtml(f.name)}" onclick="openPdfViewer(this.dataset.pdfUrl, this.dataset.pdfName)">
        <div class="pc-icon">📄</div>
        <div class="pc-name">${escapeHtml(f.name)}</div>
        <div class="pc-meta">${timeAgo(f.uploadedAt)}</div>
      </a>
    `).join('') + '</div>';
  }

  async function loadPdfs() {
    try {
      const res = await fetch(BACKEND_URL + '?action=management-list&subject=' + encodeURIComponent(SUBJECT));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      render(data.files);
    } catch (err) {
      listEl.innerHTML = '<div class="state-msg">⚠️ Could not load: ' + escapeHtml(err.message) + '</div>';
    }
  }

  loadPdfs();
  // Re-checks every 30s so a newly uploaded PDF shows up without a manual
  // refresh (this route has no live/realtime push, unlike a direct DB listener).
  setInterval(loadPdfs, 30000);
