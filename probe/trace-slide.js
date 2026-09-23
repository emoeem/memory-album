// 采样一秒半：幕自己的 opacity 怎么变、行内样式是什么、子元素有没有在动。
(async () => {
  const album = window.__memoryAlbum;
  album.open();
  await new Promise((resolve) => setTimeout(resolve, 400));
  album.go(1, { fromUser: true });

  const rows = [];
  for (let step = 0; step < 14; step += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const all = [...document.querySelectorAll('.slide')];
    const index = all.findIndex((s) => s.classList.contains('is-active'));
    const el = all[index];
    const inner = el?.querySelector('.slide__inner');
    rows.push({
      t: (step + 1) * 100,
      index,
      op: el ? getComputedStyle(el).opacity : null,
      inline: el?.getAttribute('style') || '',
      innerInline: inner?.getAttribute('style') || '',
      childOp: inner?.firstElementChild ? getComputedStyle(inner.firstElementChild).opacity : null,
      hasMotion: el?.classList.contains('has-motion'),
    });
  }
  return JSON.stringify(rows);
})()
