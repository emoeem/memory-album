/**
 * 模板 —— 复制这个文件来创建一个新的回忆录。
 *
 * 只有 slug 需要改，其余字段都可以不要，页面会自动把空的部分隐藏。
 * 图片路径写法：'photos/<slug>/p01.webp'
 *
 * 章节 kind：
 *   （不写）   普通章节，里面放 nodes
 *   interlude  停顿页，一整屏只放一两句话，逐字浮现，不需要图片
 *   chat       聊天气泡分镜，滚到时话会一个字一个字打出来，最后冒出"发送"
 *   songs      一起听过的歌，放 items: [{ name, artist, note }]
 *
 * 文字里用 ** 包起来的部分会变成大字强调，比如："这一段，**我陪你**走。"
 */
export default {
  slug: 'template',

  name: '她的名字',
  cover: {
    kicker: '这是给你的',
    title: '她的名字',
    subtitle: '有一些东西，想按顺序讲给你听',
    openLabel: '打开',
    hint: '戴上耳机更好',
  },

  // 多首歌会按顺序播，接缝处交叉淡入淡出。放空就静音，音乐按钮会自动隐藏。
  bgm: {
    tracks: [
      { src: 'audio/placeholder-ambient.mp3', title: '第一首' },
      // { src: 'audio/第二首.mp3', title: '第二首' },
    ],
    volume: 0.5,
    crossfade: 6,
    loop: true,
  },

  chapters: [
    {
      id: 'ch1',
      label: '开始',
      date: '2026 春',
      intro: '一句话过渡，可以不要。',
      nodes: [
        {
          id: 'n01',
          date: '那天', // 相对说法比硬凑日期更自然
          place: '线上', // 可以不要
          // title: '小标题（可选）',
          lines: ['一句短句。', '再来一句就够，别写多。'],
          // quote: '想单独拎出来的那句（可选）',
          images: ['photos/template/p01.webp'],
        },
      ],
    },

    // 停顿页：一整屏只放一两句话，不需要图，用来给整篇留呼吸
    {
      kind: 'interlude',
      id: 'i1',
      lines: ['一句话占满一整屏。', '重点可以这样**放大**。'],
    },

    // 聊天气泡分镜
    {
      kind: 'chat',
      id: 'c1',
      bubbles: [
        { side: 'you', text: '在吗' },
        { side: 'me', text: '在' },
      ],
      sendLabel: '发送',
    },

    // 歌单：一起听过的歌
    {
      kind: 'songs',
      id: 'songs',
      label: '一起听过的歌',
      date: '2026 夏',
      intro: '可以不要。',
      items: [{ name: '歌名', artist: '歌手', note: '为什么记得这首' }],
    },
  ],

  ending: {
    title: '给你的话',
    paragraphs: ['第一段。', '第二段。'],
    sign: '你的朋友',
    date: '2026 中秋',
  },
};
