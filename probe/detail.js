// 细看某一幕：媒体区、每张图的盒子与计算样式，以及控制条的位置关系。
//   ?probe=detail&index=10
(async () => {
  const params = new URLSearchParams(location.search);
  const index = Number(params.get('index') || 10);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const album = window.__memoryAlbum;
  album.open();
  await wait(400);
  album.go(index, { fromUser: true });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await wait(1600);

  const slide = [...document.querySelectorAll('.slide')][index];
  const media = slide.querySelector('.memory__media, .ending__photos');
  const deck = document.querySelector('.deck');
  const inner = slide.querySelector('.slide__inner');
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      bottom: Math.round(r.bottom),
    };
  };

  return JSON.stringify(
    {
      index,
      viewport: [window.innerWidth, window.innerHeight],
      inner: rect(inner),
      media: rect(media),
      mediaStyle: media
        ? {
            display: getComputedStyle(media).display,
            columns: getComputedStyle(media).gridTemplateColumns,
            rows: getComputedStyle(media).gridTemplateRows,
            aspect: getComputedStyle(media).aspectRatio,
            justify: getComputedStyle(media).justifyItems,
          }
        : null,
      images: [...slide.querySelectorAll('.memory__img, .slide__img, .ending__photo')].map((img) => ({
        cls: img.className,
        ...rect(img),
        w: getComputedStyle(img).width,
        h: getComputedStyle(img).height,
        maxH: getComputedStyle(img).maxHeight,
        transform: getComputedStyle(img).transform,
      })),
      deck: rect(deck),
      contentBottom: Math.round(
        Math.max(
          ...[...inner.querySelectorAll('*')]
            .filter((el) => el.getBoundingClientRect().height > 0)
            .map((el) => el.getBoundingClientRect().bottom),
        ),
      ),
      scrollable: inner.scrollHeight - inner.clientHeight,
    },
    null,
    1,
  );
})()
