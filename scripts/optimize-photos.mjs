/**
 * 把原图压缩成网页用的 webp，并生成 photos-manifest.json 方便对照。
 *
 *   node scripts/optimize-photos.mjs yales ~/Downloads/yales
 *   node scripts/optimize-photos.mjs yales ~/Downloads/yales --width 1080 --quality 78
 *
 * --width 只限制宽度上限，竖图不会被裁短（聊天截图要保证文字清楚）。
 *
 * 默认按文件名排序（时间戳在文件名里，所以顺序≈拍摄/截图顺序）。
 */
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const IMAGE_RE = /\.(jpe?g|png|webp|avif|bmp|tiff?)$/i;

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? fallback : argv[index + 1];
};

const slug = positional[0];
const source = positional[1]?.replace(/^~/, homedir());
const width = Number(opt('width', 1080));
const quality = Number(opt('quality', 78));

if (!slug || !source) {
  console.error('用法: node scripts/optimize-photos.mjs <slug> <原始图片目录> [--width 1080] [--quality 78]');
  process.exit(1);
}

const sourceDir = resolve(source);
const outDir = join(ROOT, 'photos', slug);
const manifestPath = join(ROOT, 'photos-manifest.json');
const sizesPath = join(ROOT, 'src', 'data', 'photo-sizes.js');

await mkdir(outDir, { recursive: true });

const files = (await readdir(sourceDir))
  .filter((name) => IMAGE_RE.test(name))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

if (!files.length) {
  console.error(`没找到图片: ${sourceDir}`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
const entries = [];
let originalBytes = 0;

for (const [index, name] of files.entries()) {
  const id = `p${String(index + 1).padStart(2, '0')}`;
  const target = join(outDir, `${id}.webp`);
  const from = join(sourceDir, name);
  const { stdout: before } = await run('magick', ['identify', '-format', '%b', from]);
  await run('magick', [
    from,
    '-auto-orient',
    '-resize',
    width === 0 ? '100%x100%' : `${width}x`,
    '-strip',
    '-quality',
    String(quality),
    '-define',
    'webp:method=6',
    target,
  ]);
  const { stdout: info } = await run('magick', ['identify', '-format', '%w %h %b', target]);
  const [w, h, size] = info.split(' ');
  originalBytes += Number(String(before).replace(/[^0-9]/g, '')) || 0;
  entries.push({ id, file: `${id}.webp`, original: name, width: w, height: h, size });
  console.log(`${id}.webp  ←  ${name}  (${w}×${h}, ${size})`);
}

manifest[slug] = {
  source: sourceDir,
  generatedAt: new Date().toISOString(),
  width,
  quality,
  photos: entries,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

// 图片尺寸表：渲染时写进 width/height，避免加载过程中页面跳动
const sizeLines = [];
for (const [key, value] of Object.entries(manifest)) {
  for (const photo of value.photos || []) {
    sizeLines.push(
      `  'photos/${key}/${photo.id}.webp': [${photo.width}, ${photo.height}],`,
    );
  }
}
await writeFile(
  sizesPath,
  `// 由 scripts/optimize-photos.mjs 生成，不要手改。\n` +
    `// 用途：给 <img> 补上 width/height，图片没加载出来之前就先占好位置，页面不会跳。\n` +
    `export const photoSizes = {\n${sizeLines.join('\n')}\n};\n`,
  'utf8',
);

const total = (await run('du', ['-sh', outDir])).stdout.split('\t')[0];
console.log(`\n共 ${entries.length} 张 → photos/${slug}/  合计 ${total}`);
console.log('对照表写在 photos-manifest.json，original 字段是原文件名。');
console.log('尺寸表写在 src/data/photo-sizes.js（自动生成）。');
