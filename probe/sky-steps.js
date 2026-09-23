// 把单屏模式从头快进到尾，记录几个时间点上的天色 / 角标 / 四层浓度。
// 用法：node .checks/analyze.mjs 'http://127.0.0.1:5199/?u=yales' 'body' '@file:.../probe/sky-steps.js'
(async () => {
  const album = window.__memoryAlbum;
  const out = [];
  const read = (label) => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    out.push({
      label,
      sun: Number(style.getPropertyValue('--sun') || 0).toFixed(2),
      weather: root.dataset.weather,
      badge: `${document.querySelector('.sky__weather-label')?.textContent} / ${
        document.querySelector('.sky__weather-value')?.textContent
      }`,
      layers: ['sky-rain-heavy', 'sky-rain-light', 'sky-clouds', 'sky-air'].map(
        (id) => document.getElementById(id)?.style.opacity || '-',
      ),
    });
  };

  album.open();
  for (const index of [0, 9, 17, 24, 30, 34, 35]) {
    album.go(index);
    await new Promise((resolve) => setTimeout(resolve, 1300));
    read(`slide ${index}`);
  }
  return JSON.stringify(out);
})()
