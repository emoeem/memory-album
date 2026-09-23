// 用无头浏览器把页面在手机 / 小屏 / 平板 / 桌面上各跑一遍。
//
//   node scripts/dev.mjs &
//   node scripts/check-layout.mjs
//   URL_BASE=http://127.0.0.1:5174/memory-album node scripts/check-layout.mjs
//
// 默认查单屏自动播那套（presentation: 'slides'），顺带烟测一下滚动那套。
// 截图存到 .checks/，眼睛还能再看一遍。
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const OUT = join(ROOT, '.checks');
const URL_BASE = process.env.URL_BASE || 'http://127.0.0.1:5173';
const PLAYWRIGHT =
  process.env.PLAYWRIGHT_PATH || '/home/emo/code/telegram-bot/node_modules/playwright/index.js';
const CHROME =
  process.env.CHROME_PATH || '/home/emo/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const playwrightModule = await import(PLAYWRIGHT);
const chromium = playwrightModule.chromium ?? playwrightModule.default?.chromium;
if (!chromium) throw new Error(`找不到 chromium 导出: ${PLAYWRIGHT}`);

await mkdir(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'mobile-small', width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'tablet', width: 834, height: 1112, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
];

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
});
const report = [];

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.hasTouch });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const loc = msg.location();
      problems.push(`console: ${msg.text()}${loc?.url ? ` @ ${loc.url}` : ''}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (req) => {
    const reason = req.failure()?.errorText || '';
    if (!reason.includes('ERR_ABORTED')) problems.push(`requestfailed: ${req.url()} (${reason})`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
  });

  await page.goto(`${URL_BASE}/?u=yales`, { waitUntil: 'load' });
  await page.waitForSelector('.cover__title');

  /* ---------- 1. 封面 ---------- */
  const coverState = await page.evaluate(() => ({
    title: document.querySelector('.cover__title')?.textContent?.trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    deckHidden: getComputedStyle(document.querySelector('.deck')).opacity === '0',
    activeSlides: document.querySelectorAll('.slide.is-active').length,
  }));
  if (!coverState.title) problems.push('封面没有渲染出名字');
  if (coverState.bodyBg !== 'rgb(10, 21, 38)') problems.push(`样式没生效 (bg=${coverState.bodyBg})`);
  if (coverState.activeSlides !== 0) problems.push('还没开始就有幕在显示了');
  await page.screenshot({ path: join(OUT, `${viewport.name}-1-cover.png`) });

  /* ---------- 2. 点开始 ---------- */
  await page.click('#open');
  await page.waitForTimeout(2200);
  const opened = await page.evaluate(() => {
    const audio = window.__memoryAlbum?.audio?.state?.();
    return {
      coverGone: document.querySelector('.cover')?.classList.contains('is-gone'),
      deckVisible: getComputedStyle(document.querySelector('.deck')).opacity !== '0',
      active: document.querySelectorAll('.slide.is-active').length,
      audioPaused: audio?.paused,
      audioDuration: audio?.duration,
      hasGo: typeof window.__memoryAlbum?.go === 'function',
      noScroll: getComputedStyle(document.body).overflow === 'hidden',
    };
  });
  if (!opened.coverGone) problems.push('点击后封面没有淡出');
  if (!opened.deckVisible) problems.push('控制条没有出现');
  if (opened.active !== 1) problems.push(`应该只有一幕在显示，现在有 ${opened.active}`);
  if (opened.audioPaused) problems.push('音乐没有开始播');
  if (opened.audioDuration && Math.abs(opened.audioDuration - 308) > 3) {
    problems.push(`音乐时长不对: ${opened.audioDuration}s`);
  }
  if (!opened.hasGo) problems.push('拿不到播放控制接口');
  if (!opened.noScroll) problems.push('单屏模式下页面还能滚动');
  await page.screenshot({ path: join(OUT, `${viewport.name}-2-first-slide.png`) });

  /* ---------- 3. 自动播 ---------- */
  const before = await page.evaluate(() => window.__memoryAlbum.index ?? null);
  await page.waitForTimeout(6500);
  const auto = await page.evaluate(() => {
    const active = document.querySelector('.slide.is-active');
    return { index: Array.from(document.querySelectorAll('.slide')).indexOf(active) };
  });
  if (auto.index <= (before ?? -1)) {
    problems.push(`没有自动往下播（停在 ${auto.index}）`);
  }

  /* ---------- 4. 暂停 ---------- */
  await page.click('#deck-toggle');
  await page.waitForTimeout(300);
  const pausedAt = await page.evaluate(() => {
    const active = document.querySelector('.slide.is-active');
    return Array.from(document.querySelectorAll('.slide')).indexOf(active);
  });
  await page.waitForTimeout(3500);
  const stillAt = await page.evaluate(() => {
    const active = document.querySelector('.slide.is-active');
    return Array.from(document.querySelectorAll('.slide')).indexOf(active);
  });
  if (stillAt !== pausedAt) problems.push(`暂停之后还在自己翻（${pausedAt} → ${stillAt}）`);

  /* ---------- 5. 手动翻页 ---------- */
  await page.click('#deck-next');
  await page.waitForTimeout(400);
  const afterNext = await page.evaluate(() => {
    const active = document.querySelector('.slide.is-active');
    return Array.from(document.querySelectorAll('.slide')).indexOf(active);
  });
  if (afterNext !== stillAt + 1) problems.push(`"下一幕"没生效（${stillAt} → ${afterNext}）`);
  await page.click('#deck-prev');
  await page.waitForTimeout(400);
  const afterPrev = await page.evaluate(() => {
    const active = document.querySelector('.slide.is-active');
    return Array.from(document.querySelectorAll('.slide')).indexOf(active);
  });
  if (afterPrev !== stillAt) problems.push(`"上一幕"没生效（${afterNext} → ${afterPrev}）`);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(350);
  const afterKey = await page.evaluate(() => {
    const active = document.querySelector('.slide.is-active');
    return Array.from(document.querySelectorAll('.slide')).indexOf(active);
  });
  if (afterKey !== afterPrev + 1) problems.push('键盘右方向键没生效');

  /* ---------- 6. 逐幕走一遍 ---------- */
  const total = await page.evaluate(() => document.querySelectorAll('.slide').length);
  const walk = [];
  for (let i = 0; i < total; i += 1) {
    await page.evaluate(async (n) => {
      window.__memoryAlbum.go(n, { fromUser: true });
      // 等两帧再往下走：这一幕的淡入是下一帧才开始的，
      // 不等就容易读到 opacity: 0，误判成"显示不出来"
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, i);
    // 450ms：足够让 0.95s 的淡入走出个明确的中间值。
    // 软件渲染（CI / 无 GPU）时首帧可能要 200ms 上下，等太短会误判成"没显示"。
    await page.waitForTimeout(450);
    const info = await page.evaluate(async () => {
      const active = document.querySelector('.slide.is-active');
      const vw = Math.round(window.visualViewport?.width ?? window.innerWidth);
      const images = Array.from(active.querySelectorAll('.slide__img'));
      if (images.length) {
        await Promise.race([
          Promise.all(images.map((img) => img.decode?.().catch(() => {}) ?? Promise.resolve())),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
      }
      return {
        kind: active.className.replace('slide slide--', '').split(' ')[0],
        visible: getComputedStyle(active).opacity !== '0' && getComputedStyle(active).visibility !== 'hidden',
        images: images.length,
        broken: images.filter((img) => !(img.complete && img.naturalWidth > 0)).length,
        overflow: document.documentElement.scrollWidth > vw + 3,
        sun: Number(getComputedStyle(document.documentElement).getPropertyValue('--sun')) || 0,
      };
    });
    walk.push({ i, ...info });
  }

  if (walk.some((s) => !s.visible)) {
    const bad = walk.filter((s) => !s.visible).map((s) => s.i);
    problems.push(`这些幕显示不出来: ${bad.join(',')}`);
  }
  const broken = walk.filter((s) => s.broken > 0);
  if (broken.length) {
    problems.push(`有图没加载出来: 幕 ${broken.map((s) => `${s.i}(${s.broken})`).join(',')}`);
  }
  if (walk.some((s) => s.overflow)) {
    problems.push(`有幕横向溢出: ${walk.filter((s) => s.overflow).map((s) => s.i).join(',')}`);
  }
  // 图文并排的节点走的是 slide--memory，只有图没有字的才是 slide--image，
  // 两种都算"照片幕"，不然这套检查会报"有照片没用上"的假警。
  const photoSlides = walk.filter((s) => s.kind === 'image' || s.kind === 'memory');
  const photoCount = photoSlides.reduce((sum, s) => sum + s.images, 0);
  if (photoCount < 19) problems.push(`有照片没用上：只出现 ${photoCount} 张`);
  const sunStart = walk[0]?.sun ?? 0;
  const sunEnd = walk[walk.length - 1]?.sun ?? 0;
  if (sunStart > 0.05) problems.push(`开头不该放晴 (--sun=${sunStart})`);
  if (sunEnd < 0.9) problems.push(`结尾没有放晴 (--sun=${sunEnd})`);

  const counts = {
    slides: total,
    image: photoSlides.length,
    memory: walk.filter((s) => s.kind === 'memory').length,
    chapter: walk.filter((s) => s.kind === 'chapter').length,
    text: walk.filter((s) => s.kind === 'text').length,
    interlude: walk.filter((s) => s.kind === 'interlude').length,
    chat: walk.filter((s) => s.kind === 'chat').length,
    songs: walk.filter((s) => s.kind === 'songs').length,
    ending: walk.filter((s) => s.kind === 'ending').length,
  };
  if (counts.interlude < 1) problems.push('没有停顿页');
  if (counts.chat < 1) problems.push('没有聊天分镜');
  if (counts.songs < 1) problems.push('没有歌单');
  if (counts.ending < 1) problems.push('没有结尾');

  /* ---------- 7. 聊天分镜打字 ---------- */
  const chatIndex = walk.find((s) => s.kind === 'chat')?.i;
  let chatState = null;
  if (chatIndex !== undefined) {
    await page.evaluate((n) => window.__memoryAlbum.go(n, { fromUser: true }), chatIndex);
    await page.waitForSelector('.slide.is-active .bubble__typed', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(4000);
    chatState = await page.evaluate(() => {
      const active = document.querySelector('.slide.is-active');
      const bubbles = Array.from(active.querySelectorAll('.bubble__typed'));
      return {
        sent: active.classList.contains('is-sent'),
        typed: bubbles.map((el) => el.textContent.length),
        expected: bubbles.map((el) => el.closest('.bubble')?.dataset.type?.length ?? 0),
      };
    });
    if (!chatState.sent) problems.push('聊天分镜没有出现"发送"');
    chatState.typed.forEach((len, i) => {
      if (len < chatState.expected[i]) {
        problems.push(`气泡没打完：${len}/${chatState.expected[i]} 字`);
      }
    });
    await page.screenshot({ path: join(OUT, `${viewport.name}-3-chat.png`) });
  }

  /* ---------- 8. 点图看大图 ---------- */
  const imageIndex = walk.find(
    (s) => (s.kind === 'image' || s.kind === 'memory') && s.images === 1,
  )?.i;
  let lightboxOk = null;
  if (imageIndex !== undefined) {
    await page.evaluate((n) => window.__memoryAlbum.go(n, { fromUser: true }), imageIndex);
    await page.waitForTimeout(600);
    await page.click('.slide.is-active .slide__img');
    await page.waitForTimeout(500);
    lightboxOk = await page.evaluate(() => {
      const box = document.querySelector('#lightbox');
      const img = document.querySelector('#lightbox-image');
      return {
        open: !box.hidden && getComputedStyle(box).opacity !== '0',
        loaded: Boolean(img?.naturalWidth),
      };
    });
    if (!lightboxOk.open) problems.push('点图片没有打开大图');
    if (!lightboxOk.loaded) problems.push('大图没加载');
    await page.screenshot({ path: join(OUT, `${viewport.name}-4-lightbox.png`) });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    const closed = await page.evaluate(() => document.querySelector('#lightbox')?.hidden);
    if (!closed) problems.push('Esc 没有关闭大图');
  }

  /* ---------- 9. 结尾重播 ---------- */
  await page.evaluate((n) => window.__memoryAlbum.go(n, { fromUser: true }), total - 1);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, `${viewport.name}-5-ending.png`) });
  const replayExists = await page.evaluate(() => Boolean(document.querySelector('#deck-replay')));
  if (!replayExists) problems.push('结尾没有"再看一遍"');
  else {
    await page.click('#deck-replay');
    await page.waitForTimeout(600);
    const afterReplay = await page.evaluate(() => {
      const active = document.querySelector('.slide.is-active');
      return Array.from(document.querySelectorAll('.slide')).indexOf(active);
    });
    if (afterReplay !== 0) problems.push(`"再看一遍"没有回到第一幕（到了 ${afterReplay}）`);
  }

  /* ---------- 10. /yales/ 独立链接 ---------- */
  await page.goto(`${URL_BASE}/yales/`, { waitUntil: 'load' });
  await page.waitForSelector('.cover__title');
  const direct = await page.evaluate(() => ({
    title: document.querySelector('.cover__title')?.textContent?.trim(),
    docTitle: document.title,
    bg: getComputedStyle(document.body).backgroundColor,
  }));
  if (!direct.title) problems.push('/yales/ 独立链接没有渲染');
  if (direct.bg !== 'rgb(10, 21, 38)') problems.push(`/yales/ 样式没加载 (${direct.bg})`);

  /* ---------- 11. 根路径不能泄露内容 ---------- */
  await page.goto(`${URL_BASE}/`, { waitUntil: 'load' });
  await page.waitForSelector('.cover__title');
  const landing = await page.evaluate(() => ({
    title: document.querySelector('.cover__title')?.textContent?.trim(),
    hasStage: Boolean(document.querySelector('.stage')),
  }));
  if (landing.hasStage) problems.push('根路径直接显示了某个人的内容');
  if (!landing.title?.includes('专属链接')) problems.push(`根路径中转页不对: ${landing.title}`);

  /* ---------- 12. 滚动那套还能用（烟测） ---------- */
  await page.goto(`${URL_BASE}/?u=yales&mode=scroll`, { waitUntil: 'load' });
  await page.waitForSelector('.cover__title');
  await page.click('#open');
  await page.waitForTimeout(1200);
  const scrollMode = await page.evaluate(() => ({
    nodes: document.querySelectorAll('.node').length,
    photos: document.querySelectorAll('.node__img').length,
    timeline: Boolean(document.querySelector('.timeline__chapter')),
  }));
  if (scrollMode.nodes < 1) problems.push('滚动模式的节点没渲染出来');
  if (scrollMode.photos < 19) problems.push(`滚动模式少了照片：${scrollMode.photos}`);
  if (!scrollMode.timeline) problems.push('滚动模式没有时间线');

  report.push({
    viewport: viewport.name,
    size: `${viewport.width}×${viewport.height}`,
    counts,
    sunStart,
    sunEnd,
    chatState,
    scrollMode,
    problems,
  });
  await context.close();
}

await browser.close();

for (const entry of report) {
  console.log(`\n=== ${entry.viewport}  ${entry.size} ===`);
  console.log(
    `一共 ${entry.counts.slides} 幕：章节 ${entry.counts.chapter} / 图片 ${entry.counts.image} / 文字 ${entry.counts.text} / 停顿 ${entry.counts.interlude} / 聊天 ${entry.counts.chat} / 歌 ${entry.counts.songs} / 结尾 ${entry.counts.ending}`,
  );
  console.log(`天色 ${entry.sunStart} → ${entry.sunEnd}`);
  if (entry.chatState) {
    console.log(`聊天打字 ${entry.chatState.typed?.join(',')} / 期望 ${entry.chatState.expected?.join(',')}`);
  }
  console.log(
    `滚动那套（烟测）节点 ${entry.scrollMode.nodes} 图 ${entry.scrollMode.photos} 时间线 ${entry.scrollMode.timeline}`,
  );
  console.log(entry.problems.length ? `问题:\n  - ${entry.problems.join('\n  - ')}` : '✅ 没有发现问题');
}

const failed = report.filter((r) => r.problems.length);
console.log(`\n截图在 ${OUT}`);
if (failed.length) process.exitCode = 1;
