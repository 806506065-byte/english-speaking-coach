/**
 * 本地自由对话兜底
 * 没有配置大模型时，「通话模式」仍能一问一答地聊起来：
 * 按话题关键词挑选追问句，保证对话能持续、语气自然。
 */

const TOPICS = [
  {
    re: /\b(work|job|office|career|colleague|boss|meeting|project|company|client|business)\b/i,
    replies: [
      "Sounds like a busy job. What's the most challenging part of it?",
      "That's interesting. Do you enjoy what you do most days?",
      "Nice. How long have you been working there?",
    ],
  },
  {
    re: /\b(hobby|hobbies|sport|run|running|jog|gym|hike|hiking|yoga|swim|basketball|football|fitness|cycling)\b/i,
    replies: [
      "That's a great way to stay active. How often do you do it?",
      "I like that too. Where do you usually go for it?",
      "Nice. Did you pick it up recently or have you done it for years?",
    ],
  },
  {
    re: /\b(travel|trip|country|city|flight|holiday|vacation|visit|abroad|tour)\b/i,
    replies: [
      "I love travelling too. Where would you go next if you could?",
      "That sounds amazing. What was the best part of the trip?",
      "Nice. Do you prefer travelling alone or with friends?",
    ],
  },
  {
    re: /\b(food|eat|cook|cooking|restaurant|dish|dinner|lunch|breakfast|coffee|tea)\b/i,
    replies: [
      "Yum! Do you cook at home or eat out more often?",
      "That sounds delicious. Is it hard to make?",
      "Nice. What's your comfort food when you're tired?",
    ],
  },
  {
    re: /\b(music|song|band|concert|guitar|piano|sing|album|playlist)\b/i,
    replies: [
      "I like that. What kind of music do you usually listen to?",
      "Nice. Is there a song you never get tired of?",
      "Cool. Have you ever seen them live?",
    ],
  },
  {
    re: /\b(movie|film|series|show|netflix|actor|actress|cinema|drama)\b/i,
    replies: [
      "Oh, I've heard about that one. What did you think of it?",
      "Nice. Would you recommend it to a friend?",
      "Interesting. Who was your favourite character?",
    ],
  },
  {
    re: /\b(study|school|university|college|exam|course|learn|learning|english|class|degree)\b/i,
    replies: [
      "That's great. How's it going so far?",
      "Nice. What made you start learning it?",
      "Good for you. What's the hardest part for you?",
    ],
  },
  {
    re: /\b(family|friend|friends|mother|father|parents|brother|sister|kid|child|children|dog|cat|pet)\b/i,
    replies: [
      "That's lovely. Do you get to spend much time together?",
      "Nice. Tell me a bit more about them.",
      "That sounds warm. How often do you see them?",
    ],
  },
  {
    re: /\b(weather|rain|raining|snow|sunny|cold|hot|summer|winter|autumn|spring)\b/i,
    replies: [
      "I know what you mean. Which season do you like best?",
      "Right. Does the weather change your plans much?",
      "Same here. What do you usually do on a rainy day?",
    ],
  },
  {
    re: /\b(weekend|today|yesterday|tomorrow|plan|plans|tonight|morning|evening)\b/i,
    replies: [
      "Sounds like a good plan. Anything else on your list?",
      "Nice. How did that go?",
      "That sounds relaxing. Do you get much free time these days?",
    ],
  },
]

const QUESTION_REPLIES = [
  "That's a good question. In my experience, it depends a lot on the person — what do you think?",
  "Good question! I'd say it's worth trying, and you can always change your mind. What about you?",
  "Hmm, I'm not totally sure, to be honest. What made you curious about that?",
]

const SHORT_REPLIES = [
  "Got it. Can you say a little more about that?",
  "I see. And how do you feel about it?",
  "Okay! Tell me more — I'm listening.",
]

const FALLBACKS = [
  "That's really interesting. Tell me more about that.",
  "I see what you mean. How did that make you feel?",
  "Nice, thanks for sharing. What do you like most about it?",
  "That makes sense. And what happened next?",
  "Interesting! Is that something you do often?",
  "Good point. Has it always been like that for you?",
  "I'm with you. What would you change if you could?",
]

/**
 * @param {string} text 用户刚说的话
 * @param {Array} history 之前的对话（用于轮换，避免重复同一句）
 */
export function localFreeTalkReply(text, history = []) {
  const clean = String(text || '').trim()
  const seed = history.length + clean.length

  if (/\?\s*$/.test(clean)) {
    return QUESTION_REPLIES[seed % QUESTION_REPLIES.length]
  }

  const topic = TOPICS.find((t) => t.re.test(clean))
  if (topic) return topic.replies[seed % topic.replies.length]

  const wordCount = clean.split(/\s+/).filter(Boolean).length
  if (wordCount <= 3) return SHORT_REPLIES[seed % SHORT_REPLIES.length]

  return FALLBACKS[seed % FALLBACKS.length]
}

export const FREE_TALK_GREETING =
  "Hi! I'm your English speaking coach. Let's just chat — tell me about your day, your work, or anything you'd like to talk about."
