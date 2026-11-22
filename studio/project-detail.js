import { setupPresentations } from './project-pdf.js';
import { projects } from './projects.js';
import { renderProject, renderIndex } from './project-template.js';

// 생성된 HTML도 완전한 페이지입니다. JS는 데이터의 최신 수정사항과 복사 기능을 반영합니다.
const slug = document.body.dataset.projectSlug;
const project = projects.find((item) => item.slug === slug);
if (project) {
  document.title = `${project.title} — xxrainow`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', project.description || project.title);
  document.body.innerHTML = renderProject(project, projects);
  setupPresentations();
  const copy = document.querySelector('[data-copy-link]');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const status = document.querySelector('#page-status');
    try {
      const url = new URL(location.href);
      url.hash = '';
      await navigator.clipboard.writeText(url.href);
      copy.textContent = 'Link copied';
      status.textContent = 'Project link copied.';
      setTimeout(() => {
        copy.textContent = 'Copy link';
      }, 1800);
    } catch {
      copy.textContent = 'Copy the address bar';
      status.textContent = 'Select and copy the URL in the address bar.';
    }
  });
} else if (slug) {
  document.title = 'Project not found — xxrainow';
  document.body.innerHTML = renderIndex(projects, '../');
  const message = document.createElement('p');
  message.className = 'missing-project';
  message.textContent =
    'This project is no longer available. Explore another project below.';
  document.querySelector('main').prepend(message);
}
