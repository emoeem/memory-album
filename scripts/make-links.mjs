/**
 * 给每个人生成一个干净的链接目录：/yales/index.html
 * 部署后直接访问 https://你的域名/yales/ 就能打开这一份。
 *
 *   node scripts/make-links.mjs
 *
 * 顺便把她的标题、分享预览图写进 HTML —— 微信里发出去才有像样的预览卡片。
 * 内容仍然由 src/data/<slug>.js 决定，加了新的人之后重跑一次即可。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const PUBLISH_DIR = process.env.PUBLISH_DIR ? resolve(process.env.PUBLISH_DIR) : ROOT;

const config = JSON.parse(await readFile(join(ROOT, 'site.config.json'), 'utf8').catch(() => '{}'));
const siteUrl = (config.siteUrl || '').replace(/\/+$/, '');
const { albums } = await import(new URL('../src/data/index.js', import.meta.url).href);

const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

/** 没配 siteUrl 就用相对路径；配了就输出绝对地址，分享预览更稳 */
const absolute = (path) =>
  siteUrl ? `${siteUrl}${path.startsWith('/') ? path : `/${path}`}` : path;

function shell(slug, data) {
  const name = data.cover?.title || data.name || slug;
  const title = `给 ${name}`;
  const desc = data.cover?.subtitle || config.description || '一份给你的回忆';
  const ogImage = absolute(data.cover?.ogImage || `og/${slug}.jpg`);

  return `<!doctype html>
<html lang="zh-CN" data-slug="${esc(slug)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#0a1526" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="robots" content="noindex,nofollow" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    ${siteUrl ? `<meta property="og:url" content="${esc(absolute(`/${slug}/`))}" />` : ''}
    <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="../favicon-180.png" />
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body>
    <div id="app" aria-live="polite"></div>
    <script type="module" src="../src/main.js"></script>
  </body>
</html>
`;
}

const made = [];
for (const [slug, load] of Object.entries(albums)) {
  const data = (await load()).default;
  const dir = join(PUBLISH_DIR, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), shell(slug, data), 'utf8');
  made.push(slug);
}

console.log(`生成了 ${made.length} 个链接：${made.map((s) => `/${s}/`).join('  ')}`);
console.log(
  siteUrl
    ? `配上域名后：${made.map((s) => `${siteUrl}/${s}/`).join('  ')}`
    : '还没填 site.config.json 的 siteUrl，分享预览图会用相对地址（微信里可能不显示图）。',
);
