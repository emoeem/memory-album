// 降级动效模式：粒子还在不在、动没动，内容是否照样看得见。
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const errors = [];
  window.addEventListener('error', (event) => errors.push(String(event.error?.message || event.message)));

  const album = window.__memoryAlbum;
  album.open();
  await wait(1500);

  const canvases = [...document.querySelectorAll('.sky canvas')];
  const before = canvases.map((c) => c.toDataURL?.().length ?? 0);
  await wait(900);
  const after = canvases.map((c) => c.toDataURL?.().length ?? 0);
  // OffscreenCanvas 拿不到数据，就退一步：看容器有没有被 pause 掉
  const layers = ['sky-rain-heavy', 'sky-rain-light', 'sky-clouds', 'sky-air'].map((id) => ({
    id,
    opacity: document.getElementById(id)?.style.opacity,
  }));

  const hidden = [];
  const slides = [...document.querySelectorAll('.slide')];
  for (let i = 0; i < slides.length; i += 1) {
    album.go(i, { fromUser: true });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await wait(80);
    const slide = slides[i];
    const inner = slide.querySelector('.slide__inner');
    const faint = [...inner.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().height > 0)
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.5)
      .map((el) => `${el.className || el.tagName}(${el.textContent.trim().slice(0, 8)})`);
    if (faint.length) hidden.push(`${i}: ${[...new Set(faint)].slice(0, 4).join(', ')}`);
  }

  return JSON.stringify({
    mediaReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    canvases: canvases.length,
    canvasStable: JSON.stringify(before) === JSON.stringify(after) && before.length > 0,
    layers,
    hiddenSlides: hidden,
    errors,
  });
})()
