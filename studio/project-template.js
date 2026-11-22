// 상세 페이지와 정적 HTML 생성기가 함께 사용하는 템플릿입니다.
export function escapeHTML(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function externalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try { const url = new URL(value.trim()); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}
function assetUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const path = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return externalUrl(path);
  if (path.startsWith('//')) return externalUrl('https:' + path);
  return path.startsWith('/') ? path : base + path.replace(/^\.\//, '');
}
function imageMarkup(image, base) {
  const data = typeof image === 'string' ? { src: image } : image;
  if (!data?.src) return '';
  const src = assetUrl(data.src, base);
  if (!src) return '';
  return `<figure><img src="${escapeHTML(src)}" alt="${escapeHTML(data.alt || '')}" loading="lazy" decoding="async">${data.caption ? `<figcaption>${escapeHTML(data.caption)}</figcaption>` : ''}</figure>`;
}
export function renderProject(project, projects) {
  const p = project, e = escapeHTML;
  const links = [['github','Code'],['demo','Live Demo'],['youtube','Watch Video']]
    .map(([field,label]) => { const url = externalUrl(p[field]); return url ? `<a class="action" href="${e(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : ''; }).join('');
  const facts = [['Year', p.year], ['Role',p.role], ['Period',p.period], ['Team',p.team], ['Built with', Array.isArray(p.stack) ? p.stack.join(' · ') : p.stack]]
    .filter(([,value]) => value != null && String(value).trim()).map(([label,value]) => `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join('');
  const sections = Array.isArray(p.sections) ? p.sections : [];
  const chapters = sections.map((section,index) => {
    const body = Array.isArray(section.body) ? section.body : section.body ? [section.body] : [];
    const images = Array.isArray(section.images) ? section.images : [];
    return `<section class="chapter" id="section-${index+1}" aria-labelledby="heading-${index+1}"><h2 id="heading-${index+1}">${e(section.heading || 'Details')}</h2><div class="chapter-body">${body.map(text=>`<p>${e(text)}</p>`).join('')}${section.code ? `<pre><code>${e(section.code)}</code></pre>` : ''}${images.map(image=>imageMarkup(image,'../../')).join('')}</div></section>`;
  }).join('');
  const mediaSrc = assetUrl(p.video, '../../');
  const cover = p.cover ? imageMarkup(p.cover, '../../') : '';
  const media = mediaSrc ? `<section class="project-media" aria-label="Project demonstration"><video controls playsinline preload="metadata"${typeof p.cover === 'string' && assetUrl(p.cover,'../../') ? ` poster="${e(assetUrl(p.cover,'../../'))}"` : ''}><source src="${e(mediaSrc)}" type="video/mp4">Your browser does not support this video.</video></section>` : cover ? `<section class="project-media" aria-label="Project image">${cover}</section>` : '';
  const index = projects.findIndex(item => item.slug === p.slug);
  const previous = projects[index-1], next = projects[index+1];
  const adjacent = (item,label) => item ? `<a href="../${encodeURIComponent(item.slug)}/"><span>${label}</span><strong>${e(item.title)}</strong></a>` : '<span></span>';
  return `<header class="topbar"><a class="wordmark" href="../../">xx.st <span>by xxrainow</span></a><a class="back-link" href="../../#projects">All projects</a></header>
  <main id="project-content"><article>
    <div class="project-heading"><p class="eyebrow">${e(p.category || 'Project')}${p.year ? ` <span>/</span> ${e(p.year)}` : ''}</p><h1>${e(p.title)}</h1>${p.description ? `<p class="intro-copy">${e(p.description)}</p>` : ''}<div class="hero-actions">${links}<button class="copy-link action secondary" type="button" data-copy-link hidden>Copy link</button></div></div>
    ${media}
    ${facts ? `<dl class="project-facts">${facts}</dl>` : ''}
    ${chapters ? `<div class="case-study">${sections.length>1 ? `<nav class="contents" aria-label="On this page"><span>In this project</span>${sections.map((section,i)=>`<a href="#section-${i+1}">${e(section.heading || 'Details')}</a>`).join('')}</nav>` : ''}<div class="chapters">${chapters}</div></div>` : ''}
    ${Array.isArray(p.images) ? `<div class="image-gallery">${p.images.map(image=>imageMarkup(image,'../../')).join('')}</div>` : ''}
    <nav class="project-pagination" aria-label="Adjacent projects">${adjacent(previous,'Previous project')}${adjacent(next,'Next project')}</nav>
  </article></main><footer class="detail-footer"><a href="../../#projects">Back to projects</a><span>xxrainow / selected work</span></footer><p class="sr-only" id="page-status" role="status" aria-live="polite"></p>`;
}
export function renderIndex(projects, prefix = './') {
  return `<header class="topbar"><a class="wordmark" href="../">xx.st <span>by xxrainow</span></a><a href="../#projects">Studio index</a></header><main class="plain-index"><p class="eyebrow">Project archive</p><h1>One project.<br>One closer look.</h1><div class="project-directory">${projects.map(p=>`<a href="${prefix}${encodeURIComponent(p.slug)}/"><strong>${escapeHTML(p.title)}</strong><span>${escapeHTML([p.category,p.year].filter(Boolean).join(' / '))}</span></a>`).join('')}</div></main>`;
}
