// 逐幕走一遍，报告「这一幕为什么看不见」。
//   node .checks/analyze.mjs '<url>' 'body' '@file:.../probe/walk.js'
(async () => {
  const errors = [];
  window.addEventListener('error', (event) => errors.push(String(event.error?.stack || event.message).split('\n')[0]));

  // ?probe=nosky → 把整层天空藏掉，做对照实验
  if (new URLSearchParams(location.search).get('probe') === 'nosky') {
    document.querySelector('.sky').style.display = 'none';
  }

  const album = window.__memoryAlbum;
  album.open();
  await new Promise((resolve) => setTimeout(resolve, 500));

  const total = document.querySelectorAll('.slide').length;
  const rows = [];
  for (let i = 0; i < total; i += 1) {
    const started = performance.now();
    album.go(i, { fromUser: true });
    const frameDelay = await new Promise((resolve) => {
      const t0 = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(Math.round(performance.now() - t0))));
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const all = [...document.querySelectorAll('.slide')];
    const active = all.find((s) => s.classList.contains('is-active'));
    const style = active ? getComputedStyle(active) : null;
    const inner = active?.querySelector('.slide__inner');
    rows.push({
      i,
      kind: active?.className.split(' ')[1],
      active: Boolean(active),
      op: style?.opacity,
      vis: style?.visibility,
      innerOp: inner ? getComputedStyle(inner).opacity : null,
      imgs: active?.querySelectorAll('img').length ?? 0,
      firstChildOp: inner?.firstElementChild ? getComputedStyle(inner.firstElementChild).opacity : null,
      frameDelay,
      cost: Math.round(performance.now() - started),
    });
  }
  return JSON.stringify({
    total,
    invisible: rows.filter((r) => r.op === '0' || r.vis === 'hidden' || !r.active).length,
    slowFrames: rows.filter((r) => r.frameDelay > 120).map((r) => `${r.i}:${r.frameDelay}ms`),
    frameDelays: rows.map((r) => r.frameDelay),
    errors: errors.slice(0, 3),
  });
})()
