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
    kicker: '给喜欢《天气之子》的你',
    title: 'Yales',
    subtitle: '雨会停，天会晴。还有一些话，想在晴天之前给你。',
    openLabel: '开始',
    hint: '建议戴上耳机 · 让グランドエスケープ陪你看完',
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
      intro: '一开始谁也没想到会走这么远。后来回头看，才发现很多小事已经变成了记忆。',
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
      kind: 'interlude',
      id: 'rain',
      label: '下雨的时候',
      date: '',
      lines: ['我喜欢《天气之子》里的雨，', '也喜欢雨里的那些安静时刻。'],
    },

    {
      kind: 'chat',
      id: 'c1',
      label: '深夜',
      date: '',
      bubbles: [
        { side: 'you', text: '在吗' },
        { side: 'me', text: '在' },
        { side: 'you', text: '没什么事，就是想确认一下你还在' },
        { side: 'me', text: '一直在的。明天醒了也还在。' },
      ],
      sendLabel: '发了',
    },

    {
      kind: 'interlude',
      id: 'rain-note',
      label: '雨',
      date: '',
      lines: ['我喜欢下雨的晚上。', '因为雨声很大，会盖过一些不好的声音。', '也因为那个时候你总在。'],
    },

    {
      kind: 'interlude',
      id: 'i1',
      label: '插句',
      date: '',
      lines: ['后来我才发现，', '跟你说话是我一天里**最松**的时候。'],
    },

    {
      kind: 'chat',
      id: 'c-rain',
      label: '下雨了',
      date: '',
      bubbles: [
        { side: 'you', text: '你那边下雨了吗' },
        { side: 'me', text: '还没，不过风开始大了' },
        { side: 'you', text: '我窗外已经下起来了，特别大' },
        { side: 'you', text: '感觉整个城市都安静了一点' },
        { side: 'me', text: '嗯，雨天就是有这种魔力' },
        { side: 'me', text: '像有人给世界开了静音' },
      ],
      sendLabel: '嗯',
    },

    {
      kind: 'chat',
      id: 'c2',
      label: '如果今天有点累',
      date: '',
      bubbles: [
        { side: 'you', text: '如果今天有点累怎么办' },
        { side: 'me', text: '那就先什么都别想' },
        { side: 'me', text: '去吹吹风，听听歌，等心情慢一点' },
        { side: 'you', text: '然后呢' },
        { side: 'me', text: '然后抬头看看天。晴天也好，雨天也好，都算今天。' },
      ],
      sendLabel: '写给你',
    },

    {
      kind: 'interlude',
      id: 'blessing-1',
      label: '想送给你的话',
      date: '',
      lines: ['愿你以后遇见的每一天，', '都有一点值得开心的小事。'],
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
          lines: ['你会把喜欢的歌分享给我。', '也会顺手把一天里的小事发过来。'],
          images: ['photos/yales/p04.webp'],
        },
        {
          id: 'n04',
          date: '后来',
          lines: ['也有过一句话都不说的时候。', '但你还是会把日常一点点分享给我。'],
          images: ['photos/yales/p05.webp', 'photos/yales/p06.webp', 'photos/yales/p07.webp'],
        },
      ],
    },

    {
      kind: 'chat',
      id: 'c-share',
      label: '分享',
      date: '',
      bubbles: [
        { side: 'you', text: '这首歌给你听' },
        { side: 'me', text: '好，我现在听听' },
        { side: 'me', text: '好听。你什么时候发现的' },
        { side: 'you', text: '刚刷到的，觉得你肯定会喜欢' },
        { side: 'you', text: '所以你看，我其实时刻想着你的' },
        { side: 'me', text: '知道的呀。我也是。' },
      ],
      sendLabel: '给你',
    },

    {
      kind: 'interlude',
      id: 'blessing-share',
      label: '想起你',
      date: '',
      lines: ['不是非得有什么特别的事才会想起你。', '有时候只是听到一句歌词，', '或者看到某个颜色，就想起你了。'],
    },

    {
      kind: 'songs',
      id: 'songs',
      label: '一起听过的歌',
      date: '2026 春夏',
      intro: '有些歌，是你分享给我的。后来再听见，我会想起你把它发过来的那个瞬间。',
      items: [
        {
          name: 'グランドエスケープ',
          artist: 'RADWIMPS',
          note: '你喜欢《天气之子》，也把这首歌分享给我。所以我把它留在这里，陪你看到最后。',
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
      label: '你的日常',
      date: '2026 夏',
      intro: '你会把一天里遇到的小事、看到的东西、突然想到的话，分享给我。',
      nodes: [
        {
          id: 'n05',
          date: '那天',
          place: '日常',
          lines: ['有时候是一张照片，有时候只是一句话。', '你把普通的一天，也分了一点给我。'],
          images: ['photos/yales/p08.webp'],
        },
        {
          id: 'n06',
          date: '那天晚上',
          place: '日常',
          lines: ['你发来的那些碎碎念，我后来才发现，已经悄悄堆成了很多记忆。'],
          quote: '原来被你分享进日常，也是一件很幸福的事。',
          images: ['photos/yales/p09.webp', 'photos/yales/p10.webp'],
        },
        {
          id: 'n07',
          date: '六月',
          place: '聊天记录',
          lines: ['有时候你只是顺手发来一张照片。', '我却会认真看很久。'],
          images: ['photos/yales/p11.webp', 'photos/yales/p12.webp'],
        },
        {
          id: 'n08',
          date: '某天',
          place: '聊天记录',
          lines: ['你分享给我的，不一定是什么特别的日子。', '可我很喜欢这些普通的日常。'],
          images: ['photos/yales/p13.webp'],
        },
      ],
    },

    {
      kind: 'interlude',
      id: 'i2',
      label: '插句',
      date: '',
      lines: ['有些话我到现在也没跟你说过。', '所以想把它们藏在这一页里，慢慢给你看。'],
    },

    {
      kind: 'chat',
      id: 'c-cheer',
      label: '加油',
      date: '',
      bubbles: [
        { side: 'you', text: '我好烦啊' },
        { side: 'me', text: '来，跟我说说' },
        { side: 'you', text: '不说了，说了也没用' },
        { side: 'me', text: '有用没用另说，先让它从心里跑出来' },
        { side: 'me', text: '我在听着呢。' },
        { side: 'me', text: '而且你每次说完，都会好很多的。' },
      ],
      sendLabel: '我在',
    },

    {
      kind: 'chat',
      id: 'c3',
      label: '关于以后',
      date: '',
      bubbles: [
        { side: 'me', text: '以后也要好好生活' },
        { side: 'you', text: '知道啦' },
        { side: 'me', text: '遇到不开心的事情也不要一个人憋着' },
        { side: 'you', text: '那开心的呢' },
        { side: 'me', text: '开心的更要告诉我。我要听。' },
      ],
      sendLabel: '未完待续',
    },

    {
      kind: 'interlude',
      id: 'blessing-2',
      label: '愿望',
      date: '',
      lines: ['愿你有很多很多晴天，', '也愿每一次下雨，都有人陪你等天晴。'],
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
      kind: 'chat',
      id: 'c-hard',
      label: '撑不住',
      date: '',
      bubbles: [
        { side: 'you', text: '我是不是真的有点撑不住了' },
        { side: 'me', text: '能说这句话就已经很厉害了' },
        { side: 'me', text: '撑不住也没关系，我帮你一起托着' },
        { side: 'you', text: '这样会不会麻烦到你' },
        { side: 'me', text: '不会的。' },
        { side: 'me', text: '能麻烦到我，是你的信任。' },
      ],
      sendLabel: '陪着你',
    },

    {
      kind: 'interlude',
      id: 'hope',
      label: '慢慢来',
      date: '',
      lines: ['没关系的。', '不用逼着自己立刻好起来。', '我会陪你一起等，等到那片乌云散掉。'],
    },

    {
      kind: 'interlude',
      id: 'i3',
      label: '插句',
      date: '',
      lines: ['然后就**慢慢**好起来了。', '不用急着放晴，慢一点，也没关系。'],
    },

    {
      kind: 'interlude',
      id: 'clear',
      label: '雨停以后',
      date: '',
      lines: ['雨停以后，不是故事结束。', '是我们终于可以一起抬头看天。'],
    },

    {
      kind: 'interlude',
      id: 'blessing-3',
      label: '中秋',
      date: '2026',
      lines: ['月亮会圆，雨也会停。', '愿你所盼的，都慢慢有回音。'],
    },

    {
      kind: 'chat',
      id: 'c4',
      label: '最后一句',
      date: '',
      bubbles: [
        { side: 'you', text: '这份回忆录到底想说什么' },
        { side: 'me', text: '没什么大道理' },
        { side: 'me', text: '就是希望你打开它的时候，刚好心情很好' },
        { side: 'you', text: '如果我今天心情不好呢' },
        { side: 'me', text: '那就多看一会儿。雨会停的。' },
      ],
      sendLabel: '送给你',
    },

    {
      kind: 'chat',
      id: 'c-final',
      label: '以后',
      date: '',
      bubbles: [
        { side: 'me', text: '对了，答应我一件事好吗' },
        { side: 'you', text: '什么' },
        { side: 'me', text: '不管发生什么，都不要觉得自己是一个人' },
        { side: 'me', text: '你有我呀' },
        { side: 'you', text: '嗯' },
        { side: 'you', text: '我知道。一直都知道的。' },
      ],
      sendLabel: '答应了',
    },

    {
      kind: 'interlude',
      id: 'ending-wish',
      label: '最后一个愿望',
      date: '',
      lines: ['愿你明天醒来的时候，', '有阳光，有一杯热的东西，', '还有一条让你嘴角上扬的消息。'],
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
      '谢谢你愿意把那些小小的日常，一点一点分享给我。',
      '有些只是随手发来的一张照片，有些只是半夜随口说的一句话，可它们最后都在这里堆成了一整个季节。你喜欢《天气之子》，所以我借了它的雨、它的云、还有那道终于放晴的光，认真祝你一次。',
      '其实没什么大事。就是想让你知道，你发来的每一条消息、每一张照片、每一句没说出口的话，我都认真看过，也都认真记得。',
      '接下来的路不用急，慢慢来也没关系。每天开心一点，照顾好自己，按时吃饭，好好睡觉。**愿你一直有值得分享的日常，也一直有人认真听。** 愿你的天，总会放晴。',
    ],
    images: [
      'photos/yales/p03.webp',
      'photos/yales/p06.webp',
      'photos/yales/p10.webp',
      'photos/yales/p15.webp',
      'photos/yales/p18.webp',
    ],
    sign: '一直听你说话的人',
    date: '2026',
  },
};
