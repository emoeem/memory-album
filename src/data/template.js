/**
 * 模板 —— 复制这个文件来创建一个新的回忆录。
 *
 * 只有 slug 需要改，其余字段可以留空或删掉，页面会自动隐藏空的部分。
 * images 的路径写法：'photos/<slug>/p01.webp'
 */
export default {
  slug: 'template',

  // 首屏
  name: '她的名字',
  cover: {
    kicker: '这是给你的',
    title: '她的名字',
    subtitle: '有一些东西，想按顺序讲给你听',
    openLabel: '打开',
    hint: '戴上耳机更好',
  },

  // 背景音乐。放空字符串就静音，页面会自动把音乐按钮藏起来。
  bgm: {
    src: 'audio/placeholder-ambient.mp3',
    title: '音乐',
    volume: 0.5,
  },

  // 章节 -> 节点。节点按你写的顺序从上到下出现。
  chapters: [
    {
      id: 'ch1',
      label: '开始',
      date: '2024 秋',
      intro: '一句话过渡，可以没有。',
      nodes: [
        {
          id: 'n1',
          date: '2024.09.12',
          place: '线上',
          title: '节点标题',
          text: '两三句话，讲一个只有你们俩知道的细节。',
          quote: '当时没说出口的话（可选）',
          images: ['photos/template/p01.webp'],
        },
      ],
    },
  ],

  // 结尾
  ending: {
    title: '给你的话',
    paragraphs: ['第一段。', '第二段。'],
    sign: '你的朋友',
    date: '2026 中秋',
  },
};
