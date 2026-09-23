// 幻灯片模式和滚动模式共用的零件

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 路径必须走这个，否则在 /yales/ 这种子目录页面下会解析错 */
export const assetFor = (ROOT) => (path) => new URL(path, ROOT).href;

/**
 * 把一句话拆成一个字一个字的 span，出场时依次浮现。
 * 用 ** 包起来的部分会变成大字。
 */
export function richChars(text, startIndex = 0) {
  let i = startIndex;
  return String(text ?? '')
    .split('**')
    .map((part, index) => {
      const emph = index % 2 === 1;
      return Array.from(part)
        .map((char) => {
          const body = char === ' ' ? '&#160;' : esc(char);
          const span = `<span class="char${emph ? ' char--emph' : ''}" style="--i:${i}">${body}</span>`;
          i += 1;
          return span;
        })
        .join('');
    })
    .join('');
}

/** 段落里的 ** 强调，不拆字 */
export function richInline(text) {
  return String(text ?? '')
    .split('**')
    .map((part, index) =>
      index % 2 === 1 ? `<strong class="emph">${esc(part)}</strong>` : esc(part),
    )
    .join('');
}

/** 雨夜 / 天色那一层 */
export function buildSky() {
  return `
  <div class="sky" aria-hidden="true">
    <div class="sky__glow"></div>
    <div class="sky__clouds sky__clouds--far"></div>
    <div class="sky__clouds sky__clouds--near"></div>
    <div class="sky__sun-disc"></div>
    <div class="sky__sun-rays"></div>
    <div class="rain"></div>
    <div class="sky__horizon"></div>
    <div class="sky__grain"></div>
  </div>`;
}

export function buildCover(data) {
  const cover = data.cover || {};
  return `
  <div class="cover" id="cover">
    <div class="cover__glow" aria-hidden="true"></div>
    <div class="cover__inner">
      ${cover.kicker ? `<p class="cover__kicker">${esc(cover.kicker)}</p>` : ''}
      <h1 class="cover__title">${esc(cover.title || data.name || '')}</h1>
      ${cover.subtitle ? `<p class="cover__subtitle">${esc(cover.subtitle)}</p>` : ''}
      <p class="cover__weather" aria-hidden="true">
        <span class="cover__weather-line"></span>
        <span>天気の子 · Weathering With You</span>
        <span class="cover__weather-line"></span>
      </p>
      <button class="cover__open" id="open" type="button">
        <span class="cover__open-ring" aria-hidden="true"></span>
        <span>${esc(cover.openLabel || '打开')}</span>
      </button>
      ${cover.hint ? `<p class="cover__hint">${esc(cover.hint)}</p>` : ''}
    </div>
  </div>`;
}

export function buildLightbox() {
  return `
  <div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="查看大图">
    <button class="lightbox__close" id="lightbox-close" type="button">关闭</button>
    <img class="lightbox__img" id="lightbox-image" alt="" />
  </div>`;
}

export function buildMusicButton(audio) {
  return `
  <button class="music" id="music" type="button" hidden>
    <span class="music__bars" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="music__text">${esc(audio.title)}</span>
  </button>`;
}

export function buildTopbar() {
  return `
  <div class="topbar" id="top-progress">
    <div class="topbar__bar"><span id="top-fill"></span></div>
    <div class="topbar__label" id="top-label"></div>
  </div>`;
}

/** 点图片看大图 —— 两种模式都要 */
export function setupLightbox(app) {
  const lightbox = app.querySelector('#lightbox');
  const image = app.querySelector('#lightbox-image');
  if (!lightbox || !image) return { open() {}, close() {} };
  let lastFocused = null;

  function open(source) {
    lastFocused = source;
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    app.querySelector('#lightbox-close')?.focus({ preventScroll: true });
  }

  function close() {
    lightbox.classList.remove('is-open');
    window.setTimeout(
      () => {
        lightbox.hidden = true;
        image.removeAttribute('src');
      },
      reducedMotion() ? 0 : 260,
    );
    lastFocused?.focus({ preventScroll: true });
  }

  app.addEventListener('click', (event) => {
    const img = event.target.closest('.node__img, .slide__img, .wall__img');
    if (img && !lightbox.classList.contains('is-open')) open(img);
  });
  lightbox.addEventListener('click', (event) => {
    if (event.target === image) return;
    close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) close();
  });

  return {
    open,
    close,
    get isOpen() {
      return !lightbox.hidden;
    },
  };
}

/** 音乐按钮：默认藏起来，等开场点开后再露面 */
export function setupMusicButton(app, audio, onToggle) {
  const button = app.querySelector('#music');
  if (!button) return { sync() {}, show() {} };
  const sync = () => {
    button.classList.toggle('is-paused', audio.paused);
    button.setAttribute('aria-label', audio.paused ? `播放${audio.title}` : `暂停${audio.title}`);
    button.title = audio.paused ? `播放 ${audio.title}` : `暂停 ${audio.title}`;
  };
  button.addEventListener('click', async () => {
    await audio.toggle();
    sync();
    onToggle?.();
  });
  sync();
  return {
    sync,
    show() {
      button.hidden = !audio.enabled;
    },
  };
}

/** 天色：雨变小、暖光起来 */
export function setSun(root, value) {
  root.style.setProperty('--sun', Math.min(1, Math.max(0, value)).toFixed(3));
}
