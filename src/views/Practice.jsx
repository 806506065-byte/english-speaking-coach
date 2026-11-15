import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CoachRail from '../components/CoachRail.jsx'
import { TAG_LABEL } from '../lib/corrections.js'
import { llmTurn, localEvaluate, localNextLine } from '../lib/engine.js'
import { FREE_TALK_GREETING } from '../lib/freetalk.js'
import { speakText, stopSpeech, useSpeechInput } from '../lib/speech.js'
import { uid } from '../lib/storage.js'

function mergeList(primary, secondary, keyOf) {
  const out = []
  const seen = new Set()
  ;[...(primary || []), ...(secondary || [])].forEach((item) => {
    const key = keyOf(item)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(item)
  })
  return out
}

export default function Practice({
  scenario,
  settings,
  llmReady,
  onExit,
  onRecord,
  onAddPhrase,
  onOpenSettings,
}) {
  const isFreeTalk = !!scenario.freeTalk
  const beats = scenario.beats || []
  const totalBeats = beats.length
  const useLLM = llmReady

  const [messages, setMessages] = useState(() => [
    {
      id: uid(),
      role: 'ai',
      text: totalBeats > 0 ? beats[0].ai : FREE_TALK_GREETING,
    },
  ])
  const [beatIndex, setBeatIndex] = useState(0)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [finished, setFinished] = useState(false)
  const [lastEval, setLastEval] = useState(null)
  const [turns, setTurns] = useState([])
  const [speakingId, setSpeakingId] = useState(null)
  const [notice, setNotice] = useState('')

  const turnsRef = useRef([])
  const savedRef = useRef(false)
  const threadRef = useRef(null)
  const textareaRef = useRef(null)

  const avgScore = useMemo(
    () => (turns.length ? Math.round(turns.reduce((n, t) => n + t.score, 0) / turns.length) : 0),
    [turns],
  )

  const currentBeat = useMemo(() => {
    if (isFreeTalk || !totalBeats) return null
    return beats[Math.min(beatIndex, totalBeats - 1)]
  }, [beats, beatIndex, isFreeTalk, totalBeats])

  const upgrades = useMemo(
    () => mergeList(turns.flatMap((t) => t.upgrades || []), [], (u) => `${u.new}`).slice(0, 12),
    [turns],
  )

  /* ---------------- 朗读 ---------------- */

  const sayText = useCallback(
    (text, id) => {
      setSpeakingId(id)
      return speakText(text, settings, {
        onError: (msg) => setNotice(`朗读失败：${msg}`),
      }).finally(() => setSpeakingId((cur) => (cur === id ? null : cur)))
    },
    [settings],
  )

  useEffect(() => {
    if (!settings.autoSpeak) return
    const first = messages[0]
    if (first) sayText(first.text, first.id)
    return () => stopSpeech()
    // 仅在场景切换（组件用 key 重挂载）时朗读开场白
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  /* ---------------- 语音输入 ---------------- */

  const handleFinalSpeech = useCallback(
    (text) => {
      setInput((cur) => (cur ? `${cur} ${text}` : text))
      textareaRef.current?.focus()
    },
    [],
  )

  const { supported: micSupported, listening, interim, error: micError, start, stop } = useSpeechInput({
    lang: 'en-US',
    onResult: handleFinalSpeech,
  })

  /* ---------------- 消息工具 ---------------- */

  const pushAIMessage = useCallback(
    (text, { done = false, autoListen = true } = {}) => {
      const id = uid()
      setMessages((prev) => [...prev, { id, role: 'ai', text }])
      if (done) setFinished(true)

      if (settings.autoSpeak) {
        sayText(text, id)
      }
      if (autoListen && settings.autoListen && micSupported && !done) {
        window.setTimeout(() => start(), 400)
      }
      return id
    },
    [micSupported, sayText, settings.autoListen, settings.autoSpeak, start],
  )

  const attachEval = useCallback((id, ev) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, eval: ev } : m)))
  }, [])

  const recordTurn = useCallback((ev) => {
    turnsRef.current = [...turnsRef.current, ev]
    setTurns(turnsRef.current)
    setLastEval(ev)
  }, [])

  const persistSession = useCallback(() => {
    if (savedRef.current) return
    const list = turnsRef.current
    if (!list.length) return
    savedRef.current = true
    onRecord({
      id: uid(),
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      emoji: scenario.emoji,
      at: Date.now(),
      turnCount: list.length,
      avgScore: Math.round(list.reduce((n, t) => n + t.score, 0) / list.length),
      turns: list.map((t) => ({
        original: t.original,
        corrected: t.corrected,
        score: t.score,
        corrections: t.corrections || [],
      })),
    })
  }, [onRecord, scenario.emoji, scenario.id, scenario.title])

  /* ---------------- 本地模式 ---------------- */

  const runLocalTurn = useCallback(
    (text, userMsgId) => {
      const beat = isFreeTalk ? null : beats[beatIndex]
      const ev = localEvaluate(text, beat)
      attachEval(userMsgId, ev)
      recordTurn(ev)

      const nextIndex = beatIndex + 1
      const { text: aiText, done } = localNextLine(scenario, nextIndex)
      setBeatIndex(nextIndex)
      pushAIMessage(aiText, { done })
      if (done) persistSession()
    },
    [
      attachEval,
      beatIndex,
      beats,
      isFreeTalk,
      persistSession,
      pushAIMessage,
      recordTurn,
      scenario,
    ],
  )

  /* ---------------- 大模型模式 ---------------- */

  const runLLMTurn = useCallback(
    async (text, userMsgId) => {
      const local = localEvaluate(text, isFreeTalk ? null : beats[beatIndex])
      const history = messages

      try {
        const res = await llmTurn({ settings, scenario, history, userText: text, beatIndex })

        const corrections = mergeList(
          res.corrections,
          local.corrections,
          (c) => `${c.tag}|${c.old}|${c.new}`,
        ).slice(0, 6)

        const ev = {
          ...local,
          corrections,
          score: res.score ?? local.score,
          upgrades: mergeList(res.upgrades, local.upgrades, (u) => `${u.new}`).slice(0, 4),
          comment: res.comment,
        }

        attachEval(userMsgId, ev)
        recordTurn(ev)

        if (!isFreeTalk) {
          const nextIndex = Math.min(beatIndex + 1, totalBeats)
          setBeatIndex(nextIndex)
          if (nextIndex >= totalBeats) {
            setNotice('脚本已走完，接下来是自由对话。想结束可以点「结束练习」。')
          }
        }

        pushAIMessage(res.reply, { done: false, autoListen: false })
        if (settings.autoListen && micSupported) window.setTimeout(() => start(), 600)
      } catch (err) {
        setNotice(`大模型调用失败，本轮已切换为本地纠错：${err?.message || err}`)
        runLocalTurn(text, userMsgId)
      }
    },
    [
      attachEval,
      beatIndex,
      beats,
      isFreeTalk,
      messages,
      micSupported,
      pushAIMessage,
      runLocalTurn,
      scenario,
      settings,
      start,
      totalBeats,
    ],
  )

  /* ---------------- 发送 ---------------- */

  const send = useCallback(
    async (raw) => {
      const text = String(raw ?? input).trim()
      if (!text || busy || finished) return
      if (listening) stop()

      setInput('')
      setNotice('')
      const userMsgId = uid()
      setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text }])
      setBusy(true)

      try {
        if (useLLM) {
          await new Promise((r) => window.setTimeout(r, 450))
          await runLLMTurn(text, userMsgId)
        } else {
          await new Promise((r) => window.setTimeout(r, 520))
          runLocalTurn(text, userMsgId)
        }
      } finally {
        setBusy(false)
      }
    },
    [busy, finished, input, listening, runLLMTurn, runLocalTurn, stop, useLLM],
  )

  const handleFinish = useCallback(() => {
    stopSpeech()
    persistSession()
    setFinished(true)
    onExit()
  }, [onExit, persistSession])

  const handleReplay = useCallback(() => {
    stopSpeech()
    savedRef.current = false
    turnsRef.current = []
    setTurns([])
    setLastEval(null)
    setBeatIndex(0)
    setFinished(false)
    setNotice('')
    setInput('')
    const first = totalBeats > 0 ? beats[0].ai : FREE_TALK_GREETING
    const id = uid()
    setMessages([{ id, role: 'ai', text: first }])
    if (settings.autoSpeak) sayText(first, id)
  }, [beats, sayText, settings.autoSpeak, totalBeats])

  const fillHint = useCallback(
    (hint) => {
      setInput(hint)
      textareaRef.current?.focus()
    },
    [],
  )

  const onTextareaChange = (e) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send()
    }
  }

  /* ---------------- 渲染 ---------------- */

  return (
    <div className="page" style={{ maxWidth: 'none', paddingTop: 22 }}>
      {notice ? (
        <div className="banner info" style={{ marginBottom: 14 }}>
          <span>ℹ️</span>
          <div>{notice}</div>
        </div>
      ) : null}

      <div className="convo">
        <div className="convo-main">
          <div className="convo-head">
            <div className="scenario-emoji">{scenario.emoji}</div>
            <div className="convo-head-info">
              <h2>
                {scenario.title}
                <span className="tag ghost" style={{ marginLeft: 8, verticalAlign: 2 }}>
                  {scenario.aiRole}
                </span>
              </h2>
              <p>{scenario.goal}</p>
            </div>
            <div className="convo-stats">
              <div className="stat">
                <b>{turns.length}</b>
                <span>轮次</span>
              </div>
              <div className="stat">
                <b>{avgScore || '—'}</b>
                <span>平均分</span>
              </div>
            </div>
            <button type="button" className="btn sm" onClick={handleReplay}>
              重新开始
            </button>
            <button type="button" className="btn sm" onClick={handleFinish}>
              结束练习
            </button>
          </div>

          <div className="thread" ref={threadRef}>
            {messages.map((m) => (
              <div key={m.id} className={`msg${m.role === 'user' ? ' user' : ''}`}>
                <div className="avatar">{m.role === 'user' ? '🧑' : scenario.emoji}</div>
                <div className="bubble-wrap">
                  <div className="bubble">{m.text}</div>

                  <div className="bubble-meta">
                    {m.role === 'ai' ? (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => sayText(m.text, m.id)}
                        title="朗读这条"
                      >
                        {speakingId === m.id ? '🔈 朗读中' : '🔊 朗读'}
                      </button>
                    ) : (
                      <>
                        {m.eval ? <span>本轮 {m.eval.score} 分</span> : null}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setInput(m.text)}
                          title="复制到输入框继续修改"
                        >
                          ✎ 改写
                        </button>
                      </>
                    )}
                  </div>

                  {m.role === 'user' && m.eval?.corrections?.length ? (
                    <div className="inline-feedback">
                      <div className="fb-head">
                        <span>🩺</span> 纠错与升级建议
                      </div>
                      {m.eval.corrections.map((c, i) => (
                        <div className="corr" key={i}>
                          <div className="corr-line">
                            <span className={`chip ${String(c.tag).replace(/\s+/g, '-')}`}>
                              {TAG_LABEL[c.tag] || c.tag}
                            </span>
                            <span className="corr-old">{c.old}</span>
                            <span className="corr-new">{c.new}</span>
                          </div>
                          {c.note ? <div className="corr-note">{c.note}</div> : null}
                        </div>
                      ))}
                      {m.eval.corrected && m.eval.corrected !== m.eval.original ? (
                        <div className="corr-note" style={{ marginTop: 8 }}>
                          修改后整句：<b>{m.eval.corrected}</b>
                        </div>
                      ) : null}
                      {m.eval.comment ? (
                        <div className="corr-note" style={{ marginTop: 6 }}>💬 {m.eval.comment}</div>
                      ) : null}
                    </div>
                  ) : null}

                  {m.role === 'user' && m.eval && !m.eval.corrections?.length ? (
                    <div className="inline-feedback">
                      <div className="fb-head">
                        <span>✅</span> 这句话没有发现明显问题
                      </div>
                      <div className="corr-note">继续保持！可以试着把句子说得更长、更具体。</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {busy ? (
              <div className="msg">
                <div className="avatar">{scenario.emoji}</div>
                <div className="bubble-wrap">
                  <div className="bubble">
                    <span className="typing">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="composer">
            {listening ? (
              <div className="live-transcript">
                <span className="wave">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span>{interim || '正在聆听… 请说英语'}</span>
              </div>
            ) : null}

            {micError ? (
              <div className="corr-note" style={{ color: 'var(--danger)', marginBottom: 8 }}>
                {micError}
              </div>
            ) : null}

            <div className="composer-row">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                placeholder={
                  finished
                    ? '本轮练习已结束，可点「重新开始」再来一遍'
                    : '用英语说出你的回应…（Ctrl / ⌘ + Enter 发送）'
                }
                disabled={finished}
                onChange={onTextareaChange}
                onKeyDown={onKeyDown}
              />
              <button
                type="button"
                className={`mic-orb${listening ? ' listening' : speakingId ? ' speaking' : ''}`}
                disabled={!micSupported || finished}
                onClick={() => (listening ? stop() : start())}
                title={
                  micSupported
                    ? listening
                      ? '停止聆听'
                      : '点击开始说话'
                    : '当前浏览器不支持语音识别'
                }
              >
                {listening ? '⏹' : '🎤'}
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={busy || finished || !input.trim()}
                onClick={() => send()}
                style={{ height: 46 }}
              >
                发送
              </button>
            </div>

            <div className="composer-tools">
              {currentBeat?.hints?.map((h) => (
                <button key={h} type="button" className="chip-btn" onClick={() => fillHint(h)}>
                  {h}
                </button>
              ))}
              {!currentBeat && !isFreeTalk ? (
                <span className="corr-note">本场景已结束，可点右上角「重新开始」或「结束练习」。</span>
              ) : null}
              {isFreeTalk ? (
                <span className="corr-note">自由对话模式：想聊什么就说什么，AI 会保持陪练角色并实时纠错。</span>
              ) : null}
              {!llmReady ? (
                <button type="button" className="chip-btn" onClick={onOpenSettings}>
                  ⚙️ 配置 API Key 解锁自由对话
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <CoachRail
          scenario={scenario}
          beat={currentBeat}
          beatIndex={Math.min(beatIndex, totalBeats)}
          totalBeats={totalBeats}
          lastEval={lastEval}
          sessionAvg={avgScore}
          turnCount={turns.length}
          upgrades={upgrades}
          onSpeak={(t) => sayText(t, 'rail')}
          onAddPhrase={onAddPhrase}
        />
      </div>
    </div>
  )
}
