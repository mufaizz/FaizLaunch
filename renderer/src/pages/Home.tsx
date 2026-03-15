import { useState, useEffect } from 'react'
import { InstallJob, HardwareInfo, HardwareWarning } from '../../../shared/types'

interface Props {
  onStartInstall: (job: InstallJob) => void
}

export default function Home({ onStartInstall }: Props) {
  const [gameName, setGameName] = useState('')
  const [sourcePath, setSourcePath] = useState('')
  const [destPath, setDestPath] = useState('C:\\Games')
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [warnings, setWarnings] = useState<HardwareWarning[]>([])
  const [loading, setLoading] = useState(false)
  const api = (window as any).faizAPI

  useEffect(() => {
    api.getHardwareInfo().then((info: HardwareInfo) => setHardware(info))
  }, [])

  const handleBrowseSource = async () => {
    const file = await api.openFile()
    if (file) setSourcePath(file)
  }

  const handleBrowseDest = async () => {
    const folder = await api.openFolder()
    if (folder) setDestPath(folder)
  }

  const handleInstall = async () => {
    if (!gameName || !sourcePath || !destPath) {
      alert('Please fill in all fields')
      return
    }
    setLoading(true)
    const w = await api.checkRequirements({ minRam: 4, minDisk: 10, estimatedInstallTime: true })
    setWarnings(w)
    if (w.some((x: HardwareWarning) => x.severity === 'high')) {
      setLoading(false)
      return
    }
    await api.addExclusion(destPath)
    const job: InstallJob = {
      id: `job_${Date.now()}`,
      name: gameName,
      sourcePath,
      destinationPath: destPath,
      totalSize: 0,
      extractedSize: 0,
      status: 'pending',
      progress: 0,
      currentFile: '',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setLoading(false)
    onStartInstall(job)
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Installation</h1>
        <p>Paste your game archive path and let FaizLaunch handle everything</p>
      </div>

      <div className="home-grid">
        <div className="card">
          <div className="card-title">Install Details</div>

          <div className="field">
            <label htmlFor="gameName">Game Name</label>
            <input
              id="gameName"
              name="gameName"
              type="text"
              placeholder="e.g. Cyberpunk 2077"
              value={gameName}
              onChange={e => setGameName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="sourcePath">Source File</label>
            <div className="field-row">
              <input
                id="sourcePath"
                name="sourcePath"
                type="text"
                placeholder=".rar / .zip / .iso / .exe"
                value={sourcePath}
                onChange={e => setSourcePath(e.target.value)}
                autoComplete="off"
              />
              <button className="browse-btn" onClick={handleBrowseSource}>Browse</button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="destPath">Install Location</label>
            <div className="field-row">
              <input
                id="destPath"
                name="destPath"
                type="text"
                placeholder="C:\Games\GameName"
                value={destPath}
                onChange={e => setDestPath(e.target.value)}
                autoComplete="off"
              />
              <button className="browse-btn" onClick={handleBrowseDest}>Browse</button>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="warnings">
              {warnings.map((w, i) => (
                <div key={i} className={`warning ${w.severity}`}>
                  ⚠️ {w.message}
                </div>
              ))}
            </div>
          )}

          <button className="install-btn" onClick={handleInstall} disabled={loading}>
            {loading ? 'Checking PC...' : '⚡ Start Install'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Your PC</div>
          {hardware ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '🖥️', label: 'CPU', value: hardware.cpu },
                { icon: '💾', label: 'RAM', value: `${hardware.freeRam}GB free / ${hardware.ram}GB total` },
                { icon: '🎮', label: 'GPU', value: hardware.gpu },
                { icon: '💿', label: 'Storage', value: `${hardware.freeDisk}GB free (${hardware.diskType})` },
                { icon: '🪟', label: 'OS', value: hardware.os },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', width: '28px', textAlign: 'center' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)', marginTop: '2px' }}>{item.value}</div>
                  </div>
                </div>
              ))}
              {hardware.diskType === 'HDD' && (
                <div className="warning low" style={{ marginTop: '8px' }}>
                  💡 HDD detected. Installs may take 10-15 hours. FaizLaunch will resume if anything fails.
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Scanning hardware...</div>
          )}
        </div>
      </div>
    </div>
  )
}
