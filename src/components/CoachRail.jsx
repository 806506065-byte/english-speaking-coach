import React from 'react'
import { TAG_LABEL } from '../lib/corrections.js'

const RING_R = 33
const RING_C = 2 * Math.PI * RING_R

function ScoreRing({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="ring">
      <svg width="78" height="78" viewBox="0 0 78 78">
        <circle className="ring-bg" cx="39" cy="39" r={RING_R} fill="none" strokeWidth="7" />
        <circle
          className="ring-fg"
          cx="39"
          cy="39"
          r={RING_R}
          fill="none"
          strokeWidth="7"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - safe / 100)}
        />
      </svg>
      <div className="ring-val">
        <div>
          {safe}
          <small>本轮得分</small>
        </div>
      </div>
    </div>
  )
}

export default function CoachRail({
  scenario,
  beat,
  beatIndex,
  totalBeats,
  lastEval,
  sessionAvg,
  turnCount,
  upgrades,
  onSpeak,
  onAddPhrase,
}) {
  const tips = []
  if (beat?.hints?.length) tips.push(...beat.hints)
  if (beat?.tip) tips.push(beat.tip)
  if (scenario?.goal) tips.push(`本场景目标：${scenario.goal}`)

  const done = Math.min(beatIndex, totalBeats)
  const progress = totalBeats ? Math.round((done / totalBeats) * 100) : 0

  return (
    <div className="rail">
      <div className="rail-card">
        <div className="score-ring">
          <ScoreRing value={lastEval ? lastEval.score : 0} />
          <div className="score-note">
            <b>{lastEval ? (lastEval.score >= 85 ? '很棒！' : lastEval.score >= 70 ? '不错' : '继续加油') : '等待你的回答'}</b>
            <span>
              {lastEval
                ? `关键词覆盖 ${Math.round(lastEval.coverage * 100)}% · 流利度 ${lastEval.fluency}`
                : '说出或输入你的回应，这里会实时给出评分'}
            </span>
          </div>
        </div>

        {lastEval?.diff?.length ? (
          <div className="word-diff">
            {lastEval.diff.map((d, i) => (
              <span key={`${d.word}-${i}`} className={d.status} title={statusTitle(d.status)}>
                {d.word}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rail-card">
        <h3 className="section-title">
          <span>🎯</span> 本句提示
        </h3>
        {tips.length ? (
          <div className="hint-list">
            {tips.map((t, i) => (
              <div className="hint-item" key={i}>
                <span>{t}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">当前没有提示，自由发挥吧。</div>
        )}
      </div>

      <div className="rail-card">
        <h3 className="section-title">
          <span>✨</span> 地道表达升级
          {upgrades.length ? <span className="count">{upgrades.length}</span> : null}
        </h3>
        {upgrades.length ? (
          <div>
            {upgrades.slice(0, 6).map((u, i) => (
              <div className="upgrade" key={`${u.new}-${i}`}>
                <span className="u-old">{u.old}</span>
                <span className="u-new">
                  {u.new}
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ marginLeft: 6 }}
                    onClick={() => onSpeak?.(u.new)}
                    title="朗读"
                  >
                    🔊
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ marginLeft: 2 }}
                    onClick={() => onAddPhrase?.(u.new, u.old, u.note)}
                    title="收藏到短语本"
                  >
                    ＋
                  </button>
                </span>
                {u.note ? <span className="u-note">{u.note}</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">还没有升级建议。出现「very good」这类表达时会自动提示更地道的说法。</div>
        )}
      </div>

      <div className="rail-card">
        <h3 className="section-title">
          <span>📈</span> 场景进度
        </h3>
        <div className="progress-bar">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="beat-dots">
          {Array.from({ length: totalBeats }).map((_, i) => (
            <i key={i} className={i < beatIndex ? 'done' : i === beatIndex ? 'current' : ''} />
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12.2, color: 'var(--muted)', lineHeight: 1.7 }}>
          已完成 {done} / {totalBeats} 轮 · 本轮累计 {turnCount} 句
          {turnCount ? ` · 平均 ${sessionAvg} 分` : ''}
        </div>
      </div>

      {lastEval?.corrections?.length ? (
        <div className="rail-card">
          <h3 className="section-title">
            <span>🩺</span> 本轮纠错
            <span className="count">{lastEval.corrections.length}</span>
          </h3>
          {lastEval.corrections.map((c, i) => (
            <div className="upgrade" key={i}>
              <span>
                <span className={`chip ${String(c.tag).replace(/\s+/g, '-')}`}>
                  {TAG_LABEL[c.tag] || c.tag}
                </span>
                <span className="corr-old" style={{ marginLeft: 6 }}>
                  {c.old}
                </span>
                <span className="corr-new" style={{ marginLeft: 6 }}>
                  {c.new}
                </span>
              </span>
              {c.note ? <span className="u-note">{c.note}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function statusTitle(status) {
  if (status === 'ok') return '已用到'
  if (status === 'close') return '接近了，再准确一点'
  if (status === 'miss') return '还没用上这个关键词'
  return '你说出的额外内容'
}
