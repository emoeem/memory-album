/*
 * tsParticles 的浏览器打包入口。
 *
 * dist/ 里只有 src / styles.css 这些静态文件，没有 node_modules，
 * 浏览器解析不了 `@tsparticles/engine` 这种裸模块名，所以这里先打成一个
 * 自带的 ESM 文件，src/weather.js 再按相对路径引它。
 *
 * 重新生成（改了依赖版本、或者想换瘦身包的时候）：
 *
 *   npx esbuild scripts/vendor/entry-tsparticles.js \
 *     --bundle --format=esm --minify --target=es2020 \
 *     --legal-comments=none --outfile=vendor/tsparticles.js
 */
import { tsParticles } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

export { tsParticles, loadSlim };
