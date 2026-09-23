/*
 * Motion（motion.dev）的浏览器打包入口，理由同上。
 *
 *   npx esbuild scripts/vendor/entry-motion.js \
 *     --bundle --format=esm --minify --target=es2020 \
 *     --legal-comments=none --outfile=vendor/motion.js
 */
export { animate, createScopedAnimate, inView, scroll, stagger } from 'motion';
