// 单屏、自动播、一幕一幕淡入淡出的幻灯片。
// 和生日模板一样的走法：不滚动，一屏一幕，自己往下推。
// 可以暂停、可以手动翻页、可以甩手指划，所以不用赶时间。

import { createAudio } from './audio.js';
import { animateSlideIn, animateSlideOut } from './motion.js';
import { setSun, triggerRainRipple } from './weather.js';
import { photoSizes } from './data/photo-sizes.js';
import {
  esc,
  richChars,
  richInline,
  reducedMotion,
  assetFor,
  buildSky,
  buildCover,
  buildLightbox,
  setupLightbox,
} from './ui.js';

const DEFAULT_TIMING = {
  chapter: 3800,
  image: 8000,
  text: 5600,
  interlude: 4800,
  chat: 8000,
  songs: 11000,
  ending: 16000,
};

/** 把内容拍平成一幕一幕 */
function buildSlides(data) {
  const slides = [];
  let chapterNo = 0;
  (data.chapters || []).forEach((chapter) => {
    if (chapter.kind === 'interlude' || chapter.kind === 'chat') {
      slides.push({ kind: chapter.kind, chapter });
      return;
    }
    chapterNo += 1;
    slides.push({ kind: 'chapter', chapter, no: chapterNo });
    if (chapter.kind === 'songs') {
      slides.push({ kind: 'songs', chapter });
      return;
    }
    (chapter.nodes || []).forEach((node) => {
      const hasImages = Boolean(node.images?.filter(Boolean).length);
      const hasText = Boolean(node.title || node.quote || node.lines?.length || node.text);
      if (hasImages && hasText) slides.push({ kind: 'memory', node, chapter });
      else if (hasImages) slides.push({ kind: 'image', node, chapter });
      else if (hasText) slides.push({ kind: 'text', node, chapter });
    });
  });
  if (data.ending) slides.push({ kind: 'ending', ending: data.ending });
  return slides;
}

export function mountSlides(app, data, ROOT) {
  const asset = assetFor(ROOT);
  const audio = createAudio({
    ...data.bgm,
    src: data.bgm?.src ? asset(data.bgm.src) : '',
    tracks: data.bgm?.tracks?.map((track) => ({ ...track, src: asset(track.src) })),
  });

  const slides = buildSlides(data);
  const timing = { ...DEFAULT_TIMING, memory: DEFAULT_TIMING.image, ...(data.timing || {}) };
  const total = slides.length;

  document.body.classList.add('mode-slides');

  app.dataset.state = 'ready';
  app.innerHTML =
    buildSky(data.theme) +
    buildCover(data) +
    buildStage(slides, asset) +
    buildDeck(audio, total) +
    buildLightbox();

  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => Array.from(app.querySelectorAll(sel));
  const cover = $('#cover');
  const stage = $('#stage');
  const slideEls = $$('.slide');
  const fill = $('#deck-fill');
  const label = $('#deck-label');
  const counter = $('#deck-counter');
  const toggleButton = $('#deck-toggle');
  const lightbox = setupLightbox(app);
  const music = $('#deck-music');

  let index = -1;
  let playing = false;
  let timer = null;

  /* ---------------- 播放控制 ---------------- */

  function hydrate(el) {
    el.querySelectorAll('img[data-src]').forEach((img) => {
      if (img.src) return;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  function typingDuration(el) {
    return Number(el.dataset.typeMs || 0) || 0;
  }

  function typeChat(el) {
    if (el.dataset.typed === '1') return 0;
    el.dataset.typed = '1';
    const bubbles = Array.from(el.querySelectorAll('.bubble'));
    const calm = reducedMotion();
    const per = calm ? 0 : 55;
    // 降级动效时不要那种"一条条隔开"的节奏，直接一口气说完
    const gap = calm ? 0 : 420;
    let delay = 0;
    bubbles.forEach((bubble) => {
      const target = bubble.querySelector('.bubble__typed');
      const chars = Array.from(bubble.dataset.type || '');
      window.setTimeout(() => bubble.classList.add('is-typing'), delay);
      chars.forEach((_, i) => {
        window.setTimeout(
          () => {
            target.textContent = chars.slice(0, i + 1).join('');
          },
          delay + per * (i + 1),
        );
      });
      const total = delay + per * chars.length;
      window.setTimeout(() => {
        bubble.classList.remove('is-typing');
        bubble.classList.add('is-done');
      }, total + 220);
      delay = total + gap;
    });
    window.setTimeout(() => {
      el.classList.add('is-sent');
      const send = el.querySelector('.chatscene__send');
      if (send && !calm) {
        send.classList.add('is-pulsing');
        window.setTimeout(() => send.classList.remove('is-pulsing'), 720);
      }
    }, delay + (calm ? 0 : 200));
    const ms = delay + (calm ? 0 : 400);
    el.dataset.typeMs = String(ms);
    return ms;
  }

  function dwellOf(slide, el) {
    if (slide.kind === 'chat') {
      return Math.max(timing.chat, typingDuration(el) + 1800);
    }
    return timing[slide.kind] ?? 5000;
  }

  function clearTimer() {
    if (timer) window.clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clearTimer();
    if (!playing) return;
    const el = slideEls[index];
    const dwell = dwellOf(slides[index], el);
    timer = window.setTimeout(() => {
      if (index >= total - 1) {
        pause();
        return;
      }
      go(index + 1);
    }, dwell);
  }

  function applySun() {
    // 不只按进度变天：让“雨 → 云隙 → 夏日晴空”成为叙事的一部分。
    const slide = slides[index];
    const id = slide?.chapter?.id || '';
    const kind = slide?.kind || '';
    const explicit = {
      rain: 0.06,
      begin: 0.07,
      spring: 0.16,
      'spring-days': 0.28,
      c1: 0.12,
      c2: 0.32,
      'little-spirit': 0.4,
      summer: 0.5,
      c3: 0.52,
      songs: 0.58,
      holiday: 0.64,
      c4: 0.69,
      photos: 0.73,
      c5: 0.76,
      sky: 0.78,
      'late-summer': 0.84,
      c6: 0.88,
      autumn: 0.91,
      c7: 0.93,
      quiet: 0.95,
      now: 0.98,
      ending: 1,
    };
    const start = total * 0.48;
    const span = Math.max(1, total * 0.48);
    let sun = Math.min(1, Math.max(0, (index - start) / span));
    if (Object.prototype.hasOwnProperty.call(explicit, id)) sun = explicit[id];
    if (kind === 'interlude' && id === 'rain') sun = 0.04;
    if (kind === 'songs') sun = Math.max(sun, 0.46);
    // --sun、data-weather、雨/云/尘埃的浓度、右下角角标都在里面
    setSun(sun);
  }

  function updateDeck() {
    const slide = slides[index];
    const chapter = slide?.chapter || null;
    if (label) {
      label.textContent = chapter
        ? [chapter.label, chapter.date].filter(Boolean).join(' · ')
        : '';
    }
    if (counter) counter.textContent = `${index + 1} / ${total}`;
    if (fill) fill.style.width = `${((index + 1) / total) * 100}%`;
    $$('.deck__dot').forEach((dot, i) => dot.classList.toggle('is-active', i <= index));
  }

  function activate(el) {
    el.classList.remove('is-in');
    hydrate(el);
    // 下一帧再加，保证里面的动画每次都从头播
    requestAnimationFrame(() => {
      el.classList.add('is-in');
      animateSlideIn(el);
    });
    if (el.dataset.typed === '1') {
      // 返回来看过的，直接把字补齐
      el.querySelectorAll('.bubble').forEach((bubble) => {
        const target = bubble.querySelector('.bubble__typed');
        if (target) target.textContent = bubble.dataset.type || '';
        bubble.classList.add('is-done');
      });
      el.classList.add('is-sent');
    } else if (el.querySelector('.bubble')) {
      typeChat(el);
    }
  }

  function go(next, { fromUser = false } = {}) {
    const target = Math.max(0, Math.min(total - 1, next));
    if (target === index) return;
    const previous = slideEls[index];
    if (previous) {
      animateSlideOut(previous);
      previous.classList.remove('is-active');
    }
    index = target;
    const el = slideEls[index];
    el.classList.add('is-active');
    activate(el);
    // 提前把后面两幕的图挂上，翻过去不用等
    [index + 1, index + 2].forEach((i) => {
      if (slideEls[i]) hydrate(slideEls[i]);
    });
    applySun();
    triggerRainRipple();
    updateDeck();
    if (playing || fromUser) schedule();
  }

  function play() {
    if (playing) return;
    playing = true;
    toggleButton?.classList.remove('is-paused');
    toggleButton?.setAttribute('aria-label', '暂停');
    schedule();
  }

  function pause() {
    playing = false;
    clearTimer();
    toggleButton?.classList.add('is-paused');
    toggleButton?.setAttribute('aria-label', '播放');
  }

  function toggle() {
    if (playing) pause();
    else play();
  }

  /* ---------------- 开场 ---------------- */

  let opened = false;
  function open() {
    if (opened) return;
    opened = true;
    cover.classList.add('is-gone');
    document.body.classList.add('is-open');
    window.setTimeout(
      () => {
        cover.hidden = true;
      },
      reducedMotion() ? 0 : 1200,
    );
    if (music) music.hidden = !audio.enabled;
    audio.play();
    syncMusic();
    go(0);
    play();
  }

  $('#open')?.addEventListener('click', open);

  ['pointerdown', 'touchstart', 'keydown'].forEach((type) =>
    window.addEventListener(type, () => audio.warm(), { once: true, passive: true }),
  );
  window.addEventListener('load', () => window.setTimeout(() => audio.warm(), 2500));

  /* ---------------- 控制条 ---------------- */

  function syncMusic() {
    if (!music) return;
    music.classList.toggle('is-paused', audio.paused);
    music.setAttribute('aria-label', audio.paused ? '播放音乐' : '暂停音乐');
  }

  music?.addEventListener('click', async () => {
    await audio.toggle();
    syncMusic();
  });
  $('#deck-prev')?.addEventListener('click', () => go(index - 1, { fromUser: true }));
  $('#deck-next')?.addEventListener('click', () => go(index + 1, { fromUser: true }));
  toggleButton?.addEventListener('click', toggle);
  $('#deck-replay')?.addEventListener('click', () => {
    slideEls.forEach((el) => {
      el.classList.remove('is-in');
      if (el.querySelector('.bubble')) {
        el.dataset.typed = '0';
        el.classList.remove('is-sent');
        el.querySelectorAll('.bubble').forEach((bubble) => {
          bubble.classList.remove('is-done', 'is-typing');
          const target = bubble.querySelector('.bubble__typed');
          if (target) target.textContent = '';
        });
      }
    });
    index = -1;
    audio.seek(0);
    audio.play();
    go(0);
    play();
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.isOpen) return;
    if (event.key === 'ArrowRight') go(index + 1, { fromUser: true });
    else if (event.key === 'ArrowLeft') go(index - 1, { fromUser: true });
    else if (event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });

  // 手指左右划
  let touchStart = null;
  stage.addEventListener(
    'touchstart',
    (event) => {
      touchStart = event.touches[0]?.clientX ?? null;
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchend',
    (event) => {
      if (touchStart === null) return;
      const end = event.changedTouches[0]?.clientX ?? touchStart;
      const dx = end - touchStart;
      touchStart = null;
      if (Math.abs(dx) < 48) return;
      go(index + (dx < 0 ? 1 : -1), { fromUser: true });
    },
    { passive: true },
  );

  // 看大图的时候先停一下，别在翻页
  app.addEventListener('click', (event) => {
    if (event.target.closest('.slide__img')) {
      const wasPlaying = playing;
      pause();
      const resume = () => {
        if (wasPlaying && !lightbox.isOpen) {
          play();
          document.removeEventListener('click', resume);
        }
      };
      document.addEventListener('click', resume);
    }
  });

  // 页面切到后台就停，回来再继续
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimer();
    else if (playing) schedule();
  });

  updateDeck();
  applySun();

  return { audio, open, go, play, pause };
}

/* ------------------------------------------------------------------ */

function buildStage(slides, asset) {
  return `
  <div class="stage" id="stage">
    <div class="stage__inner">
      ${slides.map((slide, i) => renderSlide(slide, asset, i)).join('')}
    </div>
  </div>`;
}

function renderSlide(slide, asset, i) {
  const head = `class="slide slide--${slide.kind}" data-index="${i}" aria-hidden="true"`;
  switch (slide.kind) {
    case 'chapter':
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center">
          ${slide.chapter.tag ? `<p class="chapter__tag">${esc(slide.chapter.tag)}</p>` : ''}
          <p class="chapter__index">${String(slide.no || 1).padStart(2, '0')}</p>
          ${slide.chapter.date ? `<p class="slide__date">${esc(slide.chapter.date)}</p>` : ''}
          <h2 class="slide__title">${esc(slide.chapter.label || '')}</h2>
          ${slide.chapter.intro ? `<p class="slide__intro">${esc(slide.chapter.intro)}</p>` : ''}
        </div>
      </section>`;

    case 'image':
    case 'memory': {
      const node = slide.node;
      const images = node.images.filter(Boolean).slice(0, 5);
      const count = images.length;
      const lines = node.lines || (node.text ? [node.text] : []);
      const kind = slide.kind === 'memory' ? ' memory--with-text' : '';
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center memory${kind}">
          <figure class="slide__media memory__media memory__media--${Math.min(count, 5)}">
            ${images
              .map((src, n) => {
                const size = photoSizes[src];
                return `<img class="slide__img memory__img memory__img--${n + 1}" style="--photo-i:${n}" data-src="${esc(asset(src))}" alt="${esc(
                  node.title || '',
                )}" ${size ? `width="${size[0]}" height="${size[1]}"` : ''} decoding="async" />`;
              })
              .join('')}
          </figure>
          ${slide.kind === 'memory' ? `
            <div class="memory__copy">
              <p class="slide__meta">
                ${node.date ? `<time>${esc(node.date)}</time>` : ''}
                ${node.place ? `<span>${esc(node.place)}</span>` : ''}
              </p>
              ${node.title ? `<h3 class="slide__head">${esc(node.title)}</h3>` : ''}
              <div class="slide__lines">
                ${lines.map((line, n) => `<p class="slide__line" style="--i:${n}">${richInline(line)}</p>`).join('')}
              </div>
              ${node.quote ? `<blockquote class="slide__quote">${richInline(node.quote)}</blockquote>` : ''}
            </div>` : ''}
          <p class="slide__caption">
            ${node.date ? `<time>${esc(node.date)}</time>` : ''}
            ${node.place ? `<span>${esc(node.place)}</span>` : ''}
          </p>
        </div>
      </section>`;
    }

    case 'text': {
      const node = slide.node;
      const lines = node.lines || (node.text ? [node.text] : []);
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center">
          <p class="slide__meta">
            ${node.date ? `<time>${esc(node.date)}</time>` : ''}
            ${node.place ? `<span>${esc(node.place)}</span>` : ''}
          </p>
          ${node.title ? `<h3 class="slide__head">${esc(node.title)}</h3>` : ''}
          <div class="slide__lines">
            ${lines
              .map((line, n) => `<p class="slide__line" style="--i:${n}">${richInline(line)}</p>`)
              .join('')}
          </div>
          ${node.quote ? `<blockquote class="slide__quote">${richInline(node.quote)}</blockquote>` : ''}
        </div>
      </section>`;
    }

    case 'interlude':
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center">
          <div class="interlude__inner">
            ${(slide.chapter.lines || [])
              .map(
                (line, n) =>
                  `<p class="interlude__line${n > 0 ? ' interlude__line--sub' : ''}">${richChars(
                    line,
                    n * 40,
                  )}</p>`,
              )
              .join('')}
          </div>
        </div>
      </section>`;

    case 'chat':
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center">
          <div class="chatscene__box">
            <div class="chatscene__bubbles">
              ${(slide.chapter.bubbles || [])
                .map(
                  (bubble) => `
                <p class="bubble bubble--${bubble.side === 'me' ? 'me' : 'you'}"
                   data-type="${esc(bubble.text)}">
                  <span class="bubble__typed"></span><span class="bubble__caret" aria-hidden="true"></span>
                </p>`,
                )
                .join('')}
            </div>
            ${slide.chapter.sendLabel ? `<span class="chatscene__send">${esc(slide.chapter.sendLabel)}</span>` : ''}
          </div>
        </div>
      </section>`;

    case 'songs':
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center">
          ${slide.chapter.label ? `<h2 class="slide__title slide__title--small">${esc(slide.chapter.label)}</h2>` : ''}
          <ol class="songs__list">
            ${(slide.chapter.items || [])
              .map(
                (item, n) => `
              <li class="song">
                <span class="song__index">${String(n + 1).padStart(2, '0')}</span>
                <span class="song__main">
                  <span class="song__name">${esc(item.name)}</span>
                  ${item.artist ? `<span class="song__artist">${esc(item.artist)}</span>` : ''}
                </span>
                ${item.note ? `<span class="song__note">${esc(item.note)}</span>` : ''}
              </li>`,
              )
              .join('')}
          </ol>
        </div>
      </section>`;

    case 'ending': {
      const ending = slide.ending;
      return `
      <section ${head}>
        <div class="slide__inner slide__inner--center">
          ${ending.title ? `<h2 class="slide__title slide__title--small">${esc(ending.title)}</h2>` : ''}
          ${ending.images?.length ? `<div class="ending__photos" aria-label="回忆拼贴">${ending.images.map((src, n) => `<img class="ending__photo ending__photo--${n + 1}" src="${esc(asset(src))}" alt="" loading="lazy" decoding="async" />`).join('')}</div>` : ''}
          <div class="ending__body">
            ${(ending.paragraphs || []).map((p) => `<p>${richInline(p)}</p>`).join('')}
          </div>
          ${
            ending.sign || ending.date
              ? `<p class="ending__sign">
                  ${ending.sign ? `<span>${esc(ending.sign)}</span>` : ''}
                  ${ending.date ? `<time>${esc(ending.date)}</time>` : ''}
                </p>`
              : ''
          }
          <button class="deck__replay" id="deck-replay" type="button">再看一遍</button>
        </div>
      </section>`;
    }

    default:
      return '';
  }
}

function buildDeck(audio, total) {
  return `
  <div class="deck" id="deck">
    <div class="deck__bar"><span id="deck-fill"></span></div>
    <div class="deck__row">
      <span class="deck__label" id="deck-label"></span>
      <div class="deck__buttons">
        <button class="deck__button deck__button--music" id="deck-music" type="button" hidden aria-label="播放音乐">
          <span class="music__bars" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        <button class="deck__button" id="deck-prev" type="button" aria-label="上一幕">‹</button>
        <button class="deck__button deck__button--play" id="deck-toggle" type="button" aria-label="暂停">
          <span class="deck__pause" aria-hidden="true"></span>
        </button>
        <button class="deck__button" id="deck-next" type="button" aria-label="下一幕">›</button>
      </div>
      <span class="deck__counter" id="deck-counter">1 / ${total}</span>
    </div>
  </div>`;
}
