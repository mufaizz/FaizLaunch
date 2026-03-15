import { useState, useEffect } from 'react'
import { ErrorDiagnosis } from '../../shared/types'

interface Props {
  errorText: string
  onBack: () => void
}

export default function Error({ errorText, onBack }: Props) {
  const [diagnoses, setDiagnoses] = useState<ErrorDiagnosis[]>([])
  const api = (window as any).faizAPI

  useEffect(() => {
    if (errorText) {
      api.analyzeError(errorText).then((results: ErrorDiagnosis[]) => {
        setDiagnoses(results)
      })
    }
  }, [errorText])

  return (
    <div className="error-page">
      <h2>⚠️ Installation Error Detected</h2>

      <div className="raw-error">
        <p>Error: {errorText}</p>
      </div>

      <h3>🩺 FaizLaunch Diagnosis</h3>

      {diagnoses.map((d, i) => (
        <div key={i} className={`diagnosis-card ${d.severity}`}>
          <div className="diagnosis-header">
            <span className="diagnosis-type">{d.errorType}</span>
            <span className={`severity-badge ${d.severity}`}>{d.severity.toUpperCase()}</span>
          </div>

          <p className="diagnosis-explanation">{d.explanation}</p>

          <div className="fix-steps">
            <h4>How to fix it:</h4>
            <ol>
              {d.fixSteps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>

          {d.downloadLink && (
            
              href={d.downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="download-link"
            >
              📥 Download Fix
            </a>
          )}
        </div>
      ))}

      <button className="back-btn" onClick={onBack}>
        ← Try Again
      </button>
    </div>
  )
}