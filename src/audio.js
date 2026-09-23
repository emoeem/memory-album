/** 背景音乐：淡入淡出 + 播放/暂停。 */
export function createAudio(config = {}) {
  const enabled = Boolean(config.src);
  const el = enabled ? new Audio(config.src) : null;
  const target = Math.min(1, Math.max(0, config.volume ?? 0.6));
  let fadeFrame = null;

  if (el) {
    el.loop = true;
    // 别一进页面就偷偷下好几 MB，等她点了「打开」再开始
    el.preload = 'none';
    el.volume = 0;
    el.setAttribute('playsinline', '');

    // 但她一点，就希望音乐马上出来：提前在首次交互时开始缓冲
    let warmed = false;
    const warm = () => {
      if (warmed || !el.paused) return;
      warmed = true;
      el.load();
    };
    window.addEventListener('load', () => window.setTimeout(warm, 900));
    ['pointerdown', 'touchstart', 'keydown'].forEach((type) =>
      window.addEventListener(type, warm, { once: true, passive: true }),
    );
  }

  function fadeTo(to, ms = 1200) {
    if (!el) return;
    cancelAnimationFrame(fadeFrame);
    const from = el.volume;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = t * t * (3 - 2 * t);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
      if (t < 1) fadeFrame = requestAnimationFrame(step);
    };
    fadeFrame = requestAnimationFrame(step);
  }

  async function play() {
    if (!el) return false;
    try {
      if (el.paused) await el.play();
      fadeTo(target, 1600);
      return true;
    } catch {
      return false;
    }
  }

  function pause() {
    if (!el) return;
    fadeTo(0, 700);
    window.setTimeout(() => {
      if (el.volume < 0.02) el.pause();
    }, 720);
  }

  function toggle() {
    if (!el) return Promise.resolve(false);
    return el.paused ? play() : (pause(), Promise.resolve(false));
  }

  return {
    enabled,
    title: config.title || '音乐',
    play,
    pause,
    toggle,
    get paused() {
      return !el || el.paused;
    },
    get element() {
      return el;
    },
  };
}
