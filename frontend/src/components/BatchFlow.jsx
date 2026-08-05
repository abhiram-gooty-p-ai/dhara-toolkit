import { useState } from 'react'
import BatchUpload from './BatchUpload'
import BatchReview from './BatchReview'
import ModeSelector from './ModeSelector'

export default function BatchFlow({ mode, onModeChange }) {
  const [matchResult, setMatchResult] = useState(null)
  const [metadataFiles, setMetadataFiles] = useState([])

  const handleMatched = (data) => {
    setMetadataFiles(data.metadataFiles)
    setMatchResult(data)
  }

  const reset = () => {
    setMatchResult(null)
    setMetadataFiles([])
  }

  return (
    <div className="app">
      {/* ── Left navigation tab ── */}
      <nav className="left-nav">
        <div className="left-nav-brand">
          <span className="left-nav-icon">⊞</span>
          <div className="left-nav-title-block">
            <span className="left-nav-title">DHARA</span>
            <span className="left-nav-subtitle">TOOLKIT</span>
          </div>
        </div>

        <div className="left-nav-divider" />

        <ModeSelector mode={mode} onModeChange={onModeChange} />

        <div className="left-nav-divider" />

        <div className="left-nav-section">
          <div className="left-nav-section-label">Batch Catalogue Upload</div>
          <p className="left-nav-hint">
            Upload dataset files and their metadata tag files together — matching happens automatically.
          </p>
        </div>

        {matchResult && (
          <div className="left-nav-section">
            <button className="left-nav-restart" onClick={reset}>↺ Start over</button>
          </div>
        )}
      </nav>

      {/* ── Main content ── */}
      <div className="app-main">
        <div className="app-topbar">
          <a
            href="https://des-website-235956738573.asia-south1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="view-catalogue-btn"
          >
            View Catalogue ↗
          </a>
        </div>

        <div className="app-scroll-area">
          {!matchResult && <BatchUpload onMatched={handleMatched} />}
          {matchResult && (
            <BatchReview
              matchResult={matchResult}
              metadataFiles={metadataFiles}
              onDone={reset}
              onCancel={reset}
            />
          )}
        </div>
      </div>
    </div>
  )
}
