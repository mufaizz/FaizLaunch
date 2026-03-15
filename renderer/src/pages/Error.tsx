import { useState, useEffect } from 'react'
import { ErrorDiagnosis } from '../../../shared/types'

interface Props {
  errorText: string
  onBack: () => void
}

export default function ErrorPage({ errorText, onBack }: Props) {
  const [diagnoses, setDiagnoses] = useState<ErrorDiagnosis[]>([])
  const api = (window as any).faizAPI

  useEffect(() => {
    if (errorText) {
      api.analyzeError(errorText).then((results: ErrorDiagnosis[]) => setDiagnoses(results))
    }
  }, [errorText])

  return (
    <div className="error-page">
      <div className="error-header">
        <span style={{ fontSize: '2rem' }}>🩺</span>
        <h2>Error Diagnosed</h2>
      </div>

      <div className="raw-error">Error: {errorText}</div>

      <div style={{ marginBottom: '16px', color: 'var(--text2)', fontSize: '0.9rem' }}>
        FaizLaunch identified {diagnoses.length} issue(s). Follow the steps below:
      </div>

      {diagnoses.map((d, i) => (
        <div key={i} className={`diagnosis-card ${d.severity}`}>
          <div className="diagnosis-header">
            <span className="diagnosis-type">{d.errorType}</span>
            <span className={`severity-badge ${d.severity}`}>{d.severity.toUpperCase()}</span>
          </div>
          <p className="diagnosis-explanation">{d.explanation}</p>
          <div className="fix-steps">
            <h4>How to fix:</h4>
            <ol>
              {d.fixSteps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>
          {d.downloadLink && (
            <a href={d.downloadLink} target="_blank" rel="noopener noreferrer" className="download-link">
              📥 Download Fix
            </a>
          )}
        </div>
      ))}

      <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={onBack}>
        ← Try Again
      </button>
    </div>
  )
}