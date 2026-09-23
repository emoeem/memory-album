import { albums } from './data/index.js';
import { mount } from './album.js';
import { mountSlides } from './slides.js';
import { mountSky, mountRainHover } from './weather.js';

const ROOT = new URL('../', import.meta.url);
const app = document.getElementById('app');
const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

/** 支持三种链接形式： /yales/  ·  ?u=yales  ·  #/yales */
function resolveSlug() {
  const fromHtml = document.documentElement.dataset.slug;
  if (fromHtml) return fromHtml;

  const params = new URLSearchParams(window.location.search);
  const query = params.get('u') || params.get('to');
  if (query) return query;

  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash) return hash;

  return null;
}

function setMeta(data) {
  const name = data.cover?.title || data.name || '';
  document.title = name ? `给 ${name}` : '有些东西想讲给你听';
  const desc = data.cover?.subtitle || '一份给你的回忆';
  const set = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  set('meta[name="description"]', 'content', desc);
  set('meta[property="og:title"]', 'content', document.title);
  set('meta[property="og:description"]', 'content', desc);
  const firstImage = data.chapters?.flatMap((c) => c.nodes || []).find((n) => n.images?.length)?.images[0];
  if (firstImage) {
    set('meta[property="og:image"]', 'content', new URL(firstImage, ROOT).href);
  }
}

/**
 * 没有指到具体的人时显示的中转页。
 * 只有在本机调试时才会把已有的 slug 列出来，线上不会暴露名单。
 */
function renderNotFound(slug) {
  const list = isLocalDev
    ? `<ul class="notfound">${Object.keys(albums)
        .map((key) => `<li><a href="?u=${encodeURIComponent(key)}">${key}</a></li>`)
        .join('')}</ul>`
    : '';
  app.dataset.state = 'ready';
  app.innerHTML = `
    <div class="cover">
      <div class="cover__inner">
        <p class="cover__kicker">${slug ? '没有找到这一份' : '专属链接'}</p>
        <h1 class="cover__title cover__title--small">${slug ? '链接好像不对' : '这份回忆需要一个专属链接'}</h1>
        <p class="cover__subtitle">${
          slug ? '检查一下链接有没有复制完整。' : '从 TA 给你的那条链接打开就好。'
        }</p>
        ${list}
      </div>
    </div>`;
}

async function boot() {
  const slug = resolveSlug();
  const loader = albums[slug];
  if (!loader) {
    renderNotFound(slug);
    return;
  }
  try {
    const mod = await loader();
    const data = mod.default;
    document.documentElement.dataset.slug = data.slug || slug;
    // 挂到 window 上方便本机调试（也方便检查脚本读播放状态）
    // presentation 决定走哪套：'slides' 单屏自动播（默认） / 'scroll' 往下滚
    // 链接上加 ?mode=scroll 可以临时切回去看
    const override = new URLSearchParams(window.location.search).get('mode');
    const render =
      (override || data.presentation) === 'scroll' ? mount : mountSlides;
    window.__memoryAlbum = render(app, data, ROOT);
    setMeta(data);
    // 雨 / 云 / 空气粒子（天光的 CSS 那一层已经在 buildSky 里了）
    void mountSky();
    void mountRainHover();
  } catch (error) {
    console.error(error);
    app.dataset.state = 'ready';
    app.innerHTML = `<div class="cover"><div class="cover__inner">
      <h1 class="cover__title cover__title--small">加载失败了</h1>
      <p class="cover__subtitle">${String(error?.message || error)}</p>
    </div></div>`;
  }
}

boot();
