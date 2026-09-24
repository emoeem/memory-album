/**
 * 吴玲 的回忆录。
 *
 * 文案来自 2026-03-12 ~ 2026-09-19 的真实聊天记录（Telegram 导出），
 * 只挑了适合放在页面上的部分，日期和引号里的话都是原话，没有编。
 *
 * 节点字段：
 *   date   时间线标签
 *   lines  正文，一到三句短句
 *   quote  单独拎出来的那句（可选，会做成引文样式）
 *   images 图片，可多张（照片放 photos/wuling/，跑 `npm run photos -- wuling` 压缩）
 *
 * 章节 kind：
 *   （不写）   普通章节，里面放 nodes
 *   interlude  停顿页，一整屏只放一两句话
 *   chat       聊天气泡分镜
 *   songs      一起听过的歌
 */
export default {
  slug: 'wuling',

  presentation: 'slides',

  timing: {
    chapter: 3800,
    image: 8000,
    text: 5600,
    interlude: 4800,
    chat: 8000,
    songs: 11000,
    ending: 16000,
  },

  name: '吴玲',
  cover: {
    kicker: '深夜场 · SEASON ONE',
    title: '吴玲',
    subtitle: '从你回我的那声「yes」开始，到把国赛走完。这一季不长，但有六集。',
    openLabel: '打开',
    hint: '建议戴上耳机 · 像追剧一样看完',
    line: '今晚照旧：关灯，开一集',
  },

  // 主题：'screenlight' = 深夜场（关灯看屏幕 → 天亮）
  theme: 'screenlight',

  // 这段录音用 ffmpeg 压过（loudnorm + 128k mp3），原文件是
  // ~/Downloads/wuling/标准录音 5.wav，2 分 11 秒
  bgm: {
    tracks: [{ src: 'audio/night-session.mp3', title: '本季主题曲' }],
    volume: 0.45,
    crossfade: 6,
    loop: true,
  },

  chapters: [
    {
      id: 'begin',
      tag: 'S01E01',
      label: '开始',
      date: '2026 · 春',
      intro: '三月十二号那天晚上，我只发了两个字。',
      nodes: [
        {
          id: 'n01',
          date: '3月12日 23:59',
          lines: ['我发了你的名字。', '你回的是那声「yes」。', '然后就一路聊到了很后面。'],
        },
        {
          id: 'n02',
          date: '那晚到凌晨',
          lines: ['汉化包、搜索机器人、改邮箱、开两步验证。', '一步一步，像在教一个刚拿到新玩具的人。'],
          images: ['photos/wuling/p01.webp'],
        },
      ],
    },

    {
      kind: 'chat',
      id: 'c1',
      label: '第一句',
      date: '',
      bubbles: [
        { side: 'me', text: '吴玲' },
        { side: 'you', text: 'yes！' },
        { side: 'me', text: 'nice' },
        { side: 'me', text: 'good' },
      ],
      sendLabel: '从这里开始',
    },

    {
      kind: 'interlude',
      id: 'grown',
      label: '那句感慨',
      date: '',
      lines: ['凌晨我说：就像自己养成的人，', '终于学会了一样。', '——其实是你学得太快了。'],
    },

    {
      kind: 'chat',
      id: 'c2',
      label: '第二天',
      date: '',
      bubbles: [
        { side: 'you', text: '为什么我发不了消息给 emote 这个号' },
        { side: 'me', text: '那个是个频道，后面我给你权限就好了' },
        { side: 'you', text: '那我也不想被当那个容易出现在警察叔叔冲业绩的头号人选 🥹' },
        { side: 'me', text: '一般不得，你这种在国内多了去了' },
      ],
      sendLabel: '发送',
    },

    {
      id: 'money',
      tag: 'S01E02',
      label: '第一课',
      date: '2026 · 三月',
      intro: '三月二十三号，你说想学理财。',
      nodes: [
        {
          id: 'n03',
          date: '那天晚上',
          lines: [
            '我列了一串书，讲了一堆「先建立思维、再学工具」。',
            '晚上你把笔记整理好发过来：',
            '「把钱当作工具，而不是目的。」',
          ],
        },
        {
          id: 'n04',
          date: '同一天',
          lines: ['我在对话框里恭喜你迈出了第一步。', '那句话我是认真写的。'],
          quote: '恭喜你迈出了建立财务自由意识的第一步。',
        },
      ],
    },

    {
      id: 'screen',
      tag: 'S01E03',
      label: '她看的东西',
      date: '2026 · 春',
      intro: '她爱看剧，这一点她从来没掩饰过。',
      nodes: [
        {
          id: 'n05',
          date: '3月18日',
          lines: ['她说看《黑暗荣耀》的时候，', '对里面反派的剧情，感受一模一样。'],
        },
        {
          id: 'n06',
          date: '3月28日',
          lines: ['后来又发现，她其实先听到的是广播剧。', '「当时我大晚上的听广播剧。」'],
        },
        {
          id: 'n07',
          date: '5月30日',
          lines: ['也有的剧她看完缓不过来：', '「这剧对我的价值冲击有点大了。」'],
        },
      ],
    },

    {
      kind: 'chat',
      id: 'c3',
      label: '同一部剧',
      date: '',
      bubbles: [
        { side: 'you', text: '我看黑暗荣耀的时候对里面的反派的剧情感受一模一样' },
        { side: 'me', text: '黑暗荣耀啊' },
        { side: 'me', text: '我也看过这个' },
        { side: 'you', text: '我不理解但尊重' },
      ],
      sendLabel: '发送',
    },

    {
      id: 'days',
      tag: 'S01E04',
      label: '她的一天',
      date: '2026 · 夏',
      intro: '她给自己的一天，排得挺满。',
      nodes: [
        {
          id: 'n08',
          date: '4月8日',
          lines: ['她在班上做宣传委员。', '那天她说，处理班上的事弄得有点无力。'],
        },
        {
          id: 'n09',
          date: '7月17日',
          lines: ['练车回来，接着练吉他。', '她说：我有点累了。'],
        },
        {
          id: 'n10',
          date: '7月20日',
          lines: ['自己给自己数了一遍：', '「我就是煮饭洗碗，看剧，练吉他，练车。」'],
          quote: '感觉除了练车像是正事，其他的都不是。',
        },
      ],
    },

    {
      id: 'home',
      tag: 'S01E05',
      label: '她家里',
      date: '2026 · 春',
      intro: '她讲家里的事，讲得很细。',
      nodes: [
        {
          id: 'n11',
          date: '3月15日',
          lines: [
            '她说她爸爸管得有点多：',
            '会登她的 QQ，也会管她交什么朋友。',
            '「我都不想和我爸爸说话。」',
          ],
        },
        {
          id: 'n12',
          date: '同一段话后面',
          lines: [
            '但她自己又补了一句：',
            '以前很讨厌他，现在能理解一些了。',
            '她考去广西读书，也有一部分原因，是想离远一点。',
          ],
        },
        {
          id: 'n13',
          date: '9月5日',
          lines: [
            '她说过一段我一直记得的话：',
            '在这个家里有点肆无忌惮，被保护得太好。',
            '「一旦进入学校这种环境，我会先把我的防备建得很高。」',
          ],
          quote: '每次离开家的时候，都会有点不安。',
        },
      ],
    },

    {
      kind: 'interlude',
      id: 'cet4',
      label: '四级',
      date: '',
      lines: ['你说：四级我下次绝对可以过。', '那就先说好——', '过了的那天，记得回来告诉我。'],
    },

    {
      id: 'english',
      tag: 'S01E06',
      label: '假努力',
      date: '2026 · 九月',
      intro: '九月十号那天，你说了一大段话。',
      nodes: [
        {
          id: 'n14',
          date: '9月10日',
          lines: [
            '为了英语，你唱过英语歌、给动画配过音，初中还当过英语课代表。',
            '后来因为不喜欢那位老师，你和英语分开了一段时间。',
            '再后来，你觉得以前那些都像是「假努力」。',
          ],
        },
        {
          id: 'n15',
          date: '然后你说',
          lines: ['「我很羡慕那些花一点点力气就考到 140 多的人。」'],
          quote: '你完全不需要羡慕任何人。',
        },
      ],
    },

    {
      kind: 'chat',
      id: 'c4',
      label: '那一晚',
      date: '',
      bubbles: [
        { side: 'me', text: '学习任何东西都是没有区别的' },
        { side: 'me', text: '你学习不只是学知识，是在学「怎么学」' },
        { side: 'you', text: '为自己嘛，和我想成为自己想成为的人冲突吗' },
        { side: 'me', text: '不冲突。' },
        { side: 'me', text: '有多少人，是真的为了自己读书' },
      ],
      sendLabel: '写完',
    },

    {
      id: 'contest',
      tag: 'S01E07',
      label: '国赛',
      date: '2026 · 九月',
      intro: '开学第一周，国赛开始了。',
      nodes: [
        {
          id: 'n16',
          date: '9月9日',
          lines: ['你说：明天早上去开会，数学建模国赛要开始了。', '我说：加油啊。'],
        },
        {
          id: 'n17',
          date: '9月12日 凌晨',
          lines: ['你发来一句：「我已经不抱有拿什么奖的希望了。」', '然后还是接着改稿，赶到半夜。'],
        },
        {
          id: 'n18',
          date: '我追着问的那个问题',
          lines: ['我问：你们用的方法，原理是什么？', '你说：都是 AI 给的最优解，我看不懂。', '我不是要考你。'],
          quote: '算法，是拿来把原理变成结果的。',
        },
      ],
    },

    {
      kind: 'chat',
      id: 'c5',
      label: '相信我',
      date: '',
      bubbles: [
        { side: 'you', text: '我已经不抱有拿什么奖的希望了 😅' },
        { side: 'me', text: '相信我' },
        { side: 'me', text: '也相信你' },
      ],
      sendLabel: '发送',
    },

    {
      kind: 'interlude',
      id: 'noresult',
      label: '无果也是荣光',
      date: '',
      lines: [
        '夸父不是因为追到太阳才被歌颂的，',
        '精卫不是因为填平沧海才被铭记的。',
        '纵无结果，亦是荣光。',
      ],
    },

    {
      kind: 'interlude',
      id: 'sing',
      label: '那首歌',
      date: '',
      lines: ['六月十七号，你说：我也给你唱一曲。', '「少年的脚步 跌撞」——你唱到一半停了。'],
    },

    {
      kind: 'songs',
      id: 'songs',
      label: '一起听过的',
      date: '',
      items: [
        { name: '时结', artist: '你唱的', note: '唱了一半，说剩下的下次' },
        { name: '根本你不懂得爱我', artist: '韦雄', note: '那阵子推给我的第一首' },
        { name: 'All Of The Time', artist: 'Jungle', note: '' },
        { name: 'i hate u, i love u', artist: "gnash / Olivia O'Brien", note: '' },
      ],
    },

    {
      id: 'now',
      tag: 'S01E08',
      label: '现在',
      date: '现在',
      intro: '走到这里了。',
      nodes: [
        {
          id: 'n19',
          date: '这半年',
          lines: [
            '你学会了给自己搭一套顺手的工具，',
            '学会了在不想听的课上自己看书，',
            '也学会了把「我不懂」说出来，再一点点弄懂。',
          ],
          images: ['photos/wuling/p02.webp', 'photos/wuling/p03.webp'],
        },
        {
          id: 'n20',
          date: '往后',
          lines: ['新的学期才刚开始。', '这次不用急，也不用和谁比。'],
        },
      ],
    },
  ],

  ending: {
    title: '本季完 · 给你的话',
    paragraphs: [
      '从三月十二号那天晚上算起，我们聊了半年多。',
      '这段对话里有凌晨、有一堆「OK 了」「谢谢了」「相信我」，有练车回来的累，也有国赛那两天的紧张。我记性很好，又刚好喜欢整理东西，所以把它们挑出来，放在这里。',
      '这半年你走得比你以为的稳。你真正拿到的东西不写在成绩单上：遇到一件不懂的事，先弄明白它的原理；不喜欢的东西，也自己找一条路绕过去。',
      '新的学期刚开始，考不完的试、做不完的作业、还有一堆没想清楚的事都在前面。不用急，也别和谁比。**愿你为自己读书，也为自己高兴。**',
    ],
    sign: '一个总在给你派任务的人',
    date: '2026 秋',
    images: [
      'photos/wuling/p04.webp',
      'photos/wuling/p03.webp',
      'photos/wuling/p01.webp',
      'photos/wuling/p02.webp',
    ],
  },
};
