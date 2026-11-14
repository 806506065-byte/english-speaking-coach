import React, { useState } from 'react'
import { DEFAULT_BASE_URL, DEFAULT_MODEL, llmTurn } from '../lib/engine.js'
import { FREETALK } from '../data/scenarios.js'

const LEVELS = [
  { value: 'beginner', label: '入门 Beginner' },
  { value: 'intermediate', label: '进阶 Intermediate' },
  { value: 'advanced', label: '高阶 Advanced' },
]

function Switch({ on, onClick }) {
  return <div className={`switch${on ? ' on' : ''}`} role="switch" aria-checked={on} onClick={onClick} />
}

export default function SettingsModal({ open, settings, onClose, onChange, onClearData }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  if (!open) return null

  const patch = (p) => {
    onChange({ ...settings, ...p })
    setTestResult(null)
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await llmTurn({
        settings,
        scenario: FREETALK,
        history: [],
        userText: 'Say hi and ask me one question.',
        beatIndex: 0,
      })
      setTestResult({ ok: true, message: `连接成功，模型回复：${res.reply.slice(0, 60)}` })
    } catch (err) {
      setTestResult({ ok: false, message: err?.message || '连接失败' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>⚙️ 设置</h3>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="modal-body">
          <h3 className="section-title">
            <span>🧠</span> 对话引擎
          </h3>

          <div className="switch-row">
            <div className="switch-text">
              <b>启用大模型自由对话</b>
              <span>
                关闭时使用内置场景脚本（免 Key、可离线演示）。开启并填好 Key 后，可自由聊天并获得智能纠错。
              </span>
            </div>
            <Switch
              on={settings.engine === 'llm'}
              onClick={() => patch({ engine: settings.engine === 'llm' ? 'local' : 'llm' })}
            />
          </div>

          {settings.engine === 'llm' ? (
            <>
              <div className="field">
                <label>API Base URL</label>
                <input
                  className="input"
                  value={settings.baseUrl}
                  placeholder={DEFAULT_BASE_URL}
                  onChange={(e) => patch({ baseUrl: e.target.value })}
                />
                <span className="hint">兼容 OpenAI 接口格式，例如 https://api.deepseek.com/v1 或自建网关。</span>
              </div>

              <div className="field">
                <label>API Key</label>
                <input
                  className="input"
                  type="password"
                  value={settings.apiKey}
                  placeholder="sk-..."
                  autoComplete="off"
                  onChange={(e) => patch({ apiKey: e.target.value })}
                />
                <span className="hint">Key 只保存在本机 localStorage，不会上传到任何第三方服务器。</span>
              </div>

              <div className="field">
                <label>模型名称</label>
                <input
                  className="input"
                  value={settings.model}
                  placeholder={DEFAULT_MODEL}
                  onChange={(e) => patch({ model: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <button type="button" className="btn sm" disabled={testing} onClick={runTest}>
                  {testing ? '测试中…' : '测试连接'}
                </button>
                {testResult ? (
                  <span
                    style={{
                      fontSize: 12.2,
                      lineHeight: 1.5,
                      color: testResult.ok ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {testResult.message}
                  </span>
                ) : null}
              </div>
            </>
          ) : null}

          <h3 className="section-title" style={{ marginTop: 8 }}>
            <span>🎚️</span> 难度与体验
          </h3>

          <div className="field">
            <label>口语水平</label>
            <select
              className="select"
              value={settings.level}
              onChange={(e) => patch({ level: e.target.value })}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="hint">影响大模型陪练的用词难度与句子长度。</span>
          </div>

          <div className="switch-row">
            <div className="switch-text">
              <b>自动朗读 AI 回复</b>
              <span>每轮 AI 说话时用系统语音读出来，帮助练习听力。</span>
            </div>
            <Switch on={settings.autoSpeak} onClick={() => patch({ autoSpeak: !settings.autoSpeak })} />
          </div>

          <div className="switch-row">
            <div className="switch-text">
              <b>显示中文提示</b>
              <span>在提示区与跟读页显示中文释义。</span>
            </div>
            <Switch on={settings.showZh} onClick={() => patch({ showZh: !settings.showZh })} />
          </div>

          <div className="switch-row">
            <div className="switch-text">
              <b>AI 说完后自动开始聆听</b>
              <span>每轮 AI 回复结束后自动打开麦克风，实现连续对话（需要浏览器语音识别支持）。</span>
            </div>
            <Switch on={settings.autoListen} onClick={() => patch({ autoListen: !settings.autoListen })} />
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn danger sm" onClick={onClearData}>
            清空本机数据
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
