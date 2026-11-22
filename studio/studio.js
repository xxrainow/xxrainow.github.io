import * as THREE from 'three';
import { projects } from './projects.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedQuery.matches;
const touch = matchMedia('(pointer: coarse)').matches;
const BG = 0x0c0c0d,
  INK = '#ededeb',
  MUTE = '#8a8a88';
// 빈 연도를 생략해 Demo 카드에 불필요한 쉼표가 붙지 않도록 합니다.
const projectMeta = (item) =>
  [item.category, item.year].filter(Boolean).join(', ');
// 외부 링크는 http/https 주소만 허용하고 새 탭으로 엽니다.
function projectLinkUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function projectLinks(item) {
  const links = document.createElement('div');
  links.className = 'project-links';
  links.setAttribute('aria-label', item.title + ' links');
  const detail = document.createElement('a');
  detail.href = item.detailUrl;
  detail.textContent = 'Detail';
  detail.setAttribute('aria-label', item.title + ' — Detail');
  links.append(detail);
  for (const [field, label] of [['github', 'Code'], ['demo', 'Live Demo'], ['youtube', 'Youtube']]) {
    const href = projectLinkUrl(item[field]);
    if (!href) continue;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', item.title + ' — ' + label);
    links.append(link);
  }
  links.hidden = !links.childElementCount;
  return links;
}
function setDetailLinks(container, item) {
  container.querySelector('.project-links')?.remove();
  const links = projectLinks(item);
  const description = container.querySelector('.lightbox-description') || container.querySelector(':scope > p');
  description.after(links);
}
function projectCredit(item) {
  return item.url?.startsWith('https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/')
    ? 'MotionSites preview · Design reference, not original client work.' : '';
}
const clamp = THREE.MathUtils.clamp;
const easeFactor = (speed, dt) => 1 - Math.pow(1 - speed, dt * 60);
const clock = new THREE.Clock();
let active = null,
  routeId = 0,
  dockShown = false;
const views = new Map();
const announce = (text) => {
  $('#announcement').textContent = text;
};
function animate(target, vars) {
  if (reduced) {
    Object.entries(vars).forEach(([key, value]) => {
      if (typeof value === 'number' && key in target) target[key] = value;
    });
    vars.onUpdate?.();
    vars.onComplete?.();
    return;
  }
  return gsap.to(target, vars);
}
const pointerLabel = $('#cursor-label');
let labelX, labelY;
function showLabel(text, kind = 'view') {
  pointerLabel.textContent = text;
  pointerLabel.classList.toggle('overview-cursor', kind === 'overview');
  if (!touch && innerWidth > 1024)
    gsap.to(pointerLabel, {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: 'power4.out',
      overwrite: 'auto',
    });
}
function hideLabel() {
  gsap.to(pointerLabel, {
    opacity: 0,
    scale: 0.6,
    duration: 0.25,
    overwrite: 'auto',
  });
}
window.addEventListener('pointermove', (e) => {
  labelX?.(e.clientX + 14);
  labelY?.(e.clientY + 14);
});
function showDock() {
  if (dockShown) return;
  dockShown = true;
  gsap.fromTo(
    $('.dock'),
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: reduced ? 0 : 0.9, ease: 'expo.out' },
  );
  $('.dock').style.pointerEvents = 'auto';
}
function menu(open) {
  const p = $('#dock-menu');
  p.classList.toggle('open', open);
  p.inert = !open;
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
  $('.menu-toggle').setAttribute(
    'aria-label',
    open ? '메뉴 닫기' : '메뉴 열기',
  );
}
$('.menu-toggle').addEventListener('click', () =>
  menu(!$('#dock-menu').classList.contains('open')),
);
window.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.dock,.dock-menu')) menu(false);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') menu(false);
});

// One media owner per card. Never let an asynchronous load start playback in an inactive view.
class Preview {
  constructor(item) {
    this.item = item;
    this.video = null;
    this.texture = null;
    this.still = null;
    this.ready = false;
    this.failed = false;
    this.loading = false;
    this.wantsPlay = false;
    this.listeners = [];
  }
  load() {
    if (this.loading || !this.item.url) return;
    this.loading = true;
    const v = document.createElement('video');
    this.video = v;
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.preload = 'auto';
    this.texture = new THREE.VideoTexture(v);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    const ready = () => {
      if (this.ready || !v.videoWidth) return;
      this.ready = true;
      const c = document.createElement('canvas');
      c.width = 480;
      c.height = 270;
      try {
        c.getContext('2d').drawImage(v, 0, 0, 480, 270);
        this.still = new THREE.CanvasTexture(c);
        this.still.colorSpace = THREE.SRGBColorSpace;
      } catch {
        this.failed = true;
      }
      this.listeners.forEach((f) => f(this));
      if (this.wantsPlay) this.play();
      else v.pause();
    };
    v.addEventListener('loadedmetadata', () => {
      try {
        v.currentTime = Math.min(1.2, (v.duration || 4) * 0.3);
      } catch {}
    });
    v.addEventListener('seeked', ready, { once: true });
    v.addEventListener(
      'loadeddata',
      () => {
        if (
          v.currentTime === 0 &&
          (!Number.isFinite(v.duration) || v.duration === 0)
        )
          ready();
      },
      { once: true },
    );
    v.addEventListener(
      'error',
      () => {
        this.failed = true;
        this.loading = false;
        this.listeners.forEach((f) => f(this));
      },
      { once: true },
    );
    v.src = this.item.url;
    v.load();
  }
  play() {
    this.wantsPlay = true;
    if (this.video && this.ready && !reduced && !document.hidden)
      this.video.play().catch(() => {});
  }
  pause() {
    this.wantsPlay = false;
    this.video?.pause();
  }
}
function projectPoster(item) {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 270;
  const x = c.getContext('2d');
  x.fillStyle = '#18181a';
  x.fillRect(0, 0, 480, 270);
  x.fillStyle = '#68686b';
  x.font = '13px Geist, sans-serif';
  x.fillText(
    String(item.id).padStart(2, '0') + ' / ' + item.category.toUpperCase(),
    25,
    35,
  );
  x.fillStyle = '#ededeb';
  x.font = '32px Newsreader, Georgia, serif';
  x.fillText(item.title, 25, 149);
  x.fillStyle = '#68686b';
  x.font = '12px Geist, sans-serif';
  x.fillText(item.url ? 'PREVIEW' : 'PROJECT', 25, 244);
  return c;
}
function fallbackTexture(item) {
  const t = new THREE.CanvasTexture(projectPoster(item));
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
class SceneView {
  constructor(name, fov = 60) {
    this.name = name;
    this.element = $('#' + name);
    this.stage = $('#' + name + '-stage');
    this.enabled = false;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !touch,
      alpha: false,
      powerPreference: 'low-power',
    });
    this.renderer.setClearColor(BG);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.stage.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 2000);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(9, 9);
    this.medias = [];
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.enabled = false;
      announce('3D 화면 연결이 끊겼어요. 새로고침해 주세요.');
      $('#load-error').hidden = false;
    });
  }
  resize() {
    this.w = innerWidth;
    this.h = innerHeight;
    this.renderer.setSize(this.w, this.h);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }
  enter() {
    this.enabled = true;
    this.resize();
  }
  leave() {
    this.enabled = false;
    this.medias.forEach((m) => m.pause());
    hideLabel();
  }
  pointer(e) {
    this.mouse.set((e.clientX / this.w) * 2 - 1, (-e.clientY / this.h) * 2 + 1);
  }
  ray(meshes) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(meshes, true)[0];
  }
  draw() {
    this.renderer.render(this.scene, this.camera);
  }
}

class Gallery extends SceneView {
  constructor() {
    super('gallery', 60);
    this.camera.position.z = 12;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.medias = projects.slice(0, 20).map((p) => new Preview(p));
    this.planes = [];
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.angle = new THREE.Vector2();
    this.smooth = new THREE.Vector2();
    this.velocity = new THREE.Vector2();
    this.auto = !reduced;
    this.expansion = { value: 0, band: 0 };
    this.selected = null;
    this.overview = false;
    this.hover = null;
    this.keyboardIndex = -1;
    this.introDone = false;
    this.time = 0;
    this.circleSpin = 0;
    this.introPhase = 'loading';
    this.introState = { circle: 0, collapse: 0, burst: 0, speed: 1 };
    this.medias.forEach((m, i) => {
      const mat = new THREE.MeshBasicMaterial({
        map: fallbackTexture(m.item),
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(this.geometry, mat);
      mesh.userData = { index: i, base: new THREE.Vector3() };
      this.group.add(mesh);
      this.planes.push(mesh);
      m.listeners.push(() => {
        if (m.ready) {
          mat.map = reduced ? m.still || m.texture : m.texture;
          mat.needsUpdate = true;
          if (this.enabled && this.introPhase !== 'loading') m.play();
        }
      });
    });
    this.resize();
    this.bind();
    this.startIntro();
  }
  px(v) {
    return (v * (2 * 12 * Math.tan(Math.PI / 6))) / this.h;
  }
  resize() {
    super.resize();
    if (!this.planes) return;
    const mid = this.w > 1024 && this.w <= 1440,
      phone = this.w <= 640;
    this.planeSize = phone ? 72 : 104 * (mid ? 0.8 : 1);
    this.radius = phone
      ? Math.max(65, this.w / 2 - 24 - this.planeSize / 2)
      : 250 * (mid ? 0.8 : 1);
    this.planes.forEach((mesh, i) => {
      const y = i * 0.1 - 1 + 0.05,
        r = Math.sqrt(1 - y * y),
        a = Math.PI * (3 - Math.sqrt(5)) * i;
      mesh.userData.base
        .set(Math.cos(a) * r, y, Math.sin(a) * r)
        .multiplyScalar(this.px(this.radius));
    });
  }
  bind() {
    let drag = null,
      path = 0,
      last = null,
      pinching = false;
    this.stage.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.interact();
      drag = { x: e.clientX, y: e.clientY };
      last = { ...drag };
      path = 0;
      this.stage.setPointerCapture(e.pointerId);
      this.stage.style.cursor = 'grabbing';
    });
    this.stage.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      this.pointer(e);
      if (drag && !this.selected) {
        const dx = e.clientX - last.x,
          dy = e.clientY - last.y;
        path += Math.hypot(dx, dy);
        this.velocity.x += dx * 0.001;
        this.velocity.y += dy * 0.001;
        last = { x: e.clientX, y: e.clientY };
      }
      this.needsRay = true;
    });
    this.stage.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const distance = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      drag = null;
      this.stage.style.cursor = 'grab';
      this.pointer(e);
      if (distance < 6 && path < 10 && !pinching && this.introDone) {
        const hit = this.ray(this.planes);
        if (hit) this.select(hit.object);
        else this.close();
      }
      pinching = false;
    });
    this.stage.addEventListener('pointercancel', () => {
      drag = null;
      pinching = false;
    });
    this.stage.addEventListener('lostpointercapture', () => {
      drag = null;
    });
    this.stage.addEventListener('pointerleave', () => {
      this.mouse.set(9, 9);
      this.needsRay = true;
    });
    this.stage.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.interact();
        if (!this.selected) this.velocity.x += e.deltaY * 0.0002;
      },
      { passive: false },
    );
    let pinch = 0;
    this.stage.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) {
          pinching = true;
          pinch = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
        }
      },
      { passive: true },
    );
    this.stage.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 2) {
          const next = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
          this.velocity.x += (next - pinch) * 0.0002;
          pinch = next;
        }
      },
      { passive: true },
    );
    this.stage.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        this.finishIntro();
        this.interact();
        const direction = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        this.keyboardIndex = (this.keyboardIndex + direction + 20) % 20;
        this.setCaption(this.medias[this.keyboardIndex].item);
        this.selected && this.close();
        const base = this.planes[this.keyboardIndex].userData.base
          .clone()
          .normalize();
        this.group.quaternion.setFromUnitVectors(
          base,
          new THREE.Vector3(0, 0, 1),
        );
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.finishIntro();
        this.select(this.planes[Math.max(0, this.keyboardIndex)]);
      }
    });
    $('#gallery-close').addEventListener('click', () => this.close());
    $('#overview-close').addEventListener('click', () => this.close());
    $('#skip-intro').addEventListener('click', () => this.finishIntro());
    window.addEventListener('keydown', (e) => {
      if (this.enabled && e.key === 'Escape') this.close();
    });
  }
  interact() {
    this.auto = false;
  }
  startIntro() {
    if (reduced) {
      this.finishIntro();
      return;
    }
    gsap.fromTo(
      '.intro-mark',
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.2 },
    );
    gsap.fromTo(
      '.side-label',
      { yPercent: 100, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.07,
        delay: 0.5,
      },
    );
    setTimeout(() => {
      this.medias.forEach((m) => m.load());
    }, 200);
    this.introStart = performance.now();
  }
  beginCircle() {
    if (this.introPhase !== 'loading') return;
    this.introPhase = 'circle';
    gsap.to('.counter', { y: -20, opacity: 0, duration: 0.4 });
    this.timeline = gsap.timeline();
    this.timeline
      .to(this.introState, { circle: 1, duration: 1.8, ease: 'power3.out' })
      .to(this.introState, { speed: 7.3, duration: 1, ease: 'power2.in' }, 1.3)
      .to('.intro-mark', { opacity: 0, duration: 0.75 }, 2.1)
      .to(
        this.introState,
        { collapse: 1, duration: 1.7, ease: 'power2.inOut' },
        2.1,
      )
      .call(
        () => {
          this.introPhase = 'burst';
          showDock();
        },
        null,
        4,
      )
      .to(this.introState, { burst: 1, duration: 1, ease: 'power3.out' }, 4)
      .call(() => this.finishIntro(), null, 5);
  }
  finishIntro() {
    if (this.introDone) return;
    this.introDone = true;
    this.introPhase = 'done';
    this.timeline?.kill();
    this.introState.burst = 1;
    this.medias.forEach((m) => {
      m.load();
      if (this.enabled) m.play();
    });
    this.planes.forEach((p) => (p.material.opacity = 1));
    $('#intro').hidden = true;
    showDock();
  }
  enter() {
    super.enter();
    this.medias.forEach((m) => {
      if (m.ready) m.play();
    });
  }
  leave() {
    super.leave();
    this.close(true);
  }
  setCaption(item) {
    if (this.caption === item?.title) return;
    this.caption = item?.title;
    gsap.killTweensOf('.gallery-caption');
    gsap.to('.gallery-caption', {
      y: -8,
      opacity: 0,
      duration: reduced ? 0 : 0.16,
      onComplete: () => {
        $('#caption-title').textContent = item?.title || '';
        $('#caption-category').textContent = item?.category || '';
        gsap.fromTo(
          '.gallery-caption',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: reduced ? 0 : 0.5, ease: 'expo.out' },
        );
      },
    });
  }
  select(mesh) {
    this.interact();
    if (this.selected === mesh) {
      this.showOverview(!this.overview);
      return;
    }
    if (this.selected) this.close(true);
    this.selected = mesh;
    this.setCaption(null);
    this.medias.forEach((m, i) =>
      i === mesh.userData.index ? m.play() : m.pause(),
    );
    $('#gallery-close').hidden = false;
    $('#gallery-project-link').href = this.medias[mesh.userData.index].item.detailUrl;
    $('#gallery-project-link').hidden = false;
    $('.gallery-hint').style.opacity = '0';
    animate(this.expansion, { value: 1, duration: 0.8, ease: 'power4.out' });
    announce(
      this.medias[mesh.userData.index].item.title +
        ' 미리보기. 다시 선택하면 설명이 열립니다.',
    );
  }
  showOverview(open) {
    this.overview = open;
    animate(this.expansion, {
      band: open ? 1 : 0,
      duration: 0.8,
      ease: 'power4.out',
    });
    const panel = $('#overview');
    if (open) {
      const item = this.medias[this.selected.userData.index].item;
      panel.querySelector('h2').textContent = item.title;
      panel.querySelector('em').textContent = projectMeta(item);
      panel.querySelector('p').textContent = item.description;
      setDetailLinks(panel, item);
      const tags = panel.querySelector('.tags');
      tags.replaceChildren();
      for (const text of [item.url ? 'Video preview' : 'Project', projectCredit(item) ? 'MotionSites reference' : '', 'Live WebGL'].filter(Boolean)) {
        const tag = document.createElement('span');
        tag.textContent = text;
        tags.append(tag);
      }
      panel.hidden = false;
      gsap.fromTo(
        panel,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: reduced ? 0 : 0.7,
          delay: reduced ? 0 : 0.12,
          ease: 'expo.out',
        },
      );
    } else {
      panel.hidden = true;
    }
  }
  close(immediate = false) {
    if (!this.selected) return;
    this.showOverview(false);
    $('#gallery-close').hidden = true;
    $('#gallery-project-link').hidden = true;
    $('.gallery-hint').style.opacity = '';
    hideLabel();
    if (immediate) {
      gsap.killTweensOf(this.expansion);
      this.expansion.value = 0;
      this.expansion.band = 0;
      this.selected = null;
    } else
      animate(this.expansion, {
        value: 0,
        duration: 0.8,
        ease: 'power4.out',
        onComplete: () => {
          this.selected = null;
        },
      });
  }
  update(dt, now) {
    this.time += dt;
    if (!this.introDone && this.introPhase === 'loading') {
      const elapsed = (performance.now() - this.introStart) / 1000,
        loaded = this.medias
          .slice(0, 10)
          .filter((m) => !m.item.url || m.ready || m.failed).length;
      $('.counter').textContent = String(
        Math.min(99, Math.round((loaded / 10) * 99)),
      ).padStart(3, '0');
      if (elapsed > 2 && (loaded === 10 || elapsed > 30)) this.beginCircle();
    }
    if (!this.selected && this.introDone) {
      const previous = this.smooth.clone();
      this.velocity.multiplyScalar(Math.pow(0.94, dt * 60));
      this.angle.addScaledVector(this.velocity, dt * 60);
      this.smooth.lerp(this.angle, easeFactor(0.11, dt));
      const yaw = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          this.smooth.x - previous.x,
        ),
        pitch = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          this.smooth.y - previous.y,
        );
      this.group.quaternion.premultiply(yaw).premultiply(pitch);
      if (this.auto && !reduced)
        this.group.quaternion.premultiply(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(Math.sin(0.4014), Math.cos(0.4014), 0),
            0.001 * dt * 60,
          ),
        );
    }
    this.circleSpin +=
      THREE.MathUtils.degToRad(0.5) * this.introState.speed * dt * 60;
    const inverse = this.group.quaternion.clone().invert(),
      e = this.expansion.value;
    this.planes.forEach((mesh, i) => {
      const base = mesh.userData.base.clone();
      let scale = this.px(this.planeSize),
        opacity = 1;
      if (!this.introDone) {
        if (this.introPhase === 'loading') {
          opacity = 0;
        } else if (this.introPhase === 'circle') {
          const progress = clamp(
              (this.introState.circle * 1.8 - i * 0.1) / 0.8,
              0,
              1,
            ),
            a = -Math.PI / 2 + i * Math.PI * 0.2 + this.circleSpin,
            r = this.px(240 * (this.w <= 640 ? 0.75 : 1));
          base
            .set(Math.cos(a) * r, Math.sin(a) * r, 0)
            .lerp(
              new THREE.Vector3(0, 0, i * this.px(1.5)),
              this.introState.collapse,
            );
          scale =
            this.px(
              70 +
                ((this.planeSize * 120) / 82 - 70) * this.introState.collapse,
            ) * progress;
          opacity = i < 10 ? progress : 0;
        } else {
          base.multiplyScalar(
            this.introState.burst *
              (1 + 0.1 * Math.sin(Math.PI * this.introState.burst)),
          );
          scale *= Math.max(0.01, this.introState.burst);
          opacity = this.introState.burst;
        }
      }
      if (this.selected) {
        if (mesh === this.selected) {
          const world = base.clone().applyQuaternion(this.group.quaternion);
          const band = Math.min(290, this.h * 0.4) * this.expansion.band,
            available = this.h - band;
          const h = Math.min(available * 0.7, ((this.w - 16) * 9) / 16),
            w = (h * 16) / 9;
          const center = new THREE.Vector3(0, this.px(band / 2), 0)
            .lerp(world, 1 - e)
            .applyQuaternion(inverse);
          base.copy(center);
          scale = THREE.MathUtils.lerp(scale, this.px(w), e);
          mesh.renderOrder = 20;
        } else {
          base.multiplyScalar(1 + e * 0.8);
          opacity *= 1 - e * 0.9;
          mesh.renderOrder = 0;
        }
      } else mesh.renderOrder = 0;
      mesh.position.copy(base);
      mesh.quaternion.copy(inverse);
      mesh.scale.set(scale, (scale * 9) / 16, 1);
      mesh.material.opacity = opacity;
    });
    if (this.introDone && this.time - (this.lastVideoCheck || 0) > 0.3) {
      this.lastVideoCheck = this.time;
      this.planes.forEach((mesh, i) => {
        const m = this.medias[i];
        if (this.selected) {
          mesh === this.selected ? m.play() : m.pause();
          return;
        }
        const p = mesh.position.clone().applyQuaternion(this.group.quaternion),
          ratio = p.z / p.length();
        if (ratio < -0.25) m.pause();
        else if (ratio > -0.1) m.play();
      });
    }
    if (this.needsRay && this.introDone) {
      this.needsRay = false;
      const hit = this.ray(this.planes);
      this.hover = hit?.object || null;
      if (this.selected && this.hover === this.selected)
        showLabel(this.overview ? 'Close' : 'Overview', 'overview');
      else hideLabel();
      if (!this.selected) {
        this.setCaption(
          this.hover ? this.medias[this.hover.userData.index].item : null,
        );
        this.stage.style.cursor = this.hover ? 'pointer' : 'grab';
      }
    }
    this.draw();
  }
}

const quadVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const tileFragment = `
  uniform sampler2D uTex,uTex2;uniform float uMix,uReveal,uTime;varying vec2 vUv;
  void main(){vec4 a=texture2D(uTex,vUv),b=texture2D(uTex2,vUv);vec3 media=mix(a.rgb,b.rgb,uMix);
    float sweep=fract(uTime*.6),band=(1.-smoothstep(0.,.18,abs((vUv.x+vUv.y)*.5-sweep)))*.035;
    gl_FragColor=vec4(mix(vec3(.085+band),media,uReveal),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const postVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const lensFragment = `
  uniform sampler2D uScene;uniform float uStrength;varying vec2 vUv;
  void main(){vec2 uv=vUv;float edge=min(uv.y,1.-uv.y);float d=clamp(1.-edge/.08,0.,1.);float sag=1.-sqrt(max(0.,1.-d*d));
    uv.y+=sign(.5-uv.y)*sag*.08*uStrength;
    vec3 col=vec3(0.),weight=vec3(0.);
    for(int i=0;i<16;i++){float t=float(i)/15.;vec2 p=uv+vec2(0.,(t-.5)*.01*d*30.);p=clamp(p,0.,1.);
      vec3 w=vec3(1.-smoothstep(.2,.8,t),smoothstep(0.,.5,t)*(1.-smoothstep(.5,1.,t)),smoothstep(.2,.8,t));col+=texture2D(uScene,p).rgb*w;weight+=w;}
    gl_FragColor=vec4(col/max(weight,.001),1.);
    #include <colorspace_fragment>
  }`;
class ProjectIndex extends SceneView {
  constructor() {
    super('projects', 35);
    this.scroll = $('#project-scroll');
    this.tiles = [];
    this.scrollTarget = 0;
    this.scrollCurrent = 0;
    this.t = 0;
    this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      samples: this.renderer.capabilities.isWebGL2 ? 4 : 0,
      type: THREE.HalfFloatType,
    });
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.Camera();
    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: postVertex,
      fragmentShader: lensFragment,
      uniforms: {
        uScene: { value: this.renderTarget.texture },
        uStrength: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.postScene.add(
      new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial),
    );
    this.grid = $('#project-grid');
    projects.slice(0, 24).forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'project-card';
      const button = document.createElement('button');
      button.className = 'tile';
      button.type = 'button';
      button.setAttribute(
        'aria-label',
        `${item.title}, ${projectMeta(item)} — 미리보기 열기`,
      );
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = String(i + 1).padStart(2, '0') + '  ' + item.category;
      button.append(chip);
      const label = document.createElement('div');
      label.className = 'project-label';
      const title = document.createElement('h2');
      title.textContent = item.title;
      const meta = document.createElement('p');
      meta.textContent = projectMeta(item);
      const links = projectLinks(item);
      label.append(title, meta, links);
      links.addEventListener('focusin', () => {
        this.scrollTarget = this.scroll.scrollTop;
        this.scrollCurrent = this.scrollTarget;
      });
      card.append(button, label);
      this.grid.append(card);
      const media = new Preview(item);
      this.medias.push(media);
      const fallback = fallbackTexture(item);
      const material = new THREE.ShaderMaterial({
        vertexShader: quadVertex,
        fragmentShader: tileFragment,
        uniforms: {
          uTex: { value: fallback },
          uTex2: { value: fallback },
          uMix: { value: 0 },
          uReveal: { value: item.url ? 0 : 1 },
          uTime: { value: 0 },
        },
        depthTest: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      this.scene.add(mesh);
      const tile = {
        card,
        button,
        media,
        mesh,
        material,
        item,
        top: 0,
        height: 0,
        hover: false,
      };
      this.tiles.push(tile);
      media.listeners.push(() => {
        if (media.ready) {
          material.uniforms.uTex.value = media.still || media.texture;
          material.uniforms.uTex2.value = media.texture;
          animate(material.uniforms.uReveal, {
            value: 1,
            duration: 0.8,
            ease: 'power2.out',
          });
        }
        if (media.failed) {
          material.uniforms.uReveal.value = 1;
          chip.textContent =
            String(i + 1).padStart(2, '0') + '  Preview unavailable';
        }
      });
      button.addEventListener('pointerenter', () => {
        if (!this.enabled) return;
        tile.hover = true;
        if (this.w > 1024 && !touch) {
          this.playTile(tile);
          showLabel('View');
        }
      });
      button.addEventListener('pointerleave', () => {
        tile.hover = false;
        if (this.w > 1024 && !touch) this.stopTile(tile);
        hideLabel();
      });
      button.addEventListener('focus', () => {
        this.scrollTarget = this.scroll.scrollTop;
        this.scrollCurrent = this.scrollTarget;
        this.playTile(tile);
      });
      button.addEventListener('blur', () => this.stopTile(tile));
      button.addEventListener('click', () =>
        openLightbox(item, () => this.enabled && this.resumeVisible()),
      );
    });
    this.scroll.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        const multiplier =
          e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.h : 1;
        this.scrollTarget = clamp(
          this.scrollTarget + e.deltaY * multiplier,
          0,
          this.maxScroll(),
        );
      },
      { passive: false },
    );
    let finger = null,
      inertia = 0;
    this.scroll.addEventListener(
      'touchstart',
      (e) => {
        finger = e.touches[0].clientY;
        inertia = 0;
      },
      { passive: true },
    );
    this.scroll.addEventListener(
      'touchmove',
      (e) => {
        if (finger === null) return;
        e.preventDefault();
        const y = e.touches[0].clientY;
        inertia = finger - y;
        this.scrollTarget = clamp(
          this.scrollTarget + inertia,
          0,
          this.maxScroll(),
        );
        finger = y;
      },
      { passive: false },
    );
    this.scroll.addEventListener(
      'touchend',
      () => {
        finger = null;
        this.inertia = inertia;
      },
      { passive: true },
    );
    this.scroll.addEventListener(
      'touchcancel',
      () => {
        finger = null;
        this.inertia = 0;
      },
      { passive: true },
    );
    this.scroll.addEventListener('keydown', (e) => {
      let delta = 0;
      if (e.key === 'ArrowDown') delta = 70;
      if (e.key === 'ArrowUp') delta = -70;
      if (e.key === 'PageDown' || e.key === ' ') delta = this.h * 0.8;
      if (e.key === 'PageUp') delta = -this.h * 0.8;
      if (e.key === 'Home') {
        e.preventDefault();
        this.scrollTarget = 0;
      }
      if (e.key === 'End') {
        e.preventDefault();
        this.scrollTarget = this.maxScroll();
      }
      if (delta) {
        e.preventDefault();
        this.scrollTarget = clamp(
          this.scrollTarget + delta,
          0,
          this.maxScroll(),
        );
      }
    });
    this.resize();
  }
  maxScroll() {
    return Math.max(0, this.scroll.scrollHeight - this.h);
  }
  resize() {
    super.resize();
    if (!this.tiles) return;
    this.camera.position.set(
      this.w / 2,
      -this.h / 2,
      this.h / 2 / Math.tan(THREE.MathUtils.degToRad(17.5)),
    );
    this.camera.lookAt(this.w / 2, -this.h / 2, 0);
    const dpr = this.renderer.getPixelRatio();
    this.renderTarget.setSize(
      Math.round(this.w * dpr),
      Math.round(this.h * dpr),
    );
    this.tiles.forEach((t) => {
      const r = t.button.getBoundingClientRect();
      t.left = r.left;
      t.top = r.top + this.scroll.scrollTop;
      t.width = r.width;
      t.height = r.height;
      t.mesh.scale.set(r.width, r.height, 1);
    });
    this.scrollTarget = clamp(this.scrollTarget, 0, this.maxScroll());
  }
  enter() {
    super.enter();
    this.resize();
    gsap.fromTo(
      '.projects-heading',
      { opacity: 0 },
      { opacity: 1, duration: reduced ? 0 : 0.3 },
    );
    if (!this.entered) {
      this.entered = true;
      if (!reduced) this.scramble();
      this.tiles.forEach((tile, i) => {
        const cols = this.w > 1024 ? 3 : this.w > 640 ? 2 : 1;
        gsap.fromTo(
          tile.card,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0 : 1.2,
            delay: reduced
              ? 0
              : 0.35 + 0.08 * (i % cols) + 0.06 * Math.floor(i / cols),
            ease: 'expo.out',
            onUpdate: () => this.resizeTile(tile),
          },
        );
      });
    }
    this.resumeVisible();
  }
  resizeTile(tile) {
    const r = tile.button.getBoundingClientRect();
    tile.left = r.left;
    tile.top = r.top + this.scroll.scrollTop;
  }
  scramble() {
    const node = $('.projects-heading'),
      text = 'A Collection of ',
      em = 'Demo Experiments';
    let progress = { value: 0 };
    animate(progress, {
      value: 1,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        const chars = '. : · , ; _';
        const str = [...text]
          .map((c, i) =>
            c === ' '
              ? ' '
              : progress.value > (0.7 * i) / text.length + 0.3
                ? c
                : chars[Math.floor(Math.random() * chars.length)],
          )
          .join('');
        node.firstChild.textContent = str;
      },
      onComplete: () => {
        node.firstChild.textContent = text;
        node.querySelector('em').textContent = em;
      },
    });
  }
  playTile(t) {
    if (!t.media.ready) return;
    t.media.play();
    animate(t.material.uniforms.uMix, {
      value: reduced ? 0 : 1,
      duration: 0.45,
      ease: 'power2.out',
    });
  }
  stopTile(t) {
    t.media.pause();
    animate(t.material.uniforms.uMix, {
      value: 0,
      duration: 0.45,
      ease: 'power2.out',
    });
  }
  resumeVisible() {
    this.lastPlayCheck = -1;
  }
  leave() {
    super.leave();
    this.tiles.forEach((t) => this.stopTile(t));
  }
  update(dt) {
    this.t += dt;
    if (this.inertia) {
      this.scrollTarget = clamp(
        this.scrollTarget + this.inertia * dt * 60,
        0,
        this.maxScroll(),
      );
      this.inertia *= Math.pow(0.95, dt * 60);
      if (Math.abs(this.inertia) < 0.1) this.inertia = 0;
    }
    this.scrollCurrent = THREE.MathUtils.lerp(
      this.scrollCurrent,
      this.scrollTarget,
      reduced ? 1 : easeFactor(0.12, dt),
    );
    if (Math.abs(this.scrollCurrent - this.scrollTarget) < 0.1)
      this.scrollCurrent = this.scrollTarget;
    this.scroll.scrollTop = this.scrollCurrent;
    let nearest = null,
      distance = Infinity;
    this.tiles.forEach((t) => {
      const y = t.top - this.scrollCurrent;
      t.mesh.position.set(t.left + t.width / 2, -y - t.height / 2, 0);
      t.mesh.visible = y < this.h + 50 && y + t.height > -50;
      t.material.uniforms.uTime.value = this.t;
      if (
        y < this.h * 2.6 &&
        y + t.height > -this.h * 0.6 &&
        !t.media.loading &&
        !t.media.failed
      )
        t.media.load();
      if (touch || this.w <= 1024) {
        const d = Math.abs(y + t.height / 2 - this.h / 2);
        if (d < distance) {
          distance = d;
          nearest = t;
        }
      } else if (!t.mesh.visible && t.media.wantsPlay) this.stopTile(t);
    });
    if ((touch || this.w <= 1024) && this.activeTile !== nearest) {
      if (this.activeTile) this.stopTile(this.activeTile);
      this.activeTile = nearest;
    }
    if (
      (touch || this.w <= 1024) &&
      nearest?.media.ready &&
      !$('#lightbox').open
    )
      this.playTileIfNeeded(nearest);
    if ($('#lightbox').open) this.medias.forEach((m) => m.pause());
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }
  playTileIfNeeded(tile) {
    if (!tile.media.wantsPlay) this.playTile(tile);
  }
}
let lightboxReturn = null;
function closeLightbox() {
  const dialog = $('#lightbox');
  if (!dialog.open) return;
  dialog.close();
}
function openLightbox(item, onClose) {
  const dialog = $('#lightbox'),
    host = $('#lightbox-media');
  host.replaceChildren();
  lightboxReturn = onClose;
  active?.medias.forEach((m) => m.pause());
  let video = null;
  if (item.url) {
    video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.controls = true;
    video.preload = 'metadata';
    video.src = item.url;
    video.setAttribute('aria-label', item.title + ' preview');
    host.append(video);
    video.addEventListener('error', () => {
      const message = document.createElement('p');
      message.className = 'lightbox-unavailable';
      message.textContent = 'Video preview unavailable. Project links are below.';
      host.replaceChildren(message);
    }, { once: true });
  } else {
    const poster = document.createElement('img');
    poster.src = projectPoster(item).toDataURL('image/png');
    poster.alt = item.title;
    poster.width = 480;
    poster.height = 270;
    poster.className = 'project-poster';
    host.append(poster);
  }
  $('#lightbox-title').textContent = item.title;
  $('.lightbox-heading em').textContent = projectMeta(item);
  $('.lightbox-description').textContent = item.description;
  setDetailLinks($('.lightbox-content'), item);
  const credit = $('.lightbox-credit');
  credit.textContent = projectCredit(item);
  credit.hidden = !credit.textContent;
  dialog.showModal();
  gsap.fromTo(
    '.lightbox-content',
    { opacity: 0, scale: 0.94, y: 20 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: reduced ? 0 : 0.9,
      ease: 'expo.out',
    },
  );
  if (video && !reduced) video.play().catch(() => {});
}
$('#lightbox-close').addEventListener('click', closeLightbox);
$('#lightbox').addEventListener('click', (e) => {
  if (e.target === $('#lightbox')) closeLightbox();
});
$('#lightbox').addEventListener('close', () => {
  const v = $('#lightbox video');
  if (v) {
    v.pause();
    v.removeAttribute('src');
    v.load();
  }
  $('#lightbox-media').replaceChildren();
  lightboxReturn?.();
  lightboxReturn = null;
});

// Chrome is lit by a small emissive room, rather than a downloaded model or HDRI.
function makeEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x0a0a0b);
  const panel = (w, h, x, y, z, intensity, rx = 0, ry = 0) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setScalar(intensity),
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, 0);
    room.add(mesh);
  };
  panel(14, 5, 0, 6, 0, 1.1, Math.PI / 2);
  panel(3.2, 10, -6, 0, 0, 1, 0, Math.PI / 2);
  panel(2.4, 10, 6, 0, 0, 0.85, 0, -Math.PI / 2);
  panel(12, 2.2, 0, -1.5, -6, 0.6);
  panel(5, 4, 3, 2.5, 6, 0.8);
  panel(14, 6, 0, -6, 0, 0.22, -Math.PI / 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.04);
  pmrem.dispose();
  room.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) o.material.dispose();
  });
  return env;
}
function makeBot() {
  const root = new THREE.Group(),
    head = new THREE.Group();
  root.add(head);
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.07,
  });
  const dark = new THREE.MeshPhysicalMaterial({
    color: 0x040405,
    metalness: 0.3,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf2f2ee });
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), chrome);
  headMesh.scale.set(1.1, 1, 0.98);
  head.add(headMesh);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(
      1,
      48,
      32,
      Math.PI / 2 - 1.02,
      2.04,
      Math.PI / 2 - 0.5,
      1,
    ),
    dark,
  );
  visor.scale.set(1.1 * 1.015, 1.015, 0.98 * 1.015);
  head.add(visor);
  const eyes = [];
  for (const sign of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.2, 6, 12),
      eyeMat,
    );
    eye.position.set(sign * 0.3, 0.03, 0.963);
    eye.scale.z = 0.45;
    head.add(eye);
    eyes.push(eye);
    const ear = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.065, 12, 28),
      chrome,
    );
    ear.position.x = sign * 1.1;
    ear.rotation.y = Math.PI / 2;
    head.add(ear);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.08, 24),
      dark,
    );
    cap.position.x = sign * 1.1;
    cap.rotation.z = Math.PI / 2;
    head.add(cap);
  }
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.03, 0.42, 12),
    chrome,
  );
  stem.position.y = 1.15;
  head.add(stem);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 12), chrome);
  ball.position.y = 1.38;
  head.add(ball);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.05, 16, 64),
    chrome,
  );
  halo.position.y = -1.28;
  halo.rotation.x = (0.92 * Math.PI) / 2;
  root.add(halo);
  return { root, head, eyes, halo, materials: [chrome, dark, eyeMat] };
}
function wrapText(text, maxWidth, font) {
  const c = document.createElement('canvas'),
    x = c.getContext('2d');
  x.font = font;
  let lines = [],
    line = '';
  for (const word of text.split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (line && x.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
const waveFragment = `
  uniform sampler2D uBackground;uniform vec2 uResolution;uniform float uRadius,uDissolve;varying vec2 vUv;
  void main(){vec2 local=vUv-.5;float nd=length(local)*2.;if(nd>1.)discard;vec2 screen=gl_FragCoord.xy/uResolution;
    vec2 center=vec2(.5);vec2 pull=(center-screen)*(.5*.30*nd*nd+smoothstep(.85,1.,nd)*.2344);
    vec3 col=vec3(0.),weights=vec3(0.);float dispersion=smoothstep(.6,1.,nd)*1.64*.004;
    for(int i=0;i<8;i++){float t=float(i)/7.;vec3 w=exp(-pow((vec3(t)-vec3(.2,.5,.8))*4.,vec3(2.)));vec2 off=normalize(local+vec2(.0001))*(t-.5)*dispersion;col+=texture2D(uBackground,screen+pull*(1.-smoothstep(.4,.8,uDissolve))+off).rgb*w;weights+=w;}
    col/=max(weights,.001);float nova=exp(-nd*nd/ (.132*.132))*.285*11./17.*1.15;
    float ring=exp(-pow((nd-.49)/.08,2.))*.9*11./17.*1.8;
    float rim=exp(-pow((nd-.483)/.008,2.));float edge=exp(-pow((nd-.478)/.06,2.))*1.053;
    col+=(vec3(nova)+vec3(.145,.169,.655)*(ring+edge)+rim*.5)*(1.-smoothstep(0.,.6,uDissolve));
    gl_FragColor=vec4(col,(1.-smoothstep(.8,1.,uDissolve))*(1.-smoothstep(.97,1.,nd)));
    #include <colorspace_fragment>
  }`;
class About extends SceneView {
  constructor() {
    super('about', 45);
    this.camera.position.z = 13;
    this.scene.background = new THREE.Color(BG);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.environment = makeEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;
    this.bot = makeBot();
    this.bot.root.position.z = -1;
    this.scene.add(this.bot.root);
    this.reveal = { value: reduced ? 1 : 0 };
    this.hover = { value: 0 };
    this.glass = {
      reveal: { value: this.reveal.value },
      hover: { value: 0 },
      hit: { value: new THREE.Vector3(0, 0, 1) },
    };
    this.bot.materials.forEach((material, index) => {
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, {
          uReveal: this.glass.reveal,
          uHover: this.glass.hover,
          uHit: this.glass.hit,
        });
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            '#include <common>\nvarying vec3 vLocal;',
          )
          .replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvLocal=position;',
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>\nvarying vec3 vLocal;uniform float uReveal,uHover;uniform vec3 uHit;float valueNoise(vec3 p){return sin(p.x*8.+sin(p.z*7.))*sin(p.y*6.+p.x*3.);}`,
          )
          .replace(
            '#include <clipping_planes_fragment>',
            `#include <clipping_planes_fragment>\nfloat front=mix(-2.3,2.1,uReveal)+valueNoise(vLocal)*.95*(1.-uReveal);if(vLocal.y>front)discard;`,
          )
          .replace(
            '#include <opaque_fragment>',
            `float band=1.-smoothstep(0.,.97,front-vLocal.y);float meniscus=pow(max(0.,1.-abs(front-vLocal.y)/.12),3.);outgoingLight=mix(outgoingLight,outgoingLight*.5+vec3(.56,.63,1.)*.7,band*(1.-uReveal));outgoingLight+=vec3(.086,.129,1.)*meniscus*1.4*(1.-uReveal);float glow=pow(max(0.,1.-length(vLocal-uHit)/1.09),3.)*.4*uHover;outgoingLight+=vec3(.086,.129,1.)*glow;\n#include <opaque_fragment>`,
          );
      };
      material.customProgramCacheKey = () => `studio-liquid-${index}`;
    });
    this.backgroundTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
    });
    this.disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.ShaderMaterial({
        vertexShader: quadVertex,
        fragmentShader: waveFragment,
        uniforms: {
          uBackground: { value: this.backgroundTarget.texture },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uRadius: { value: 0 },
          uDissolve: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
      }),
    );
    this.disc.position.z = -7.9;
    this.disc.visible = false;
    this.disc.renderOrder = 5;
    this.scene.add(this.disc);
    this.track = new THREE.Group();
    this.track.position.z = -8;
    this.scene.add(this.track);
    this.lines = [];
    this.blocks = [];
    this.textures = [];
    this.scrollTarget = 0;
    this.scrollCurrent = 0;
    this.phase = 0;
    this.float = { speed: 1, amplitude: 1 };
    this.rotation = new THREE.Vector3();
    this.reaction = { x: 0, y: 0, z: 0 };
    this.effect = { radius: 0, dissolve: 0 };
    this.lastInput = performance.now();
    this.sleeping = false;
    this.moved = false;
    this.mousePixels = new THREE.Vector2(0, 0);
    this.blinkAt = 3 + Math.random() * 2;
    this.eyeState = { value: 1 };
    this.time = 0;
    this.clickCount = 0;
    this.bind();
    this.resize();
  }
  px(v, z = -8) {
    return (
      (v * (2 * (this.camera.position.z - z) * Math.tan(Math.PI / 8))) / this.h
    );
  }
  line(
    text,
    x,
    y,
    {
      size = 22,
      family = 'Newsreader',
      weight = 300,
      italic = false,
      color = INK,
      side = null,
      link = null,
      heading = false,
    } = {},
  ) {
    const ratio = this.renderer.getPixelRatio(),
      font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
    const c = document.createElement('canvas'),
      ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.font = font;
    const width = Math.ceil(ctx.measureText(text).width) + 12,
      height = Math.ceil(size * 1.5) + 12;
    c.width = Math.ceil(width * ratio);
    c.height = Math.ceil(height * ratio);
    ctx.scale(ratio, ratio);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 6, height / 2);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    );
    mesh.renderOrder = 1;
    this.track.add(mesh);
    this.textures.push(texture);
    const entry = {
      mesh,
      text,
      x,
      y,
      width,
      height,
      fontSize: size,
      side: side || (y < 0 ? -1 : 1),
      shift: 0,
      link,
      heading,
    };
    this.lines.push(entry);
    return entry;
  }
  buildText() {
    this.lines.forEach((l) => {
      l.mesh.geometry.dispose();
      l.mesh.material.dispose();
      this.track.remove(l.mesh);
    });
    this.textures.forEach((t) => t.dispose());
    this.lines = [];
    this.textures = [];
    this.blocks = [];
    const phone = this.w <= 640,
      tablet = this.w <= 1024,
      maxWidth = phone ? this.w - 32 : this.w - 80;
    let size = phone ? 42 : tablet ? 58 : Math.min(75, this.h * 0.06);
    const headline = [
      'Shaping little experiments into',
      'restless, curious and wildly kinetic',
      'things that keep becoming.',
    ];
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `300 ${size}px Newsreader`;
    const widest = Math.max(
      ...headline.map((s) => measure.measureText(s).width),
    );
    if (widest > maxWidth) size *= maxWidth / widest;
    const lineHeight = size * 1.18;
    const hero = [];
    headline.forEach((text, i) => {
      const line = this.line(text, 0, (i - 1) * lineHeight, {
        size,
        side: i === 0 ? -1 : 1,
      });
      hero.push(line);
    });
    hero.push(
      this.line(
        'An independent creative playground',
        0,
        lineHeight + size / 2 + 56,
        {
          size: phone ? 12 : 14,
          family: 'Geist',
          weight: 500,
          side: 1,
          link: 'https://github.com/xxrainow',
        },
      ),
    );
    this.blocks.push({ lines: hero, baseX: 0, centered: true });
    const stops = [
      {
        heading: 'Motion',
        kind: 'paragraph',
        text: 'Product stories, UI motion and small 3D loops. Learning to make movement mean something.',
      },
      {
        heading: 'Interactive',
        kind: 'list',
        items: [
          'WebGL studies',
          'Scroll experiments',
          'Creative development',
          'Prototyping',
        ],
      },
      {
        heading: 'Part One  ·  Curiosity',
        kind: 'chapter',
        number: 'I',
        text: 'Make something small. Change one thing. Follow the part that feels unexpected.',
      },
      {
        heading: 'A studio note',
        kind: 'quote',
        text: '“A little colour. A little curiosity.”',
      },
      {
        heading: 'An ongoing practice',
        kind: 'list',
        items: [
          'Motion studies',
          'Type experiments',
          'Material explorations',
          'Things still taking shape',
        ],
      },
      {
        heading: 'Identity',
        kind: 'paragraph',
        text: 'Looking for the space where colour, type and movement start to feel like a language.',
      },
      {
        heading: 'Part Two  ·  Rhythm',
        kind: 'chapter',
        number: 'II',
        text: 'Interfaces are things you can touch. Timing decides how a page feels.',
      },
      {
        heading: 'This collection',
        kind: 'list',
        items: [
          'MotionSites previews',
          'Design references',
          'Not commissioned work',
          'A place to learn',
        ],
      },
      {
        heading: 'A studio note',
        kind: 'quote',
        text: '“Break something on purpose, then keep the best part.”',
      },
      {
        heading: 'Elsewhere',
        kind: 'links',
        items: [
          ['Find me on GitHub', 'https://github.com/xxrainow'],
          ['Browse the reference index', '#projects'],
          ['Back to the rainbow', '../'],
        ],
      },
    ];
    let x = this.w / 2 + (phone ? 70 : 200);
    stops.forEach((stop, index) => {
      const lines = [],
        side = index % 2 === 0 ? -1 : 1,
        bodySize = phone ? 19 : 22,
        bw = phone ? Math.min(this.w - 56, 300) : 320;
      let y = 0;
      lines.push(
        this.line(stop.heading, x, y, {
          size: 12,
          family: 'Geist',
          weight: 500,
          color: MUTE,
          side,
          heading: true,
        }),
      );
      y += 32;
      const add = (text, options = {}) => {
        const line = this.line(text, x, y, {
          size: bodySize,
          side,
          ...options,
        });
        lines.push(line);
        y += options.step || 29;
      };
      if (stop.kind === 'paragraph')
        wrapText(stop.text, bw, `300 ${bodySize}px Newsreader`).forEach((s) =>
          add(s),
        );
      if (stop.kind === 'list')
        stop.items.forEach((s) => add(s, { size: 18, weight: 400, step: 29 }));
      if (stop.kind === 'chapter') {
        add(stop.number, { size: 72, step: 85 });
        wrapText(stop.text, phone ? bw : 300, '300 19px Newsreader').forEach(
          (s) => add(s, { size: 19, step: 26 }),
        );
      }
      if (stop.kind === 'quote') {
        const qs = phone ? 30 : 40;
        wrapText(
          stop.text,
          phone ? bw : 440,
          `italic 300 ${qs}px Newsreader`,
        ).forEach((s) => add(s, { size: qs, italic: true, step: qs * 1.12 }));
      }
      if (stop.kind === 'links')
        stop.items.forEach(([s, link]) =>
          add(s, { size: phone ? 19 : 22, step: 34, link }),
        );
      const total = y - 14,
        offset = side < 0 ? -(phone ? 64 : 78) - total : phone ? 64 : 78;
      lines.forEach((line) => (line.y += offset));
      this.blocks.push({ lines, baseX: x, centered: false });
      const width = Math.max(...lines.map((l) => l.width));
      x += Math.max(width * 0.62, phone ? 150 : 200) + (phone ? 60 : 90);
    });
    this.loopLength = x + (phone ? 140 : 260) + this.w / 2;
    this.lines.forEach((l) =>
      l.mesh.scale.set(this.px(l.width), this.px(l.height), 1),
    );
  }
  resize() {
    super.resize();
    if (!this.bot) return;
    const scalePx = 200 * (this.w <= 1024 ? 0.85 : this.w <= 1440 ? 0.9 : 1);
    const heightAtBot = 2 * 14 * Math.tan(Math.PI / 8);
    const s = ((scalePx / this.h) * heightAtBot) / 2.85;
    this.bot.root.scale.setScalar(s);
    const ratio = this.renderer.getPixelRatio();
    this.backgroundTarget.setSize(
      Math.round(this.w * ratio),
      Math.round(this.h * ratio),
    );
    this.disc.material.uniforms.uResolution.value.set(
      this.w * ratio,
      this.h * ratio,
    );
    this.buildText();
  }
  bind() {
    const input = () => {
      if (!this.enabled) return;
      this.lastInput = performance.now();
      if (this.sleeping) this.wake();
    };
    ['pointermove', 'wheel', 'pointerdown', 'touchstart', 'keydown'].forEach(
      (name) => window.addEventListener(name, input, { passive: true }),
    );
    window.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      this.mousePixels.set(e.clientX - this.w / 2, e.clientY - this.h / 2);
      this.moved = true;
      this.pointer(e);
    });
    const hit = $('#bot-hit');
    hit.addEventListener('pointerenter', () => {
      this.hoverTarget = 1;
    });
    hit.addEventListener('pointerleave', () => {
      this.hoverTarget = 0;
    });
    hit.addEventListener('focus', () => {
      this.hoverTarget = 1;
    });
    hit.addEventListener('blur', () => {
      this.hoverTarget = 0;
    });
    let botDrag = null,
      botPath = 0;
    hit.addEventListener('pointerdown', (e) => {
      botPath = 0;
      if (e.pointerType !== 'mouse') {
        botDrag = { x: e.clientX, y: e.clientY };
        hit.setPointerCapture(e.pointerId);
      }
    });
    hit.addEventListener('pointermove', (e) => {
      if (!botDrag) return;
      const dx = botDrag.x - e.clientX,
        dy = botDrag.y - e.clientY;
      botPath += Math.hypot(dx, dy);
      this.scrollBy(Math.abs(dx) > Math.abs(dy) ? dx : dy);
      botDrag = { x: e.clientX, y: e.clientY };
    });
    hit.addEventListener('pointerup', () => {
      botDrag = null;
    });
    hit.addEventListener('pointercancel', () => {
      botDrag = null;
    });
    hit.addEventListener('click', () => {
      if (botPath < 8) this.burst();
    });
    this.stage.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.scrollBy(
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY,
        );
      },
      { passive: false },
    );
    // The transparent robot button must pass scrolling through to the track too.
    hit.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.scrollBy(
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY,
        );
      },
      { passive: false },
    );
    let finger = null,
      velocity = 0,
      moved = 0;
    const down = (e) => {
      finger = { x: e.clientX, y: e.clientY };
      velocity = 0;
      moved = 0;
      this.inertia = 0;
    };
    const move = (e) => {
      if (!finger) return;
      const dx = finger.x - e.clientX,
        dy = finger.y - e.clientY;
      velocity = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      moved += Math.hypot(dx, dy);
      this.scrollBy(velocity);
      finger = { x: e.clientX, y: e.clientY };
    };
    this.stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') {
        down(e);
        this.stage.setPointerCapture(e.pointerId);
      }
    });
    this.stage.addEventListener('pointermove', move);
    this.stage.addEventListener('pointerup', (e) => {
      if (finger) {
        finger = null;
        this.inertia = velocity;
      }
      if (moved < 8) {
        this.pointer(e);
        const links = this.lines.filter((l) => l.link);
        const hit = this.ray(links.map((l) => l.mesh));
        if (hit) {
          const line = links.find((l) => l.mesh === hit.object);
          if (line.link.startsWith('#')) location.hash = line.link;
          else if (line.link === '../') location.href = '../';
          else window.open(line.link, '_blank', 'noopener,noreferrer');
        }
      }
    });
    this.stage.addEventListener('pointercancel', () => {
      finger = null;
      this.inertia = 0;
    });
    this.stage.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        this.scrollBy(e.key === 'PageDown' ? this.w * 0.7 : 100);
      }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        this.scrollBy(e.key === 'PageUp' ? -this.w * 0.7 : -100);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        this.scrollTarget = 0;
      }
    });
  }
  scrollBy(delta) {
    this.scrollTarget += delta;
    gsap.to('.about-hint', { opacity: 0, duration: 0.35, overwrite: 'auto' });
  }
  enter() {
    super.enter();
    this.lastInput = performance.now();
    this.reveal.value = reduced ? 1 : 0;
    animate(this.reveal, {
      value: 1,
      duration: 3.85,
      delay: this.visited ? 0.45 : 1,
      ease: 'power2.out',
    });
    this.visited = true;
  }
  leave() {
    super.leave();
    this.inertia = 0;
    gsap.killTweensOf(this.reveal);
  }
  shake() {
    if (reduced) return;
    gsap
      .timeline()
      .to(this.reaction, { y: 0.22, duration: 0.09 })
      .to(this.reaction, { y: -0.18, duration: 0.12 })
      .to(this.reaction, { y: 0.1, duration: 0.11 })
      .to(this.reaction, { y: 0, duration: 0.18 });
  }
  wake() {
    this.sleeping = false;
    gsap.to(this.float, { speed: 1, amplitude: 1, duration: 0.8 });
    gsap.to(this.eyeState, { value: 1, duration: 0.15 });
    this.shake();
  }
  sleep() {
    this.sleeping = true;
    gsap.to(this.float, { speed: 0.35, amplitude: 1.6, duration: 1.6 });
    gsap.to(this.eyeState, { value: 0.2, duration: 1.1, ease: 'power2.inOut' });
  }
  burst() {
    if (this.reveal.value < 0.8 || this.busy) return;
    this.lastInput = performance.now();
    this.wake();
    if (reduced) {
      announce('로봇이 인사합니다. 모션 줄이기 설정이 적용되어 있어요.');
      return;
    }
    this.busy = true;
    this.clickCount++;
    this.disc.visible = true;
    this.effect.radius = 0;
    this.effect.dissolve = 0;
    gsap.to(this.effect, {
      radius: 10,
      duration: 4,
      ease: 'expo.out',
      onUpdate: () => {
        if (this.effect.radius > 6.14 && !this.dissolving) {
          this.dissolving = true;
          gsap.to(this.effect, {
            dissolve: 1,
            duration: 0.8975,
            ease: 'sine.inOut',
            onComplete: () => {
              this.disc.visible = false;
              this.dissolving = false;
            },
          });
        }
      },
      onComplete: () => {
        this.busy = false;
        this.disc.visible = false;
      },
    });
    if (this.clickCount % 2) {
      gsap
        .timeline()
        .to(this.reaction, {
          x: -0.45,
          y: 0.18,
          duration: 0.16,
          ease: 'power3.out',
        })
        .to(this.reaction, {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: 'elastic.out(1,.45)',
          onComplete: () => this.shake(),
        });
      gsap.to(this.eyeState, {
        value: 0.2,
        duration: 0.16,
        yoyo: true,
        repeat: 1,
      });
    } else
      gsap
        .timeline()
        .to(this.reaction, {
          y: Math.PI * 2,
          z: 0.25,
          duration: 1.1,
          ease: 'power3.inOut',
        })
        .to(this.reaction, {
          z: 0,
          duration: 0.6,
          ease: 'elastic.out(1,.5)',
          onComplete: () => {
            this.reaction.y = 0;
            this.shake();
          },
        });
  }
  updateText(dt) {
    if (this.inertia) {
      this.scrollTarget += this.inertia * dt * 60;
      this.inertia *= Math.pow(0.95, dt * 60);
      if (Math.abs(this.inertia) < 0.1) this.inertia = 0;
    }
    this.scrollCurrent = THREE.MathUtils.lerp(
      this.scrollCurrent,
      this.scrollTarget,
      reduced ? 1 : easeFactor(0.12, dt),
    );
    const length = this.loopLength,
      rx = 3.4 * (this.w <= 640 ? 0.7875 : 1),
      ry = Math.min(
        4.0543 * (this.w <= 640 ? 0.7875 : 1),
        this.px(Math.max(90, this.h * 0.15)),
      ),
      padding = 0.35;
    this.blocks.forEach((block) => {
      const wrapped =
        ((((block.baseX - this.scrollCurrent + length / 2) % length) + length) %
          length) -
        length / 2;
      for (const side of [-1, 1]) {
        const lines = block.lines
          .filter((l) => l.side === side)
          .sort((a, b) => Math.abs(a.y) - Math.abs(b.y));
        let previousShift = 0;
        lines.forEach((line, k) => {
          const centerX = this.px(
              wrapped + (block.centered ? 0 : line.width / 2),
            ),
            baseY = -this.px(line.y),
            halfWidth = this.px(line.width / 2),
            halfHeight = this.px(line.height / 2);
          const d = Math.max(0, Math.abs(centerX) - halfWidth);
          let need = 0;
          if (d < rx) {
            const h = ry * Math.sqrt(1 - (d / rx) ** 2) + padding;
            need = Math.max(0, h + halfHeight - Math.abs(baseY));
          }
          need = Math.max(need, previousShift);
          line.shift = THREE.MathUtils.lerp(
            line.shift,
            need,
            reduced ? 1 : easeFactor(Math.max(0.1, 0.14 - 0.012 * k), dt),
          );
          previousShift = line.shift;
          line.mesh.position.set(centerX, baseY - side * line.shift, 0);
          line.mesh.visible =
            Math.abs(centerX) < this.px(this.w / 2 + line.width + 30);
        });
      }
    });
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const linkLines = this.lines.filter((l) => l.link && l.mesh.visible);
    const hit = this.raycaster.intersectObjects(
      linkLines.map((l) => l.mesh),
    )[0];
    this.stage.style.cursor = hit ? 'pointer' : 'default';
    linkLines.forEach((l) => {
      l.mesh.material.opacity = THREE.MathUtils.lerp(
        l.mesh.material.opacity,
        hit?.object === l.mesh ? 0.5 : 1,
        easeFactor(0.1, dt),
      );
    });
  }
  update(dt) {
    this.time += dt;
    this.phase += dt * 1.5 * this.float.speed;
    this.glass.reveal.value = this.reveal.value;
    this.hover.value = THREE.MathUtils.lerp(
      this.hover.value,
      this.hoverTarget || 0,
      easeFactor(this.hoverTarget ? 0.1 : 0.05, dt),
    );
    this.glass.hover.value = this.hover.value;
    const nx = this.mousePixels.x / (this.w / 2),
      ny = this.mousePixels.y / (this.h / 2);
    const tx = this.sleeping
        ? 0.42
        : this.moved
          ? clamp(ny, -0.62, 0.62)
          : touch
            ? 0
            : -0.62,
      ty = this.sleeping
        ? 0
        : this.moved
          ? clamp(nx, -0.59, 0.59)
          : touch
            ? 0
            : 0.59,
      tz = this.sleeping ? 0.12 : this.moved ? 0.2 * nx : touch ? 0 : 0.2;
    if (!this.busy)
      this.rotation.lerp(new THREE.Vector3(tx, ty, tz), easeFactor(0.08, dt));
    this.bot.head.rotation.set(
      this.rotation.x + this.reaction.x,
      this.rotation.y + this.reaction.y,
      this.rotation.z + this.reaction.z,
    );
    this.bot.head.position.y = reduced
      ? 0
      : Math.sin(this.phase) * 0.2 * this.float.amplitude * this.reveal.value;
    if (!reduced) this.bot.halo.rotation.z += dt * 0.35;
    this.bot.eyes.forEach((eye) => (eye.scale.y = this.eyeState.value));
    if (!reduced && !this.sleeping && this.time > this.blinkAt) {
      this.blinkAt = this.time + 3 + Math.random() * 2;
      gsap.to(this.eyeState, {
        value: 0.1,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      });
    }
    if (
      !reduced &&
      !touch &&
      !this.sleeping &&
      this.reveal.value > 0.99 &&
      performance.now() - this.lastInput > 30000
    )
      this.sleep();
    this.updateText(dt);
    this.disc.scale.setScalar(Math.max(0.001, this.effect.radius));
    this.disc.material.uniforms.uRadius.value = this.effect.radius;
    this.disc.material.uniforms.uDissolve.value = this.effect.dissolve;
    if (this.disc.visible) {
      this.bot.root.visible = false;
      this.disc.visible = false;
      this.renderer.setRenderTarget(this.backgroundTarget);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      this.bot.root.visible = true;
      this.disc.visible = true;
    }
    this.draw();
  }
}

async function route() {
  const name = ['gallery', 'projects', 'about'].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : 'gallery';
  if (active?.name === name) return;
  const token = ++routeId;
  menu(false);
  closeLightbox();
  hideLabel();
  if (active) {
    const previous = active;
    previous.leave();
    gsap.killTweensOf(previous.element);
    await new Promise((resolve) =>
      gsap.to(previous.element, {
        opacity: 0,
        duration: reduced ? 0 : 0.35,
        ease: 'power2.in',
        onComplete: resolve,
      }),
    );
    previous.element.classList.remove('active');
    previous.element.inert = true;
  }
  if (token !== routeId) return;
  try {
    if (!views.has(name)) {
      const View = { gallery: Gallery, projects: ProjectIndex, about: About }[
        name
      ];
      views.set(name, new View());
    }
    const next = views.get(name);
    active = next;
    next.element.inert = false;
    next.element.classList.add('active');
    next.enter();
    gsap.fromTo(
      next.element,
      { opacity: 0 },
      { opacity: 1, duration: reduced ? 0 : 0.5, ease: 'power2.out' },
    );
    $$('.tab').forEach((tab) => {
      const selected = tab.dataset.view === name;
      tab.classList.toggle('active', selected);
      if (selected) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    if (name !== 'gallery') showDock();
    announce(name + ' 화면');
  } catch (error) {
    console.error('Studio view could not start:', error);
    $('#load-error').hidden = false;
  }
}
let frameId = 0;
function frame() {
  frameId = requestAnimationFrame(frame);
  if (document.hidden) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  try {
    if (active?.enabled) active.update(dt, clock.elapsedTime);
  } catch (error) {
    console.error('Studio render failed:', error);
    active?.leave();
    $('#load-error').hidden = false;
  }
}
async function init() {
  if (!window.gsap) {
    $('#load-error').hidden = false;
    return;
  }
  await Promise.all([
    document.fonts.load('500 14px Geist'),
    document.fonts.load('300 24px Newsreader'),
    document.fonts.load('italic 300 24px Newsreader'),
  ]);
  await document.fonts.ready;
  labelX = gsap.quickTo(pointerLabel, 'x', {
    duration: 0.5,
    ease: 'power3.out',
  });
  labelY = gsap.quickTo(pointerLabel, 'y', {
    duration: 0.5,
    ease: 'power3.out',
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', () => {
    for (const view of views.values()) view.resize();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      active?.medias.forEach((m) => m.pause());
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      clock.getDelta();
      if (!frameId) frame();
    }
  });
  reducedQuery.addEventListener('change', (e) => {
    reduced = e.matches;
    if (reduced) {
      for (const view of views.values()) view.medias.forEach((m) => m.pause());
      const gallery = views.get('gallery');
      if (gallery) {
        gallery.auto = false;
        gallery.finishIntro();
      }
      const about = views.get('about');
      if (about) {
        about.reveal.value = 1;
        gsap.killTweensOf(about.reveal);
      }
    }
  });
  await route();
  frame();
}
init().catch((error) => {
  console.error('Studio initialization failed:', error);
  $('#load-error').hidden = false;
});
