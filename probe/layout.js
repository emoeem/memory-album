// 逐幕量：照片排布（1/2/3 张）、正文底边到控制条的间距、内容有没有溢出。
(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const album = window.__memoryAlbum;
  album.open();
  await wait(400);

  const slides = [...document.querySelectorAll('.slide')];
  const rows = [];
  for (let i = 0; i < slides.length; i += 1) {
    album.go(i, { fromUser: true });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await wait(500);
    const slide = slides[i];
    const inner = slide.querySelector('.slide__inner');
    const deck = document.querySelector('.deck');
    if (!inner || !deck) continue;

    const imgs = [...slide.querySelectorAll('.memory__img, .slide__img, .ending__photo')];
    const boxes = imgs.map((img) => {
      const r = img.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    });
    const blocks = [...inner.querySelectorAll('*')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.width > 0;
    });
    const contentBottom = blocks.length
      ? Math.max(...blocks.map((el) => el.getBoundingClientRect().bottom))
      : inner.getBoundingClientRect().bottom;
    const innerRect = inner.getBoundingClientRect();
    rows.push({
      i,
      kind: slide.className.split(' ')[1],
      photos: imgs.length,
      boxes,
      innerTop: Math.round(innerRect.top),
      innerBottom: Math.round(innerRect.bottom),
      gapToDeck: Math.round(deck.getBoundingClientRect().top - contentBottom),
      scrollable: inner.scrollHeight - inner.clientHeight,
      viewport: [window.innerWidth, window.innerHeight],
    });
  }
  return JSON.stringify(rows);
})()
