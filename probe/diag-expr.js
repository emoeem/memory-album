// 最小复现表达式（`.checks/analyze.mjs` 用 @file: 读它）：
// inline options + 独立 div，看看粒子到底建不建得出来。
(async () => {
  const host = document.createElement('div');
  host.id = 'diag-1';
  host.style.cssText =
    'position:fixed;left:0;top:0;width:300px;height:300px;z-index:9;background:#101d33';
  document.body.append(host);
  const c = await window.__tsp.tsParticles.load({
    id: 'diag-1',
    element: host,
    options: {
      fullScreen: { enable: false },
      particles: {
        number: { value: 25, density: { enable: true, width: 1000, height: 1000 } },
        shape: { type: 'circle' },
        size: { value: 8 },
        paint: { fill: { enable: true, color: { value: '#ffffff' } } },
        move: { enable: true, speed: 5 },
      },
    },
  });
  return JSON.stringify({
    count: c.particles.count,
    num: c.actualOptions.particles.number.value,
    density: c.actualOptions.particles.number.density.enable,
    shape: c.actualOptions.particles.shape.type,
    size: JSON.stringify(c.actualOptions.particles.size.value),
    fill: JSON.stringify(c.actualOptions.particles.paint.fill),
  });
})()
