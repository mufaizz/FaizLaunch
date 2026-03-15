import { useState } from 'react'

interface SettingsData {
  defaultInstallPath: string
  theme: 'dark' | 'darker'
  notifications: boolean
  autoDefenderExclusion: boolean
  autoCheckHardware: boolean
  downloadSpeedLimit: number
  language: string
  minimizeToTray: boolean
  autoResume: boolean
  vaultPath: string
}

const DEFAULT_SETTINGS: SettingsData = {
  defaultInstallPath: 'C:\\Games',
  theme: 'dark',
  notifications: true,
  autoDefenderExclusion: true,
  autoCheckHardware: true,
  downloadSpeedLimit: 0,
  language: 'English',
  minimizeToTray: true,
  autoResume: true,
  vaultPath: '',
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const api = (window as any).faizAPI

  const update = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('faizlaunch_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleBrowse = async (key: keyof SettingsData) => {
    const folder = await api.openFolder()
    if (folder) update(key, folder)
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Customize FaizLaunch to work exactly how you want</p>
      </div>

      {/* Install Settings */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">📁 Install Settings</div>

        <div className="field">
          <label htmlFor="defaultInstallPath">Default Install Location</label>
          <div className="field-row">
            <input
              id="defaultInstallPath"
              name="defaultInstallPath"
              type="text"
              value={settings.defaultInstallPath}
              onChange={e => update('defaultInstallPath', e.target.value)}
              autoComplete="off"
            />
            <button className="browse-btn" onClick={() => handleBrowse('defaultInstallPath')}>Browse</button>
          </div>
        </div>

        <ToggleSetting
          label="Auto Resume Failed Installs"
          description="Automatically resume installs that failed or were interrupted"
          value={settings.autoResume}
          onChange={v => update('autoResume', v)}
        />

        <ToggleSetting
          label="Auto Hardware Check"
          description="Check RAM and disk space before every installation"
          value={settings.autoCheckHardware}
          onChange={v => update('autoCheckHardware', v)}
        />

        <ToggleSetting
          label="Auto Windows Defender Exclusion"
          description="Automatically add game folder to Defender exclusions before installing"
          value={settings.autoDefenderExclusion}
          onChange={v => update('autoDefenderExclusion', v)}
        />
      </div>

      {/* Vault Settings */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">📦 Vault Settings</div>
        <div className="field">
          <label htmlFor="vaultPath">Vault Storage Location</label>
          <div className="field-row">
            <input
              id="vaultPath"
              name="vaultPath"
              type="text"
              value={settings.vaultPath || '~/.faizlaunch/vault (default)'}
              onChange={e => update('vaultPath', e.target.value)}
              autoComplete="off"
            />
            <button className="browse-btn" onClick={() => handleBrowse('vaultPath')}>Browse</button>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">🎨 App Settings</div>

        <ToggleSetting
          label="Notifications"
          description="Show notifications when installs complete or fail"
          value={settings.notifications}
          onChange={v => update('notifications', v)}
        />

        <ToggleSetting
          label="Minimize to Tray"
          description="Keep FaizLaunch running in the system tray when closed"
          value={settings.minimizeToTray}
          onChange={v => update('minimizeToTray', v)}
        />

        <div className="field" style={{ marginTop: '16px' }}>
          <label htmlFor="language">Language</label>
          <select
            id="language"
            value={settings.language}
            onChange={e => update('language', e.target.value)}
            style={{
              width: '100%', padding: '11px 14px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem',
              outline: 'none',
            }}
          >
            <option>English</option>
            <option>Urdu</option>
            <option>Arabic</option>
            <option>Hindi</option>
            <option>Turkish</option>
            <option>Russian</option>
            <option>Spanish</option>
          </select>
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">ℹ️ About FaizLaunch</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Built by', value: 'Mufaiz' },
            { label: 'Mission', value: 'For the gamer who has nothing but loves games the most' },
            { label: 'GitHub', value: 'github.com/mufaizz/FaizLaunch' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</span>
              <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        className="install-btn"
        onClick={handleSave}
        style={{ background: saved ? 'linear-gradient(135deg, #43d98c, #38b275)' : undefined }}
      >
        {saved ? '✅ Saved!' : '💾 Save Settings'}
      </button>
    </div>
  )
}

function ToggleSetting({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, marginRight: '16px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{description}</div>
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: '44px', height: '24px',
          background: value ? 'var(--accent)' : 'var(--bg4)',
          borderRadius: '12px', cursor: 'pointer',
          position: 'relative', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          width: '18px', height: '18px',
          background: '#fff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  )
}