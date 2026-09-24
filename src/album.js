import { createAudio } from './audio.js';
import { setSun } from './weather.js';
import { photoSizes } from './data/photo-sizes.js';
import {
  esc,
  richChars,
  richInline,
  reducedMotion,
  assetFor,
  buildSky,
  buildCover,
  buildTopbar,
  buildMusicButton,
  buildLightbox,
  setupLightbox,
  setupMusicButton,
} from './ui.js';

/** 把 data 渲染成一整页回忆。 */
export function mount(app, data, ROOT) {
  const asset = assetFor(ROOT);
  // 注意：这里的路径必须走 asset()，否则在 /yales/ 这种子目录页面下会解析错
  const audio = createAudio({
    ...data.bgm,
    src: data.bgm?.src ? asset(data.bgm.src) : '',
    tracks: data.bgm?.tracks?.map((track) => ({ ...track, src: asset(track.src) })),
  });
  const chapters = data.chapters || [];

  app.dataset.state = 'ready';
  app.innerHTML =
    buildSky(data.theme) +
    buildCover(data) +
    buildPage(data, chapters, asset) +
    buildTopbar() +
    buildMusicButton(audio) +
    buildLightbox();

  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => Array.from(app.querySelectorAll(sel));

  const cover = $('#cover');
  const page = $('#page');
  const timelineFill = $('#timeline-fill');
  const topFill = $('#top-fill');
  const topLabel = $('#top-label');
  const topProgress = $('#top-progress');
  const openButton = $('#open');
  const endingSection = $('#ending');

  document.body.classList.add('is-locked');

  /* ---------- 打开 ---------- */
  let opened = false;
  async function open() {
    if (opened) return;
    opened = true;
    cover.classList.add('is-gone');
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.remove('is-locked');
    music.show();
    audio.play().then(() => music.sync());
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

  // 首次交互先把音乐缓冲起来，别等点开了才开始下载
  ['pointerdown', 'touchstart', 'keydown'].forEach((type) =>
    window.addEventListener(type, () => audio.warm(), { once: true, passive: true }),
  );
  // 等首屏和第一张图先站稳，再在后台悄悄缓冲音乐
  window.addEventListener('load', () => window.setTimeout(() => audio.warm(), 2500));

  const music = setupMusicButton(app, audio);
  setupLightbox(app);

  /* ---------- 进场动画 ---------- */
  const revealTargets = $$('.reveal, .motion');

  /**
   * 一幕的"进—停—出"。
   * 参考生日模板那种一幕幕推过去的节奏：动作不是靠定时器，而是跟着滚动走，
   * 所以她停在哪一幕就停在哪一幕，想多看一会儿就多看一会儿。
   *
   *   --in   0→1  斜着落下来
   *   --out  0→1  斜着滑走、上飞、轻微缩小
   *
   * 比一屏还高的元素（长截图那种）不做"出场"，否则会在还能看见的时候就淡掉。
   */
  const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function updateMotion() {
    if (reducedMotion()) {
      revealTargets.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const vh = window.innerHeight;
    revealTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // data-lag 越大出场越晚 —— 图片先落，文字跟上
      const lag = Math.min(1, Math.max(0, Number(el.dataset.lag || 0)));
      const start = vh * (0.94 - 0.44 * lag);
      const enter = Math.min(1, Math.max(0, (start - rect.top) / (vh * 0.36)));

      // is-in 也从这里给：不再依赖 IntersectionObserver，
      // 甩着滚也不会漏掉某一幕，导致里面的字永远不出现
      const eased = smootherstep(enter);
      if (eased > 0.02) el.classList.add('is-in');

      if (!el.classList.contains('motion')) return;

      const short = rect.height < vh * 0.8;
      const leave = short
        ? Math.min(1, Math.max(0, (vh * 0.3 - rect.bottom) / (vh * 0.32)))
        : 0;
      // 比一屏还高的、以及图片本身，都不斜切：
      // 长元素一斜，上边缘就横着偏出去上百像素，会怼出屏幕
      el.classList.toggle('is-tall', !short || el.dataset.skew === '0');
      el.style.setProperty('--in', eased.toFixed(3));
      el.style.setProperty('--out', smootherstep(leave).toFixed(3));
      if (el.classList.contains('chatscene') && eased > 0.3) typeChat(el);
    });
  }

  /* ---------- 聊天分镜：一个字一个字打出来 ---------- */
  const chatScenes = $$('.chatscene');
  function typeChat(scene) {
    if (scene.dataset.typed === '1') return;
    scene.dataset.typed = '1';
    const bubbles = Array.from(scene.querySelectorAll('.bubble'));
    let delay = 0;
    bubbles.forEach((bubble) => {
      const target = bubble.querySelector('.bubble__typed');
      const text = bubble.dataset.type || '';
      const chars = Array.from(text);
      const calm = reducedMotion();
      const per = calm ? 0 : 55;
      const gap = calm ? 0 : 420;
      window.setTimeout(() => bubble.classList.add('is-typing'), delay);
      chars.forEach((char, i) => {
        window.setTimeout(() => {
          target.textContent = chars.slice(0, i + 1).join('');
        }, delay + per * (i + 1));
      });
      const total = delay + per * chars.length;
      window.setTimeout(() => {
        bubble.classList.remove('is-typing');
        bubble.classList.add('is-done');
      }, total + 220);
      delay = total + gap;
    });
    window.setTimeout(() => scene.classList.add('is-sent'), delay + 200);
  }

  // 打字由 updateMotion 在滚到那一幕时触发，不另开观察者
  if (reducedMotion()) chatScenes.forEach(typeChat);

  /* ---------- 时间线：当前读到哪 ---------- */
  const nodes = $$('.node, .interlude, .songs, .chatscene');
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
    const chapter = node?.closest('.chapter, .interlude, .songs');
    const chapterId = chapter?.id;
    chapterLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.chapter === chapterId);
    });
    if (topLabel && chapter) {
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
      updateMotion();

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
          // --sun、data-weather、雨/云/尘埃的浓度、右下角角标都在里面
          setSun(sun);
        }
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- 结尾的"再看一遍" ---------- */
  const replayButton = $('#replay');
  replayButton?.addEventListener('click', () => {
    // 让所有进场动画可以重新播一次
    revealTargets.forEach((el) => el.classList.remove('is-in'));

    chatScenes.forEach((scene) => {
      scene.dataset.typed = '0';
      scene.classList.remove('is-sent');
      scene.querySelectorAll('.bubble').forEach((bubble) => {
        bubble.classList.remove('is-done', 'is-typing');
        const typed = bubble.querySelector('.bubble__typed');
        if (typed) typed.textContent = '';
      });
    });

    lastSun = -1;
    audio.seek(0);
    audio.play();
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    onScroll();
  });

  return { audio, open };
}

/* ------------------------------------------------------------------ */

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

  // 停顿页不占章节编号，所以单独数一遍
  let headNo = 0;
  const body = chapters
    .map((chapter) => {
      if (chapter.kind === 'interlude') return buildInterlude(chapter);
      if (chapter.kind === 'chat') return buildChat(chapter);
      headNo += 1;
      if (chapter.kind === 'songs') return buildSongs(chapter, headNo - 1);
      return buildChapter(chapter, asset, headNo - 1);
    })
    .join('');

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
        <button class="scroll-cue" id="replay" type="button">再看一遍</button>
      </footer>
    </main>
  </div>`;
}

function head(chapter, chapterIndex) {
  return `
    <header class="chapter__head reveal motion">
      ${chapter.tag ? `<p class="chapter__tag">${esc(chapter.tag)}</p>` : ''}
      <p class="chapter__index">${String(chapterIndex + 1).padStart(2, '0')}</p>
      ${chapter.date ? `<p class="chapter__date">${esc(chapter.date)}</p>` : ''}
      <h2 class="chapter__label">${esc(chapter.label || '')}</h2>
      ${chapter.intro ? `<p class="chapter__intro">${esc(chapter.intro)}</p>` : ''}
    </header>`;
}

function buildChapter(chapter, asset, chapterIndex) {
  return `
  <section class="chapter reveal motion" id="${esc(chapter.id)}" data-date="${esc(chapter.date || '')}" data-label="${esc(chapter.label || '')}">
    ${head(chapter, chapterIndex)}
    ${(chapter.nodes || []).map((node, i) => buildNode(node, asset, i)).join('')}
  </section>`;
}

/** 停顿页：一整屏只放一两句话，逐字浮现。不需要图，用来给整篇留呼吸和分量。 */
function buildInterlude(chapter) {
  const lines = chapter.lines || [];
  let cursor = 0;
  const rendered = lines.map((line, i) => {
    const html = richChars(line, cursor);
    cursor += Array.from(String(line).replace(/\*\*/g, '')).length + 6;
    return `<p class="interlude__line${i > 0 ? ' interlude__line--sub' : ''}">${html}</p>`;
  });
  return `
  <section class="interlude reveal motion" id="${esc(chapter.id)}"
    data-date="${esc(chapter.date || '')}" data-label="${esc(chapter.label || '')}">
    <div class="interlude__inner">
      ${rendered.join('')}
    </div>
  </section>`;
}

/**
 * 聊天气泡分镜：滚到这里，话一个字一个字打出来，最后冒出"发送"。
 * 参考生日模板里那个聊天框，只是内容换成你们自己的。
 */
function buildChat(chapter) {
  const bubbles = chapter.bubbles || [];
  return `
  <section class="chatscene reveal motion" id="${esc(chapter.id)}"
    data-date="${esc(chapter.date || '')}" data-label="${esc(chapter.label || '')}">
    <div class="chatscene__box">
      <div class="chatscene__bubbles">
        ${bubbles
          .map(
            (bubble, i) => `
          <p class="bubble bubble--${bubble.side === 'me' ? 'me' : 'you'}"
             data-type="${esc(bubble.text)}" style="--row:${i}">
            <span class="bubble__typed"></span><span class="bubble__caret" aria-hidden="true"></span>
          </p>`,
          )
          .join('')}
      </div>
      ${chapter.sendLabel ? `<span class="chatscene__send">${esc(chapter.sendLabel)}</span>` : ''}
    </div>
  </section>`;
}

/** 一起听过的歌。纯文字，撑得住篇幅，也是你们之间真实存在的东西。 */
function buildSongs(chapter, chapterIndex) {
  return `
  <section class="songs reveal motion" id="${esc(chapter.id)}"
    data-date="${esc(chapter.date || '')}" data-label="${esc(chapter.label || '')}">
    ${head(chapter, chapterIndex)}
    <ol class="songs__list">
      ${(chapter.items || [])
        .map(
          (item, i) => `
        <li class="song reveal motion" data-lag="${Math.min(0.8, i * 0.16).toFixed(2)}">
          <span class="song__index">${String(i + 1).padStart(2, '0')}</span>
          <span class="song__main">
            <span class="song__name">${esc(item.name)}</span>
            ${item.artist ? `<span class="song__artist">${esc(item.artist)}</span>` : ''}
          </span>
          ${item.note ? `<span class="song__note">${esc(item.note)}</span>` : ''}
        </li>`,
        )
        .join('')}
    </ol>
  </section>`;
}

function buildNode(node, asset, index) {
  const images = (node.images || []).filter(Boolean);
  const lines = node.lines || (node.text ? [node.text] : []);
  return `
  <article class="node reveal ${index % 2 === 1 ? 'node--flip' : ''} ${
    images.length > 1 ? 'node--multi' : ''
  }" id="${esc(node.id)}">
    ${
      images.length
        ? `<figure class="node__media motion${images.length > 1 ? ' node__media--multi' : ''}" data-skew="0">
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
    <div class="node__body motion" data-lag="0.6">
      <p class="node__meta">
        ${node.date ? `<time>${esc(node.date)}</time>` : ''}
        ${node.place ? `<span class="node__place">${esc(node.place)}</span>` : ''}
      </p>
      ${node.title ? `<h3 class="node__title">${esc(node.title)}</h3>` : ''}
      ${lines.map((line) => `<p class="node__text">${richInline(line)}</p>`).join('')}
      ${node.quote ? `<p class="node__quote">${richInline(node.quote)}</p>` : ''}
    </div>
  </article>`;
}

function buildEnding(data) {
  const ending = data.ending || {};
  if (!ending.paragraphs?.length && !ending.title) return '';
  return `
  <section class="ending reveal motion" id="ending">
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
