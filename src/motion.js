// 单屏模式的进 / 出场动画，交给 Motion。
//
// 分工：
//   · 标题块、图片区、正文区、歌单这些「块」先落下来
//   · 里面的照片再各自错开：轻微位移 + 缩放 + 虚化，像是从景深里浮出来
//   · 正文一行一行、歌单一首一首、聊天一句一句跟着上
//
// 两个坑记在这里（都是拿探针量出来的）：
//   1. Motion v13 的关键帧只认 `{ opacity: [0, 1] }` 这种写法；
//      传 `[{...}, {...}]` 会抛 "Indexed property setter is not supported"。
//   2. 只要关键帧里出现了位移 / 缩放 / 旋转，Motion 就会整个接管 transform，
//      CSS 里的 `transform: rotate(var(--rot))` 会被抹掉。所以落款照片墙的倾角
//      要自己从 --rot 读出来，当成动画目标写回去。
//
// 滚动模式不吃这套（那边是跟着滚动位置算的），所以这里只管 .slide。

import { animate } from '../vendor/motion.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EASE_OUT = [0.22, 1, 0.36, 1];

/** 读元素上 CSS 定义的倾角（`--rot: -7deg`），读不到就 0 */
function tiltOf(el) {
  const raw = getComputedStyle(el).getPropertyValue('--rot').trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

/**
 * 一趟动画 = 一个选择器 + 一套关键帧工厂。
 * 顺序有讲究：后面的组会把前面占过的元素让出去（见 targetsFor）。
 */
const PLAN = [
  {
    // 照片：从更远的地方、稍微歪一点浮上来
    selector: '.memory__img, .slide__img',
    keys: (index) => ({
      opacity: [0, 1],
      y: [34 + (index % 2) * 12, 0],
      scale: [0.86, 1],
      rotate: [index % 2 ? 1.6 : -1.6, 0],
      filter: ['blur(14px)', 'blur(0px)'],
    }),
    delay: 0.16,
    step: 0.11,
    duration: 1.1,
    easing: 'spring',
  },
  {
    // 落款照片墙：散开的相纸一张张压上来，各自的 --rot 倾角要保住
    selector: '.ending__photo',
    keys: (index, el) => {
      const tilt = tiltOf(el);
      return {
        opacity: [0, 1],
        y: [30 + (index % 2) * 10, 0],
        scale: [0.8, 1],
        rotate: [tilt - (index % 2 ? -7 : 7), tilt],
        filter: ['blur(10px)', 'blur(0px)'],
      };
    },
    delay: 0.1,
    step: 0.09,
    duration: 1.0,
    easing: 'spring',
  },
  {
    // 歌单：一左一右错开
    selector: '.song',
    keys: (index) => ({
      opacity: [0, 1],
      x: [index % 2 ? 26 : -26, 0],
      y: [14, 0],
      scale: [0.97, 1],
      filter: ['blur(8px)', 'blur(0px)'],
    }),
    delay: 0.14,
    step: 0.075,
    duration: 0.8,
  },
  {
    // 聊天：气泡弹性地顶上来，像真实 IM 那种 pop 一下
    selector: '.bubble',
    keys: () => ({
      opacity: [0, 1],
      y: [22, 0],
      scale: [0.85, 1],
      filter: ['blur(8px)', 'blur(0px)'],
    }),
    delay: 0.12,
    step: 0.14,
    duration: 0.72,
    easing: 'spring',
  },
  {
    // 正文：一行一行浮出来
    selector: '.slide__line',
    keys: () => ({
      opacity: [0, 1],
      y: [16, 0],
      filter: ['blur(9px)', 'blur(0px)'],
    }),
    delay: 0.26,
    step: 0.08,
    duration: 0.78,
  },
  {
    // 「当时没说的话」比正文重一点
    selector: '.slide__quote',
    keys: () => ({
      opacity: [0, 1],
      y: [18, 0],
      scale: [0.97, 1],
      filter: ['blur(10px)', 'blur(0px)'],
    }),
    delay: 0.34,
    step: 0.08,
    duration: 0.86,
  },
  {
    // 章节序号、日期、标题这类标题块
    selector:
      '.chapter__tag, .chapter__index, .slide__date, .slide__title, .slide__head, .slide__meta',
    keys: () => ({
      opacity: [0, 1],
      y: [22, 0],
      filter: ['blur(10px)', 'blur(0px)'],
    }),
    delay: 0.06,
    step: 0.07,
    duration: 0.85,
  },
  {
    // 兜底：剩下那些块（图片区、正文区、按钮……）也得动，别有人杵在那儿
    selector: '.slide__inner > *',
    keys: () => ({
      opacity: [0, 1],
      y: [26, 0],
      filter: ['blur(12px)', 'blur(0px)'],
    }),
    delay: 0.04,
    step: 0.06,
    duration: 0.9,
    fallback: true,
  },
];

/** 最后那一组只认领「还没被别的组挑走」的元素，免得同一个东西动两遍 */
const targetsFor = (slide, group, claimed) => {
  const found = [...slide.querySelectorAll(group.selector)];
  if (!group.fallback) {
    found.forEach((el) => claimed.add(el));
    return found;
  }
  return found.filter((el) => !claimed.has(el));
};

/** 进场：一幕里的东西错落着浮出来 */
export function animateSlideIn(slide) {
  if (!slide) return;
  if (reducedMotion()) {
    slide.classList.remove('has-motion');
    return;
  }
  // 有 Motion 顶着的时候，让 CSS 里那套过渡让开，免得到处打架
  slide.classList.add('has-motion');

  const claimed = new Set();
  for (const group of PLAN) {
    targetsFor(slide, group, claimed).forEach((el, index) => {
      animate(el, group.keys(index, el), {
        duration: group.duration,
        delay: group.delay + index * group.step,
        easing: group.easing || EASE_OUT,
      });
    });
  }

  // 结尾的相纸墙：落稳之后开始缓慢漂浮，直到这一幕被切走
  if (slide.querySelector('.ending__photo')) {
    const photos = slide.querySelectorAll('.ending__photo');
    photos.forEach((photo, index) => {
      const tilt = tiltOf(photo);
      animate(
        photo,
        {
          y: [0, -6 - (index % 2) * 3, 0],
          rotate: [tilt, tilt + (index % 2 ? 1.2 : -1.2), tilt],
        },
        {
          duration: 3.6 + index * 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.4 + index * 0.1,
        },
      );
    });
  }
}

/**
 * 出场：很短的一下「收」，把这一幕让出去。
 * 只碰透明度和虚化 —— 动 transform 会把落款照片的倾角抹平。
 * 动的元素和进场是同一批，所以下次翻回来，进场动画会把它们重新拉起来。
 */
export function animateSlideOut(slide) {
  if (!slide || reducedMotion()) return;
  const claimed = new Set();
  for (const group of PLAN) {
    targetsFor(slide, group, claimed).forEach((el) => {
      animate(
        el,
        { opacity: [1, 0], filter: ['blur(0px)', 'blur(6px)'] },
        { duration: 0.3, easing: [0.4, 0, 1, 1] },
      );
    });
  }
}
