import React from 'react'

const NAV = [
  { id: 'home', icon: '🎯', label: '场景练习' },
  { id: 'report', icon: '📊', label: '纠错报告' },
  { id: 'drill', icon: '🗣️', label: '跟读训练' },
  { id: 'phrases', icon: '📒', label: '短语本' },
]

export default function Sidebar({
  view,
  onNav,
  onOpenSettings,
  sessionsCount,
  phrasesCount,
  engineReady,
  engineLabel,
}) {
  const badgeFor = (id) => {
    if (id === 'report') return sessionsCount || null
    if (id === 'phrases') return phrasesCount || null
    return null
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">🎙️</div>
        <div>
          <div className="brand-name">EchoSpeak</div>
          <div className="brand-sub">英语口语陪练</div>
        </div>
      </div>

      <div className="nav-group-label">练习</div>
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item${view === item.id ? ' active' : ''}`}
          onClick={() => onNav(item.id)}
        >
          <span className="nav-ico">{item.icon}</span>
          <span>{item.label}</span>
          {badgeFor(item.id) ? <span className="nav-badge">{badgeFor(item.id)}</span> : null}
        </button>
      ))}

      <div className="sidebar-foot">
        <div className="engine-pill">
          <span className={`dot${engineReady ? '' : ' idle'}`} />
          {engineLabel}
        </div>
        <button type="button" className="nav-item" onClick={onOpenSettings} style={{ padding: '8px 4px' }}>
          <span className="nav-ico">⚙️</span>
          <span>设置</span>
        </button>
        <div style={{ paddingTop: 6 }}>数据仅保存在本机浏览器</div>
      </div>
    </aside>
  )
}
