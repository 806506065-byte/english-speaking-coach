/**
 * 本地纠错引擎
 * 规则来源：english-coach（三段式纠错标签）+ english-tutor（两遍分析：先改错，再母语化）
 *
 * 标签体系：Spelling / Grammar / Word Choice / Punctuation / Expression
 */

const TAGS = ['Spelling', 'Grammar', 'Word Choice', 'Punctuation', 'Expression']

export const TAG_LABEL = {
  Spelling: '拼写',
  Grammar: '语法',
  'Word Choice': '用词',
  Punctuation: '标点',
  Expression: '地道表达',
}

export const TAG_ORDER = TAGS

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/* ---------------------------------------------------------------
   第一遍：拼写与语法错误
   --------------------------------------------------------------- */

const SPELLING_RULES = [
  [/\bim\b/gi, "I'm", 'I am 的缩写是 I\'m，别忘了撇号。'],
  [/\bdont\b/gi, "don't", 'do not 的缩写是 don\'t。'],
  [/\bcant\b/gi, "can't", 'cannot 的缩写是 can\'t。'],
  [/\bwont\b/gi, "won't", 'will not 的缩写是 won\'t。'],
  [/\bthats\b/gi, "that's", 'that is 的缩写是 that\'s。'],
  [/\bdoesnt\b/gi, "doesn't", 'does not 的缩写是 doesn\'t。'],
  [/\bdidnt\b/gi, "didn't", 'did not 的缩写是 didn\'t。'],
  [/\bive\b/gi, "I've", 'I have 的缩写是 I\'ve。'],
  [/\bwanna\b/gi, 'want to', '口语缩略 want to，正式书写与考试中建议写全。'],
  [/\bgonna\b/gi, 'going to', '口语缩略 going to，正式书写中建议写全。'],
  [/\bgotta\b/gi, 'have got to', '口语缩略，正式场合建议写 have got to。'],
  [/\bkinda\b/gi, 'kind of', '口语缩略 kind of。'],
  [/\balot\b/gi, 'a lot', 'a lot 是两个词。'],
  [/\bteh\b/gi, 'the', '拼写笔误。'],
  [/\brecieve\b/gi, 'receive', 'i 在 e 前，除了 c 之后：receive。'],
  [/\bdefinately\b/gi, 'definitely', '拼写应为 definitely。'],
  [/\bseperate\b/gi, 'separate', '拼写应为 separate。'],
  [/\buntill\b/gi, 'until', 'until 只有一个 l。'],
]

const GRAMMAR_RULES = [
  [/\bi\s+am\s+agree\b/gi, 'I agree', 'agree 本身就是动词，不说 I am agree。'],
  [/\bi\s+very\s+like\b/gi, 'I really like', '修饰动词用 really，不用 very。'],
  [/\bvery\s+much\s+like\b/gi, 'like … a lot', '更自然的说法：I like it a lot。'],
  [/\bmore\s+better\b/gi, 'better', 'better 已经是比较级，不用再加 more。'],
  [/\bmore\s+easier\b/gi, 'easier', 'easier 已经是比较级。'],
  [/\bdiscuss\s+about\b/gi, 'discuss', 'discuss 是及物动词，后面不加 about。'],
  [/\bexplain\s+me\b/gi, 'explain to me', 'explain 后面要加 to：explain to me。'],
  [/\baccording\s+to\s+my\s+opinion\b/gi, 'in my opinion', '固定搭配是 in my opinion。'],
  [/\bhow\s+to\s+say\b/gi, 'how do you say', '问怎么说是 How do you say…，不是 How to say。'],
  [/\bi\s+have\s+(\d+)\s+years?\s+old\b/gi, 'I am $1 years old', '年龄用 be 动词：I am 25 years old。'],
  [/\bhe\s+go\b/g, 'he goes', '第三人称单数动词要加 s。'],
  [/\bshe\s+go\b/g, 'she goes', '第三人称单数动词要加 s。'],
  [/\bhe\s+like\b/g, 'he likes', '第三人称单数动词要加 s。'],
  [/\bshe\s+like\b/g, 'she likes', '第三人称单数动词要加 s。'],
  [/\bpeople\s+is\b/gi, 'people are', 'people 是复数，搭配 are。'],
  [/\bpeoples\b/gi, 'people', 'people 已是复数形式，不加 s。'],
  [/\binformations\b/gi, 'information', 'information 不可数，没有复数。'],
  [/\badvices\b/gi, 'advice', 'advice 不可数，没有复数。'],
  [/\btwo\s+luggage\b/gi, 'two pieces of luggage', 'luggage 不可数，用 pieces of。'],
  [/\bsuggest\s+me\b/gi, 'suggest to me', 'suggest 后面常接 to sb. 或动名词。'],
  [/\bdepends?of\b/gi, 'depends on', '固定搭配是 depend on。'],
  [/\bmarried\s+with\b/gi, 'married to', '固定搭配是 married to。'],
]

/* ---------------------------------------------------------------
   第二遍：母语化升级（english-tutor 的 Native Expression Suggestions）
   --------------------------------------------------------------- */

const EXPRESSION_RULES = [
  [/\bi\s+want\s+(a|an|the)?\s*/gi, "I'd like ", '点单 / 请求时用 I\'d like 比 I want 更礼貌。'],
  [/\bvery\s+good\b/gi, 'excellent', 'excellent / great 比 very good 更有力。'],
  [/\bvery\s+bad\b/gi, 'terrible', 'terrible / awful 比 very bad 更地道。'],
  [/\bvery\s+tired\b/gi, 'exhausted', 'exhausted 比 very tired 更精确。'],
  [/\bvery\s+happy\b/gi, 'delighted', 'delighted / thrilled 是更地道的搭配。'],
  [/\bi\s+think\s+that\b/gi, 'I think', '口语中 that 常省略，更顺。'],
  [/\bgive\s+you\b/gi, 'here you are', '递东西时说 Here you are / Here you go。'],
  [/\bopen\s+the\s+light\b/gi, 'turn on the light', '开灯用 turn on the light。'],
  [/\bclose\s+the\s+light\b/gi, 'turn off the light', '关灯用 turn off the light。'],
  [/\bwhat'?s\s+your\s+meaning\b/gi, 'what do you mean', '问“你什么意思”用 What do you mean?'],
  [/\bmy\s+english\s+is\s+very\s+poor\b/gi, "my English isn't great yet", '谦逊且积极的表达更好听。'],
  [/\bi\s+am\s+very\s+happy\s+to\s+meet\s+you\b/gi, "it's great to meet you", '初次见面 It\'s great to meet you 更自然。'],
]

const CHOICE_RULES = [
  [/\btalk\s+with\b/gi, 'talk to', 'talk to sb. 更常用（talk with 强调双向）。'],
  [/\blook\s+forward\s+to\s+see\b/gi, 'look forward to seeing', 'look forward to 后面接动名词。'],
  [/\binteresting\s+in\b/gi, 'interested in', '人做主语用 interested，物用 interesting。'],
  [/\bbored\s+of\b/gi, 'bored with', '固定搭配 be bored with。'],
  [/\bmake\s+a\s+photo\b/gi, 'take a photo', '拍照用 take a photo。'],
]

const ALL_RULES = [
  ...SPELLING_RULES.map((r) => ({ tag: 'Spelling', source: r[0], to: r[1], note: r[2] })),
  ...GRAMMAR_RULES.map((r) => ({ tag: 'Grammar', source: r[0], to: r[1], note: r[2] })),
  ...CHOICE_RULES.map((r) => ({ tag: 'Word Choice', source: r[0], to: r[1], note: r[2] })),
  ...EXPRESSION_RULES.map((r) => ({ tag: 'Expression', source: r[0], to: r[1], note: r[2] })),
]

/** 需要冠词的常见可数名词（用于补 a/an） */
const COUNTABLE_NOUNS = [
  'latte', 'coffee', 'cappuccino', 'americano', 'mocha', 'espresso', 'tea', 'drink',
  'croissant', 'muffin', 'sandwich', 'bag', 'suitcase', 'room', 'seat', 'reservation',
  'booking', 'ticket', 'passport', 'question', 'project', 'coffee',
]

const VOWELS = /^[aeiou]/i

/* ---------------------------------------------------------------
   主流程
   --------------------------------------------------------------- */

function normalize(text) {
  let out = String(text || '')
  out = out.replace(/\s+/g, ' ').trim()
  return out
}

/**
 * 对一段英文做两遍分析。
 * @returns {{ original, corrected, corrections: Array<{tag,old,new,note}>, byTag: object }}
 */
export function analyzeText(rawInput) {
  const original = normalize(rawInput)
  const corrections = []
  if (!original) return { original, corrected: '', corrections, byTag: {} }

  let text = original

  const push = (tag, old, neu, note) => {
    if (!old || old === neu) return
    if (corrections.some((c) => c.tag === tag && c.old === old && c.new === neu)) return
    corrections.push({ tag, old, new: neu, note })
  }

  const applyRule = (rule) => {
    const base = rule.source.flags.replace('g', '')
    const globalRe = new RegExp(rule.source.source, base + 'g')
    const singleRe = new RegExp(rule.source.source, base)
    const matches = text.match(globalRe)
    if (!matches) return
    text = text.replace(globalRe, rule.to)
    matches.forEach((m) => push(rule.tag, m, m.replace(singleRe, rule.to), rule.note))
  }

  /* --- 标点清理 --- */
  const spaceBeforePunct = text.match(/\s+([,.!?;:])/g)
  if (spaceBeforePunct) {
    text = text.replace(/\s+([,.!?;:])/g, '$1')
    push('Punctuation', spaceBeforePunct[0], spaceBeforePunct[0].trim(), '标点前不要空格。')
  }

  /* --- 规则替换 --- */
  ALL_RULES.forEach(applyRule)

  /* --- 补冠词：I'd like latte -> I'd like a latte --- */
  const nounGroup = COUNTABLE_NOUNS.map(escapeRegExp).join('|')
  const articleRe = new RegExp(
    `\\b(I'd like|I would like|I'll take|I want|I need|can I get|can I have|I have)\\s+((?:${nounGroup}))\\b`,
    'gi',
  )
  const articleMatches = text.match(articleRe)
  if (articleMatches) {
    text = text.replace(articleRe, (full, verb, noun) => {
      const art = VOWELS.test(noun) ? 'an' : 'a'
      push('Grammar', full, `${verb} ${art} ${noun}`, '可数名词单数前需要冠词 a / an。')
      return `${verb} ${art} ${noun}`
    })
  }

  /* --- 句首大写 --- */
  const capMatch = text.match(/^([^a-zA-Z]*)([a-z])/)
  if (capMatch) {
    const upper = capMatch[2].toUpperCase()
    push('Punctuation', capMatch[1] + capMatch[2], capMatch[1] + upper, '句子首字母要大写。')
    text = text.replace(/^([^a-zA-Z]*)([a-z])/, `$1${upper}`)
  }

  /* --- 结尾标点 --- */
  if (!/[.!?]$/.test(text)) {
    const isQuestion = /^(what|where|when|who|whom|whose|why|how|which|do|does|did|is|are|am|was|were|can|could|would|will|should|shall|may|might|have|has|had|any)\b/i.test(
      text,
    )
    const punct = isQuestion ? '?' : '.'
    push('Punctuation', text, text + punct, isQuestion ? '疑问句结尾用问号。' : '句子结尾要有标点。')
    text += punct
  }

  const byTag = {}
  corrections.forEach((c) => {
    byTag[c.tag] = (byTag[c.tag] || 0) + 1
  })

  return { original, corrected: text, corrections, byTag }
}

/* ---------------------------------------------------------------
   评分与对话匹配
   --------------------------------------------------------------- */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function normalizeForMatch(text) {
  return ` ${String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
}

/**
 * 评估用户一轮回答。
 * @param {string} text 用户原话
 * @param {object} beat 当前 beat（含 expect 关键词组 / hints / tip）
 */
export function evaluateTurn(text, beat) {
  const { corrections, corrected } = analyzeText(text)
  const haystack = normalizeForMatch(text)
  const groups = (beat && beat.expect) || []

  const hits = groups.map((group) =>
    group.some((kw) => haystack.includes(String(kw).toLowerCase())),
  )
  const coverage = groups.length ? hits.filter(Boolean).length / groups.length : 1

  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length

  let fluency = 100
  if (wordCount < 4) fluency -= (4 - wordCount) * 14
  if (wordCount > 32) fluency -= (wordCount - 32) * 1.5
  corrections.forEach((c) => {
    if (c.tag === 'Spelling' || c.tag === 'Grammar') fluency -= 8
    else if (c.tag === 'Word Choice' || c.tag === 'Expression') fluency -= 3
    else fluency -= 2
  })
  fluency = clamp(Math.round(fluency), 25, 100)

  const content = clamp(Math.round(coverage * 100), 0, 100)
  const score = clamp(Math.round(content * 0.6 + fluency * 0.4), 0, 100)

  /* 词差异视图 */
  const diff = groups.map((group, i) => ({
    word: group[0],
    status: hits[i] ? 'ok' : 'miss',
  }))
  groups.forEach((group, i) => {
    if (hits[i]) return
    const close = group.some((kw) => {
      const k = String(kw).toLowerCase()
      return k.length > 4 && haystack.includes(k.slice(0, Math.max(4, k.length - 2)))
    })
    if (close) diff[i].status = 'close'
  })

  const stop = new Set([
    'i', 'a', 'an', 'the', 'is', 'am', 'are', 'to', 'of', 'and', 'in', 'on', 'at',
    'it', 'my', 'me', 'you', 'your', 'for', 'that', 'this', 'be', 'do', 'so', 'not',
  ])
  const known = new Set(groups.flat().map((k) => String(k).toLowerCase()))
  const extras = words
    .map((w) => w.toLowerCase().replace(/[^a-z'-]/g, ''))
    .filter((w) => w.length > 3 && !stop.has(w) && !known.has(w))
    .slice(0, 3)
  extras.forEach((w) => diff.push({ word: w, status: 'extra' }))

  const upgrades = corrections
    .filter((c) => c.tag === 'Expression' || c.tag === 'Word Choice')
    .map((c) => ({ old: c.old, new: c.new, note: c.note }))

  return {
    original: String(text || ''),
    corrected,
    corrections,
    hits,
    coverage,
    content,
    fluency,
    score,
    wordCount,
    diff,
    upgrades,
  }
}

/* ---------------------------------------------------------------
   跟读比对（目标句 vs 识别结果）
   --------------------------------------------------------------- */

function tokens(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * 用 LCS 做词级对齐，返回 ok / miss / extra 序列。
 */
export function compareSpeech(target, said) {
  const a = tokens(target)
  const b = tokens(said)

  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const result = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ word: a[i], type: 'ok' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ word: a[i], type: 'miss' })
      i++
    } else {
      result.push({ word: b[j], type: 'extra' })
      j++
    }
  }
  while (i < a.length) result.push({ word: a[i++], type: 'miss' })
  while (j < b.length) result.push({ word: b[j++], type: 'extra' })

  const ok = result.filter((r) => r.type === 'ok').length
  const accuracy = a.length ? Math.round((ok / a.length) * 100) : 0
  return { words: result, accuracy }
}

/* ---------------------------------------------------------------
   汇总：把多轮结果合成一份「两遍纠错报告」
   --------------------------------------------------------------- */

/**
 * @param {Array} turns [{ original, corrected, corrections, score }]
 */
export function buildReport(turns = []) {
  const clean = turns.filter((t) => t && t.original)
  const grammarNotes = []
  const nativeSuggestions = []
  const counter = {}

  clean.forEach((t) => {
    (t.corrections || []).forEach((c) => {
      const key = `${c.tag}|${c.old}|${c.new}`
      counter[key] = (counter[key] || 0) + 1
      if (counter[key] === 1) {
        const row = { tag: c.tag, old: c.old, new: c.new, note: c.note, count: 1 }
        if (c.tag === 'Expression' || c.tag === 'Word Choice') nativeSuggestions.push(row)
        else grammarNotes.push(row)
      } else {
        const pool = [...grammarNotes, ...nativeSuggestions]
        const found = pool.find((r) => `${r.tag}|${r.old}|${r.new}` === key)
        if (found) found.count = counter[key]
      }
    })
  })

  const totalSentences = clean.length
  const totalErrors = clean.reduce((n, t) => n + (t.corrections || []).length, 0)
  const avgScore = totalSentences
    ? Math.round(clean.reduce((n, t) => n + (t.score || 0), 0) / totalSentences)
    : 0

  const byTag = {}
  clean.forEach((t) =>
    (t.corrections || []).forEach((c) => {
      byTag[c.tag] = (byTag[c.tag] || 0) + 1
    }),
  )

  const recurring = [...grammarNotes, ...nativeSuggestions]
    .filter((r) => r.count > 1)
    .sort((x, y) => y.count - x.count)
    .slice(0, 5)

  let summary = '继续保持，你的表达已经能支撑完整对话了。'
  if (!totalSentences) summary = '还没有练习记录，先去场景练习页聊一轮吧。'
  else if (avgScore >= 88) summary = '整体非常流利，错误稀少，可以尝试更高难度场景或自由对话。'
  else if (avgScore >= 72) summary = '表达清晰、少量错误，重点打磨时态与冠词会更上一层。'
  else if (avgScore >= 55) summary = '能完成交流，但语法与用词错误偏多，建议先固定句式再扩展。'

  return {
    totalSentences,
    totalErrors,
    avgScore,
    byTag,
    grammarNotes,
    nativeSuggestions,
    recurring,
    summary,
  }
}
