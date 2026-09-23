/**
 * 所有人的入口表。
 *
 * 每加一个人：
 *   1. 在 src/data/ 下复制 template.js，改名成她的 slug（比如 lin.js）
 *   2. 在下面加一行   lin: () => import('./lin.js'),
 *   3. 把照片放进 photos/lin/  （跑 pnpm photos -- lin 会自动压缩）
 *   4. 跑 pnpm links 生成 /lin/ 这个链接
 */
export const albums = {
  yales: () => import('./yales.js'),
};
