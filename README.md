# memory-album

一份写给朋友的回忆录：打开是她的名字，点开之后音乐进来，然后**一屏一幕自己往下播**，走过你们经历过的事，最后是祝福和鼓励。

**一个链接只能看到一个人的内容。** 目前有 `yales`（测试数据）和 `wuling`（深夜场主题）。

视觉参考了《天气之子》：雨夜的深蓝打底，一路下雨，走到结尾那一段雨会停下来、天色转暖——放晴。对应的是 RADWIMPS 的『グランドエスケープ』。

## 叙事过程

**默认是单屏自动播的幻灯片**（像 PPT 那样一幕一幕淡入淡出），不是往下滚。一屏一幕，自己往下推，一共 36 幕、4 分钟左右，刚好和歌一样长。

1. **遮罩开场** —— 她的名字 + 「温馨提醒：戴上耳机听会更好」+「开始」
2. **章节页** —— 章节序号、时间、章节名
3. **图片页** —— 一张（或并排两张）截图，下面一行日期和地点
4. **文字页** —— 每个节点单独一屏，一到两句短句，一行一行浮出来
5. **停顿页** —— 一整屏只放一句话，**一个字一个字浮出来**
6. **聊天分镜** —— 一个聊天气泡，话一个字一个字打出来，最后冒出「发送」
7. **歌单** —— 一起听过的歌
8. **放晴** —— 走到后四分之一，雨慢慢停、天色慢慢暖
9. **再看一遍** —— 结尾按钮把整段倒回开头，音乐也从头放

**不用赶时间**：底部控制条能暂停 / 上一幕 / 下一幕；键盘左右方向键翻页、空格暂停；手机上左右划也能翻。点开大图会自动暂停，关掉再继续。

### 两套走法

| `presentation` | 效果 |
| --- | --- |
| 不写（默认） | `slides` 单屏自动播，一屏一幕淡入淡出 |
| `'scroll'` | 往下滚：时间线在侧边（手机在顶部），每一幕跟着滚动位置斜着进出，图片先落、文字跟上 |

写文案时不用管是哪套，同一份数据两边都能跑。本机想对比，链接后面加 `?mode=scroll` 就行。

文字里用 `**` 包起来的部分会放大变金，就是生日模板里那个突然放大的 "SO" 的位置：

```js
lines: ['后面还有很长一段路。', '这一段，**我陪你**走。'],
```

## 先在本机看

```bash
node scripts/dev.mjs          # http://127.0.0.1:5173/?u=yales
```

三种链接形式都支持，测试用：

- `http://127.0.0.1:5173/?u=yales`
- `http://127.0.0.1:5173/#/yales`
- `http://127.0.0.1:5173/yales/` ← 正式分享用的形式

首页 `http://127.0.0.1:5173/` 是中转页，不会显示任何人的内容（只有本机调试时才会列出名单）。

## 换成你自己的话

所有内容都在 `src/data/yales.js`，改字符串就行，不用碰别的代码：

| 字段 | 作用 |
| --- | --- |
| `cover.title` / `cover.subtitle` | 首屏的名字和那行小字 |
| `bgm.src` | 背景音乐，放空字符串就静音（音乐按钮会自动隐藏） |
| `bgm.volume` | 音乐音量，0–1，默认 0.6（这里用的 0.45，当背景乐刚好） |
| `chapters[].label` / `.date` / `.intro` | 章节名、章节日期、章节过渡句 |
| `chapters[].nodes[]` | 每个节点：`date` 日期、`place` 地点、`title` 标题、`text` 正文、`quote` 当时没说的话（可选）、`images` 图 |
| `chapters[].kind` | 不写=普通章节；`interlude` 停顿页；`chat` 聊天气泡分镜；`songs` 歌单 |
| `ending` | 结尾的祝福、鼓励、落款 |

节点按你写的顺序从上往下出现，所以**排序由你控制**，照片文件名是什么无所谓。

### 换照片

```bash
node scripts/optimize-photos.mjs yales ~/Downloads/yales
```

会把原图压成 `photos/yales/p01.webp`…（1.5MB / 19 张，原图 8.6MB），并更新：

- `photos-manifest.json` —— 对照表，看 `original` 字段就知道 `p07` 原本是哪张图
- `src/data/photo-sizes.js` —— 尺寸表，自动生成的，别手改

照片按文件名排序编号。想调整顺序，改 `images` 里的文件名排列即可。

### 换音乐

现在的 `audio/grand-escape.mp3` 是从 `~/Downloads/…グランドエスケープ…m4a` 里剪的：从人声进唱处（原曲 26 秒）开始，取 308 秒，首尾各做了淡入淡出，128k、4.9MB。原始文件里前 26 秒是电影对白和环境音，做背景乐不合适；第 335 秒之后是空白，也一并剪掉了。

> 这首歌是商业发行曲。做成私人礼物发给朋友没什么问题，但**别把这个链接公开传播**——页面是公开可访问的，公开挂着会有版权风险。

### 生成分享预览图

```bash
node scripts/make-og.mjs      # → og/yales.jpg（1200×630）
```

微信里发链接时显示的那张卡片。换完文案要重跑一次。

## 加一个新的人

1. `cp src/data/template.js src/data/lin.js`，改里面的 `slug` 和内容
2. `src/data/index.js` 加一行：`lin: () => import('./lin.js'),`
3. `node scripts/optimize-photos.mjs lin ~/图片目录`
4. `node scripts/make-og.mjs && node scripts/build.mjs`

链接就是 `https://你的域名/lin/`，和别人的完全独立。

## 部署到 GitHub Pages

### 方案 A：独立仓库（推荐）

已经带了 `.github/workflows/deploy.yml`，推到 `main` 就自动发布。

```bash
cd /home/emo/code/memory-album
git init && git add -A && git commit -m "回忆录"
gh repo create memory-album --public --source=. --push
```

然后在仓库 **Settings → Pages → Source** 选 **GitHub Actions**，等一次 workflow 跑完，地址就是：

```
https://emoeem.github.io/memory-album/yales/
```

### 方案 B：塞进现有的 emoeem.github.io

放进子目录，不会碰到博客的 `index.html`：

```bash
node scripts/build.mjs
mkdir -p ../emoeem.github.io/memory-album
cp -a dist/. ../emoeem.github.io/memory-album/
cd ../emoeem.github.io && git add memory-album && git commit -m "加上回忆录" && git push
```

地址一样：`https://emoeem.github.io/memory-album/yales/`

> 注意别用 `cp -a dist/*` 直接铺到博客根目录，那会覆盖博客首页。一定要落到 `memory-album/` 这个子目录里。

### 填上域名

改 `site.config.json` 的 `siteUrl`（比如 `https://emoeem.github.io/memory-album`），再重跑 `make-links.mjs`，分享卡片的图片地址才会是绝对路径，微信里才稳定显示。打包时用 `PUBLISH_DIR`：

```bash
node scripts/make-links.mjs   # 本地直接生成同名目录
```

## 复查

```bash
node scripts/dev.mjs &                                    # 起服务
node scripts/check-layout.mjs                             # 本机
URL_BASE=http://127.0.0.1:5174/memory-album \
  node scripts/check-layout.mjs                           # 试子路径部署
```

会在手机 390 / 小屏 320 / 平板 834 / 桌面 1440 四种尺寸下跑一遍，检查：横向不溢出、进场动画正常触发、图片全部加载、时间线在桌面出现而在手机换成顶部进度条、点击看大图和 Esc 关闭、`/slug/` 独立链接可打开、根路径不泄露内容。截图存在 `.checks/`。

## 一些已经处理好的坑

> 叙事节奏参考了 `abandon888/HappyBirthday`（MIT，本身基于 `faahim/happy-birthday`）那一类分镜式祝福页的做法；这里只是借鉴了思路，代码是自己写的，那个项目适合真生日贺卡，放不下这 19 张照片。

- **音乐不会自动响。** 浏览器禁止自动播放，所以首屏是一个「打开」按钮，点了才播放并淡入。这也是 iOS 上唯一可靠的做法。
- **滚动是原生的**，动画靠 IntersectionObserver，没有劫持滚轮。
- **截图能点开放大。** 竖屏聊天截图在页面上会被压小，点一下进全屏看，Esc 关掉。
- **不裁图。** 竖图按原始比例显示，只限宽度（1080），聊天记录的文字不会糊。
- **页面不跳动。** 图片带 `width`/`height`，加载前就占好位置。
- **不收录。** 每个人的页面都带 `noindex,nofollow`，站点有 `robots.txt`，不会被搜索引擎搜到。但链接本身是可以被猜到的，别发到公开的地方。
- **BGM 版权**：`audio/placeholder-ambient.mp3` 只是测试用的合成音，正式用请换成你有权使用的音乐。
- **音乐不会白下载。** 进页面时不会预先下载那 4.9MB，点了「打开」才开始缓冲；同时会在首次点击/触摸时就先开始预载，所以正常网速下点开就有声。
- **结尾会放晴。** 越接近结尾，雨和夜色越淡、暖光越亮，那段是跟着滚动实时算的，不是视频。
