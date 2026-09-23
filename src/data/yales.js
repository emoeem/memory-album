/**
 * Yales 的回忆录。
 *
 * ⚠️ 下面所有文案都是示例 —— 用来让你先看清版式和节奏，换成你们真实的事就行。
 *    写法建议：一两句短句，越具体越好；不要写成作文，也别写"感谢陪伴"这种谁都能说的话。
 *
 * 节点字段：
 *   date   时间线标签（写成"那天晚上""六月"这种相对说法反而更自然，别硬凑日期）
 *   place  地点，可以不要
 *   title  小标题，可以不要
 *   lines  正文，一到三句短句。也可以只写一句
 *   quote  单独拎出来的那句（可选，会做成引文样式）
 *   images 图片，可多张
 *
 * 章节 kind：
 *   （不写）   普通章节，里面放 nodes
 *   interlude  停顿页，一整屏只放 lines 里的一两句话，不需要图片
 *   songs      一起听过的歌，放 items: [{ name, artist, note }]
 */
export default {
  slug: 'yales',

  // 'slides'（默认）单屏自动播，一屏一幕；'scroll' 往下滚。
  // 本机想对比：链接后面加 ?mode=scroll
  presentation: 'slides',

  // 每一幕停多久（毫秒）。想让她多看一会儿截图就把 image 调大。
  timing: {
    chapter: 3800,
    image: 8000,
    text: 5600,
    interlude: 4800,
    chat: 8000,
    songs: 11000,
    ending: 16000,
  },

  name: 'Yales',
  cover: {
    kicker: '这是给你的',
    title: 'Yales',
    subtitle: '有一些东西，想按顺序讲给你听',
    openLabel: '开始',
    hint: '温馨提醒：戴上耳机听会更好',
  },

  // 想按章节换歌，就往 tracks 里继续加。播放时自动交叉淡入淡出，听不出接缝。
  bgm: {
    tracks: [{ src: 'audio/grand-escape.mp3', title: 'グランドエスケープ' }],
    volume: 0.45,
    crossfade: 6,
    loop: true,
  },

  chapters: [
    {
      id: 'begin',
      label: '开始',
      date: '2026 春',
      intro: '一开始谁也没想到会走这么远。',
      nodes: [
        {
          id: 'n01',
          date: '最初',
          place: '线上',
          lines: ['那时候只是随便聊聊。', '没想到后来会变得这么重要。'],
          images: ['photos/yales/p01.webp'],
        },
        {
          id: 'n02',
          date: '后来',
          lines: ['聊到很晚，谁也不肯先说晚安。'],
          images: ['photos/yales/p02.webp', 'photos/yales/p03.webp'],
        },
      ],
    },

    {
      kind: 'chat',
      id: 'c1',
      label: '一句',
      date: '',
      bubbles: [
        { side: 'you', text: '在吗' },
        { side: 'me', text: '在' },
        { side: 'you', text: '没什么事，就是想确认一下你还在' },
      ],
      sendLabel: '发送',
    },

    {
      kind: 'interlude',
      id: 'i1',
      label: '插句',
      date: '',
      lines: ['后来我才发现，', '跟你说话是我一天里**最松**的时候。'],
    },

    {
      id: 'walking',
      label: '一起走过',
      date: '2026 夏',
      intro: '中间这一段，是我们最常回去看的地方。',
      nodes: [
        {
          id: 'n03',
          date: '那个夏天',
          lines: ['我们开始互相丢歌。', '你说这首听完会想起我。'],
          images: ['photos/yales/p04.webp'],
        },
        {
          id: 'n04',
          date: '后来',
          lines: ['也有过一句话都不说的时候。', '但你知道我在，我知道你在。'],
          images: ['photos/yales/p05.webp', 'photos/yales/p06.webp'],
        },
      ],
    },

    {
      kind: 'songs',
      id: 'songs',
      label: '一起听过的歌',
      date: '2026 春夏',
      intro: '有些歌现在一响，我就知道是你发来的。',
      items: [
        {
          name: 'グランドエスケープ',
          artist: 'RADWIMPS',
          note: '你说这是你最喜欢那部电影里最喜欢的一首。所以这份东西也用这首。',
        },
        {
          name: '无尽幸福',
          artist: '',
          note: '"像百花撞了春风" —— 那天你转过来的时候，我循环了一整个下午。',
        },
      ],
    },

    {
      id: 'chat',
      label: '聊天记录',
      date: '2026 夏',
      intro: '这些截图我一直留着。',
      nodes: [
        {
          id: 'n05',
          date: '那天',
          place: '聊天记录',
          lines: ['你截了好多图给我看。', '现在翻回去，还是会笑。'],
          images: ['photos/yales/p07.webp', 'photos/yales/p08.webp'],
        },
        {
          id: 'n06',
          date: '那天晚上',
          place: '聊天记录',
          lines: ['你说「我能有什么好看的」。'],
          quote: '你就很好看啊。',
          images: ['photos/yales/p09.webp', 'photos/yales/p10.webp'],
        },
        {
          id: 'n07',
          date: '六月',
          place: '聊天记录',
          lines: ['有时候一句「在吗」就够了。'],
          images: ['photos/yales/p11.webp', 'photos/yales/p12.webp'],
        },
        {
          id: 'n08',
          date: '某天',
          place: '聊天记录',
          lines: ['有些对话我现在还舍不得删。'],
          images: ['photos/yales/p13.webp'],
        },
      ],
    },

    {
      kind: 'interlude',
      id: 'i2',
      label: '插句',
      date: '',
      lines: ['有些话我到现在也没跟你说过。'],
    },

    {
      id: 'hard',
      label: '难的时候',
      date: '2026 秋',
      intro: '也有不太好过的一段。',
      nodes: [
        {
          id: 'n09',
          date: '那阵子',
          lines: ['有一段时间很难。', '我没有跟谁说，但你知道。'],
          images: ['photos/yales/p14.webp'],
        },
        {
          id: 'n10',
          date: '每天',
          lines: ['你没问为什么，只是照常跟我说晚安。'],
          quote: '那段时间谢谢你没走。',
          images: ['photos/yales/p15.webp'],
        },
      ],
    },

    {
      kind: 'interlude',
      id: 'i3',
      label: '插句',
      date: '',
      lines: ['然后就**慢慢**好起来了。'],
    },

    {
      id: 'now',
      label: '现在的我们',
      date: '现在',
      intro: '走到这里了。',
      nodes: [
        {
          id: 'n11',
          date: '现在',
          lines: ['现在的我们，比那时候松弛多了。'],
          images: ['photos/yales/p16.webp', 'photos/yales/p17.webp'],
        },
        {
          id: 'n12',
          date: '往后',
          lines: ['后面还有很长一段路。', '这一段，**我陪你**走。'],
          images: ['photos/yales/p18.webp', 'photos/yales/p19.webp'],
        },
      ],
    },
  ],

  ending: {
    title: '给你的话',
    paragraphs: [
      '谢谢你陪我走过这一段。',
      '你喜欢《天气之子》，喜欢雨停下来那一下。我想跟你说的是——难的那阵子你都熬过来了，后面的晴天是你自己等来的。',
      '接下来的路不用急，慢慢来也没关系。**我会一直在。**',
    ],
    sign: '你的朋友',
    date: '2026 中秋',
  },
};
