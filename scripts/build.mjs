// 打包出可以直接发布的 dist/
//
//   node scripts/build.mjs
//
// dist/ 里只有跑页面需要的东西（不含 scripts、node_modules、原图对照表）。
// 发布方式见 README：推 gh-pages、或者拷进 emoeem.github.io 仓库都行。
import { execFile } from 'node:child_process';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const DIST = join(ROOT, 'dist');

const ENTRIES = [
  'index.html',
  'styles.css',
  'favicon.svg',
  'favicon.ico',
  'favicon-180.png',
  'robots.txt',
  '.nojekyll',
  'src',
  // 浏览器用的第三方库（tsParticles / Motion），是自己打包好放进来的，
  // 不是 node_modules —— 详见 scripts/vendor/
  'vendor',
  'photos',
  'audio',
  'og',
];

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const copied = [];
for (const entry of ENTRIES) {
  const from = join(ROOT, entry);
  if (!(await stat(from).catch(() => null))) continue;
  await cp(from, join(DIST, entry), { recursive: true });
  copied.push(entry);
}

// 每个人的独立入口页直接生成到 dist 里
await run('node', [join(ROOT, 'scripts', 'make-links.mjs')], {
  env: { ...process.env, PUBLISH_DIR: DIST },
});

const { stdout } = await run('du', ['-sh', DIST]);
console.log(`\ndist/ 就绪：${stdout.split('\t')[0]}`);
console.log(`包含：${copied.join('  ')}  +  每个人的链接目录`);
console.log('把 dist/ 的内容发布出去就行。');
