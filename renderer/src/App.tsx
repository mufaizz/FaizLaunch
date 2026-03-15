import { useState, Suspense, lazy, useCallback, memo } from 'react'
import { InstallJob } from '../../shared/types'
import { mockAPI } from './mockAPI'

// ── 2,4. STARTUP: Lazy load + dynamic imports ─────────────
const Home = lazy(() => import('./pages/Home'))
const Installing = lazy(() => import('./pages/Installing'))
const ErrorPage = lazy(() => import('./pages/Error'))
const DNA = lazy(() => import('./pages/DNA'))
const Turbo = lazy(() => import('./pages/Turbo'))
const Library = lazy(() => import('./pages/Library'))
const AICompanion = lazy(() => import('./pages/AICompanion'))
const Vault = lazy(() => import('./pages/Vault'))
const Together = lazy(() => import('./pages/Together'))
const Doctor = lazy(() => import('./pages/Doctor'))
const Settings = lazy(() => import('./pages/Settings'))

if (!(window as any).faizAPI) {
  (window as any).faizAPI = mockAPI
}

type Page = 'home' | 'installing' | 'error' | 'dna' | 'turbo' | 'library' | 'ai' | 'vault' | 'together' | 'doctor' | 'settings'

// ── 5. RENDERER: Memoized loader ──────────────────────────
const PageLoader = memo(() => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--accent)', fontFamily: 'Rajdhani, sans-serif',
    fontSize: '1.2rem', letterSpacing: '2px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
      <div>Loading...</div>
    </div>
  </div>
))

// ── 5. RENDERER: Memoized nav item ────────────────────────
const NavItem = memo(({ id, icon, label, active, onClick }: any) => (
  <button
    className={`nav-item ${active ? 'active' : ''}`}
    onClick={() => onClick(id)}
  >
    <span className="nav-icon">{icon}</span>
    {label}
  </button>
))

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

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [currentJob, setCurrentJob] = useState<InstallJob | null>(null)
  const [errorText, setErrorText] = useState('')

  // ── 6. RENDERER: useCallback prevents re-renders ──────────
  const handleStartInstall = useCallback((job: InstallJob) => {
    setCurrentJob(job)
    setPage('installing')
  }, [])

  const handleError = useCallback((error: string) => {
    setErrorText(error)
    setPage('error')
  }, [])

  const handleBack = useCallback(() => {
    setPage('home')
    setCurrentJob(null)
    setErrorText('')
  }, [])

  const handleNav = useCallback((id: string) => {
    setPage(id as Page)
  }, [])

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
            <NavItem
              key={item.id}
              {...item}
              active={page === item.id}
              onClick={handleNav}
            />
          ))}
          <div className="sidebar-bottom">
            FaizLaunch v1.0.0<br />
            For the gamer who has nothing but loves games the most.
          </div>
        </div>

        <div className="main-content">
          {/* ── 9. RENDERER: Fallback UI states ─────────────── */}
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </div>
      </div>
    </div>
  )
}
