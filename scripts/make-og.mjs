/**
 * 给每个人生成一张分享预览卡片（微信/QQ 发链接时显示的那张图）。
 *
 *   node scripts/make-og.mjs
 *
 * 输出 og/<slug>.jpg（1200×630），用的是本地霞鹜文楷字体。
 */
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const OUT = join(ROOT, 'og');

const FONT_SERIF = process.env.OG_FONT_SERIF || '/usr/share/fonts/TTF/LXGWWenKaiScreen.ttf';
const FONT_SANS = process.env.OG_FONT_SANS || '/usr/share/fonts/TTF/LXGWWenKaiMonoGBScreen.ttf';

const { albums } = await import(new URL('../src/data/index.js', import.meta.url).href);
await mkdir(OUT, { recursive: true });

for (const [slug, load] of Object.entries(albums)) {
  const data = (await load()).default;
  const name = data.cover?.title || data.name || slug;
  const subtitle = data.cover?.subtitle || '一份给你的回忆';
  const target = join(OUT, `${slug}.jpg`);

  try {
    await run('magick', [
      '-size', '1200x630', 'xc:#100e13',
      '(', '-size', '1200x630', 'radial-gradient:#7cc7f238-#0a152600', '-blur', '0x30', ')',
      '-compose', 'screen', '-composite',
      '(', '-size', '1200x630', 'radial-gradient:#f4b9422e-#0a152600', '-blur', '0x50', ')',
      '-compose', 'screen', '-composite',
      '-stroke', '#f4b94266', '-strokewidth', '1.5', '-fill', 'none',
      '-draw', 'circle 600,238 600,196',
      '-font', FONT_SERIF, '-stroke', 'none', '-fill', '#ede8e0',
      '-pointsize', '104', '-gravity', 'center', '-annotate', '+0-18', name,
      '-font', FONT_SANS, '-fill', '#9a938a',
      '-pointsize', '28', '-annotate', '+0+92', subtitle,
      '-strip', '-quality', '86', target,
    ]);
    console.log(`og/${slug}.jpg  ←  ${name}`);
  } catch (error) {
    console.warn(`og/${slug}.jpg 生成失败（跳过）：${String(error.message).split('\n')[0]}`);
  }
}

try {
  await run('magick', [
    join(ROOT, 'favicon.svg'),
    '-resize', '180x180',
    join(ROOT, 'favicon-180.png'),
  ]);
  console.log('favicon-180.png');
} catch {
  /* 可选产物，失败不影响发布 */
}
