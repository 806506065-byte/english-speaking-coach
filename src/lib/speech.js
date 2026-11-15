/**
 * 语音模块
 * - 朗读：优先使用云端神经网络 TTS（/audio/speech），否则回退系统语音
 * - 音色：自动排序，优先选 Natural / Neural / Online 等真人感更强的音色
 * - 识别：Web Speech API，支持连续 / 单轮两种模式
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================================
   浏览器能力探测
   ============================================================ */

export function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function speechRecognitionSupported() {
  return !!getRecognitionCtor()
}

export function speechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/* ============================================================
   音色挑选
   ============================================================ */

/** 加分项：越靠前越像真人 */
const VOICE_BONUS = [
  [/natural|neural/i, 120],
  [/google/i, 80],
  [/online/i, 70],
  [/enhanced|premium|multilingual/i, 60],
  [/siri|aria|jenny|guy|ava|emma|andrew|brian/i, 40],
]

/** 扣分项：老式机械音 */
const VOICE_PENALTY = [
  [/^microsoft\s+(david|zira|mark|hazel|george|susan)/i, -80],
  [/espeak|festival|compact|robot|sam\b/i, -120],
]

export function rankVoice(voice) {
  if (!voice) return -999
  const label = `${voice.name} ${voice.voiceURI}`
  let score = 0
  VOICE_BONUS.forEach(([re, s]) => {
    if (re.test(label)) score += s
  })
  VOICE_PENALTY.forEach(([re, s]) => {
    if (re.test(label)) score += s
  })
  if (/^en[-_]US/i.test(voice.lang)) score += 30
  else if (/^en[-_]GB/i.test(voice.lang)) score += 24
  else if (/^en/i.test(voice.lang)) score += 15
  if (voice.localService === false) score += 10
  if (voice.default) score += 5
  return score
}

export function listVoices() {
  if (!speechSynthesisSupported()) return []
  return window.speechSynthesis
    .getVoices()
    .slice()
    .sort((a, b) => rankVoice(b) - rankVoice(a))
}

/** 判断一个音色是不是「真人感强」的神经网络音色，用于界面打标 */
export function isNaturalVoice(voice) {
  if (!voice) return false
  return /natural|neural|online|google|enhanced|multilingual/i.test(`${voice.name} ${voice.voiceURI}`)
}

export function bestVoice(voices, preferredURI) {
  if (preferredURI) {
    const picked = voices.find((v) => v.voiceURI === preferredURI)
    if (picked) return picked
  }
  return voices.find((v) => /^en/i.test(v.lang)) || voices[0] || null
}

/** 订阅浏览器音色列表（首次加载是异步的） */
export function useVoices() {
  const [voices, setVoices] = useState(() => listVoices())

  useEffect(() => {
    if (!speechSynthesisSupported()) return undefined
    const update = () => setVoices(listVoices())
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    const timers = [200, 700, 1500].map((ms) => window.setTimeout(update, ms))
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  return voices
}

export function primeVoices() {
  if (!speechSynthesisSupported()) return
  try {
    window.speechSynthesis.getVoices()
  } catch {
    /* ignore */
  }
}

/* ============================================================
   朗读
   ============================================================ */

/** 云端 TTS 可选音色（OpenAI 兼容 /audio/speech） */
export const CLOUD_VOICES = [
  { id: 'nova', label: 'Nova · 女声，明亮亲和' },
  { id: 'shimmer', label: 'Shimmer · 女声，柔和温暖' },
  { id: 'alloy', label: 'Alloy · 中性，平稳自然' },
  { id: 'echo', label: 'Echo · 男声，沉稳' },
  { id: 'fable', label: 'Fable · 中性，有叙事感' },
  { id: 'onyx', label: 'Onyx · 男声，低沉厚实' },
]

const NATIVE_FALLBACK_LANG = 'en-US'
const DEFAULT_CLOUD_BASE = 'https://api.openai.com/v1'

/** 描述当前实际会使用的音色，用于设置页展示与诊断 */
export function currentVoiceLabel(settings, voices) {
  if (settings?.ttsEngine === 'cloud' && String(settings?.apiKey || '').trim()) {
    const picked = CLOUD_VOICES.find((c) => c.id === settings.ttsCloudVoice)
    return {
      label: `云端神经语音 · ${picked ? picked.label : settings.ttsCloudVoice}`,
      natural: true,
      cloud: true,
    }
  }
  const list = voices && voices.length ? voices : listVoices()
  const voice = bestVoice(list, settings?.ttsVoiceURI)
  if (!voice) return { label: '未检测到本机音色（浏览器不支持语音合成）', natural: false, cloud: false }
  return { label: `${voice.name} · ${voice.lang}`, natural: isNaturalVoice(voice), cloud: false }
}

let currentAudio = null
let objectUrls = []

function clamp(n, min, max) {
  const v = Number(n)
  if (!Number.isFinite(v)) return (min + max) / 2
  return Math.max(min, Math.min(max, v))
}

export function stopSpeech() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
  objectUrls.forEach((u) => {
    try {
      URL.revokeObjectURL(u)
    } catch {
      /* ignore */
    }
  })
  objectUrls = []
}

function speakNative(text, settings, onStart) {
  return new Promise((resolve) => {
    if (!speechSynthesisSupported()) {
      resolve()
      return
    }
    const synth = window.speechSynthesis
    const utter = new SpeechSynthesisUtterance(text)
    const voices = listVoices()
    const voice = bestVoice(voices, settings?.ttsVoiceURI)

    if (voice) utter.voice = voice
    utter.lang = voice?.lang || NATIVE_FALLBACK_LANG
    utter.rate = clamp(settings?.ttsRate ?? 1, 0.5, 1.6)
    utter.pitch = clamp(settings?.ttsPitch ?? 1, 0.5, 1.6)
    utter.volume = 1

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    utter.onstart = () => onStart?.()
    utter.onend = finish
    utter.onerror = finish

    // 兜底：部分浏览器 onend 不触发
    const guard = window.setTimeout(finish, Math.max(6000, text.length * 120))

    const done = () => {
      window.clearTimeout(guard)
      finish()
    }
    utter.onend = done
    utter.onerror = done

    synth.speak(utter)
  })
}

async function speakCloud(text, settings, onStart) {
  const apiKey = String(settings?.apiKey || '').trim()
  if (!apiKey) throw new Error('未配置 API Key')

  const base = String(settings?.baseUrl || DEFAULT_CLOUD_BASE).trim().replace(/\/+$/, '')
  const url = /\/audio\/speech$/.test(base) ? base : `${base}/audio/speech`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings?.ttsModel || 'tts-1',
      voice: settings?.ttsCloudVoice || 'nova',
      input: text,
      response_format: 'mp3',
      speed: clamp(settings?.ttsRate ?? 1, 0.5, 1.6),
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || ''
    } catch {
      detail = ''
    }
    throw new Error(`语音合成失败（HTTP ${res.status}）${detail ? `：${detail.slice(0, 120)}` : ''}`)
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  objectUrls.push(objectUrl)

  await new Promise((resolve, reject) => {
    const audio = new Audio(objectUrl)
    currentAudio = audio
    audio.onplay = () => onStart?.()
    audio.onended = resolve
    audio.onerror = () => reject(new Error('音频播放失败'))
    const p = audio.play()
    if (p && typeof p.then === 'function') p.catch(reject)
  }).finally(() => {
    currentAudio = null
  })
}

/**
 * 统一朗读入口：根据设置自动选择云端神经语音或系统语音。
 * 返回的 Promise 在朗读结束时 resolve，方便「通话模式」串起对话循环。
 */
export async function speakText(text, settings, { onStart, onError } = {}) {
  const clean = String(text || '').trim()
  if (!clean) return

  const busy = speechSynthesisSupported() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)
  stopSpeech()
  if (busy) await new Promise((r) => window.setTimeout(r, 60))

  const useCloud = settings?.ttsEngine === 'cloud' && String(settings?.apiKey || '').trim()

  if (useCloud) {
    try {
      await speakCloud(clean, settings, onStart)
      return
    } catch (err) {
      onError?.(err?.message || String(err))
    }
  }

  await speakNative(clean, settings, onStart)
}

/* ============================================================
   语音识别
   ============================================================ */

const MIC_ERRORS = {
  'not-allowed': '麦克风权限被拒绝，请点地址栏左侧的锁图标允许「麦克风」后重试。',
  'service-not-allowed': '浏览器阻止了语音识别服务，请检查权限设置，或改用 Edge 浏览器。',
  'audio-capture': '没有找到可用的麦克风设备，请检查系统录音设备。',
  'language-not-supported': '该语言不被当前浏览器支持。',
  network: '语音识别服务连接失败：Chrome 的识别依赖在线服务，国内网络可能不可达，建议改用 Edge 浏览器。',
}

/**
 * @param {object} options
 * @param {string} options.lang 识别语言
 * @param {boolean} options.continuous 连续模式（true 需手动停止；false 说完自动结束）
 * @param {(text: string) => void} options.onResult 一轮识别结束时回调，text 可能为空字符串
 * @param {(text: string) => void} options.onInterim 实时中间结果
 */
export function useSpeechInput({ lang = 'en-US', continuous = false, onResult, onInterim } = {}) {
  const Ctor = getRecognitionCtor()
  const supported = !!Ctor

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')

  const recRef = useRef(null)
  const finalRef = useRef('')
  const shownRef = useRef('')
  const resultRef = useRef(onResult)
  const interimRef = useRef(onInterim)

  resultRef.current = onResult
  interimRef.current = onInterim

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* 已停止 */
    }
    setListening(false)
  }, [])

  const abort = useCallback(() => {
    const rec = recRef.current
    if (rec) {
      rec.__cancelled = true
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    }
    finalRef.current = ''
    shownRef.current = ''
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    if (!Ctor) {
      setError('当前浏览器不支持语音识别，请改用 Chrome 或 Edge，或直接键盘输入。')
      return
    }
    // 丢弃上一个实例的残留结果，避免误触发回调
    const prev = recRef.current
    if (prev) {
      prev.__cancelled = true
      try {
        prev.abort()
      } catch {
        /* ignore */
      }
    }

    const rec = new Ctor()
    rec.__cancelled = false
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = continuous
    rec.maxAlternatives = 1

    finalRef.current = ''
    shownRef.current = ''
    setInterim('')
    setError('')

    rec.onresult = (event) => {
      if (rec.__cancelled) return
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        // results[i][0] 是 SpeechRecognitionAlternative 对象，文本在 .transcript 上
        const chunk = result[0]?.transcript || ''
        if (result.isFinal) finalRef.current += chunk
        else interimText += chunk
      }
      const shown = (finalRef.current + interimText).trim()
      shownRef.current = shown
      setInterim(shown)
      interimRef.current?.(shown)
    }

    rec.onerror = (event) => {
      if (rec.__cancelled) return
      const code = event?.error
      if (code !== 'aborted' && code !== 'no-speech') {
        setError(MIC_ERRORS[code] || `语音识别出错：${code || '未知原因'}`)
      }
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
      if (rec.__cancelled) return
      // 少数情况识别不返回 final 结果，用最后一次实时文本兜底
      const text = (finalRef.current || shownRef.current).trim()
      finalRef.current = ''
      shownRef.current = ''
      setInterim('')
      resultRef.current?.(text)
    }

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch (err) {
      setListening(false)
      setError(`无法启动麦克风：${err?.message || err}`)
    }
  }, [Ctor, continuous, lang])

  useEffect(
    () => () => {
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    },
    [],
  )

  return { supported, listening, interim, error, start, stop, abort, setError }
}
