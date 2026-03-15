import { useState, useEffect } from 'react'

interface VaultEntry {
  id: string
  gameName: string
  sourcePath: string
  backupPath: string
  size: number
  createdAt: string
}

export default function Vault() {
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [backing, setBacking] = useState(false)
  const [gameName, setGameName] = useState('')
  const [gamePath, setGamePath] = useState('')
  const api = (window as any).faizAPI

  useEffect(() => {
    api.vaultGetAll?.().then((data: VaultEntry[]) => setEntries(data || []))
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const handleBackup = async () => {
    if (!gameName || !gamePath) return
    setBacking(true)
    const result = await api.vaultBackup?.(gameName, gamePath)
    if (result?.success) {
      setEntries(prev => [...prev, result.entry])
      setGameName('')
      setGamePath('')
    }
    setBacking(false)
  }

  const handleDelete = async (id: string) => {
    await api.vaultDelete?.(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h1>📦 Vault</h1>
        <p>Your games backed up. Yours forever. Even if everything else breaks.</p>
      </div>

      <div className="home-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-title">Backup a Game</div>
          <div className="field">
            <label htmlFor="vaultGameName">Game Name</label>
            <input
              id="vaultGameName"
              name="vaultGameName"
              type="text"
              placeholder="e.g. Cyberpunk 2077"
              value={gameName}
              onChange={e => setGameName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="vaultGamePath">Game Folder Path</label>
            <div className="field-row">
              <input
                id="vaultGamePath"
                name="vaultGamePath"
                type="text"
                placeholder="C:\Games\Cyberpunk2077"
                value={gamePath}
                onChange={e => setGamePath(e.target.value)}
                autoComplete="off"
              />
              <button className="browse-btn" onClick={async () => {
                const f = await api.openFolder()
                if (f) setGamePath(f)
              }}>Browse</button>
            </div>
          </div>
          <button className="install-btn" onClick={handleBackup} disabled={backing || !gameName || !gamePath}>
            {backing ? '📦 Backing up...' : '📦 Backup Now'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Vault Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text2)' }}>Games backed up</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem' }}>{entries.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text2)' }}>Total backed up</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem' }}>
                {formatSize(entries.reduce((a, e) => a + e.size, 0))}
              </span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text3)', lineHeight: 1.6 }}>
              💡 Vault stores your games locally on your drive. Even if FitGirl goes down, your games are safe.
            </div>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', color: 'var(--text2)' }}>Vault is empty</div>
          <div style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '8px' }}>Back up your first game to keep it safe forever</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map(entry => (
            <div key={entry.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
              <div style={{ fontSize: '2rem' }}>🎮</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>{entry.gameName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                  {formatSize(entry.size)} · Backed up {new Date(entry.createdAt).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {entry.backupPath}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 14px' }}>
                  ↩ Restore
                </button>
                <button
                  className="btn-danger"
                  style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                  onClick={() => handleDelete(entry.id)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}