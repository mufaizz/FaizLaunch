import { useState, useEffect } from 'react'
import { InstallJob, HardwareInfo, HardwareWarning } from '../../shared/types'

interface Props {
  onStartInstall: (job: InstallJob) => void
}

export default function Home({ onStartInstall }: Props) {
  const [gameName, setGameName] = useState('')
  const [sourcePath, setSourcePath] = useState('')
  const [destPath, setDestPath] = useState('')
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [warnings, setWarnings] = useState<HardwareWarning[]>([])
  const [loading, setLoading] = useState(false)
  const api = (window as any).faizAPI

  useEffect(() => {
    api.getHardwareInfo().then((info: HardwareInfo) => {
      setHardware(info)
    })
  }, [])

  const handleBrowseSource = async () => {
    const file = await api.openFile()
    if (file) setSourcePath(file)
  }

  const handleBrowseDest = async () => {
    const folder = await api.openFolder()
    if (folder) setDestPath(folder)
  }

  const handleCheckAndInstall = async () => {
    if (!gameName || !sourcePath || !destPath) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)

    // Pre-install hardware check
    const w = await api.checkRequirements({
      minRam: 4,
      minDisk: 10,
      estimatedInstallTime: true,
    })
    setWarnings(w)

    if (w.some((x: HardwareWarning) => x.severity === 'high')) {
      setLoading(false)
      return
    }

    // Add Windows Defender exclusion
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
    <div className="home">
      <div className="hero">
        <h1>⚡ FaizLaunch</h1>
        <p>Smart game installer. No more failed installs. No more errors at 99%.</p>
      </div>

      {hardware && (
        <div className="hardware-bar">
          <span>🖥️ {hardware.cpu}</span>
          <span>💾 {hardware.ram}GB RAM ({hardware.freeRam}GB free)</span>
          <span>💿 {hardware.freeDisk}GB free ({hardware.diskType})</span>
          <span>🎮 {hardware.gpu}</span>
        </div>
      )}

      <div className="install-form">
        <h2>New Installation</h2>

        <div className="field">
          <label>Game Name</label>
          <input
            type="text"
            placeholder="e.g. Cyberpunk 2077"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Source File (archive or setup)</label>
          <div className="field-row">
            <input
              type="text"
              placeholder="Path to .rar / .zip / .iso / .exe"
              value={sourcePath}
              onChange={e => setSourcePath(e.target.value)}
            />
            <button onClick={handleBrowseSource}>Browse</button>
          </div>
        </div>

        <div className="field">
          <label>Install Location</label>
          <div className="field-row">
            <input
              type="text"
              placeholder="Where to install the game"
              value={destPath}
              onChange={e => setDestPath(e.target.value)}
            />
            <button onClick={handleBrowseDest}>Browse</button>
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

        <button
          className="install-btn"
          onClick={handleCheckAndInstall}
          disabled={loading}
        >
          {loading ? 'Checking your PC...' : '⚡ Start Install'}
        </button>
      </div>
    </div>
  )
}