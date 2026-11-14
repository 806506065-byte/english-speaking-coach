import React, { useMemo, useState } from 'react'
import { SCENARIOS, LEVEL_LABEL } from '../data/scenarios.js'
import { compareSpeech } from '../lib/corrections.js'
import { speak, useSpeechInput } from '../lib/speech.js'

export default function Drill({ settings, onAddPhrase }) {
  const [scenarioFilter, setScenarioFilter] = useState('all')
  const [index, setIndex] = useState(0)
  const [said, setSaid] = useState('')
  const [result, setResult] = useState(null)
  const [manual, setManual] = useState('')

  const pool = useMemo(() => {
    const list = []
    SCENARIOS.forEach((s) => {
      ;(s.shadowing || []).forEach((item, i) => {
        list.push({
          id: `${s.id}-${i}`,
          scenarioId: s.id,
          scenarioTitle: s.title,
          emoji: s.emoji,
          level: s.level,
          text: item.text,
          zh: item.zh,
        })
      })
    })
    return list
  }, [])

  const list = useMemo(
    () => (scenarioFilter === 'all' ? pool : pool.filter((p) => p.scenarioId === scenarioFilter)),
    [pool, scenarioFilter],
  )

  const current = list[Math.min(index, Math.max(list.length - 1, 0))] || null

  const { supported, listening, interim, error, start, stop } = useSpeechInput({
    lang: 'en-US',
    onFinal: (text) => {
      setSaid(text)
      setResult(compareSpeech(current?.text || '', text))
    },
  })

  const reset = (nextIndex) => {
    if (listening) stop()
    setIndex(nextIndex)
    setSaid('')
    setResult(null)
    setManual('')
  }

  const go = (delta) => {
    if (!list.length) return
    const next = (index + delta + list.length) % list.length
    reset(next)
  }

  const runManual = () => {
    const text = manual.trim()
    if (!text || !current) return
    setSaid(text)
    setResult(compareSpeech(current.text, text))
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">跟读训练 · Shadowing</h1>
        <p className="page-desc">
          先听原句，再模仿跟读。系统会把你的发音识别结果与原句逐词对齐，标出漏读（红色）与多读（虚线）的部分。
          跟读是提升语调与连读最快的练习方式。
        </p>
      </div>

      {!supported ? (
        <div className="banner">
          <span>🎤</span>
          <div>当前浏览器不支持语音识别，你可以在下方输入框里手动输入刚才读出的句子来做对比。</div>
        </div>
      ) : null}

      <div className="chips-row" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`chip-btn${scenarioFilter === 'all' ? ' active' : ''}`}
          onClick={() => {
            setScenarioFilter('all')
            reset(0)
          }}
        >
          全部（{pool.length}）
        </button>
        {SCENARIOS.filter((s) => (s.shadowing || []).length).map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip-btn${scenarioFilter === s.id ? ' active' : ''}`}
            onClick={() => {
              setScenarioFilter(s.id)
              reset(0)
            }}
          >
            {s.emoji} {s.title}
          </button>
        ))}
      </div>

      {current ? (
        <div className="drill">
          <div className="card card-pad">
            <h3 className="section-title">
              <span>{current.emoji}</span> {current.scenarioTitle}
              <span className={`tag ${current.level}`}>{LEVEL_LABEL[current.level]}</span>
              <span className="count">
                {index + 1} / {list.length}
              </span>
            </h3>

            <div className="drill-sentence">
              {current.text}
              {settings.showZh && current.zh ? <span className="tr">{current.zh}</span> : null}
            </div>

            <div className="composer-tools" style={{ marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => speak(current.text)}>
                🔊 听原句
              </button>
              <button type="button" className="btn" onClick={() => speak(current.text, { rate: 0.7 })}>
                🐢 慢速
              </button>
              <button
                type="button"
                className={`btn ${listening ? 'danger' : 'primary'}`}
                disabled={!supported}
                onClick={() => (listening ? stop() : start())}
              >
                {listening ? '⏹ 停止跟读' : '🎤 开始跟读'}
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => onAddPhrase?.(current.text, '', `${current.scenarioTitle} 跟读句`)}
              >
                ＋ 收藏这句
              </button>
            </div>

            {listening ? (
              <div className="live-transcript" style={{ marginTop: 14, marginBottom: 0 }}>
                <span className="wave">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span>{interim || '正在聆听… 请跟读上面的句子'}</span>
              </div>
            ) : null}

            {error ? (
              <div className="corr-note" style={{ color: 'var(--danger)', marginTop: 10 }}>
                {error}
              </div>
            ) : null}
          </div>

          <div className="card card-pad">
            <h3 className="section-title">
              <span>📐</span> 跟读对比
            </h3>

            {result ? (
              <>
                <div className="score-ring" style={{ marginBottom: 16 }}>
                  <div className="ring">
                    <svg width="78" height="78" viewBox="0 0 78 78">
                      <circle className="ring-bg" cx="39" cy="39" r="33" fill="none" strokeWidth="7" />
                      <circle
                        className="ring-fg"
                        cx="39"
                        cy="39"
                        r="33"
                        fill="none"
                        strokeWidth="7"
                        strokeDasharray={2 * Math.PI * 33}
                        strokeDashoffset={2 * Math.PI * 33 * (1 - result.accuracy / 100)}
                      />
                    </svg>
                    <div className="ring-val">
                      <div>
                        {result.accuracy}
                        <small>匹配度</small>
                      </div>
                    </div>
                  </div>
                  <div className="score-note">
                    <b>
                      {result.accuracy >= 90
                        ? '非常棒！'
                        : result.accuracy >= 70
                          ? '不错，注意漏读的词'
                          : '再听一遍原句试试'}
                    </b>
                    <span>你读出的是：{said}</span>
                  </div>
                </div>

                <div className="word-diff">
                  {result.words.map((w, i) => (
                    <span
                      key={`${w.word}-${i}`}
                      className={w.type === 'ok' ? 'ok' : w.type === 'miss' ? 'miss' : 'extra'}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>

                <div className="corr-note" style={{ marginTop: 12 }}>
                  绿色=读对 · 红色删除线=漏读 · 虚线框=多读
                </div>
              </>
            ) : (
              <div className="empty">点击「🎤 开始跟读」后，这里会显示逐词对比结果。</div>
            )}

            <div className="field" style={{ marginTop: 18 }}>
              <label>没有麦克风？手动输入刚才读出的句子</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="input"
                  value={manual}
                  placeholder="Type what you just said…"
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runManual()}
                />
                <button type="button" className="btn" disabled={!manual.trim()} onClick={runManual}>
                  比对
                </button>
              </div>
            </div>
          </div>

          <div className="chips-row">
            <button type="button" className="btn" onClick={() => go(-1)}>
              ← 上一句
            </button>
            <button type="button" className="btn primary" onClick={() => go(1)}>
              下一句 →
            </button>
          </div>
        </div>
      ) : (
        <div className="empty">这个场景还没有跟读句。</div>
      )}
    </div>
  )
}
