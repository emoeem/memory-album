/**
 * 零依赖静态服务器。
 *   node scripts/dev.mjs                    → http://127.0.0.1:5173/?u=yales
 *   node scripts/dev.mjs 4000               → 换端口
 *   node scripts/dev.mjs 4000 ./dist        → 指定要服务的目录（用来试打包结果）
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(
  process.argv[3] ? process.argv[3] : fileURLToPath(new URL('../', import.meta.url)),
);
const PORT = Number(process.argv[2] || process.env.PORT || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';

    let filePath = resolve(join(ROOT, normalize(pathname)));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }

    let info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) {
      filePath = join(filePath, 'index.html');
      info = await stat(filePath).catch(() => null);
    }
    if (!info) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(String(error));
  }
});

const HOST = process.env.HOST || '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`memory-album → http://${HOST}:${PORT}/?u=yales`);
});
