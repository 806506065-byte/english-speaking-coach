import React, { useState } from 'react'

export default function Phrasebook({ phrases, onAdd, onRemove, onSpeak }) {
  const [en, setEn] = useState('')
  const [note, setNote] = useState('')

  const add = () => {
    const text = en.trim()
    if (!text) return
    onAdd({ text, from: '', note: note.trim() })
    setEn('')
    setNote('')
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">我的短语本</h1>
        <p className="page-desc">
          练习中所有「地道表达升级」建议都会自动流到这里。也可以随时手动记下想记住的句子，点 🔊 反复朗读直到脱口而出。
        </p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 className="section-title">
          <span>➕</span> 添加一条
        </h3>
        <div className="field">
          <label>英文句子</label>
          <input
            className="input"
            value={en}
            placeholder="e.g. I'd like a medium latte, please."
            onChange={(e) => setEn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <div className="field">
          <label>备注（可选）</label>
          <input
            className="input"
            value={note}
            placeholder="使用场景 / 中文意思"
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <button type="button" className="btn primary" disabled={!en.trim()} onClick={add}>
          收藏到短语本
        </button>
      </div>

      <div className="card card-pad">
        <h3 className="section-title">
          <span>📒</span> 已收藏
          <span className="count">{phrases.length}</span>
        </h3>

        {phrases.length ? (
          <div>
            {phrases.map((p) => (
              <div className="list-item" key={p.id}>
                <div className="li-body">
                  <div className="li-title">{p.text}</div>
                  {p.from ? <div className="li-sub">原表达：{p.from}</div> : null}
                  {p.note ? <div className="li-sub">{p.note}</div> : null}
                </div>
                <button type="button" className="icon-btn" onClick={() => onSpeak?.(p.text)} title="朗读">
                  🔊
                </button>
                <button type="button" className="icon-btn" onClick={() => onRemove(p.id)} title="删除">
                  🗑
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            短语本还是空的。在场景练习里留意右侧「地道表达升级」，点 ＋ 就能收藏进来。
          </div>
        )}
      </div>
    </div>
  )
}
