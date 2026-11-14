/**
 * 对话引擎
 * - local：内置场景脚本，免 API Key，纯前端运行
 * - llm  ：OpenAI 兼容接口（/chat/completions），自由对话 + 智能纠错
 *
 * 纠错提示词逻辑来自 english-coach（三段式）+ english-tutor（两遍分析）。
 */

import { analyzeText, evaluateTurn } from './corrections.js'

export const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_MODEL = 'gpt-4o-mini'

function endpoint(baseUrl) {
  const base = String(baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '')
  if (/\/chat\/completions$/.test(base)) return base
  return `${base}/chat/completions`
}

/** 从模型返回里抽出 JSON（兼容被 ```json 包裹或夹杂解释文字的情况） */
function extractJson(content) {
  if (!content) return null
  const text = String(content).trim()
  try {
    return JSON.parse(text)
  } catch {
    /* 继续尝试抽取 */
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch {
      /* 继续 */
    }
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      return null
    }
  }
  return null
}

function normalizeCorrections(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((c) => c && (c.old || c.wrong || c.original))
    .slice(0, 6)
    .map((c) => ({
      tag: c.tag || c.type || 'Expression',
      old: String(c.old || c.wrong || c.original || ''),
      new: String(c.new || c.right || c.fixed || c.suggestion || ''),
      note: String(c.note || c.reason || c.explanation || ''),
    }))
}

async function callChat(settings, messages, { json = false, temperature = 0.7 } = {}) {
  const apiKey = String(settings.apiKey || '').trim()
  if (!apiKey) throw new Error('未配置 API Key')

  const res = await fetch(endpoint(settings.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || DEFAULT_MODEL,
      temperature,
      messages,
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || data?.message || ''
    } catch {
      detail = await res.text().catch(() => '')
    }
    throw new Error(`请求失败（HTTP ${res.status}）${detail ? `：${String(detail).slice(0, 180)}` : ''}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content ?? ''
  if (json) return extractJson(content) ?? { reply: String(content || '').trim() }
  return String(content || '').trim()
}

/* ---------------------------------------------------------------
   场景模式：角色扮演 + 结构化反馈
   --------------------------------------------------------------- */

function buildScenarioPrompt(scenario, settings) {
  const levelTip = {
    beginner: '学习者水平：入门。用词简单、语速慢、句子短。',
    intermediate: '学习者水平：进阶。可用常见习语，句子可稍长。',
    advanced: '学习者水平：高阶。可用地道表达与学术语域。',
  }[settings.level] || ''

  const script = scenario.beats?.length
    ? scenario.beats
        .map((b, i) => `${i + 1}. 你说：${b.ai}\n   期望学习者回应方向：${b.hints?.join(' / ') || '—'}`)
        .join('\n')
    : '（自由对话，无固定脚本，请自行推进话题）'

  return `你是一位英语口语陪练（EchoSpeak Coach）。当前进行角色扮演练习。

【场景】${scenario.title} / ${scenario.titleEn}
【你的角色】${scenario.aiRole}
【学习者角色】${scenario.userRole}
【场景目标】${scenario.goal}
${levelTip}

【参考脚本（可灵活变通，不要死板照念）】
${script}

【回答要求】
1. reply：始终用英文，保持角色，自然接话。1-3 句，且结尾尽量用一个问题把话递回给学习者。
2. corrections：指出学习者这句话里的错误。tag 只能用 Spelling / Grammar / Word Choice / Punctuation / Expression 之一。old 是原句里的问题片段，new 是修改后的片段。最多 5 条，没有错误就给空数组，不要硬凑。
3. upgrades：0-3 条更地道的说法。old 是学习者原话，new 是母语者更常用的说法，note 用中文解释为什么更地道。
4. score：0-100 的综合口语评分。
5. comment：一句中文点评，指出本轮最值得改的一点。

只输出 JSON，不要任何额外文字：
{"reply":"","corrections":[{"tag":"","old":"","new":"","note":""}],"upgrades":[{"old":"","new":"","note":""}],"score":0,"comment":""}`
}

/**
 * 走大模型完成一轮（场景模式或自由对话）。
 * @returns {{reply, corrections, upgrades, score, comment}}
 */
export async function llmTurn({ settings, scenario, history, userText, beatIndex }) {
  const messages = [{ role: 'system', content: buildScenarioPrompt(scenario, settings) }]

  history.slice(-12).forEach((m) => {
    messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })
  })
  messages.push({ role: 'user', content: userText })

  const data = await callChat(settings, messages, { json: true, temperature: 0.8 })

  const reply = String(data.reply || data.message || '').trim()
  const corrections = normalizeCorrections(data.corrections)
  const upgrades = Array.isArray(data.upgrades)
    ? data.upgrades
        .filter((u) => u && (u.old || u.new))
        .slice(0, 3)
        .map((u) => ({ old: String(u.old || ''), new: String(u.new || ''), note: String(u.note || '') }))
    : []

  if (!reply) throw new Error('模型没有返回有效回复')

  return {
    reply,
    corrections,
    upgrades,
    score: Number.isFinite(Number(data.score)) ? Math.round(Number(data.score)) : null,
    comment: String(data.comment || ''),
  }
}

/* ---------------------------------------------------------------
   报告台：english-tutor 的两遍分析
   --------------------------------------------------------------- */

const REPORT_PROMPT = `你是英语纠错专家。请对用户给的英文做两遍分析：

第一遍（纠错）：找出拼写、语法、标点、用词错误。
第二遍（母语化升级）：在语法正确的前提下，把非母语表达替换成母语者更自然的说法。

输出 JSON：
{
  "corrected": "修改后的完整英文句子",
  "grammarNotes": [{"tag":"Spelling|Grammar|Word Choice|Punctuation","old":"","new":"","note":"中文说明"}],
  "nativeSuggestions": [{"old":"","new":"","note":"中文说明，解释为什么更地道"}],
  "summary": "一句中文总评，指出最需要提高的一点"
}

只输出 JSON，不要额外文字。`

export async function llmAnalyzeText({ settings, text }) {
  const data = await callChat(
    settings,
    [
      { role: 'system', content: REPORT_PROMPT },
      { role: 'user', content: text },
    ],
    { json: true, temperature: 0.3 },
  )
  if (!data || typeof data !== 'object') throw new Error('模型返回内容无法解析')
  return {
    corrected: String(data.corrected || ''),
    grammarNotes: normalizeCorrections(data.grammarNotes),
    nativeSuggestions: Array.isArray(data.nativeSuggestions)
      ? data.nativeSuggestions.map((u) => ({
          old: String(u.old || ''),
          new: String(u.new || ''),
          note: String(u.note || ''),
        }))
      : [],
    summary: String(data.summary || ''),
  }
}

/* ---------------------------------------------------------------
   本地模式
   --------------------------------------------------------------- */

/** 本地：取下一句 AI 台词 */
export function localNextLine(scenario, nextIndex) {
  if (!scenario.beats || nextIndex >= scenario.beats.length) {
    return { text: scenario.closing?.ai || 'Great job! That wraps up this scenario.', done: true }
  }
  return { text: scenario.beats[nextIndex].ai, done: false }
}

/** 本地：评估一轮 */
export function localEvaluate(text, beat) {
  return evaluateTurn(text, beat)
}

/** 本地：文本两遍分析 */
export function localAnalyze(text) {
  const { corrected, corrections } = analyzeText(text)
  const grammarNotes = corrections.filter((c) => c.tag !== 'Expression')
  const nativeSuggestions = corrections.filter((c) => c.tag === 'Expression')
  return {
    corrected,
    grammarNotes,
    nativeSuggestions,
    summary: corrections.length
      ? `共发现 ${corrections.length} 处可改进点，其中地道表达建议 ${nativeSuggestions.length} 条。`
      : '这句话没有问题，表达已经很自然。',
  }
}
