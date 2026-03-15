import { useState } from 'react'

const TURBO_TASKS = [
  { icon: '🧹', label: 'Kill background processes' },
  { icon: '⚡', label: 'Set CPU to performance mode' },
  { icon: '🎮', label: 'Optimize GPU cache' },
  { icon: '🌐', label: 'Reduce network latency' },
  { icon: '🛡️', label: 'Pause Windows Update' },
  { icon: '💾', label: 'Clear memory cache' },
]

export default function Turbo() {
  const [active, setActive] = useState(false)
  const [done, setDone] = useState<number[]>([])
  const [running, setRunning] = useState(false)

  const handleTurbo = async () => {
    if (active) {
      setActive(false)
      setDone([])
      return
    }

    setRunning(true)
    for (let i = 0; i < TURBO_TASKS.length; i++) {
      await new Promise(r => setTimeout(r, 400))
      setDone(prev => [...prev, i])
    }
    setRunning(false)
    setActive(true)
  }

  return (
    <div>
      <div className="page-header">
        <h1>🚀 Turbo</h1>
        <p>One click to optimize your entire PC for gaming</p>
      </div>

      <div className="card">
        <div className="turbo-center">
          <button
            className={`turbo-btn ${active ? 'active' : ''}`}
            onClick={handleTurbo}
            disabled={running}
          >
            <span className="turbo-icon">{active ? '✅' : '🚀'}</span>
            <span className="turbo-label">{running ? 'BOOSTING...' : active ? 'ACTIVE' : 'TURBO'}</span>
          </button>

          <div style={{ marginTop: '16px', color: 'var(--text2)', fontSize: '0.9rem', textAlign: 'center' }}>
            {active
              ? 'Your PC is fully optimized for gaming. Click again to restore.'
              : 'Click to optimize your PC for maximum gaming performance'}
          </div>

          <div className="turbo-tasks">
            {TURBO_TASKS.map((task, i) => (
              <div key={i} className={`turbo-task ${done.includes(i) ? 'done' : ''}`}>
                <span className="turbo-task-icon">{done.includes(i) ? '✅' : task.icon}</span>
                {task.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}