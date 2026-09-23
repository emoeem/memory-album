// 4 组组合，逐步记录错误与结果，判断到底是"哪种写法"还是"哪种元素"出的问题。
(async () => {
  const { animate } = await import('/vendor/motion.js');
  const log = [];
  let errors = 0;
  window.addEventListener('error', () => {
    errors += 1;
  });

  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:0;top:0;width:80px;height:40px;background:#123;opacity:1';
  document.body.append(div);

  const target = document.querySelector('.slide__title');
  const snap = (el) => `${getComputedStyle(el).opacity}/${getComputedStyle(el).transform}`;

  const cases = [
    ['div array-of-objects', div, () => [{ opacity: 0.3, y: 12 }, { opacity: 1, y: 0 }]],
    ['div object-of-arrays', div, () => ({ opacity: [0.3, 1], y: [0, 12] })],
    ['title array-of-objects', target, () => [{ opacity: 0.3, y: 12 }, { opacity: 1, y: 0 }]],
    ['title object-of-arrays', target, () => ({ opacity: [0.3, 1], y: [0, 12] })],
  ];

  for (const [name, el, make] of cases) {
    const before = errors;
    let returned = 'n/a';
    try {
      const controls = animate(el, make(), { duration: 0.25 });
      returned = controls ? typeof controls : 'undefined';
    } catch (error) {
      returned = `threw ${error.message}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    log.push(`${name}: errors+${errors - before} result=${snap(el)} returns=${returned}`);
  }

  return JSON.stringify(log, null, 1);
})()
