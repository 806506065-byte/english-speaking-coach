import React, { useState } from 'react'
import { DEFAULT_BASE_URL, DEFAULT_MODEL, llmTurn } from '../lib/engine.js'
import { FREETALK } from '../data/scenarios.js'
import {
  CLOUD_VOICES,
  currentVoiceLabel,
  isNaturalVoice,
  speakText,
  speechSynthesisSupported,
  useVoices,
} from '../lib/speech.js'

const LEVELS = [
  { value: 'beginner', label: '入门 Beginner' },
  { value: 'intermediate', label: '进阶 Intermediate' },
  { value: 'advanced', label: '高阶 Advanced' },
]

const VOICE_SAMPLE = "Hi, I'm your English speaking coach. Let's practise your spoken English together."

function Switch({ on, onClick }) {
  return <div className={`switch${on ? ' on' : ''}`} role="switch" aria-checked={on} onClick={onClick} />
}

function Range({ label, value, min, max, step, onChange }) {
  return (
    <div className="field">
      <label>
        {label}
        <span className="range-value">{Number(value).toFixed(2)}×</span>
      </label>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export default function SettingsModal({ open, settings, onClose, onChange, onClearData }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [voicePreview, setVoicePreview] = useState('')

  const voices = useVoices()

  if (!open) return null

  const patch = (p) => {
    onChange({ ...settings, ...p })
    setTestResult(null)
  }

  const hasKey = !!String(settings.apiKey || '').trim()
  const activeVoice = currentVoiceLabel(settings, voices)
  const enVoiceCount = voices.filter((v) => /^en/i.test(v.lang)).length

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

          {hasKey && settings.engine !== 'llm' ? (
            <div className="voice-tip" style={{ marginBottom: 14 }}>
              <span>💡</span>
              <div>
                已填好 API Key，但当前仍是内置场景模式。
                <button
                  type="button"
                  className="icon-btn"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                  onClick={() => patch({ engine: 'llm' })}
                >
                  点此启用大模型自由对话
                </button>
                ，纠错和陪聊质量会明显提升。
              </div>
            </div>
          ) : null}

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
            <span>🔉</span> 发音与音色
          </h3>

          <div
            className="voice-tip"
            style={{
              marginBottom: 14,
              borderColor: activeVoice.natural ? '#a7e3c4' : '#f3c98b',
              background: activeVoice.natural ? '#eafaf2' : '#fef4e6',
              color: activeVoice.natural ? '#12634a' : '#8a5300',
            }}
          >
            <span>{activeVoice.natural ? '✅' : '⚠️'}</span>
            <div>
              当前音色：<b>{activeVoice.label}</b>
              {activeVoice.natural ? '（真人感不错）' : '（偏机械，听起来像机器人）'}
              <br />
              本机共检测到 {enVoiceCount} 个英语音色。
              {!activeVoice.natural && hasKey
                ? ' 你已填好 API Key，直接切到云端神经语音即可明显改善。'
                : ''}
              {!activeVoice.natural && !hasKey
                ? ' 可以换个 Natural / Neural 音色，或填 API Key 后用云端神经语音。'
                : ''}
              {!activeVoice.natural && hasKey ? (
                <button
                  type="button"
                  className="icon-btn"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                  onClick={() => patch({ ttsEngine: 'cloud' })}
                >
                  立刻切换
                </button>
              ) : null}
            </div>
          </div>

          <div className="chips-row" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={`chip-btn${settings.ttsEngine !== 'cloud' ? ' active' : ''}`}
              onClick={() => patch({ ttsEngine: 'native' })}
            >
              系统语音
            </button>
            <button
              type="button"
              className={`chip-btn${settings.ttsEngine === 'cloud' ? ' active' : ''}`}
              onClick={() => patch({ ttsEngine: 'cloud' })}
            >
              云端神经语音（更像真人）
            </button>
          </div>

          {settings.ttsEngine === 'cloud' ? (
            <>
              <div className="field">
                <label>云端音色</label>
                <select
                  className="select"
                  value={settings.ttsCloudVoice}
                  onChange={(e) => patch({ ttsCloudVoice: e.target.value })}
                >
                  {CLOUD_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <span className="hint">
                  复用「对话引擎」里填的 Base URL 与 Key。注意：DeepSeek 等只提供对话的接口<b>不支持</b>
                  /audio/speech，需要 OpenAI 官方或支持语音合成的兼容网关；失败会自动回退系统语音。
                </span>
              </div>

              <div className="field">
                <label>语音模型</label>
                <input
                  className="input"
                  value={settings.ttsModel}
                  placeholder="tts-1"
                  onChange={(e) => patch({ ttsModel: e.target.value })}
                />
                <span className="hint">可填 tts-1 / tts-1-hd 或服务商提供的语音模型名。</span>
              </div>

              {!hasKey ? (
                <div className="voice-tip" style={{ marginBottom: 14 }}>
                  <span>⚠️</span>
                  <div>还没填 API Key，云端语音不可用，会自动回退到系统语音。</div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="field">
              <label>系统音色</label>
              <select
                className="select"
                value={settings.ttsVoiceURI}
                onChange={(e) => patch({ ttsVoiceURI: e.target.value })}
                disabled={!voices.length}
              >
                <option value="">自动选择最佳音色（推荐）</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} · {v.lang}
                    {isNaturalVoice(v) ? ' · 真人感' : ''}
                  </option>
                ))}
              </select>
              <span className="hint">
                {speechSynthesisSupported()
                  ? voices.length
                    ? '带「真人感」标记的是 Natural / Neural 一类神经网络音色，比传统机械音自然得多。'
                    : '正在读取本机音色…（Windows 上安装「英语(美国)语音包」可获得更多音色）'
                  : '当前浏览器不支持语音合成。'}
              </span>
            </div>
          )}

          <Range
            label="语速"
            value={settings.ttsRate}
            min={0.5}
            max={1.6}
            step={0.05}
            onChange={(v) => patch({ ttsRate: v })}
          />

          {settings.ttsEngine !== 'cloud' ? (
            <Range
              label="音调"
              value={settings.ttsPitch}
              min={0.5}
              max={1.6}
              step={0.05}
              onChange={(v) => patch({ ttsPitch: v })}
            />
          ) : null}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <button
              type="button"
              className="btn sm"
              disabled={voicePreview === 'loading'}
              onClick={async () => {
                setVoicePreview('loading')
                await speakText(VOICE_SAMPLE, settings, {
                  onError: (msg) => setVoicePreview(`失败：${msg}`),
                })
                setVoicePreview((cur) => (cur === 'loading' ? '' : cur))
              }}
            >
              {voicePreview === 'loading' ? '试听中…' : '🔊 试听这个音色'}
            </button>
            {voicePreview && voicePreview !== 'loading' ? (
              <span style={{ fontSize: 12.2, color: 'var(--danger)' }}>{voicePreview}</span>
            ) : (
              <span className="hint" style={{ margin: 0 }}>
                试听后觉得不合适，换个音色或调调语速、音调。
              </span>
            )}
          </div>

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
