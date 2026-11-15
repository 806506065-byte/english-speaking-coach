import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import CallMode from './components/CallMode.jsx'
import Home from './views/Home.jsx'
import Practice from './views/Practice.jsx'
import Report from './views/Report.jsx'
import Drill from './views/Drill.jsx'
import Phrasebook from './views/Phrasebook.jsx'
import { getScenario } from './data/scenarios.js'
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from './lib/engine.js'
import { primeVoices, speakText } from './lib/speech.js'
import { load, save, uid } from './lib/storage.js'

const DEFAULT_SETTINGS = {
  engine: 'local',
  baseUrl: DEFAULT_BASE_URL,
  apiKey: '',
  model: DEFAULT_MODEL,
  autoSpeak: true,
  autoListen: false,
  showZh: true,
  level: 'intermediate',
  ttsEngine: 'native',
  ttsVoiceURI: '',
  ttsRate: 1,
  ttsPitch: 1,
  ttsCloudVoice: 'nova',
  ttsModel: 'tts-1',
}

export default function App() {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('settings', {}) }))
  const [sessions, setSessions] = useState(() => load('sessions', []))
  const [phrases, setPhrases] = useState(() => load('phrases', []))
  const [view, setView] = useState('home')
  const [activeId, setActiveId] = useState(null)
  const [restartKey, setRestartKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => save('settings', settings), [settings])
  useEffect(() => save('sessions', sessions), [sessions])
  useEffect(() => save('phrases', phrases), [phrases])
  useEffect(primeVoices, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const title = view === 'practice' && activeId ? '练习中 · EchoSpeak' : 'EchoSpeak · 英语口语陪练'
      document.title = title
    }
  }, [view, activeId])

  const llmReady = settings.engine === 'llm' && !!String(settings.apiKey || '').trim()
  const activeScenario = useMemo(() => getScenario(activeId), [activeId])

  const startScenario = useCallback((id) => {
    setActiveId(id)
    setRestartKey((k) => k + 1)
    setView('practice')
  }, [])

  const recordSession = useCallback((record) => {
    setSessions((prev) => [record, ...prev].slice(0, 80))
  }, [])

  const handleSpeak = useCallback((text) => speakText(text, settings), [settings])

  const addPhrase = useCallback(
    (text, from = '', note = '') => {
      const clean = String(text || '').trim()
      if (!clean) return
      setPhrases((prev) => {
        if (prev.some((p) => p.text.toLowerCase() === clean.toLowerCase())) {
          setToast('这条已经在短语本里了')
          return prev
        }
        return [{ id: uid(), text: clean, from, note, at: Date.now() }, ...prev].slice(0, 300)
      })
      setToast('已加入短语本')
    },
    [],
  )

  const removePhrase = useCallback((id) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setSessions([])
    setPhrases([])
    setSettings(DEFAULT_SETTINGS)
    setSettingsOpen(false)
    setActiveId(null)
    setView('home')
    setToast('本机数据已清空')
  }, [])

  const renderMain = () => {
    if (view === 'practice' && activeScenario) {
      return (
        <Practice
          key={`${activeScenario.id}-${restartKey}`}
          scenario={activeScenario}
          settings={settings}
          llmReady={llmReady}
          onExit={() => setView('home')}
          onRecord={recordSession}
          onAddPhrase={addPhrase}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )
    }

    if (view === 'report') {
      return (
        <Report
          history={sessions}
          settings={settings}
          llmReady={llmReady}
          onSpeak={handleSpeak}
          onAddPhrase={addPhrase}
          onGotoPractice={() => setView('home')}
          onClear={() => setSessions([])}
        />
      )
    }

    if (view === 'drill') {
      return <Drill settings={settings} onAddPhrase={addPhrase} />
    }

    if (view === 'phrases') {
      return (
        <Phrasebook
          phrases={phrases}
          onAdd={addPhrase}
          onRemove={removePhrase}
          onSpeak={handleSpeak}
        />
      )
    }

    return (
      <Home
        onStart={startScenario}
        onStartCall={() => setCallOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        llmReady={llmReady}
        history={sessions}
      />
    )
  }

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNav={setView}
        onOpenSettings={() => setSettingsOpen(true)}
        sessionsCount={sessions.length}
        phrasesCount={phrases.length}
        engineReady={llmReady}
        engineLabel={llmReady ? `大模型 · ${settings.model || DEFAULT_MODEL}` : '内置场景模式'}
      />

      <main className="main">{renderMain()}</main>

      {toast ? (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 28,
            transform: 'translateX(-50%)',
            zIndex: 80,
            padding: '10px 18px',
            borderRadius: 999,
            background: 'rgba(20, 26, 46, 0.92)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {toast}
        </div>
      ) : null}

      {callOpen ? (
        <CallMode
          settings={settings}
          llmReady={llmReady}
          onExit={() => setCallOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : null}

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={setSettings}
        onClearData={clearAll}
      />
    </div>
  )
}
