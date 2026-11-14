import React, { useMemo, useState } from 'react'
import { SCENARIOS, FREETALK, LEVEL_LABEL } from '../data/scenarios.js'
import { speechRecognitionSupported, speechSynthesisSupported } from '../lib/speech.js'

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'beginner', label: '入门' },
  { id: 'intermediate', label: '进阶' },
  { id: 'advanced', label: '高阶' },
]

export default function Home({ onStart, onOpenSettings, llmReady, history }) {
  const [filter, setFilter] = useState('all')

  const list = useMemo(
    () => (filter === 'all' ? SCENARIOS : SCENARIOS.filter((s) => s.level === filter)),
    [filter],
  )

  const bestOf = (id) => {
    const records = (history || []).filter((h) => h.scenarioId === id)
    if (!records.length) return null
    return Math.max(...records.map((r) => r.avgScore || 0))
  }

  const noMic = !speechRecognitionSupported()

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">选择场景，开始开口说英语</h1>
        <p className="page-desc">
          每个场景都是一段完整对话脚本：AI 扮演对话方，你来说出回应。系统会实时点评你的用词、语法与地道表达，
          并在右侧给出「更母语者」的替代说法。想自由发挥，可开启大模型模式。
        </p>
      </div>

      {!llmReady ? (
        <div className="banner">
          <span>💡</span>
          <div>
            当前为<b>内置场景模式</b>（免 API Key，所有纠错由本地规则引擎完成）。想解锁
            <b>自由对话 + 智能纠错</b>，请到
            <button
              type="button"
              className="icon-btn"
              style={{ textDecoration: 'underline', color: 'inherit' }}
              onClick={onOpenSettings}
            >
              设置
            </button>
            里填入任意 OpenAI 兼容接口的 Key。
          </div>
        </div>
      ) : (
        <div className="banner info">
          <span>🧠</span>
          <div>已启用大模型模式，除下方场景外，你还可以进入「自由对话」随意聊天。</div>
        </div>
      )}

      {noMic ? (
        <div className="banner error">
          <span>🎤</span>
          <div>当前浏览器不支持语音识别，你可以用键盘输入英文继续练习。推荐使用 Chrome 或 Edge。</div>
        </div>
      ) : null}

      <div className="chips-row" style={{ marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip-btn${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid-scenarios">
        {list.map((s) => {
          const best = bestOf(s.id)
          return (
            <button key={s.id} type="button" className="scenario-card" onClick={() => onStart(s.id)}>
              <div className="scenario-top">
                <div className="scenario-emoji">{s.emoji}</div>
                <div>
                  <div className="scenario-name">{s.title}</div>
                  <div className="scenario-name-en">{s.titleEn}</div>
                </div>
              </div>
              <div className="scenario-blurb">{s.blurb}</div>
              <div className="scenario-meta">
                <span className={`tag ${s.level}`}>{LEVEL_LABEL[s.level]}</span>
                <span className="tag">{s.beats.length} 轮</span>
                <span className="tag ghost">{s.userRole}</span>
                {best ? <span className="tag ghost">最高 {best} 分</span> : null}
              </div>
            </button>
          )
        })}

        {llmReady ? (
          <button type="button" className="scenario-card" onClick={() => onStart(FREETALK.id)}>
            <div className="scenario-top">
              <div className="scenario-emoji">💬</div>
              <div>
                <div className="scenario-name">{FREETALK.title}</div>
                <div className="scenario-name-en">{FREETALK.titleEn}</div>
              </div>
            </div>
            <div className="scenario-blurb">{FREETALK.blurb}</div>
            <div className="scenario-meta">
              <span className="tag advanced">大模型</span>
              <span className="tag ghost">不限轮次</span>
              <span className="tag ghost">实时纠错</span>
            </div>
          </button>
        ) : null}
      </div>

      <div className="card card-pad" style={{ marginTop: 26 }}>
        <h3 className="section-title">
          <span>🧩</span> 语音能力检测
        </h3>
        <div className="list-item">
          <div className="li-body">
            <div className="li-title">语音识别（说英语，自动转文字）</div>
            <div className="li-sub">
              {speechRecognitionSupported()
                ? '可用。点击练习页的麦克风按钮即可开口说话。'
                : '不可用。请使用 Chrome / Edge，或直接键盘输入。'}
            </div>
          </div>
          <span className={`tag ${speechRecognitionSupported() ? 'beginner' : 'ghost'}`}>
            {speechRecognitionSupported() ? '支持' : '不支持'}
          </span>
        </div>
        <div className="list-item">
          <div className="li-body">
            <div className="li-title">语音朗读（AI 说英语，练听力）</div>
            <div className="li-sub">
              {speechSynthesisSupported()
                ? '可用。每条 AI 回复都可以点击 🔊 重新朗读。'
                : '不可用。当前浏览器没有 speechSynthesis。'}
            </div>
          </div>
          <span className={`tag ${speechSynthesisSupported() ? 'beginner' : 'ghost'}`}>
            {speechSynthesisSupported() ? '支持' : '不支持'}
          </span>
        </div>
      </div>
    </div>
  )
}
