import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FREETALK } from '../data/scenarios.js'
import { llmTurn } from '../lib/engine.js'
import { FREE_TALK_GREETING, localFreeTalkReply } from '../lib/freetalk.js'
import { speakText, speechRecognitionSupported, stopSpeech, useSpeechInput } from '../lib/speech.js'
import { uid } from '../lib/storage.js'

/**
 * 通话模式：全屏「打电话」式自由英语对话。
 * 状态机：connecting → speaking(AI) → listening(你) → thinking(等待回复) → speaking …
 */

const PHASE_TEXT = {
  connecting: '正在接通…',
  speaking: 'Tutor 正在说英语…',
  listening: '轮到你了，请说英语',
  thinking: '正在思考…',
  waiting: '麦克风已关闭，点麦克风继续',
  ended: '通话已结束',
}

const ORB_ICON = {
  connecting: '📞',
  speaking: '🗣️',
  listening: '🎤',
  thinking: '💭',
  waiting: '🎙️',
  ended: '📴',
}

const ORB_STATE = { speaking: 'speaking', listening: 'listening', thinking: 'thinking' }

function formatTime(total) {
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function CallMode({ settings, llmReady, onExit, onOpenSettings }) {
  const micSupported = speechRecognitionSupported()

  const [phase, setPhase] = useState('connecting')
  const [lines, setLines] = useState([])
  const [live, setLive] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [notice, setNotice] = useState('')
  const [speakerOn, setSpeakerOn] = useState(settings.autoSpeak !== false)
  const [micOn, setMicOn] = useState(micSupported)
  const [captionsOn, setCaptionsOn] = useState(true)
  const [typed, setTyped] = useState('')

  const settingsRef = useRef(settings)
  const llmReadyRef = useRef(llmReady)
  const speakerRef = useRef(speakerOn)
  const micRef = useRef(micOn)
  const phaseRef = useRef(phase)
  const linesRef = useRef([])
  const aliveRef = useRef(true)
  const emptyRef = useRef(0)
  const resultRef = useRef(null)
  const captionsRef = useRef(null)

  settingsRef.current = settings
  llmReadyRef.current = llmReady
  speakerRef.current = speakerOn
  micRef.current = micOn
  phaseRef.current = phase

  const { listening, error: micError, start, stop, abort, setError } = useSpeechInput({
    lang: 'en-US',
    continuous: false,
    onInterim: (t) => setLive(t),
    onResult: (t) => resultRef.current?.(t),
  })

  /* 通话计时 */
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      stopSpeech()
    }
  }, [])

  useEffect(() => {
    const el = captionsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, live])

  const pushLine = useCallback((role, text) => {
    const item = { id: uid(), role, text }
    linesRef.current = [...linesRef.current, item]
    setLines(linesRef.current)
  }, [])

  const startListening = useCallback(() => {
    if (!aliveRef.current) return
    if (!micRef.current) {
      setPhase('waiting')
      return
    }
    setLive('')
    setPhase('listening')
    start()
  }, [start])

  const aiSay = useCallback(
    async (text) => {
      if (!aliveRef.current) return
      pushLine('ai', text)

      if (!speakerRef.current) {
        startListening()
        return
      }

      setPhase('speaking')
      await speakText(text, settingsRef.current, {
        onError: (msg) => setNotice(`云端语音不可用，已改用系统语音（${msg}）`),
      })
      if (aliveRef.current) startListening()
    },
    [pushLine, startListening],
  )

  const handleResult = useCallback(
    async (text) => {
      if (!aliveRef.current) return
      const clean = String(text || '').trim()
      setLive('')

      if (!clean) {
        emptyRef.current += 1
        if (emptyRef.current >= 2) {
          emptyRef.current = 0
          setPhase('waiting')
          setNotice('没有听到你的声音。确认麦克风可用后，点一下麦克风按钮继续。')
          return
        }
        setNotice('没听清，再说一次好吗？')
        window.setTimeout(() => {
          if (aliveRef.current) startListening()
        }, 800)
        return
      }

      emptyRef.current = 0
      setNotice('')
      pushLine('user', clean)
      setPhase('thinking')

      let reply = ''
      if (llmReadyRef.current) {
        try {
          const res = await llmTurn({
            settings: settingsRef.current,
            scenario: FREETALK,
            history: linesRef.current.slice(0, -1),
            userText: clean,
            beatIndex: 0,
          })
          reply = res?.reply || ''
        } catch (err) {
          setNotice(`大模型调用失败，已切换为本地陪聊（${err?.message || err}）`)
        }
      }
      if (!reply) reply = localFreeTalkReply(clean, linesRef.current)
      if (aliveRef.current) await aiSay(reply)
    },
    [aiSay, pushLine, startListening],
  )

  resultRef.current = handleResult

  /* 接通：先由 Tutor 说开场白 */
  useEffect(() => {
    const t = window.setTimeout(() => aiSay(FREE_TALK_GREETING), 420)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hangup = useCallback(() => {
    aliveRef.current = false
    try {
      abort()
    } catch {
      /* ignore */
    }
    stopSpeech()
    onExit()
  }, [abort, onExit])

  const toggleMic = useCallback(() => {
    const next = !micRef.current
    micRef.current = next
    setMicOn(next)

    if (!next) {
      stop()
      setLive('')
      setPhase('waiting')
      setNotice('麦克风已关闭')
      return
    }

    setNotice('')
    if (phaseRef.current !== 'speaking' && phaseRef.current !== 'thinking') startListening()
  }, [startListening, stop])

  const sendTyped = () => {
    const text = typed.trim()
    if (!text) return
    setTyped('')
    handleResult(text)
  }

  const typeFallback = !micSupported || !!micError

  return (
    <div className="call-layer">
      <div className="call-card">
        <button type="button" className="call-close" onClick={hangup} title="挂断并关闭">
          ✕
        </button>

        <div className="call-head">
          <h2>英语陪练通话</h2>
          <span className="call-role">{FREETALK.aiRole}</span>
          <span className="call-timer">{formatTime(seconds)}</span>
        </div>

        <div className="call-stage">
          <div className={`call-orb${ORB_STATE[phase] ? ` ${ORB_STATE[phase]}` : ''}`}>
            {ORB_ICON[phase] || '📞'}
          </div>
          <div className="call-status">{PHASE_TEXT[phase] || ''}</div>
          <div className={`call-wave${listening ? ' on' : ''}`}>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        {captionsOn ? (
          <div className="call-captions" ref={captionsRef}>
            {!lines.length && !live ? (
              <div className="call-line">
                <span className="txt" style={{ color: '#8f97c9' }}>
                  接通中，请稍候…
                </span>
              </div>
            ) : null}
            {lines.map((l) => (
              <div key={l.id} className={`call-line ${l.role === 'ai' ? 'ai' : 'user'}`}>
                <span className="who">{l.role === 'ai' ? 'Tutor' : 'You'}</span>
                <span className="txt">{l.text}</span>
              </div>
            ))}
            {live ? (
              <div className="call-line live">
                <span className="who">You</span>
                <span className="txt">{live}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {notice ? <div className="call-hint">{notice}</div> : null}
        {micError ? (
          <div className="call-hint" style={{ color: '#fca5a5' }}>
            {micError}
            <br />
            若提示权限被拒：点浏览器地址栏左侧的锁图标 → 允许「麦克风」，然后重试。
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'inherit', textDecoration: 'underline', marginLeft: 6 }}
              onClick={() => {
                setError('')
                setNotice('')
                startListening()
              }}
            >
              重试开麦
            </button>
          </div>
        ) : null}

        {typeFallback ? (
          <>
            <div className="call-hint">
              {micSupported
                ? '麦克风暂时不可用，可以先打字继续通话。'
                : '当前浏览器不支持语音识别，可以打字继续通话（推荐用 Chrome / Edge 打开）。'}
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                className="input"
                value={typed}
                placeholder="Type in English…"
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTyped()}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                }}
              />
              <button type="button" className="btn primary" disabled={!typed.trim()} onClick={sendTyped}>
                发送
              </button>
            </div>
          </>
        ) : null}

        {!llmReady ? (
          <div className="call-hint">
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'inherit', textDecoration: 'underline' }}
              onClick={onOpenSettings}
            >
              配置大模型 Key
            </button>
            可以让对话更聪明；现在也能用本地陪聊正常通话。
          </div>
        ) : null}

        <div className="call-controls">
          <button
            type="button"
            className={`call-btn${micOn ? ' active' : ''}`}
            disabled={!micSupported}
            onClick={toggleMic}
            title={micOn ? '关闭麦克风' : '打开麦克风'}
          >
            {micOn ? '🎤' : '🔇'}
          </button>
          <button
            type="button"
            className={`call-btn${speakerOn ? ' active' : ''}`}
            onClick={() => setSpeakerOn((v) => !v)}
            title={speakerOn ? '静音对方声音' : '打开对方声音'}
          >
            {speakerOn ? '🔊' : '🔈'}
          </button>
          <button type="button" className="call-btn hangup" onClick={hangup} title="挂断">
            📞
          </button>
        </div>

        <button
          type="button"
          className="icon-btn call-caption-toggle"
          style={{ color: '#8f97c9' }}
          onClick={() => setCaptionsOn((v) => !v)}
        >
          {captionsOn ? '隐藏字幕' : '显示字幕'}
        </button>
      </div>
    </div>
  )
}
