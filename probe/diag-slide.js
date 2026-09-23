// 诊断：抓 uncaught error 的堆栈 + 看当前幕的状态。
//   node .checks/analyze.mjs 'http://127.0.0.1:5199/?u=yales' 'body' '@file:.../probe/diag-slide.js'
(async () => {
  const errors = [];
  window.addEventListener('error', (event) => {
    errors.push(String(event.error?.stack || event.message));
  });
  window.addEventListener('unhandledrejection', (event) => {
    errors.push(`rejection: ${event.reason?.stack || event.reason}`);
  });

  const album = window.__memoryAlbum;
  album.open();
  await new Promise((resolve) => setTimeout(resolve, 600));
  album.go(4, { fromUser: true });
  await new Promise((resolve) => setTimeout(resolve, 900));

  const all = [...document.querySelectorAll('.slide')];
  const active = document.querySelector('.slide.is-active');
  const style = active ? getComputedStyle(active) : null;
  return JSON.stringify(
    {
      total: all.length,
      index: all.indexOf(active),
      className: active?.className,
      opacity: style?.opacity,
      visibility: style?.visibility,
      images: active ? active.querySelectorAll('img').length : 0,
      firstImageSrc: active?.querySelector('img')?.getAttribute('src')?.slice(-24),
      kinds: all.map((s) => s.className.split(' ')[1]),
      hasMotion: all.filter((s) => s.classList.contains('has-motion')).length,
      errors: errors.slice(0, 4),
    },
    null,
    1,
  );
})()
