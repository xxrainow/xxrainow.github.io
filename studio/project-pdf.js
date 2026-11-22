// PDF를 설정한 프로젝트에서만 PDF.js를 불러옵니다. 서버 변환이나 이미지 추출은 필요하지 않습니다.
const PDF_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/';
let library;
function loadLibrary() {
  if (!library) library = import(PDF_BASE + 'build/pdf.mjs').then(pdfjs => {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_BASE + 'build/pdf.worker.mjs';
    return pdfjs;
  }).catch(error => { library = null; throw error; });
  return library;
}
export function previewPages(config, total) {
  const values = Array.isArray(config) ? config : [1, 2, 3, 4];
  const pages = [...new Set(values.map(Number).filter(n => Number.isInteger(n) && n > 0 && n <= total))].slice(0, 6);
  return pages.length ? pages : Array.from({ length: Math.min(4, total) }, (_, i) => i + 1);
}
export function setupPresentations(scope = document) {
  for (const section of scope.querySelectorAll('[data-pdf-src]')) {
    if (section.dataset.pdfInitialized) continue;
    section.dataset.pdfInitialized = 'true';
    setupPresentation(section);
  }
}
function setupPresentation(section) {
  const find = selector => section.querySelector(selector);
  const status = find('[data-pdf-status]');
  const grid = find('[data-pdf-previews]');
  const dialog = find('[data-pdf-dialog]');
  const viewerCanvas = find('[data-pdf-canvas]');
  const viewerStatus = find('[data-pdf-viewer-status]');
  const pageInput = find('[data-pdf-page]');
  const previous = find('[data-pdf-prev]');
  const next = find('[data-pdf-next]');
  const open = find('[data-pdf-open]');
  const surface = find('.pdf-surface');
  let documentPromise, doc, pageNumber = 1, zoom = 1, renderTask, renderVersion = 0, renderQueue = Promise.resolve();
  let config;
  try { config = JSON.parse(section.dataset.pdfPages || 'null'); } catch { config = null; }
  open.hidden = false;
  async function loadDocument() {
    if (!documentPromise) documentPromise = loadLibrary().then(pdfjs => pdfjs.getDocument({
      url: new URL(section.dataset.pdfSrc, location.href).href,
      cMapUrl: PDF_BASE + 'cmaps/', cMapPacked: true,
      standardFontDataUrl: PDF_BASE + 'standard_fonts/', wasmUrl: PDF_BASE + 'wasm/',
      isEvalSupported: false,
    }).promise).then(pdf => { doc = pdf; pageInput.max = String(pdf.numPages); find('[data-pdf-total]').textContent = String(pdf.numPages); return pdf; }).catch(error => { documentPromise = null; throw error; });
    return documentPromise;
  }
  function reportError() {
    status.textContent = 'Preview unavailable. Use Open PDF to view the file.';
    viewerStatus.textContent = 'Unable to load this PDF. Open the file directly using the link above.';
  }
  async function renderViewer(number = pageNumber) {
    const version = ++renderVersion;
    renderTask?.cancel();
    // PDF.js cannot render two pages onto the same canvas at the same time.
    renderQueue = renderQueue.catch(() => {}).then(async () => {
      if (version !== renderVersion || !dialog.open) return;
      viewerStatus.textContent = 'Loading page…';
      try {
        const pdf = await loadDocument();
        if (version !== renderVersion || !dialog.open) return;
        pageNumber = Math.max(1, Math.min(pdf.numPages, Math.floor(Number(number) || 1)));
        pageInput.value = String(pageNumber); previous.disabled = pageNumber === 1; next.disabled = pageNumber === pdf.numPages;
        const page = await pdf.getPage(pageNumber);
        if (version !== renderVersion || !dialog.open) return;
        const original = page.getViewport({ scale: 1 });
        const width = Math.max(200, surface.clientWidth - 32);
        const viewport = page.getViewport({ scale: width / original.width * zoom });
        const ratio = Math.min(devicePixelRatio || 1, 2);
        viewerCanvas.width = Math.ceil(viewport.width * ratio); viewerCanvas.height = Math.ceil(viewport.height * ratio);
        viewerCanvas.style.width = Math.ceil(viewport.width) + 'px'; viewerCanvas.style.height = Math.ceil(viewport.height) + 'px';
        viewerCanvas.setAttribute('aria-label', 'PDF page ' + pageNumber + ' of ' + pdf.numPages);
        renderTask = page.render({ canvasContext: viewerCanvas.getContext('2d'), viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
        await renderTask.promise;
        if (version === renderVersion) viewerStatus.textContent = 'Page ' + pageNumber + ' of ' + pdf.numPages;
      } catch (error) { if (error.name !== 'RenderingCancelledException') reportError(); }
    });
    return renderQueue;
  }
  function openViewer(number = 1) {
    pageNumber = number;
    zoom = 1;
    if (!dialog.open) dialog.showModal();
    renderViewer(number);
  }
  open.addEventListener('click', () => openViewer());
  find('[data-pdf-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { ++renderVersion; renderTask?.cancel(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  previous.addEventListener('click', () => renderViewer(pageNumber - 1));
  next.addEventListener('click', () => renderViewer(pageNumber + 1));
  pageInput.addEventListener('change', () => renderViewer(pageInput.value));
  find('[data-pdf-zoom-in]').addEventListener('click', () => { zoom = Math.min(2.5, zoom + .25); renderViewer(); });
  find('[data-pdf-zoom-out]').addEventListener('click', () => { zoom = Math.max(.5, zoom - .25); renderViewer(); });
  find('[data-pdf-fit]').addEventListener('click', () => { zoom = 1; renderViewer(); });
  dialog.addEventListener('keydown', event => {
    if (event.target.tagName === 'INPUT') return;
    if (event.key === 'ArrowRight') { event.preventDefault(); renderViewer(pageNumber + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); renderViewer(pageNumber - 1); }
  });
  let resizeTimer;
  window.addEventListener('resize', () => { if (dialog.open) { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => renderViewer(), 150); } });
  async function showPreviews() {
    try {
      const pdf = await loadDocument();
      const selected = previewPages(config, pdf.numPages);
      status.textContent = selected.length + ' selected pages / ' + pdf.numPages + ' total';
      grid.replaceChildren();
      for (const number of selected) {
        const figure = document.createElement('figure');
        const button = document.createElement('button'); button.type = 'button'; button.className = 'pdf-preview';
        button.setAttribute('aria-label', 'Open presentation at page ' + number);
        const canvas = document.createElement('canvas'); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Presentation page ' + number);
        const caption = document.createElement('figcaption'); caption.textContent = 'Page ' + number;
        button.append(canvas); figure.append(button, caption); grid.append(figure);
        button.addEventListener('click', () => openViewer(number));
        const page = await pdf.getPage(number), original = page.getViewport({ scale: 1 });
        const width = Math.min(720, button.clientWidth || 520);
        const viewport = page.getViewport({ scale: width / original.width });
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * ratio); canvas.height = Math.ceil(viewport.height * ratio);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: [ratio, 0, 0, ratio, 0, 0] }).promise;
      }
    } catch { reportError(); }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); showPreviews(); } }, { rootMargin: '300px' });
    observer.observe(section);
  } else showPreviews();
}
