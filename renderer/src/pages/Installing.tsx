import { useState, useEffect } from 'react'
import { InstallJob } from '../../../shared/types'

interface Props {
  job: InstallJob
  onError: (error: string) => void
  onBack: () => void
}

export default function Installing({ job, onError, onBack }: Props) {
  const [progress, setProgress] = useState(job.progress)
  const [currentFile, setCurrentFile] = useState('Preparing...')
  const [status, setStatus] = useState('extracting')
  const [completed, setCompleted] = useState(false)
  const api = (window as any).faizAPI

  useEffect(() => {
    api.startInstall(job)

    api.onProgress((data: any) => {
      if (data.jobId === job.id) {
        setProgress(data.progress)
        setCurrentFile(data.currentFile || 'Processing...')
        setStatus(data.status)
      }
    })

    api.onInstallComplete((data: any) => {
      if (data.jobId === job.id) {
        setProgress(100)
        setCompleted(true)
      }
    })

    api.onInstallError((data: any) => {
      if (data.jobId === job.id) onError(data.error)
    })

    return () => {
      api.removeAllListeners?.('installer:progress')
      api.removeAllListeners?.('installer:complete')
      api.removeAllListeners?.('installer:error')
    }
  }, [])

  const handleCancel = async () => {
    await api.cancelInstall(job.id)
    onBack()
  }

  if (completed) {
    return (
      <div className="completed">
        <div className="completed-icon">✅</div>
        <h3>{job.name} is Ready!</h3>
        <p>Installation completed successfully. Time to play.</p>
        <button className="btn-primary" onClick={onBack}>Back to Home</button>
      </div>
    )
  }

  return (
    <div className="installing-page">
      <div className="install-header">
        <div style={{ fontSize: '2.5rem' }}>📦</div>
        <div>
          <h2>{job.name}</h2>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem', marginTop: '4px' }}>
            FaizLaunch is handling your installation
          </div>
        </div>
      </div>

      <div className="card">
        <div className="progress-stats">
          <div className="progress-percent">{progress}%</div>
          <div className="progress-status">{status}</div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="current-file">📄 {currentFile}</div>

        <div className="install-tips">
          <p>💡 Do not turn off your PC during installation</p>
          <p>💡 HDD installs are slow — if it looks stuck, it's still working</p>
          <p>💡 FaizLaunch will resume automatically if anything goes wrong</p>
          <p>💡 Windows Defender exclusion has been added automatically</p>
        </div>

        <div className="install-actions">
          <button className="btn-danger" onClick={handleCancel}>Cancel Installation</button>
        </div>
      </div>
    </div>
  )
}