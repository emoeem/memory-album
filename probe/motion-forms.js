// 比较两种 keyframes 写法在同一批元素上的表现（抓不到错误就说明没抛）。
(async () => {
  const { animate } = await import('/vendor/motion.js');
  const errors = [];
  window.addEventListener('error', (event) => errors.push(String(event.error?.message || event.message)));

  const box = document.querySelector('.memory__img') || document.querySelector('.slide__title');
  const results = [];
  const styleOf = (el) => {
    const cs = getComputedStyle(el);
    return `${cs.opacity}|${cs.transform}|${cs.filter}`;
  };

  try {
    animate(
      box,
      [
        { opacity: 0.2, y: 20, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)' },
      ],
      { duration: 0.25 },
    );
    await new Promise((r) => setTimeout(r, 500));
    results.push(`array-of-objects → ${styleOf(box)}`);
  } catch (error) {
    results.push(`array-of-objects threw: ${error.message}`);
  }

  try {
    animate(box, { opacity: [0.2, 1], y: [20, 0], filter: ['blur(10px)', 'blur(0px)'] }, { duration: 0.25 });
    await new Promise((r) => setTimeout(r, 500));
    results.push(`object-of-arrays → ${styleOf(box)}`);
  } catch (error) {
    results.push(`object-of-arrays threw: ${error.message}`);
  }

  return JSON.stringify({ target: box?.className, results, errors });
})()
