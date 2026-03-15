import { useState, useEffect } from 'react'
import { HardwareInfo } from '../../../shared/types'

export default function DNA() {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const api = (window as any).faizAPI

  useEffect(() => {
    api.getHardwareInfo().then((info: HardwareInfo) => setHardware(info))
  }, [])

  const getRamBarColor = (free: number, total: number) => {
    const pct = free / total
    if (pct > 0.5) return 'green'
    if (pct > 0.25) return 'yellow'
    return 'red'
  }

  const getDiskBarColor = (free: number, total: number) => {
    const pct = free / total
    if (pct > 0.4) return 'green'
    if (pct > 0.2) return 'yellow'
    return 'red'
  }

  return (
    <div>
      <div className="page-header">
        <h1>🧬 DNA</h1>
        <p>Your PC's complete hardware profile</p>
      </div>

      {hardware ? (
        <>
          <div className="dna-grid">
            <div className="dna-card">
              <div className="dna-icon">🖥️</div>
              <div className="dna-info">
                <div className="dna-label">Processor</div>
                <div className="dna-value">{hardware.cpu}</div>
                <div className="dna-sub">Central Processing Unit</div>
              </div>
            </div>

            <div className="dna-card">
              <div className="dna-icon">🎮</div>
              <div className="dna-info">
                <div className="dna-label">Graphics</div>
                <div className="dna-value">{hardware.gpu}</div>
                <div className="dna-sub">Graphics Processing Unit</div>
              </div>
            </div>

            <div className="dna-card">
              <div className="dna-icon">💾</div>
              <div className="dna-info">
                <div className="dna-label">Memory (RAM)</div>
                <div className="dna-value">{hardware.ram}GB Total</div>
                <div className="dna-sub">{hardware.freeRam}GB available right now</div>
                <div className="dna-bar-container">
                  <div
                    className={`dna-bar-fill ${getRamBarColor(hardware.freeRam, hardware.ram)}`}
                    style={{ width: `${(hardware.freeRam / hardware.ram) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="dna-card">
              <div className="dna-icon">💿</div>
              <div className="dna-info">
                <div className="dna-label">Storage ({hardware.diskType})</div>
                <div className="dna-value">{hardware.freeDisk}GB Free</div>
                <div className="dna-sub">{hardware.totalDisk}GB total capacity</div>
                <div className="dna-bar-container">
                  <div
                    className={`dna-bar-fill ${getDiskBarColor(hardware.freeDisk, hardware.totalDisk)}`}
                    style={{ width: `${(hardware.freeDisk / hardware.totalDisk) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Gaming Readiness</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  label: 'RAM for Gaming',
                  ok: hardware.freeRam >= 4,
                  msg: hardware.freeRam >= 4
                    ? `${hardware.freeRam}GB free — Good for most games`
                    : `Only ${hardware.freeRam}GB free — Close apps before gaming`,
                },
                {
                  label: 'Storage Space',
                  ok: hardware.freeDisk >= 20,
                  msg: hardware.freeDisk >= 20
                    ? `${hardware.freeDisk}GB free — Enough for most installs`
                    : `Only ${hardware.freeDisk}GB free — Consider freeing space`,
                },
                {
                  label: 'Drive Type',
                  ok: hardware.diskType === 'SSD',
                  msg: hardware.diskType === 'SSD'
                    ? 'SSD detected — Fast installs and load times'
                    : 'HDD detected — Installs will take longer, FaizLaunch will protect them',
                },
                {
                  label: 'Operating System',
                  ok: true,
                  msg: hardware.os,
                },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.ok ? '✅' : '⚠️'}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', color: item.ok ? 'var(--text)' : 'var(--accent)', marginTop: '2px' }}>{item.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>
          🧬 Scanning your hardware...
        </div>
      )}
    </div>
  )
}