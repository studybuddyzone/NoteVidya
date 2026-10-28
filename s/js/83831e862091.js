
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const params = new URLSearchParams(location.search);
  const pdfUrl = params.get('url');
  const pdfName = params.get('name') || 'Document';

  document.getElementById('pvTitle').textContent = pdfName;
  document.title = pdfName + ' | StudyBuddy Pro';

  const container = document.getElementById('pdfContainer');
  const pagesLabel = document.getElementById('pvPages');

  function showError(msg) {
    container.innerHTML = `
      <div class="state-msg">
        ⚠️ ${sbzEsc(msg)}<br />
        <a class="fallback-btn" href="${sbzUrl(pdfUrl || '#')}" download="${sbzEsc(pdfName)}.pdf">⬇️ Try downloading instead</a>
      </div>`;
  }

  if (!pdfUrl) {
    showError('No PDF specified.');
  } else {
    pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false }).promise
      .then(async (pdf) => {
        container.innerHTML = '';
        pagesLabel.textContent = pdf.numPages + ' page' + (pdf.numPages === 1 ? '' : 's');

        // Render pages one at a time (not all in parallel) — kinder to memory
        // on low-end phones, which is who's actually opening this in the app.
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewportBase = page.getViewport({ scale: 1 });
          const targetWidth = Math.min(window.innerWidth - 16, 900);
          const scale = (targetWidth / viewportBase.width) * (window.devicePixelRatio || 1);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = (viewport.width / (window.devicePixelRatio || 1)) + 'px';
          canvas.style.height = (viewport.height / (window.devicePixelRatio || 1)) + 'px';
          container.appendChild(canvas);

          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
      })
      .catch((err) => {
        console.error('[PDF Viewer]', err);
        showError('Could not load this PDF. ' + (err && err.message ? err.message : ''));
      });
  }
