/**
 * 用无头浏览器把页面在手机和桌面尺寸下跑一遍，检查布局和交互。
 *
 *   node scripts/dev.mjs &            # 先起服务
 *   node scripts/check-layout.mjs     # 再检查
 *
 * 会把截图存到 .checks/ 方便肉眼再看一遍。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const OUT = join(ROOT, '.checks');
const URL_BASE = process.env.URL_BASE || 'http://localhost:5173';
const PLAYWRIGHT = process.env.PLAYWRIGHT_PATH || '/home/emo/code/telegram-bot/node_modules/playwright/index.js';
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
  page.on('requestfailed', (req) => problems.push(`requestfailed: ${req.url()}`));
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
  });

  await page.goto(`${URL_BASE}/?u=yales`, { waitUntil: 'load' });
  await page.waitForSelector('.node', { state: 'attached' });

  // 1. 封面阶段
  const coverState = await page.evaluate(() => ({
    coverVisible: Boolean(document.querySelector('.cover:not(.is-gone)')),
    title: document.querySelector('.cover__title')?.textContent?.trim(),
    docWidth: document.documentElement.scrollWidth,
    winWidth: window.innerWidth,
    bodyLocked: document.body.classList.contains('is-locked'),
  }));
  if (!coverState.coverVisible) problems.push('封面没有出现');
  if (coverState.docWidth > coverState.winWidth + 1) {
    problems.push(`封面阶段横向溢出 ${coverState.docWidth} > ${coverState.winWidth}`);
  }
  await page.screenshot({ path: join(OUT, `${viewport.name}-1-cover.png`) });

  // 2. 点开
  await page.click('#open');
  await page.waitForTimeout(1600);
  const afterOpen = await page.evaluate(() => ({
    coverGone: document.querySelector('.cover')?.classList.contains('is-gone'),
    pageVisible: document.querySelector('#page')?.getAttribute('aria-hidden'),
    bodyLocked: document.body.classList.contains('is-locked'),
    musicVisible: !document.querySelector('#music')?.hidden,
    audioPlaying: Boolean(document.querySelector('#music') && !document.querySelector('#music').classList.contains('is-paused')),
  }));
  if (!afterOpen.coverGone) problems.push('点击后封面没有淡出');
  if (afterOpen.pageVisible !== 'false') problems.push('点击后正文没有显示');
  if (afterOpen.bodyLocked) problems.push('点击后页面仍然锁着滚动');
  if (!afterOpen.musicVisible) problems.push('音乐按钮没有出现');
  if (!afterOpen.audioPlaying) problems.push('音乐没有进入播放状态');
  const audioState = await page.evaluate(() => {
    const el = window.__memoryAlbum?.audio?.element;
    return el
      ? { paused: el.paused, time: Number(el.currentTime.toFixed(2)), readyState: el.readyState, duration: Math.round(el.duration || 0) }
      : null;
  });
  if (!audioState) problems.push('拿不到音频元素');
  else {
    if (audioState.paused) problems.push('音频处于暂停状态');
    if (audioState.duration && Math.abs(audioState.duration - 308) > 3) {
      problems.push(`音乐时长不对: ${audioState.duration}s`);
    }
    if (audioState.duration && audioState.time <= 0) problems.push('音乐播到了 0 秒');
  }
  await page.screenshot({ path: join(OUT, `${viewport.name}-2-opened.png`) });

  // 2.5 天气：开头在下雨，结尾放晴
  const skyStart = await page.evaluate(() => ({
    sun: getComputedStyle(document.documentElement).getPropertyValue('--sun').trim(),
    rainOpacity: getComputedStyle(document.querySelector('.rain')).opacity,
    hasSky: Boolean(document.querySelector('.sky')),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));
  if (!skyStart.hasSky) problems.push('没有天色/下雨那层');
  if (Number(skyStart.sun) > 0.02) problems.push(`开头不该放晴 (--sun=${skyStart.sun})`);
  if (Number(skyStart.rainOpacity) < 0.5) problems.push(`开头雨太小 (opacity=${skyStart.rainOpacity})`);

  // 3. 滚到底，边走边记录
  const scrollReport = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const bad = [];
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += Math.max(200, max / 24)) {
      window.scrollTo(0, y);
      await sleep(60);
      if (document.documentElement.scrollWidth > window.innerWidth + 1) {
        bad.push(`scrollY=${Math.round(y)} 横向溢出`);
      }
      const wide = Array.from(document.querySelectorAll('.node, .node__img, .chapter__head'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > window.innerWidth + 1 || r.right > window.innerWidth + 2 || r.left < -2;
        })
        .map((el) => `${el.className}: ${Math.round(el.getBoundingClientRect().left)}→${Math.round(el.getBoundingClientRect().right)}`);
      wide.forEach((w) => bad.push(w));
    }
    window.scrollTo(0, max);
    await sleep(1000);
    const revealed = Array.from(document.querySelectorAll('.reveal')).filter((el) =>
      el.classList.contains('is-in'),
    ).length;
    const missing = Array.from(document.querySelectorAll('.reveal'))
      .filter((el) => !el.classList.contains('is-in'))
      .map((el) => `${el.tagName.toLowerCase()}#${el.id || '(无 id)'}`);
    const images = Array.from(document.querySelectorAll('.node__img'));
    return {
      overflow: Array.from(new Set(bad)).slice(0, 8),
      revealTotal: document.querySelectorAll('.reveal').length,
      revealed,
      missing,
      images: images.map((img) => ({
        src: img.currentSrc.split('/').pop(),
        ok: img.complete && img.naturalWidth > 0,
        shownW: Math.round(img.getBoundingClientRect().width),
        shownH: Math.round(img.getBoundingClientRect().height),
        natural: `${img.naturalWidth}×${img.naturalHeight}`,
      })),
      timelineDisplay: getComputedStyle(document.querySelector('.timeline')).display,
      topbarVisible: document.querySelector('.topbar')?.classList.contains('is-visible'),
      topbarDisplay: getComputedStyle(document.querySelector('.topbar')).display,
      timelineFill: document.querySelector('#timeline-fill')?.style.height,
      topFill: document.querySelector('#top-fill')?.style.width,
      pageHeight: document.documentElement.scrollHeight,
      sun: getComputedStyle(document.documentElement).getPropertyValue('--sun').trim(),
      rainOpacity: getComputedStyle(document.querySelector('.rain')).opacity,
    };
  });

  if (Number(scrollReport.sun) < 0.9) {
    problems.push(`滚到底没有放晴 (--sun=${scrollReport.sun})`);
  }
  if (Number(scrollReport.rainOpacity) > 0.15) {
    problems.push(`结尾雨没停 (opacity=${scrollReport.rainOpacity})`);
  }
  scrollReport.audio = audioState;
  scrollReport.skyStart = skyStart;

  const brokenImages = scrollReport.images.filter((img) => !img.ok);
  brokenImages.forEach((img) => problems.push(`图片没加载: ${img.src}`));
  if (scrollReport.revealed !== scrollReport.revealTotal) {
    problems.push(
      `进场动画未触发 ${scrollReport.revealed}/${scrollReport.revealTotal}: ${scrollReport.missing.join(', ')}`,
    );
  }
  if (scrollReport.overflow.length) {
    problems.push(`滚动中横向溢出: ${scrollReport.overflow.join(' | ')}`);
  }
  const wantTimeline = viewport.width >= 1180 ? 'block' : 'none';
  if (scrollReport.timelineDisplay !== wantTimeline) {
    problems.push(`时间线 display=${scrollReport.timelineDisplay}，期望 ${wantTimeline}`);
  }
  if (viewport.width < 1180 && scrollReport.topbarDisplay !== 'block') {
    problems.push(`手机顶部进度条没显示 (display=${scrollReport.topbarDisplay})`);
  }
  await page.screenshot({ path: join(OUT, `${viewport.name}-3-ending.png`) });

  // 5. 点击看大图
  await page.evaluate(() => {
    document.querySelector('.node__img')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  await page.click('.node__img');
  await page.waitForTimeout(400);
  const lightboxOpen = await page.evaluate(() => {
    const box = document.querySelector('#lightbox');
    const img = document.querySelector('#lightbox-image');
    return {
      visible: box && !box.hidden && getComputedStyle(box).opacity !== '0',
      natural: img ? `${img.naturalWidth}×${img.naturalHeight}` : '',
      shownW: img ? Math.round(img.getBoundingClientRect().width) : 0,
    };
  });
  if (!lightboxOpen.visible) problems.push('点击图片没有打开大图');
  if (!lightboxOpen.natural || lightboxOpen.natural.startsWith('0')) {
    problems.push('大图没有加载');
  }
  await page.screenshot({ path: join(OUT, `${viewport.name}-4-lightbox.png`) });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const lightboxClosed = await page.evaluate(() => document.querySelector('#lightbox')?.hidden);
  if (!lightboxClosed) problems.push('Esc 没有关闭大图');

  // 6. 每个人的独立链接（/yales/）也要能打开
  await page.goto(`${URL_BASE}/yales/`, { waitUntil: 'load' });
  await page.waitForSelector('.cover__title');
  const direct = await page.evaluate(() => ({
    title: document.querySelector('.cover__title')?.textContent?.trim(),
    docTitle: document.title,
    cssLoaded: getComputedStyle(document.body).backgroundColor,
  }));
  if (!direct.title) problems.push('/yales/ 独立链接没有渲染出名字');
  if (direct.cssLoaded !== 'rgb(10, 21, 38)') {
    problems.push(`/yales/ 样式没加载 (body bg=${direct.cssLoaded})`);
  }

  // 7. 根路径（没带 slug）应该只显示中转页，不能把谁的内容露出去
  await page.goto(`${URL_BASE}/`, { waitUntil: 'load' });
  await page.waitForSelector('.cover__title');
  const landing = await page.evaluate(() => ({
    title: document.querySelector('.cover__title')?.textContent?.trim(),
    hasTimeline: Boolean(document.querySelector('.timeline__chapter')),
  }));
  if (landing.hasTimeline) problems.push('根路径直接显示了某个人的内容');
  if (!landing.title?.includes('专属链接')) {
    problems.push(`根路径中转页不对: ${landing.title}`);
  }

  report.push({
    viewport: viewport.name,
    size: `${viewport.width}×${viewport.height}`,
    direct,
    landing,
    ...scrollReport,
    problems,
  });
  await context.close();
}

await browser.close();

for (const entry of report) {
  console.log(`\n=== ${entry.viewport}  ${entry.size} ===`);
  console.log(`页面总高 ${entry.pageHeight}px   图片 ${entry.images.length} 张`);
  console.log(`图片显示尺寸 ${entry.images.map((i) => `${i.src} ${i.shownW}×${i.shownH}(${i.natural})`).join('  ')}`);
  console.log(`时间线 ${entry.timelineDisplay} / 顶部条 ${entry.topbarDisplay} / 进场 ${entry.revealed}/${entry.revealTotal}`);
  console.log(`进度 时间线=${entry.timelineFill || '—'} 顶条=${entry.topFill || '—'}`);
  console.log(`独立链接 /yales/ → ${entry.direct?.title} / document.title=${entry.direct?.docTitle}`);
  console.log(`根路径中转页 → ${entry.landing?.title}`);
  console.log(
    `音乐 ${entry.audio?.duration}s 播到 ${entry.audio?.time}s  readyState=${entry.audio?.readyState}`,
  );
  console.log(
    `天色 开头 --sun=${entry.skyStart?.sun} 雨=${entry.skyStart?.rainOpacity} → 结尾 --sun=${entry.sun} 雨=${entry.rainOpacity}`,
  );
  console.log(entry.problems.length ? `问题:\n  - ${entry.problems.join('\n  - ')}` : '✅ 没有发现问题');
}

const failed = report.filter((r) => r.problems.length);
console.log(`\n截图在 ${OUT}`);
if (failed.length) process.exitCode = 1;
