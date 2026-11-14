/**
 * Web Speech API 封装
 * - 语音识别：webkitSpeechRecognition / SpeechRecognition（Chrome / Edge）
 * - 语音朗读：speechSynthesis
 */

import { useCallback, useEffect, useRef, useState } from 'react'

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

let cachedVoices = []

export function primeVoices() {
  if (!speechSynthesisSupported()) return
  const load = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
  load()
  if (!cachedVoices.length) {
    window.speechSynthesis.addEventListener('voiceschanged', load, { once: true })
  }
}

function pickVoice(lang) {
  if (cachedVoices.length === 0) cachedVoices = window.speechSynthesis.getVoices()
  const exact = cachedVoices.find((v) => v.lang === lang)
  if (exact) return exact
  const sameLocale = cachedVoices.find((v) => v.lang?.replace('_', '-').startsWith(lang.split('-')[0]))
  if (sameLocale) return sameLocale
  return cachedVoices.find((v) => /^en/i.test(v.lang)) || null
}

/**
 * 朗读一段英文。
 * @returns 是否成功发起朗读
 */
export function speak(text, { lang = 'en-US', rate = 0.95, onStart, onEnd } = {}) {
  if (!speechSynthesisSupported() || !text) {
    onEnd?.()
    return false
  }
  const synth = window.speechSynthesis
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(String(text))
  utter.lang = lang
  utter.rate = rate
  utter.pitch = 1
  const voice = pickVoice(lang)
  if (voice) utter.voice = voice

  utter.onstart = () => onStart?.()
  utter.onend = () => onEnd?.()
  utter.onerror = () => onEnd?.()

  synth.speak(utter)
  return true
}

export function stopSpeaking() {
  if (speechSynthesisSupported()) window.speechSynthesis.cancel()
}

/**
 * 语音识别 Hook。
 * @param {{ lang?: string, onFinal?: (text: string) => void, onInterim?: (text: string) => void }} options
 */
export function useSpeechInput({ lang = 'en-US', onFinal, onInterim } = {}) {
  const Ctor = getRecognitionCtor()
  const supported = !!Ctor

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')

  const recRef = useRef(null)
  const finalRef = useRef('')
  const onFinalRef = useRef(onFinal)
  const onInterimRef = useRef(onInterim)
  const keepAliveRef = useRef(false)

  onFinalRef.current = onFinal
  onInterimRef.current = onInterim

  const stop = useCallback(() => {
    keepAliveRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* 已停止 */
    }
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!Ctor) {
      setError('当前浏览器不支持语音识别，请改用 Chrome 或 Edge，或直接输入文字。')
      return
    }
    try {
      recRef.current?.abort()
    } catch {
      /* ignore */
    }

    const rec = new Ctor()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = true
    rec.maxAlternatives = 1

    finalRef.current = ''
    setInterim('')
    setError('')

    rec.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const chunk = result[0]?.[0] || ''
        if (result.isFinal) finalRef.current += chunk
        else interimText += chunk
      }
      const shown = (finalRef.current + interimText).trim()
      setInterim(shown)
      onInterimRef.current?.(shown)
    }

    rec.onerror = (event) => {
      const code = event?.error
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setError('麦克风权限被拒绝，请在浏览器地址栏允许麦克风访问。')
      } else if (code === 'no-speech') {
        setError('没有检测到语音，请靠近麦克风再说一次。')
      } else if (code !== 'aborted') {
        setError(`语音识别出错：${code || '未知原因'}`)
      }
      keepAliveRef.current = false
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
      const text = finalRef.current.trim()
      if (text) onFinalRef.current?.(text)
      setInterim('')
      keepAliveRef.current = false
    }

    recRef.current = rec
    try {
      rec.start()
      keepAliveRef.current = true
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [Ctor, lang])

  useEffect(
    () => () => {
      keepAliveRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    },
    [],
  )

  return { supported, listening, interim, error, start, stop, setError }
}
