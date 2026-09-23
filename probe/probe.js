import { tsParticles, loadSlim } from '../vendor/tsparticles.js';

await loadSlim(tsParticles);
window.__tsp = { tsParticles };

// 每格 11 个粒子（density 会按格子面积换算），只测「线条朝向 vs 实际运动方向」。
const base = {
  number: { value: 40, density: { enable: true, width: 1200, height: 900 } },
  size: { value: { min: 14, max: 26 } },
  shape: { type: 'line' },
  paint: { stroke: { width: 2, color: { value: '#d8efff' } }, fill: { enable: false } },
  move: {
    enable: true,
    direction: 'bottom',
    speed: 10,
    straight: true,
    outModes: { default: 'out' },
  },
};

const variants = [
  { name: 'K direction 102 (number), rotate 102', particles: { ...base, rotate: { value: 102 }, move: { ...base.move, direction: 102 } } },
  {
    name: 'L angle.value 102, rotate 102',
    particles: {
      ...base,
      rotate: { value: 102 },
      move: { ...base.move, direction: undefined, angle: { value: 102, offset: 0 } },
    },
  },
  {
    name: 'M direction 78 (number), rotate 78',
    particles: { ...base, rotate: { value: 78 }, move: { ...base.move, direction: 78 } },
  },
  {
    name: 'N direction 102, rotate 90 (故意不齐)',
    particles: { ...base, rotate: { value: 90 }, move: { ...base.move, direction: 102 } },
  },
];

const row = document.getElementById('row');
for (const [i, variant] of variants.entries()) {
  const figure = document.createElement('figure');
  figure.innerHTML = `<figcaption>${variant.name}</figcaption><div class="cell"></div>`;
  row.append(figure);
  const cell = figure.querySelector('.cell');
  const container = await tsParticles.load({
    id: `probe-town-${i}`,
    element: cell,
    options: {
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 60,
      particles: variant.particles,
    },
  });
  console.log('loaded', variant.name, container.particles.count);
}
