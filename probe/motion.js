import { animate } from '../vendor/motion.js';

const style = (id) => {
  const computed = getComputedStyle(document.getElementById(id));
  return { transform: computed.transform, opacity: computed.opacity, filter: computed.filter };
};

const errors = [];
window.addEventListener('error', (event) => errors.push(String(event.error?.message || event.message)));

const settle = (id, keyframes, options = {}) =>
  animate(document.getElementById(id), keyframes, { duration: 0.3, ...options });

// A：普通元素，位移 + 缩放 + 虚化 + 透明度
settle('a', {
  opacity: [0, 1],
  y: [24, 0],
  scale: [0.9, 1],
  filter: ['blur(12px)', 'blur(0px)'],
});

// B：CSS 里本来就有 rotate(5deg)，只动 opacity / y / scale（落款照片那种）
settle('b', { opacity: [0, 1], y: [24, 0], scale: [0.9, 1] });

// C：CSS 有 rotate，且这次明确写 rotate
settle('c', { opacity: [0, 1], rotate: [-6, 0] });

// D：CSS 有 rotate，只动 opacity + filter
settle('d', { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'] });

// E：立即读一次，看看第一帧有没有闪（应该还停在 CSS 状态）
settle('e', { opacity: [0, 1], y: [20, 0] }, { duration: 0.8 });
const immediate = style('e');

window.__motionProbe = () => ({
  immediate,
  errors,
  a: style('a'),
  b: style('b'),
  c: style('c'),
  d: style('d'),
  e: style('e'),
});
