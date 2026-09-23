// 天空层：雨、云、空气里的尘埃全部交给 tsParticles。
//
// 三件事一起做：
//   · 雨幕用两条粒子层（急雨 / 细雨）交叉淡入淡出，越到结尾雨越少、越斜、越慢
//   · 云团是一层大颗粒 + CSS blur，代替原来那几条生硬的 repeating-gradient
//   · 空气尘埃在「云开 / 放晴」时慢慢亮起来，正好接住那一片漫射天光
//
// 之所以不用「改 options + refresh()」而是两层交叉：refresh 会把粒子重新洗牌，
// 屏幕上会闪一下；交叉淡入淡出看不出接缝，而且密度、速度、方向是真的在变。

import { tsParticles, loadSlim } from '../vendor/tsparticles.js';

/** 数量换算用的参考框：tsParticles 的 density 是按「这个框里放这么多」算的 */
const DENSITY_REF = { width: 1400, height: 1000 };

const PHASES = [
  { key: 'rain', from: 0 },
  { key: 'cloud', from: 0.22 },
  { key: 'sunbreak', from: 0.5 },
  { key: 'clear', from: 0.78 },
];

const LABELS = {
  rain: ['RAIN', '雨中'],
  cloud: ['CLOUD', '云隙'],
  sunbreak: ['SUNBREAK', '云开'],
  clear: ['CLEAR', '放晴'],
};

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function phaseOf(sun) {
  const value = clamp01(sun);
  return PHASES.reduce((phase, item) => (value >= item.from ? item.key : phase), PHASES[0].key);
}

/** 折线插值：把 --sun（0=雨夜，1=放晴）映射成某一层的不透明度 */
function curve(points, sun) {
  const value = clamp01(sun);
  if (value <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    if (value <= x1) {
      const [x0, y0] = points[i - 1];
      const t = (value - x0) / Math.max(1e-6, x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return points[points.length - 1][1];
}

/** 量一下这块画布和环境，决定粒子数量、帧率和画布精度 */
function measure(host) {
  const rect = host?.getBoundingClientRect();
  const width = Math.round(rect?.width || window.innerWidth);
  const height = Math.round(rect?.height || window.innerHeight);
  const small = Math.min(window.innerWidth, window.innerHeight) < 620;
  const reduced = reducedMotion();
  // 一律按 1 倍像素画：雨丝本来就是虚的，1 倍看不出来，
  // 但视网膜屏上能省掉 4 倍的填充率 —— 桌面端开 2 倍时，
  // 一层雨就是 2880×1800 的画布，几层叠起来会把首帧拖慢。
  const retina = false;
  const ratio = 1;
  return {
    width,
    height,
    ratio,
    retina,
    small,
    reduced,
    fps: reduced ? 20 : small ? 36 : 38,
    // 云和尘埃都铺着一层 CSS blur，重画一次就要重新糊一次，
    // 所以给它们低一点的帧率 —— 反正本来就飘得很慢。
    calmFps: reduced ? 12 : 16,
  };
}

/**
 * 反着算 number.value：引擎实际粒子数 = value × 画布面积 /（参考框 × 像素比²），
 * 想让每台设备都落在同一个目标数量上，就把 value 除以这个系数。
 */
function countValue(target, env, scale = 1) {
  const factor =
    (env.width * env.height) / (DENSITY_REF.width * DENSITY_REF.height * env.ratio ** 2);
  return Math.max(1, Math.round((target * scale) / Math.max(factor, 1e-6)));
}

const density = {
  enable: true,
  width: DENSITY_REF.width,
  height: DENSITY_REF.height,
};

/**
 * 一条雨层。
 *
 * v4 里 particles.color 已经不画线了，必须走 paint.stroke；
 * rotate.value 是线的角度（0=横线，90=竖线），必须和 move.direction 对齐，
 * 否则雨丝横着漂 —— 这两个数字是拿探针量出来对齐的，别随手改其中一个。
 */
function rainOptions(env, tune) {
  const scale = env.reduced ? 0.34 : env.small ? 0.46 : 1;
  const slow = env.reduced ? 0.4 : 1;
  return {
    fullScreen: { enable: false },
    fpsLimit: env.fps,
    detectRetina: env.retina,
    particles: {
      number: {
        value: countValue(tune.count, env, scale),
        density,
      },
      shape: { type: 'line', options: { line: { cap: 'round' } } },
      size: { value: { min: tune.size[0], max: tune.size[1] } },
      rotate: { value: tune.direction, animation: { enable: false } },
      paint: {
        fill: { enable: false },
        stroke: {
          width: tune.width,
          opacity: { min: tune.opacity[0], max: tune.opacity[1] },
          color: { value: tune.colors },
        },
      },
      move: {
        enable: true,
        direction: tune.direction,
        speed: { min: tune.speed[0] * slow, max: tune.speed[1] * slow },
        straight: true,
        outModes: { default: 'out' },
      },
    },
  };
}

/** 云团：大颗粒 + CSS blur(30px) ⇒ 软绵绵的一团，不是几条渐变色带 */
function cloudOptions(env) {
  const scale = env.reduced ? 0.4 : env.small ? 0.55 : 1;
  return {
    fullScreen: { enable: false },
    fpsLimit: env.calmFps,
    detectRetina: env.retina,
    particles: {
      number: { value: countValue(11, env, scale), density },
      shape: { type: 'circle' },
      size: { value: { min: env.small ? 70 : 120, max: env.small ? 150 : 260 } },
      paint: {
        fill: {
          enable: true,
          opacity: { min: 0.07, max: 0.2 },
          color: { value: ['#8fb6dd', '#a9cae9', '#7ea6cf'] },
        },
        stroke: { width: 0 },
      },
      move: {
        enable: true,
        direction: 0,
        speed: { min: 0.18, max: 0.55 },
        straight: true,
        outModes: { default: 'out' },
      },
    },
  };
}

/** 空气里的尘埃：放晴时顺着光慢慢往上飘，给天光一点颗粒感 */
function airOptions(env) {
  const scale = env.reduced ? 0.35 : env.small ? 0.5 : 1;
  return {
    fullScreen: { enable: false },
    fpsLimit: env.calmFps,
    detectRetina: env.retina,
    particles: {
      number: { value: countValue(26, env, scale), density },
      shape: { type: 'circle' },
      size: { value: { min: 0.7, max: 2.4 } },
      paint: {
        fill: {
          enable: true,
          opacity: { min: 0.18, max: 0.5 },
          color: { value: ['#eaf5ff', '#ffeec9', '#cfe6ff'] },
        },
        stroke: { width: 0 },
      },
      move: {
        enable: true,
        direction: 288,
        speed: { min: 0.12, max: 0.42 },
        straight: true,
        outModes: { default: 'out' },
      },
    },
  };
}

/** 每一层：一条随 --sun 变的浓度曲线 + 自己的粒子配置 */
const LAYERS = [
  {
    id: 'sky-rain-heavy',
    weight: (sun) => curve([[0, 1], [0.2, 0.68], [0.5, 0.16], [0.8, 0.02], [1, 0]], sun),
    options: (env) =>
      rainOptions(env, {
        count: 66,
        // 急雨：更竖、更快、更长
        direction: 99,
        speed: [26, 40],
        size: [18, 34],
        width: 1.9,
        opacity: [0.14, 0.3],
        colors: ['#d8efff', '#c6e4fb', '#eaf6ff'],
      }),
  },
  {
    id: 'sky-rain-light',
    weight: (sun) => curve([[0, 0.22], [0.2, 0.7], [0.5, 0.6], [0.8, 0.16], [1, 0.02]], sun),
    options: (env) =>
      rainOptions(env, {
        count: 52,
        // 细雨：更斜、更慢、更短
        direction: 86,
        speed: [8, 15],
        size: [9, 18],
        width: 1.1,
        opacity: [0.1, 0.22],
        colors: ['#bfe1f8', '#d8efff', '#a9d2ef'],
      }),
  },
  {
    id: 'sky-clouds',
    weight: (sun) => curve([[0, 0.92], [0.24, 0.78], [0.5, 0.52], [0.78, 0.26], [1, 0.16]], sun),
    options: cloudOptions,
  },
  {
    id: 'sky-air',
    weight: (sun) => curve([[0, 0.16], [0.3, 0.28], [0.55, 0.52], [0.8, 0.78], [1, 0.9]], sun),
    options: airOptions,
  },
];

let layers = [];
let mounting = null;
let lastSun = 0;

/**
 * 天色：写 --sun、切 data-weather、改各层浓度，顺手更新右下角那枚角标。
 * 单屏模式和滚动模式都只调这一个函数，省得两边各写一套。
 */
export function setSun(value) {
  const sun = clamp01(value);
  lastSun = sun;

  const root = document.documentElement;
  root.style.setProperty('--sun', sun.toFixed(3));
  const phase = phaseOf(sun);
  if (root.dataset.weather !== phase) root.dataset.weather = phase;

  root.classList.toggle('is-sky-clear', phase === 'clear');

  for (const layer of layers) {
    const weight = clamp01(layer.weight(sun));
    layer.el.style.opacity = weight.toFixed(3);
    // 已经淡到看不见的层就别再画了：省下来的帧全给还在动的那些
    const container = layer.container;
    if (!container) continue;
    if (weight < 0.015 && !layer.idle) {
      layer.idle = true;
      container.pause();
    } else if (weight >= 0.015 && layer.idle) {
      layer.idle = false;
      container.play();
    }
  }

  const [code, text] = LABELS[phase];
  const labelEl = document.querySelector('.sky__weather-label');
  const valueEl = document.querySelector('.sky__weather-value');
  if (labelEl) labelEl.textContent = code;
  if (valueEl) valueEl.textContent = text;

  return phase;
}

/** 挂载封面雨幕的 hover 加速：鼠标在封面区域时，两层雨速度临时 ×1.8 */
export function mountRainHover() {
  const cover = document.querySelector('.cover');
  if (!cover) return;
  const roots = [document.getElementById('sky-rain-heavy'), document.getElementById('sky-rain-light')];
  const rootsWithId = roots.map((el, i) => ({ el, id: i === 0 ? 'sky-rain-heavy' : 'sky-rain-light' })).filter(r => r.el);

  const setSpeed = (multiplier) => {
    rootsWithId.forEach(({ id }) => {
      const container = tsParticles.getContainer(id);
      if (!container) return;
      const opts = container.options.particles.move.speed;
      if (Array.isArray(opts) && opts.length >= 2) {
        opts[0] = opts[0] * multiplier;
        opts[1] = opts[1] * multiplier;
        container.set({ fpsLimit: container.options.fpsLimit });
      }
    });
  };

  cover.addEventListener('mouseenter', () => setSpeed(1.8));
  cover.addEventListener('mouseleave', () => setSpeed(1 / 1.8));
}

/** 每次翻页触发一次雨帘涟漪：在屏幕中央生成一圈缓缓扩开然后消失的大雨滴 */
export function triggerRainRipple() {
  const heavy = tsParticles.getContainer('sky-rain-heavy');
  const light = tsParticles.getContainer('sky-rain-light');
  const targets = [heavy, light].filter(Boolean);
  if (!targets.length) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  targets.forEach((container) => {
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const r = 40 + Math.random() * 60;
      container.particles.addParticle({
        x: w / 2 + Math.cos(angle) * r,
        y: h / 2 + Math.sin(angle) * r,
        options: {
          shape: { type: 'circle' },
          size: { value: 2 + Math.random() * 3 },
          paint: { fill: { enable: true, opacity: { value: 0.55 }, color: { value: '#c6e4fb' } }, stroke: { width: 0 } },
          move: {
            enable: true,
            direction: angle * (180 / Math.PI),
            speed: { value: 4 + Math.random() * 3 },
            outModes: { default: 'destroy' },
            gravity: { enable: true, acceleration: 0.3, maxSpeed: 12 },
          },
          life: { duration: { value: 1.2 }, count: 1 },
        },
      });
    }
  });
}

/** 挂天气层。重复调用只会挂一次；挂好之前 setSun 也可以先调，最后会补上。 */
export function mountSky() {
  if (mounting) return mounting;

  mounting = (async () => {
    const hosts = LAYERS.map((layer) => ({
      layer,
      el: document.getElementById(layer.id),
    })).filter((item) => item.el);
    if (!hosts.length) return;

    try {
      await loadSlim(tsParticles);
      const loaded = [];
      for (const { layer, el } of hosts) {
        const env = measure(el);
        const container = await tsParticles.load({
          id: layer.id,
          element: el,
          options: layer.options(env),
        });
        // 降级动效：让它先画几帧再定住，别一直在眼前飘
        if (env.reduced && container) {
          window.setTimeout(() => container.pause(), 700);
        }
        loaded.push({ el, weight: layer.weight, container, id: layer.id, idle: false });
      }
      // 存成「元素 + 权重曲线 + 容器」，setSun 照着曲线给浓度，
      // 浓度掉到 0 的层顺手暂停掉，别空转
      layers = loaded;
      setSun(lastSun);
    } catch (error) {
      // 粒子起不来也不能让页面塌：CSS 那层天光还在
      console.warn('天气粒子没起来，先用静态天空顶着：', error);
    }
  })();

  return mounting;
}
