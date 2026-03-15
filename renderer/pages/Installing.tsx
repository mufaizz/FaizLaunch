import { useState, useEffect } from 'react'
import { InstallJob } from '../../shared/types'

interface Props {
  job: InstallJob
  onError: (error: string) => void
  onBack: () => void
}

export default function Installing({ job, onError, onBack }: Props) {
  const [progress, setProgress] = useState(job.progress)
  const [currentFile, setCurrentFile] = useState('')
  const [status, setStatus] = useState('Starting...')
  const [completed, setCompleted] = useState(false)
  const api = (window as any).faizAPI

  useEffect(() => {
    // Start the install
    api.startInstall(job)

    // Listen for progress
    api.onProgress((data: any) => {
      if (data.jobId === job.id) {
        setProgress(data.progress)
        setCurrentFile(data.currentFile)
        setStatus(data.status)
      }
    })

    api.onInstallComplete((data: any) => {
      if (data.jobId === job.id) {
        setProgress(100)
        setStatus('completed')
        setCompleted(true)
      }
    })

    api.onInstallError((data: any) => {
      if (data.jobId === job.id) {
        onError(data.error)
      }
    })

    return () => {
      api.removeAllListeners('installer:progress')
      api.removeAllListeners('installer:complete')
      api.removeAllListeners('installer:error')
    }
  }, [])

  const handleCancel = async () => {
    await api.cancelInstall(job.id)
    onBack()
  }

  return (
    <div className="installing">
      <h2>Installing {job.name}</h2>

      {!completed ? (
        <>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="progress-info">
            <span className="progress-percent">{progress}%</span>
            <span className="progress-status">{status}</span>
          </div>

          {currentFile && (
            <p className="current-file">📦 {currentFile}</p>
          )}

          <div className="install-tips">
            <p>💡 Do not turn off your PC during installation</p>
            <p>💡 If it appears stuck, it's still working — HDD installs are slow</p>
            <p>💡 FaizLaunch will resume automatically if anything goes wrong</p>
          </div>

          <button className="cancel-btn" onClick={handleCancel}>
            Cancel Installation
          </button>
        </>
      ) : (
        <div className="completed">
          <div className="completed-icon">✅</div>
          <h3>{job.name} installed successfully!</h3>
          <p>Your game is ready to play.</p>
          <button className="back-btn" onClick={onBack}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  )
}