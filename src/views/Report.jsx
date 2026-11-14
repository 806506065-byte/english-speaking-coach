import React, { useMemo, useState } from 'react'
import { buildReport, TAG_LABEL, TAG_ORDER } from '../lib/corrections.js'
import { llmAnalyzeText, localAnalyze } from '../lib/engine.js'

function timeLabel(ts) {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function Report({ history, settings, llmReady, onSpeak, onAddPhrase, onGotoPractice, onClear }) {
  const [draft, setDraft] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')

  const report = useMemo(() => {
    const allTurns = (history || []).flatMap((h) => h.turns || [])
    return buildReport(allTurns)
  }, [history])

  const runAnalyze = async () => {
    const text = draft.trim()
    if (!text) return
    setAnalyzing(true)
    setError('')
    setAnalysis(null)
    try {
      if (llmReady) {
        const res = await llmAnalyzeText({ settings, text })
        setAnalysis({ ...res, engine: 'llm' })
      } else {
        setAnalysis({ ...localAnalyze(text), engine: 'local' })
      }
    } catch (err) {
      setError(err?.message || '分析失败')
      setAnalysis({ ...localAnalyze(text), engine: 'local', fallback: true })
    } finally {
      setAnalyzing(false)
    }
  }

  const totalTurns = (history || []).reduce((n, h) => n + (h.turnCount || 0), 0)

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">纠错报告</h1>
        <p className="page-desc">
          汇总你在所有场景里的表达问题，并按 english-tutor 的「两遍分析法」给出修改建议：
          第一遍修语法与拼写，第二遍把非母语表达升级成母语者更自然的说法。
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <b>{history?.length || 0}</b>
          <span>练习场次</span>
        </div>
        <div className="kpi">
          <b>{totalTurns}</b>
          <span>累计开口句数</span>
        </div>
        <div className="kpi">
          <b>{report.avgScore || '—'}</b>
          <span>平均口语分</span>
        </div>
        <div className="kpi">
          <b>{report.totalErrors}</b>
          <span>可改进点</span>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 className="section-title">
          <span>🧪</span> 深度纠错台
          <span className="count">{llmReady ? '大模型' : '本地规则'}</span>
        </h3>
        <div className="field">
          <textarea
            className="textarea"
            value={draft}
            placeholder="粘贴或输入一段英文，例如：I am very like this job because I want grow fast."
            onChange={(e) => setDraft(e.target.value)}
          />
          <span className="hint">
            {llmReady
              ? '将调用你配置的大模型接口完成两遍分析。'
              : '当前使用本地规则引擎；配置 API Key 后可获得更全面的语义级分析。'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="button" className="btn primary" disabled={analyzing || !draft.trim()} onClick={runAnalyze}>
            {analyzing ? '分析中…' : '开始两遍分析'}
          </button>
          <button type="button" className="btn ghost sm" onClick={() => { setDraft(''); setAnalysis(null); setError('') }}>
            清空
          </button>
        </div>

        {error ? (
          <div className="banner error" style={{ marginTop: 16, marginBottom: 0 }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        ) : null}

        {analysis ? (
          <div style={{ marginTop: 18 }}>
            {analysis.corrected ? (
              <div className="drill-sentence" style={{ marginBottom: 16 }}>
                {analysis.corrected}
                <button
                  type="button"
                  className="icon-btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => onSpeak?.(analysis.corrected)}
                >
                  🔊
                </button>
                <span className="tr">修改后版本（Corrected Version）</span>
              </div>
            ) : null}

            <h3 className="section-title">
              <span>1️⃣</span> 语法与拼写（Grammar Notes）
              <span className="count">{analysis.grammarNotes?.length || 0}</span>
            </h3>
            {analysis.grammarNotes?.length ? (
              <table className="table" style={{ marginBottom: 18 }}>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>类型</th>
                    <th>原文 → 修改</th>
                    <th style={{ width: '38%' }}>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.grammarNotes.map((n, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`chip ${String(n.tag || 'Grammar').replace(/\s+/g, '-')}`}>
                          {TAG_LABEL[n.tag] || n.tag || '语法'}
                        </span>
                      </td>
                      <td>
                        {n.old ? <span className="corr-old">{n.old}</span> : null}
                        {n.new ? <span className="corr-new" style={{ marginLeft: 6 }}>{n.new}</span> : null}
                      </td>
                      <td className="corr-note">{n.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty" style={{ marginBottom: 18 }}>
                没有发现拼写或语法错误，基础很扎实。
              </div>
            )}

            <h3 className="section-title">
              <span>2️⃣</span> 母语化升级（Native Expression Suggestions）
              <span className="count">{analysis.nativeSuggestions?.length || 0}</span>
            </h3>
            {analysis.nativeSuggestions?.length ? (
              <div style={{ marginBottom: 16 }}>
                {analysis.nativeSuggestions.map((u, i) => (
                  <div className="upgrade" key={i} style={{ borderTop: i === 0 ? 'none' : undefined }}>
                    <span className="u-old">{u.old}</span>
                    <span className="u-new">
                      {u.new}
                      <button type="button" className="icon-btn" style={{ marginLeft: 6 }} onClick={() => onSpeak?.(u.new)}>
                        🔊
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ marginLeft: 2 }}
                        onClick={() => onAddPhrase?.(u.new, u.old, u.note)}
                      >
                        ＋ 收藏
                      </button>
                    </span>
                    {u.note ? <span className="u-note">{u.note}</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ marginBottom: 16 }}>
                这句话表达已经足够地道，没有更好的替换建议。
              </div>
            )}

            <div className="banner info" style={{ marginBottom: 0 }}>
              <span>📝</span>
              <div>
                <b>总结：</b>
                {analysis.summary}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 className="section-title">
          <span>📌</span> 错误类型分布
        </h3>
        {report.totalErrors ? (
          <>
            <table className="table" style={{ marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>类型</th>
                  <th style={{ width: 90 }}>次数</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                {TAG_ORDER.filter((t) => report.byTag[t]).map((t) => (
                  <tr key={t}>
                    <td>
                      <span className={`chip ${String(t).replace(/\s+/g, '-')}`}>{TAG_LABEL[t]}</span>
                    </td>
                    <td>{report.byTag[t]}</td>
                    <td>
                      <div className="progress-bar" style={{ maxWidth: 220 }}>
                        <i style={{ width: `${Math.round((report.byTag[t] / report.totalErrors) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="banner info" style={{ marginTop: 14, marginBottom: 0 }}>
              <span>💡</span>
              <div>{report.summary}</div>
            </div>
          </>
        ) : (
          <div className="empty">
            还没有数据。先去
            <button
              type="button"
              className="icon-btn"
              style={{ textDecoration: 'underline', color: 'inherit' }}
              onClick={onGotoPractice}
            >
              场景练习
            </button>
            聊一轮，这里会自动汇总。
          </div>
        )}
      </div>

      {report.recurring.length ? (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 className="section-title">
            <span>🔁</span> 重复出现的错误（Recurring Patterns）
            <span className="count">{report.recurring.length}</span>
          </h3>
          {report.recurring.map((r, i) => (
            <div className="list-item" key={i}>
              <span className={`chip ${String(r.tag).replace(/\s+/g, '-')}`}>{TAG_LABEL[r.tag]}</span>
              <div className="li-body">
                <div className="li-title">
                  <span className="corr-old">{r.old}</span>
                  <span className="corr-new" style={{ marginLeft: 6 }}>
                    {r.new}
                  </span>
                </div>
                <div className="li-sub">{r.note}</div>
              </div>
              <span className="li-time">{r.count} 次</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card card-pad">
        <h3 className="section-title">
          <span>🗂️</span> 练习历史
          <span className="count">{history?.length || 0}</span>
          {history?.length ? (
            <button type="button" className="btn danger sm" style={{ marginLeft: 'auto' }} onClick={onClear}>
              清空记录
            </button>
          ) : null}
        </h3>
        {history?.length ? (
          <div>
            {[...history]
              .sort((a, b) => b.at - a.at)
              .map((h) => (
                <div className="list-item" key={h.id}>
                  <div className="scenario-emoji" style={{ width: 36, height: 36, fontSize: 18 }}>
                    {h.emoji}
                  </div>
                  <div className="li-body">
                    <div className="li-title">{h.scenarioTitle}</div>
                    <div className="li-sub">
                      {h.turnCount} 轮 · 平均 {h.avgScore} 分 · 可改进点{' '}
                      {(h.turns || []).reduce((n, t) => n + (t.corrections?.length || 0), 0)}
                    </div>
                  </div>
                  <span className="li-time">{timeLabel(h.at)}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty">暂无练习记录。</div>
        )}
      </div>
    </div>
  )
}
