/**
 * Yales 的回忆录 —— 目前是测试用的占位内容。
 * 带 TODO 的地方等你的真实文案，直接改字符串就行，不用碰其他代码。
 */
export default {
  slug: 'yales',

  name: 'Yales',
  cover: {
    kicker: '这是给你的',
    title: 'Yales',
    subtitle: '有一些东西，想按顺序讲给你听',
    openLabel: '打开',
    hint: '戴上耳机更好',
  },

  bgm: {
    src: 'audio/grand-escape.mp3',
    title: 'グランドエスケープ',
    volume: 0.45,
  },

  chapters: [
    {
      id: 'begin',
      label: '开始',
      date: '2026.09',
      intro: '一开始谁也没想到会走这么远。',
      nodes: [
        {
          id: 'n01',
          date: '2026.09.23',
          place: '线上',
          title: 'TODO 节点标题',
          text: 'TODO 这两三句话由你写。这个位置留着讲你们之间的一个小细节，越具体越好。',
          quote: 'TODO 可选：当时没说出口的那句话。',
          images: ['photos/yales/p01.webp'],
        },
        {
          id: 'n02',
          date: '2026.09.23',
          place: '线上',
          title: 'TODO 节点标题',
          text: 'TODO 正文。',
          images: ['photos/yales/p02.webp', 'photos/yales/p03.webp'],
        },
      ],
    },
    {
      id: 'middle',
      label: '一起走过',
      date: '2026.09',
      intro: '中间这一段，是我们最常回去看的地方。',
      nodes: [
        {
          id: 'n03',
          date: '2026.09.23',
          place: '聊天记录',
          title: 'TODO 节点标题',
          text: 'TODO 正文。聊天记录这类截图适合放在这里，配一句“那天”。',
          images: ['photos/yales/p07.webp'],
        },
        {
          id: 'n04',
          date: '2026.09.23',
          place: '聊天记录',
          title: 'TODO 节点标题',
          text: 'TODO 正文。',
          images: ['photos/yales/p08.webp', 'photos/yales/p09.webp'],
        },
      ],
    },
    {
      id: 'hard',
      label: '难的时候',
      date: '2026.09',
      intro: '也有不太好过的一段。',
      nodes: [
        {
          id: 'n05',
          date: '2026.09.23',
          place: '线上',
          title: 'TODO 节点标题',
          text: 'TODO 这一段留给低谷。哪怕一句也好，整个回忆录的重量会不一样。',
          images: ['photos/yales/p14.webp'],
        },
      ],
    },
    {
      id: 'now',
      label: '现在的我们',
      date: '现在',
      intro: '然后就走到了现在。',
      nodes: [
        {
          id: 'n06',
          date: '现在',
          place: '',
          title: 'TODO 节点标题',
          text: 'TODO 正文。',
          images: ['photos/yales/p18.webp'],
        },
      ],
    },
  ],

  ending: {
    title: '给你的话',
    paragraphs: [
      'TODO 第一段：谢谢你陪我走这一段。',
      'TODO 第二段：接下来这一段，我陪你。',
    ],
    sign: '你的朋友',
    date: '2026 中秋',
  },
};
