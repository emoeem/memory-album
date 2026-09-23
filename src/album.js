import { createAudio } from './audio.js';
import { photoSizes } from './data/photo-sizes.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 把 data 渲染成一整页回忆。 */
export function mount(app, data, ROOT) {
  const asset = (path) => new URL(path, ROOT).href;
  // 注意：这里的路径必须走 asset()，否则在 /yales/ 这种子目录页面下会解析错
  const audio = createAudio({
    ...data.bgm,
    src: data.bgm?.src ? asset(data.bgm.src) : '',
  });
  const chapters = data.chapters || [];

  app.dataset.state = 'ready';
  app.innerHTML =
    buildSky() + buildCover(data) + buildPage(data, chapters, asset) + buildChrome(audio);

  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => Array.from(app.querySelectorAll(sel));

  const cover = $('#cover');
  const page = $('#page');
  const musicButton = $('#music');
  const timelineFill = $('#timeline-fill');
  const topFill = $('#top-fill');
  const topLabel = $('#top-label');
  const topProgress = $('#top-progress');
  const openButton = $('#open');
  const endingSection = $('#ending');
  const rainLayer = $('.rain');

  document.body.classList.add('is-locked');

  /* ---------- 打开 ---------- */
  let opened = false;
  async function open() {
    if (opened) return;
    opened = true;
    cover.classList.add('is-gone');
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.remove('is-locked');
    musicButton.hidden = !audio.enabled;
    audio.play().then(updateMusicButton);
    window.setTimeout(() => {
      cover.hidden = true;
    }, reducedMotion() ? 0 : 1200);
    const first = $('.chapter__head');
    if (first) first.classList.add('is-in');
  }

  openButton.addEventListener('click', open);
  page.addEventListener('click', (event) => {
    if (!opened && event.target.closest('a')) open();
  });

  /* ---------- 音乐按钮 ---------- */
  function updateMusicButton() {
    if (!audio.enabled) return;
    musicButton.classList.toggle('is-paused', audio.paused);
    musicButton.setAttribute(
      'aria-label',
      audio.paused ? `播放${audio.title}` : `暂停${audio.title}`,
    );
    musicButton.title = audio.paused ? `播放 ${audio.title}` : `暂停 ${audio.title}`;
  }
  musicButton.addEventListener('click', async () => {
    await audio.toggle();
    updateMusicButton();
  });

  /* ---------- 点击看大图 ---------- */
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  let lastFocused = null;

  function openLightbox(img) {
    lastFocused = img;
    lightboxImage.src = img.currentSrc || img.src;
    lightboxImage.alt = img.alt;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    $('#lightbox-close').focus({ preventScroll: true });
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    window.setTimeout(
      () => {
        lightbox.hidden = true;
        lightboxImage.removeAttribute('src');
      },
      reducedMotion() ? 0 : 260,
    );
    lastFocused?.focus({ preventScroll: true });
  }

  app.addEventListener('click', (event) => {
    const img = event.target.closest('.node__img');
    if (img) openLightbox(img);
  });
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightboxImage) return;
    closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  /* ---------- 进场动画 ---------- */
  const revealTargets = $$('.reveal');
  if (reducedMotion()) {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- 时间线：当前读到哪 ---------- */
  const nodes = $$('.node');
  const ticks = new Map(
    $$('.timeline__tick').map((el) => [el.dataset.target, el]),
  );
  const chapterLinks = $$('.timeline__chapter');
  let activeId = null;

  function setActive(id) {
    if (!id || id === activeId) return;
    activeId = id;
    ticks.forEach((tick, key) => tick.classList.toggle('is-active', key === id));
    const node = document.getElementById(id);
    const chapterId = node?.closest('.chapter')?.id;
    chapterLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.chapter === chapterId);
    });
    if (topLabel && node) {
      const chapter = node.closest('.chapter');
      const date = chapter?.dataset.date || '';
      const label = chapter?.dataset.label || '';
      topLabel.textContent = [label, date].filter(Boolean).join(' · ');
    }
  }

  if (nodes.length) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    nodes.forEach((node) => activeObserver.observe(node));
    setActive(nodes[0].id);
  }

  $$('.timeline__link, .timeline__tick, .scroll-cue').forEach((el) => {
    el.addEventListener('click', (event) => {
      const id = el.dataset.target || (el.getAttribute('href') || '').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (!opened) open();
      target.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
    });
  });

  /* ---------- 滚动进度 ---------- */
  let ticking = false;
  let lastSun = -1;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (timelineFill) timelineFill.style.height = `${ratio * 100}%`;
      if (topFill) topFill.style.width = `${ratio * 100}%`;
      if (topProgress) topProgress.classList.toggle('is-visible', window.scrollY > 8);

      // 越接近结尾，雨越小、天色越暖 —— 那一下放晴
      if (endingSection) {
        const vh = window.innerHeight;
        const top = endingSection.getBoundingClientRect().top;
        // 结尾刚进屏幕就开始，走到屏幕中间偏上就完全放晴
        const from = vh * 0.95;
        const to = vh * 0.5;
        const sun = Math.min(1, Math.max(0, (from - top) / (from - to)));
        if (Math.abs(sun - lastSun) > 0.004) {
          lastSun = sun;
          doc.style.setProperty('--sun', sun.toFixed(3));
          rainLayer?.classList.toggle('is-stopped', sun > 0.99);
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  return { audio, open };
}

/* ------------------------------------------------------------------ */

function buildSky() {
  return `
  <div class="sky" aria-hidden="true">
    <div class="sky__glow"></div>
    <div class="rain"></div>
  </div>`;
}

function buildCover(data) {
  const cover = data.cover || {};
  return `
  <div class="cover" id="cover">
    <div class="cover__glow" aria-hidden="true"></div>
    <div class="cover__inner">
      ${cover.kicker ? `<p class="cover__kicker">${esc(cover.kicker)}</p>` : ''}
      <h1 class="cover__title">${esc(cover.title || data.name || '')}</h1>
      ${cover.subtitle ? `<p class="cover__subtitle">${esc(cover.subtitle)}</p>` : ''}
      <button class="cover__open" id="open" type="button">
        <span class="cover__open-ring" aria-hidden="true"></span>
        <span>${esc(cover.openLabel || '打开')}</span>
      </button>
      ${cover.hint ? `<p class="cover__hint">${esc(cover.hint)}</p>` : ''}
    </div>
  </div>`;
}

function buildChrome(audio) {
  return `
  <div class="topbar" id="top-progress">
    <div class="topbar__bar"><span id="top-fill"></span></div>
    <div class="topbar__label" id="top-label"></div>
  </div>
  <button class="music" id="music" type="button" hidden>
    <span class="music__bars" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="music__text">${esc(audio.title)}</span>
  </button>
  <div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="查看大图">
    <button class="lightbox__close" id="lightbox-close" type="button">关闭</button>
    <img class="lightbox__img" id="lightbox-image" alt="" />
  </div>`;
}

function buildPage(data, chapters, asset) {
  const nav = chapters
    .map(
      (chapter) => `
      <li class="timeline__chapter" data-chapter="${esc(chapter.id)}">
        <button class="timeline__link" type="button" data-target="${esc(chapter.id)}">
          <span class="timeline__dot" aria-hidden="true"></span>
          <span class="timeline__label">${esc(chapter.label || '')}</span>
          <span class="timeline__date">${esc(chapter.date || '')}</span>
        </button>
        <ul class="timeline__nodes">
          ${(chapter.nodes || [])
            .map(
              (node) => `
            <li><button class="timeline__tick" type="button"
              data-target="${esc(node.id)}" aria-label="${esc(node.date || node.title || '')}">
            </button></li>`,
            )
            .join('')}
        </ul>
      </li>`,
    )
    .join('');

  const body = chapters.map((chapter, chapterIndex) => buildChapter(chapter, asset, chapterIndex)).join('');

  return `
  <div class="page" id="page" aria-hidden="true">
    <nav class="timeline" aria-label="时间线">
      <div class="timeline__rail" aria-hidden="true"><span class="timeline__fill" id="timeline-fill"></span></div>
      <ol class="timeline__list">${nav}</ol>
    </nav>
    <main class="content">
      <p class="content__name">${esc(data.name || '')}</p>
      ${body}
      ${buildEnding(data)}
      <footer class="colophon">
        <button class="scroll-cue" type="button" data-target="${esc(chapters[0]?.id || '')}">回到开头</button>
      </footer>
    </main>
  </div>`;
}

function buildChapter(chapter, asset, chapterIndex) {
  return `
  <section class="chapter reveal" id="${esc(chapter.id)}" data-date="${esc(chapter.date || '')}" data-label="${esc(chapter.label || '')}">
    <header class="chapter__head reveal">
      <p class="chapter__index">${String(chapterIndex + 1).padStart(2, '0')}</p>
      <p class="chapter__date">${esc(chapter.date || '')}</p>
      <h2 class="chapter__label">${esc(chapter.label || '')}</h2>
      ${chapter.intro ? `<p class="chapter__intro">${esc(chapter.intro)}</p>` : ''}
    </header>
    ${(chapter.nodes || []).map((node, i) => buildNode(node, asset, i)).join('')}
  </section>`;
}

function buildNode(node, asset, index) {
  const images = (node.images || []).filter(Boolean);
  return `
  <article class="node reveal ${index % 2 === 1 ? 'node--flip' : ''} ${
    images.length > 1 ? 'node--multi' : ''
  }" id="${esc(node.id)}">
    ${
      images.length
        ? `<figure class="node__media${images.length > 1 ? ' node__media--multi' : ''}">
            ${images
              .map(
                (src, i) => {
                  const size = photoSizes[src];
                  return `
              <img class="node__img" src="${esc(asset(src))}" alt="${esc(node.title || '')}"
                ${size ? `width="${size[0]}" height="${size[1]}"` : ''}
                loading="${index === 0 && i === 0 ? 'eager' : 'lazy'}" decoding="async" />`;
                },
              )
              .join('')}
          </figure>`
        : ''
    }
    <div class="node__body">
      <p class="node__meta">
        ${node.date ? `<time>${esc(node.date)}</time>` : ''}
        ${node.place ? `<span class="node__place">${esc(node.place)}</span>` : ''}
      </p>
      ${node.title ? `<h3 class="node__title">${esc(node.title)}</h3>` : ''}
      ${node.text ? `<p class="node__text">${esc(node.text)}</p>` : ''}
      ${node.quote ? `<p class="node__quote">${esc(node.quote)}</p>` : ''}
    </div>
  </article>`;
}

function buildEnding(data) {
  const ending = data.ending || {};
  if (!ending.paragraphs?.length && !ending.title) return '';
  return `
  <section class="ending reveal" id="ending">
    <div class="ending__rule" aria-hidden="true"></div>
    ${ending.title ? `<h2 class="ending__title">${esc(ending.title)}</h2>` : ''}
    <div class="ending__body">
      ${(ending.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    ${
      ending.sign || ending.date
        ? `<p class="ending__sign">
            ${ending.sign ? `<span>${esc(ending.sign)}</span>` : ''}
            ${ending.date ? `<time>${esc(ending.date)}</time>` : ''}
          </p>`
        : ''
    }
  </section>`;
}
