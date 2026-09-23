// 背景音乐：支持多首按顺序播，接缝处交叉淡入淡出。
// 一首歌只有三四分钟也够用 —— 播完会自动接下一首（没给下一首就接回自己），
// 因为是两轨重叠淡入淡出，听不出循环点。

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createAudio(config = {}) {
  const raw = Array.isArray(config.tracks) && config.tracks.length
    ? config.tracks
    : config.src
      ? [{ src: config.src, title: config.title, volume: config.volume }]
      : [];
  const tracks = raw.filter((track) => track && track.src);

  const enabled = tracks.length > 0;
  const master = clamp(config.volume ?? 0.6, 0, 1);
  const looping = config.loop !== false;
  const crossfade = clamp(config.crossfade ?? 6, 1, 20);

  // 两个播放槽轮换，才能出现"两轨重叠"的交叉淡化
  const slots = [
    { el: null, index: -1 },
    { el: null, index: -1 },
  ];
  let active = 0;
  let monitor = null;
  let inCrossfade = false;

  const gainOf = (index) => master * clamp(tracks[index]?.volume ?? 1, 0, 1);

  function slotEl(i) {
    const slot = slots[i];
    if (!slot.el) {
      const el = new Audio();
      el.preload = 'none';
      el.volume = 0;
      el.setAttribute('playsinline', '');
      slot.el = el;
    }
    return slot.el;
  }

  function fade(el, to, ms) {
    if (el._fadeTimer) {
      clearInterval(el._fadeTimer);
      el._fadeTimer = null;
    }
    const from = el.volume;
    const target = clamp(to, 0, 1);
    if (ms <= 0 || Math.abs(target - from) < 0.001) {
      el.volume = target;
      return;
    }
    const step = 60;
    const steps = Math.max(1, Math.round(ms / step));
    let i = 0;
    el._fadeTimer = setInterval(() => {
      i += 1;
      const t = Math.min(1, i / steps);
      const eased = t * t * (3 - 2 * t);
      el.volume = clamp(from + (target - from) * eased, 0, 1);
      if (t >= 1) {
        clearInterval(el._fadeTimer);
        el._fadeTimer = null;
      }
    }, step);
  }

  async function startSlot(i, index, fadeMs) {
    const slot = slots[i];
    const el = slotEl(i);
    if (slot.index !== index || !el.src) {
      el.src = tracks[index].src;
      slot.index = index;
    }
    try {
      el.currentTime = 0;
    } catch {
      /* 还没加载好时忽略 */
    }
    el.volume = 0;
    try {
      await el.play();
    } catch {
      return false;
    }
    fade(el, gainOf(index), fadeMs);
    return true;
  }

  function otherIndex() {
    const current = slots[active].index;
    const next = current + 1;
    if (next < tracks.length) return next;
    return looping ? 0 : -1;
  }

  /** 提前把下一首缓冲好，接缝处才不会空一段 */
  function preloadNext() {
    const index = otherIndex();
    if (index < 0) return;
    const slot = slots[(active + 1) % 2];
    if (slot.index === index && slot.el?.src) return;
    const el = slotEl((active + 1) % 2);
    slot.index = index;
    el.src = tracks[index].src;
    el.load();
  }

  async function crossfadeToNext() {
    if (inCrossfade) return;
    const index = otherIndex();
    if (index < 0) {
      stop();
      return;
    }
    inCrossfade = true;
    const from = slots[active];
    const to = (active + 1) % 2;
    const ok = await startSlot(to, index, crossfade * 1000);
    if (!ok) {
      inCrossfade = false;
      return;
    }
    fade(from.el, 0, crossfade * 1000);
    const retiring = from.el;
    window.setTimeout(() => {
      retiring.pause();
      try {
        retiring.currentTime = 0;
      } catch {
        /* ignore */
      }
    }, crossfade * 1000 + 200);
    active = to;
    inCrossfade = false;
  }

  function tick() {
    const el = slots[active].el;
    if (!el || el.paused || !el.duration || Number.isNaN(el.duration)) return;
    const remaining = el.duration - el.currentTime;
    if (remaining <= crossfade + 20) preloadNext();
    if (remaining <= crossfade) crossfadeToNext();
  }

  function startMonitor() {
    if (monitor) return;
    monitor = window.setInterval(tick, 400);
  }

  /** 她手指一按下去就先开始缓冲，正式点开时就不用等 */
  function warm() {
    if (!enabled) return;
    const slot = slots[active];
    if (slot.index < 0) slot.index = 0;
    const el = slotEl(active);
    if (!el.src) {
      el.src = tracks[0].src;
      el.load();
    }
  }

  async function play() {
    if (!enabled) return false;
    startMonitor();
    if (slots[active].el && !slots[active].el.paused) {
      fade(slots[active].el, gainOf(slots[active].index), 900);
      return true;
    }
    const index = slots[active].index < 0 ? 0 : slots[active].index;
    return startSlot(active, index, 1800);
  }

  function stop() {
    slots.forEach((slot) => {
      if (!slot.el) return;
      fade(slot.el, 0, 700);
      const el = slot.el;
      window.setTimeout(() => el.pause(), 720);
    });
    if (monitor) {
      window.clearInterval(monitor);
      monitor = null;
    }
  }

  function toggle() {
    const el = slots[active].el;
    if (el && !el.paused) {
      stop();
      return Promise.resolve(false);
    }
    return play();
  }

  /** 跳到某一秒（调试/检查用） */
  function seek(seconds) {
    const el = slots[active].el;
    if (!el || !el.duration) return false;
    el.currentTime = clamp(seconds, 0, Math.max(0, el.duration - 0.5));
    return true;
  }

  return {
    enabled,
    title: tracks[0]?.title || '音乐',
    warm,
    play,
    pause: stop,
    toggle,
    seek,
    get paused() {
      const el = slots[active].el;
      return !el || el.paused;
    },
    get element() {
      return slots[active].el;
    },
    /** 给检查脚本和调试用：能看到当前播到哪、有没有在交叉淡化 */
    state() {
      const el = slots[active].el;
      return {
        enabled,
        tracks: tracks.length,
        paused: !el || el.paused,
        slot: active,
        index: slots[active].index,
        time: el ? Number(el.currentTime.toFixed(2)) : 0,
        duration: el ? Math.round(el.duration || 0) : 0,
        volume: el ? Number(el.volume.toFixed(3)) : 0,
        element: el || null,
        crossfade,
      };
    },
  };
}
