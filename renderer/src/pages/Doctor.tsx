import { useState } from 'react'

interface HealthIssue {
  id: string
  type: 'warning' | 'critical' | 'info'
  category: string
  title: string
  description: string
  fix: string
  autoFixable: boolean
}

const TYPE_COLORS = {
  critical: '#ff4757',
  warning: '#f5a623',
  info: '#43d98c',
}

const TYPE_ICONS = {
  critical: '🚨',
  warning: '⚠️',
  info: '✅',
}

const CATEGORY_ICONS: Record<string, string> = {
  storage: '💿',
  memory: '💾',
  temperature: '🌡️',
  files: '📁',
  drivers: '⚙️',
}

export default function Doctor() {
  const [issues, setIssues] = useState<HealthIssue[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [fixing, setFixing] = useState<string | null>(null)
  const [fixResults, setFixResults] = useState<Record<string, string>>({})
  const api = (window as any).faizAPI

  const handleScan = async () => {
    setScanning(true)
    setScanned(false)
    setIssues([])
    setFixResults({})

    // Simulate scan steps for UX
    await new Promise(r => setTimeout(r, 600))
    const result = await api.doctorScan?.() || getMockIssues()
    setIssues(result)
    setScanning(false)
    setScanned(true)
  }

  const handleAutoFix = async (issue: HealthIssue) => {
    setFixing(issue.id)
    const result = await api.doctorAutofix?.(issue.id)
    setFixResults(prev => ({
      ...prev,
      [issue.id]: result?.message || 'Fixed successfully'
    }))
    setFixing(null)
    // Remove fixed issue
    setIssues(prev => prev.filter(i => i.id !== issue.id))
  }

  const getMockIssues = (): HealthIssue[] => ([
    {
      id: 'warn_ram',
      type: 'warning',
      category: 'memory',
      title: 'Low Available RAM',
      description: '3.2GB free RAM. Large game installs may struggle.',
      fix: 'Close Chrome, Discord, and other apps before installing.',
      autoFixable: false,
    },
    {
      id: 'hdd_detected',
      type: 'info',
      category: 'storage',
      title: 'HDD Detected',
      description: 'You are using a Hard Disk Drive. Game installs will take 8-15 hours.',
      fix: 'FaizLaunch checkpoint system protects your installs.',
      autoFixable: false,
    },
    {
      id: 'low_pagefile',
      type: 'warning',
      category: 'memory',
      title: 'Low Virtual Memory (Pagefile)',
      description: 'Virtual memory too low. ISDone.dll errors likely during extraction.',
      fix: 'Set pagefile to minimum 10000MB in Advanced System Settings.',
      autoFixable: false,
    },
    {
      id: 'orphaned_checkpoints',
      type: 'info',
      category: 'files',
      title: '2 Incomplete Installs Found',
      description: '2 paused or failed installations found that can be resumed.',
      fix: 'Go to Install tab to resume, or clear them.',
      autoFixable: true,
    },
  ])

  const criticalCount = issues.filter(i => i.type === 'critical').length
  const warningCount = issues.filter(i => i.type === 'warning').length
  const infoCount = issues.filter(i => i.type === 'info').length

  return (
    <div>
      <div className="page-header">
        <h1>🩺 Doctor</h1>
        <p>Predictive repair — finds problems before they break your install</p>
      </div>

      {/* Scan Button */}
      {!scanned && !scanning && (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🩺</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', marginBottom: '8px' }}>
            Run Health Scan
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '28px' }}>
            Doctor will scan your PC for issues that could cause install failures
          </div>
          <button className="btn-primary" style={{ margin: '0 auto' }} onClick={handleScan}>
            🩺 Start Scan
          </button>
        </div>
      )}

      {/* Scanning animation */}
      {scanning && (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'pulse 1s infinite' }}>🔍</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', marginBottom: '8px' }}>
            Scanning your PC...
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Checking RAM, disk, virtual memory, game files...
          </div>
          <div style={{ marginTop: '24px', height: '4px', background: 'var(--bg4)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              borderRadius: '2px',
              animation: 'scanProgress 2s ease infinite',
              width: '60%',
            }} />
          </div>
          <style>{`
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
            @keyframes scanProgress { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
          `}</style>
        </div>
      )}

      {/* Results */}
      {scanned && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Critical', count: criticalCount, color: '#ff4757' },
              { label: 'Warnings', count: warningCount, color: '#f5a623' },
              { label: 'Info', count: infoCount, color: '#43d98c' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: item.color, lineHeight: 1 }}>
                  {item.count}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Issues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {issues.map(issue => (
              <div key={issue.id} className="card" style={{
                borderLeft: `4px solid ${TYPE_COLORS[issue.type]}`,
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                    {TYPE_ICONS[issue.type]}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{issue.title}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: `${TYPE_COLORS[issue.type]}20`, color: TYPE_COLORS[issue.type], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {issue.type}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                        {CATEGORY_ICONS[issue.category]} {issue.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text2)', marginBottom: '8px' }}>
                      {issue.description}
                    </div>
                    {issue.fix && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text3)', background: 'var(--bg3)', padding: '8px 12px', borderRadius: '6px' }}>
                        💡 {issue.fix}
                      </div>
                    )}
                    {fixResults[issue.id] && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--green)', marginTop: '8px' }}>
                        ✅ {fixResults[issue.id]}
                      </div>
                    )}
                  </div>
                  {issue.autoFixable && !fixResults[issue.id] && (
                    <button
                      className="btn-primary"
                      style={{ marginTop: 0, padding: '8px 16px', fontSize: '0.82rem', flexShrink: 0 }}
                      onClick={() => handleAutoFix(issue)}
                      disabled={fixing === issue.id}
                    >
                      {fixing === issue.id ? 'Fixing...' : '⚡ Auto Fix'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="btn-secondary" onClick={handleScan}>
            🔄 Scan Again
          </button>
        </>
      )}
    </div>
  )
}