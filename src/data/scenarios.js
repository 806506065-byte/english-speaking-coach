/**
 * 场景脚本库
 * 每个 beat = AI 的一句台词 + 用户本轮“期待表达”的关键词组。
 * expect: 二维数组，外层每个元素是一组关键词（组内任一同义词命中即算该组通过）。
 */
export const SCENARIOS = [
  {
    id: 'coffee-shop',
    emoji: '☕',
    title: '咖啡店点单',
    titleEn: 'Ordering Coffee',
    level: 'beginner',
    blurb: '从打招呼到付款取餐，完整走一遍咖啡店点单流程。',
    goal: '能独立完成点单、选规格、付款',
    aiRole: 'Barista（咖啡师）',
    userRole: 'Customer（顾客）',
    beats: [
      {
        ai: "Hi there! Welcome to Brew & Bloom. What can I get for you today?",
        expect: [
          ['latte', 'coffee', 'cappuccino', 'americano', 'mocha', 'tea', 'espresso', 'drink'],
          ['like', 'get', 'want', 'have', 'take', 'would'],
        ],
        hints: ["I'd like a latte, please.", 'Can I get a medium coffee?'],
        tip: "点单最自然的两句开头：I'd like… / Can I get…，比 I want… 更礼貌。",
      },
      {
        ai: 'Great choice. What size would you like — small, medium or large?',
        expect: [['small', 'medium', 'large', 'regular', 'tall', 'grande', 'big']],
        hints: ['Medium, please.', 'A large one, please.'],
        tip: '回答规格可以直接说 Medium, please.，省略重复的主谓反而更自然。',
      },
      {
        ai: 'Sure. Would you like that for here or to go?',
        expect: [['here', 'to go', 'takeaway', 'take away', 'takeout']],
        hints: ['For here, please.', 'To go, please.'],
        tip: 'for here = 堂食，to go = 外带，是英语国家最常用的说法。',
      },
      {
        ai: 'Got it. Anything else? We have fresh croissants and muffins today.',
        expect: [
          ['no', "that's all", 'thats all', 'nothing', 'yes', 'croissant', 'muffin', 'thanks', 'thank', 'good'],
        ],
        hints: ["No, that's all. Thanks.", "Yes, I'll take one croissant."],
        tip: "拒绝加购最地道：No, that's it, thanks. / I'm good, thanks.",
      },
      {
        ai: "Perfect. That'll be four fifty. Cash or card?",
        expect: [['card', 'cash', 'credit', 'debit', 'apple pay', 'alipay', 'wechat']],
        hints: ['Card, please.', "I'll pay by card."],
        tip: '付款方式说 by card / in cash；回答 Card, please. 就足够了。',
      },
      {
        ai: 'All set! Your drink will be ready at the counter in a couple of minutes.',
        expect: [['thank', 'thanks', 'great', 'ok', 'okay', 'cheers', 'perfect']],
        hints: ['Thank you!', 'Thanks a lot.'],
        tip: '收尾一句 Thanks, have a good one! 非常自然。',
      },
    ],
    closing: {
      ai: "You ordered like a regular — nice work! Ordering is one of the fastest ways to practise small talk with strangers.",
      tip: "记住三件套：I'd like… / For here, please. / Thanks, have a good one!",
    },
    shadowing: [
      { text: "I'd like a medium latte with oat milk, please.", zh: '我要一杯中杯燕麦奶拿铁，谢谢。' },
      { text: 'Could I get that to go, please?', zh: '可以帮我打包带走吗？' },
      { text: "No, that's all. Thanks for asking.", zh: '不用了，就这些，谢谢。' },
      { text: "I'll pay by card, thank you.", zh: '我用卡支付，谢谢。' },
    ],
  },

  {
    id: 'airport-checkin',
    emoji: '✈️',
    title: '机场值机',
    titleEn: 'Airport Check-in',
    level: 'beginner',
    blurb: '递交证件、托运行李、选座、确认登机口，一次说清。',
    goal: '能独立完成值机柜台全部问答',
    aiRole: 'Check-in Agent（值机柜台职员）',
    userRole: 'Passenger（旅客）',
    beats: [
      {
        ai: 'Good morning! Welcome to Skyline Air. May I see your passport and ticket, please?',
        expect: [['here', 'passport', 'sure', 'yes', 'okay', 'ok', 'ticket', 'course']],
        hints: ['Here you are.', "Sure, here's my passport."],
        tip: '递东西时说 Here you are. / Here you go.，不要说 Give you。',
      },
      {
        ai: 'Thank you. Where are you flying to today?',
        expect: [['to', 'london', 'new york', 'paris', 'tokyo', 'sydney', 'singapore', 'beijing', 'shanghai', 'fly', 'flying']],
        hints: ["I'm flying to London.", "I'm going to New York."],
        tip: 'fly to + 目的地，目的地前要有 to，不要说 fly London。',
      },
      {
        ai: 'And how many bags are you checking in today?',
        expect: [['one', 'two', 'three', 'bag', 'suitcase', 'check', 'checked', 'luggage', 'none']],
        hints: ['Just one, please.', 'I have two bags to check.'],
        tip: '可数名词记得复数：two bags；luggage 不可数，说 two pieces of luggage。',
      },
      {
        ai: 'Would you prefer a window or an aisle seat?',
        expect: [['window', 'aisle', 'middle', 'either', 'any']],
        hints: ['A window seat, please.', 'Aisle, if possible.'],
        tip: 'aisle 读 /aɪl/，中间的 s 不发音。',
      },
      {
        ai: "Alright, here's your boarding pass. Your gate is B12, boarding starts at 10:40.",
        expect: [['thank', 'thanks', 'gate', 'okay', 'ok', 'got it', 'understand', 'repeat']],
        hints: ['Thank you. Which gate did you say?', 'Got it, thanks.'],
        tip: '没听清时最自然的问法：Sorry, could you repeat that?',
      },
    ],
    closing: {
      ai: "Smooth. Airports are full of fixed phrases — once you own them, travel gets much less stressful.",
      tip: '常备一句：Sorry, I didn\'t catch that. Could you say it again?',
    },
    shadowing: [
      { text: 'Here you are — my passport and ticket.', zh: '给你，我的护照和机票。' },
      { text: "I'm flying to Singapore this evening.", zh: '我今晚飞新加坡。' },
      { text: "I'd prefer a window seat if there's one available.", zh: '如果有的话，我想要靠窗的座位。' },
      { text: 'Sorry, could you repeat which gate that is?', zh: '不好意思，你能再说一遍是哪个登机口吗？' },
    ],
  },

  {
    id: 'hotel-checkin',
    emoji: '🏨',
    title: '酒店入住',
    titleEn: 'Hotel Check-in',
    level: 'beginner',
    blurb: '确认预订、出示证件、选房型、问早餐和 Wi-Fi。',
    goal: '能独立办完入住并追问配套信息',
    aiRole: 'Front Desk（前台）',
    userRole: 'Guest（住客）',
    beats: [
      {
        ai: 'Good evening, welcome to the Riverside Hotel. Do you have a reservation with us?',
        expect: [['yes', 'have', 'reservation', 'booking', 'booked', 'no']],
        hints: ['Yes, I have a reservation under Chen.', "Yes, it's booked under the name Chen."],
        tip: '预订用 under + 姓名：a reservation under Chen。',
      },
      {
        ai: 'Let me check… Yes, I see it. A double room for two nights. Could I see your ID, please?',
        expect: [['here', 'sure', 'id', 'passport', 'course', 'yes', 'okay']],
        hints: ["Sure, here's my passport.", 'Of course, here you go.'],
        tip: 'Could I see… 是礼貌请求，直接回 Here you are. 即可。',
      },
      {
        ai: 'Thank you. Would you like a room with a city view or a garden view?',
        expect: [['city', 'garden', 'either', 'any', 'view']],
        hints: ['A city view, please.', 'Either is fine.'],
        tip: 'Either is fine. / Anything works. 表示“都行”。',
      },
      {
        ai: 'Perfect. Breakfast is served from 7 to 10 on the second floor. Anything else I can help with?',
        expect: [['no', 'wi-fi', 'wifi', 'internet', 'breakfast', 'thanks', 'thank', 'what time', 'password', 'gym']],
        hints: ["No, that's all. Thanks.", "What's the Wi-Fi password?"],
        tip: '追问信息：What time is breakfast? / What\'s the Wi-Fi password?',
      },
      {
        ai: "Here's your key card — room 508. Enjoy your stay!",
        expect: [['thank', 'thanks', 'great', 'enjoy', 'perfect']],
        hints: ['Thank you very much.', 'Thanks, have a good night.'],
        tip: 'have a good night / have a good one 都是自然的道别。',
      },
    ],
    closing: {
      ai: 'That was a clean check-in. Hotel staff hear the same questions all day, so simple, direct English works best.',
      tip: '记住：a reservation under + 名字 / Either is fine. / What time is…?',
    },
    shadowing: [
      { text: "Yes, I have a reservation under the name Chen.", zh: '是的，我用陈这个名字预订了。' },
      { text: 'Either is fine, thank you.', zh: '都可以，谢谢。' },
      { text: 'Sorry, what time does breakfast start?', zh: '不好意思，早餐几点开始？' },
      { text: "Thanks, have a good night.", zh: '谢谢，晚安。' },
    ],
  },

  {
    id: 'small-talk',
    emoji: '🎈',
    title: '日常闲聊',
    titleEn: 'Small Talk',
    level: 'intermediate',
    blurb: '在活动、聚会或咖啡角跟陌生人自然搭话并延续话题。',
    goal: '能把一次闲聊延续 6 轮以上',
    aiRole: 'Maya（刚认识的与会者）',
    userRole: '你（参会者）',
    beats: [
      {
        ai: "Hey! I don't think we've met. I'm Maya. Are you here for the conference too?",
        expect: [['yes', 'no', "i'm", 'im', 'my name', 'nice to meet', 'here for']],
        hints: ["Hi Maya, I'm Leo. Yes, I'm here for the conference.", "Nice to meet you — I'm Leo."],
        tip: '自我介绍直接说 I\'m + 名字，不必用 My name is。',
      },
      {
        ai: 'Nice to meet you, Leo! Where are you from?',
        expect: [['from', 'china', 'beijing', 'shanghai', 'shenzhen', 'originally', 'come']],
        hints: ["I'm from Shanghai, China.", "I'm originally from Beijing."],
        tip: 'originally from 表示老家，比 I come from 更口语。',
      },
      {
        ai: 'Cool! So what do you do?',
        expect: [['work', "i'm a", 'im a', 'study', 'student', 'engineer', 'designer', 'teacher', 'manager', 'developer']],
        hints: ['I work as a product designer.', "I'm a software engineer."],
        tip: 'What do you do? 问的是职业，回答 I\'m a + 职位 / I work as a + 职位。',
      },
      {
        ai: 'That sounds interesting. How long have you been doing that?',
        expect: [['for', 'since', 'years', 'year', 'months', 'been']],
        hints: ["I've been doing it for about three years.", 'For three years now.'],
        tip: '持续到现在用现在完成进行时：I\'ve been doing it for three years。',
      },
      {
        ai: 'Nice. What do you like to do outside of work?',
        expect: [['like', 'enjoy', 'hobby', 'into', 'running', 'reading', 'hiking', 'photography', 'cooking', 'gym']],
        hints: ["I'm really into photography and hiking.", 'I like reading and running.'],
        tip: "I'm into… 比 I like… 更口语、更像母语者。",
      },
      {
        ai: 'Same here! We should grab a coffee sometime.',
        expect: [['sure', 'yes', 'love to', 'sounds good', 'definitely', 'okay', 'ok', 'sure', 'yes']],
        hints: ["Sounds good! I'd love to.", "Definitely, let's do that."],
        tip: "接受邀约：Sounds good. / I'd love to. / Let's do it.",
      },
    ],
    closing: {
      ai: "Nice — that's exactly how small talk works: answer, then hand a question back so the conversation keeps breathing.",
      tip: '黄金节奏：回答一句 + 反问一句。别只答不问。',
    },
    shadowing: [
      { text: "Nice to meet you — I'm Leo, by the way.", zh: '很高兴认识你，顺便说下我叫 Leo。' },
      { text: "I'm originally from Beijing, but I live in Shanghai now.", zh: '我老家北京，现在住上海。' },
      { text: "I've been doing it for about three years now.", zh: '我做这个大概三年了。' },
      { text: "I'm really into photography — how about you?", zh: '我很喜欢摄影，你呢？' },
    ],
  },

  {
    id: 'job-interview',
    emoji: '💼',
    title: '求职面试',
    titleEn: 'Job Interview',
    level: 'intermediate',
    blurb: '自我介绍、讲项目、答压力题、反问面试官。',
    goal: '用完整句流畅回答 5 个核心问题',
    aiRole: 'Interviewer（面试官）',
    userRole: 'Candidate（候选人）',
    beats: [
      {
        ai: 'Thanks for coming in today. Could you start by telling me a bit about yourself?',
        expect: [["i'm", 'im', 'my name', 'work', 'experience', 'years', 'graduated', 'background', 'engineer', 'designer']],
        hints: ["Sure. I'm Leo, a software engineer with four years of experience.", "My name is Leo and I've been working in…"],
        tip: '开头用 Sure. / Thanks for having me.，再一句话概括身份 + 年限。',
      },
      {
        ai: 'Great. Why are you interested in this role specifically?',
        expect: [['because', 'interested', 'role', 'team', 'product', 'grow', 'mission', 'align', 'reasons']],
        hints: ["I'm interested in this role because your team works on…", 'Two reasons: the product and the team.'],
        tip: '回答 why 要用 because + 具体理由，避免 “It is very good”。',
      },
      {
        ai: "Can you walk me through a project you're proud of?",
        expect: [['project', 'built', 'led', 'designed', 'shipped', 'worked', 'team', 'launched']],
        hints: ['I led a project where we rebuilt the checkout flow…', 'I worked on a mobile app that…'],
        tip: '讲项目用过去时；结构：目标 → 我做了什么 → 结果（带上数字）。',
      },
      {
        ai: 'And how do you handle tight deadlines or conflicting priorities?',
        expect: [['prioritize', 'priority', 'deadline', 'communicate', 'first', 'trade-off', 'tradeoff', 'plan', 'focus', 'impact']],
        hints: ['I usually prioritize by impact and communicate trade-offs early.', 'First I clarify what actually matters, then…'],
        tip: 'handle 后面接名词：how I handle tight deadlines。',
      },
      {
        ai: 'Do you have any questions for us?',
        expect: [['yes', 'question', 'what', 'how', 'could you', 'team', 'success', 'culture', 'onboarding']],
        hints: ['Yes — what does success look like in the first 90 days?', 'How does the team measure impact?'],
        tip: '反问环节一定要问，What does success look like…? 显得很专业。',
      },
      {
        ai: "That's a great question. We'll be in touch by Friday.",
        expect: [['thank', 'thanks', 'appreciate', 'look forward', 'hear from', 'time']],
        hints: ['Thank you, I look forward to hearing from you.', 'Thanks for your time.'],
        tip: '收尾：Thank you for your time — I look forward to hearing from you.',
      },
    ],
    closing: {
      ai: "Strong finish. Interviews reward structure: situation, what you did, and a measurable result.",
      tip: '万能结构：Situation → Action → Result（带数字）。',
    },
    shadowing: [
      { text: "Thanks for having me — I'm excited to be here.", zh: '谢谢你们的邀请，我很高兴来这里。' },
      { text: "I'm interested in this role because your team ships fast.", zh: '我对这个岗位感兴趣，因为你们团队迭代很快。' },
      { text: 'I usually prioritise by impact and flag trade-offs early.', zh: '我通常按影响面排优先级，并尽早说明取舍。' },
      { text: 'Thank you for your time — I look forward to hearing from you.', zh: '谢谢你的时间，期待你的回复。' },
    ],
  },

  {
    id: 'academic-seminar',
    emoji: '🎓',
    title: '学术研讨',
    titleEn: 'Academic Seminar',
    level: 'advanced',
    blurb: '论文研讨会上提问、质疑、补充，用学术语域表达观点。',
    goal: '能礼貌地质疑并给出建设性建议',
    aiRole: 'Moderator（主持人）',
    userRole: 'Participant（参会者）',
    beats: [
      {
        ai: "Thanks everyone for joining. Let's open the floor — does anyone have thoughts on the paper's methodology?",
        expect: [['think', 'methodology', 'sample', 'data', 'question', 'interesting', 'concern', 'design']],
        hints: ['I found the methodology solid, though the sample size seems small.', "One thing I'd push back on is…"],
        tip: "学术讨论常用 I'd push back on… / One concern is…，比 I don't agree 更得体。",
      },
      {
        ai: "That's a fair point. How would you address the sampling limitation?",
        expect: [['stratified', 'random', 'larger', 'replicate', 'control', 'generaliz', 'generalise', 'power', 'sample']],
        hints: ['A stratified sample across regions would help.', "I'd replicate the study with a larger, more diverse sample."],
        tip: '提建议用 would + 动词，语气比 should 更学术、更柔和。',
      },
      {
        ai: 'Interesting. So are you suggesting the effect might not generalize?',
        expect: [['generalize', 'generalise', 'population', 'scope', 'external', 'validity', 'caution', 'yes', 'not necessarily']],
        hints: ["Not necessarily — I'd just add a caveat about external validity.", "I'm suggesting we should be cautious about generalizing."],
        tip: 'caveat / external validity 是这类讨论的高频词。',
      },
      {
        ai: 'Good. Anyone want to build on that point?',
        expect: [['add', 'build', 'also', 'furthermore', 'point', 'agree', 'extend']],
        hints: ["I'd like to build on that — the same issue appears in…", 'To add to that point…'],
        tip: '接话用 I\'d like to build on that / To add to that，比只说 and 更连贯。',
      },
      {
        ai: "We're almost out of time. Any final comments before we wrap up?",
        expect: [['no', 'thank', 'thanks', 'nothing', 'great', 'wrap', 'session']],
        hints: ['Nothing from me — thanks for a great session.', 'No, thank you.'],
        tip: 'Nothing from me. 是会议上自然的“我没有补充”。',
      },
    ],
    closing: {
      ai: "Nicely argued. Academic English rewards hedging — words like would, might and caveat keep you precise without sounding blunt.",
      tip: '学术语域三件套：I would… / It might… / One caveat is…',
    },
    shadowing: [
      { text: "I'd push back slightly on the interpretation of the results.", zh: '我想对结果的解读稍微提出一点不同意见。' },
      { text: 'A stratified sample across regions would strengthen the design.', zh: '跨地区分层抽样会让研究设计更有说服力。' },
      { text: "I'd add a caveat about external validity here.", zh: '这里我想补一个关于外部效度的提醒。' },
      { text: "I'd like to build on that point briefly.", zh: '我想简短地接着那一点补充。' },
    ],
  },
]

/**
 * 自由对话（无脚本）——仅在设置中配置了大模型 API 后可用。
 */
export const FREETALK = {
  id: 'free-talk',
  emoji: '💬',
  title: '自由对话',
  titleEn: 'Free Talk',
  level: 'intermediate',
  blurb: '不限定脚本，想聊什么聊什么，由大模型扮演陪练并实时纠错。',
  goal: '在真实自由对话中即时纠错',
  aiRole: 'Friendly English Coach（友好英语陪练）',
  userRole: '你（学习者）',
  freeTalk: true,
  beats: [],
  closing: {
    ai: 'Nice talking with you! Keep practising a little every day.',
    tip: '自由对话结束后回看纠错报告，把重复出现的错误整理成清单。',
  },
  shadowing: [],
}

export const ALL_SCENARIOS = [...SCENARIOS, FREETALK]

export const LEVEL_LABEL = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高阶',
}

export function getScenario(id) {
  return ALL_SCENARIOS.find((s) => s.id === id) || null
}
