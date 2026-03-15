import { useState } from 'react'
import Home from './pages/Home'
import Installing from './pages/Installing'
import ErrorPage from './pages/Error'
import DNA from './pages/DNA'
import Turbo from './pages/Turbo'
import Library from './pages/Library'
import AICompanion from './pages/AICompanion'
import Vault from './pages/Vault'
import Together from './pages/Together'
import Doctor from './pages/Doctor'
import Settings from './pages/Settings'
import { InstallJob } from '../../shared/types'
import { mockAPI } from './mockAPI'

if (!(window as any).faizAPI) {
  (window as any).faizAPI = mockAPI
}

type Page = 'home' | 'installing' | 'error' | 'dna' | 'turbo' | 'library' | 'ai' | 'vault' | 'together' | 'doctor' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [currentJob, setCurrentJob] = useState<InstallJob | null>(null)
  const [errorText, setErrorText] = useState('')

  const handleStartInstall = (job: InstallJob) => {
    setCurrentJob(job)
    setPage('installing')
  }

  const handleError = (error: string) => {
    setErrorText(error)
    setPage('error')
  }

  const handleBack = () => {
    setPage('home')
    setCurrentJob(null)
    setErrorText('')
  }

  const navItems = [
    { id: 'home', icon: '⚡', label: 'Install' },
    { id: 'library', icon: '🎮', label: 'Library' },
    { id: 'dna', icon: '🧬', label: 'DNA' },
    { id: 'turbo', icon: '🚀', label: 'Turbo' },
    { id: 'vault', icon: '📦', label: 'Vault' },
    { id: 'ai', icon: '🤖', label: 'FaizAI' },
    { id: 'together', icon: '👥', label: 'Together' },
    { id: 'doctor', icon: '🩺', label: 'Doctor' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="titlebar">
        <span className="titlebar-logo">⚡ FAIZLAUNCH</span>
        <div className="titlebar-controls">
          <button onClick={() => (window as any).faizAPI.minimize()}>─</button>
          <button onClick={() => (window as any).faizAPI.maximize()}>□</button>
          <button className="close" onClick={() => (window as any).faizAPI.close()}>✕</button>
        </div>
      </div>

      <div className="app-layout">
        <div className="sidebar">
          <div className="sidebar-label">Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id as Page)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="sidebar-bottom">
            FaizLaunch v1.0.0<br />
            For the gamer who has nothing but loves games the most.
          </div>
        </div>

        <div className="main-content">
          {page === 'home' && <Home onStartInstall={handleStartInstall} />}
          {page === 'installing' && currentJob && (
            <Installing job={currentJob} onError={handleError} onBack={handleBack} />
          )}
          {page === 'error' && <ErrorPage errorText={errorText} onBack={handleBack} />}
          {page === 'dna' && <DNA />}
          {page === 'turbo' && <Turbo />}
          {page === 'library' && <Library onInstall={() => setPage('home')} />}
          {page === 'ai' && <AICompanion />}
          {page === 'vault' && <Vault />}
          {page === 'together' && <Together />}
          {page === 'doctor' && <Doctor />}
          {page === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  )
}
