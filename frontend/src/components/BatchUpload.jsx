import { useRef, useState } from 'react'

function FileList({ files, onRemove }) {
  if (files.length === 0) return null
  return (
    <ul className="batch-file-list">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`}>
          <span className="batch-file-name">{f.name}</span>
          <button className="batch-file-remove" onClick={() => onRemove(i)} title="Remove">✕</button>
        </li>
      ))}
    </ul>
  )
}

export default function BatchUpload({ onMatched }) {
  const [datasetFiles, setDatasetFiles] = useState([])
  const [metadataFiles, setMetadataFiles] = useState([])
  const [stage, setStage] = useState('idle') // idle | extracting | matching | error
  const [error, setError] = useState('')
  // A single shared hidden input, routed by `pendingTarget`, sidesteps a
  // React/Chromium quirk where the second of two separate <input type=file>
  // elements on the page stops firing onChange after the first one is used.
  const fileInputRef = useRef()
  const pendingTarget = useRef(null) // 'dataset' | 'metadata'

  const excelOnly = (fileList) => Array.from(fileList).filter((f) => /\.(xlsx|xls)$/i.test(f.name))

  const openPicker = (target) => {
    pendingTarget.current = target
    fileInputRef.current.click()
  }

  const handleFilesChosen = (fileList) => {
    const files = excelOnly(fileList)
    if (pendingTarget.current === 'dataset') {
      setDatasetFiles((prev) => [...prev, ...files])
    } else if (pendingTarget.current === 'metadata') {
      setMetadataFiles((prev) => [...prev, ...files])
    }
  }

  const removeDataset = (i) => setDatasetFiles((prev) => prev.filter((_, idx) => idx !== i))
  const removeMetadata = (i) => setMetadataFiles((prev) => prev.filter((_, idx) => idx !== i))

  const busy = stage === 'extracting' || stage === 'matching'
  const canRun = datasetFiles.length > 0 && metadataFiles.length > 0 && !busy

  const runMatch = async () => {
    setError('')
    setStage('extracting')
    try {
      const extractFd = new FormData()
      datasetFiles.forEach((f) => extractFd.append('files', f))
      const extractRes = await fetch('/api/catalogue/batch-extract', { method: 'POST', body: extractFd })
      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({ detail: 'Extraction failed' }))
        throw new Error(err.detail || 'Extraction failed')
      }
      const extractData = await extractRes.json()

      setStage('matching')
      const matchFd = new FormData()
      matchFd.append('tables_json', JSON.stringify(extractData.tables))
      metadataFiles.forEach((f) => matchFd.append('metadata_files', f))
      const matchRes = await fetch('/api/catalogue/batch-match', { method: 'POST', body: matchFd })
      if (!matchRes.ok) {
        const err = await matchRes.json().catch(() => ({ detail: 'Matching failed' }))
        throw new Error(err.detail || 'Matching failed')
      }
      const matchData = await matchRes.json()

      setStage('idle')
      onMatched({ ...matchData, metadataFiles, perFile: extractData.per_file })
    } catch (e) {
      setError(e.message)
      setStage('error')
    }
  }

  return (
    <div className="batch-upload">
      <h2 className="batch-upload-title">Batch upload &amp; auto-map</h2>
      <p className="batch-upload-subtitle">
        Upload every dataset workbook and every metadata tag file for a release together.
        Tables are matched to their metadata automatically — you'll review the mapping before anything is pushed.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { handleFilesChosen(e.target.files); e.target.value = '' }}
      />

      <div className="batch-upload-cols">
        <div className="batch-upload-col">
          <div className="batch-upload-label">Dataset files</div>
          <button className="batch-upload-btn" disabled={busy} onClick={() => openPicker('dataset')}>
            📁 Add dataset files
          </button>
          <FileList files={datasetFiles} onRemove={removeDataset} />
        </div>

        <div className="batch-upload-col">
          <div className="batch-upload-label">Metadata tag files</div>
          <button className="batch-upload-btn" disabled={busy} onClick={() => openPicker('metadata')}>
            🏷️ Add metadata files
          </button>
          <FileList files={metadataFiles} onRemove={removeMetadata} />
        </div>
      </div>

      {error && <div className="error-banner"><strong>Error:</strong> {error}</div>}

      <button className="batch-run-btn" disabled={!canRun} onClick={runMatch}>
        {stage === 'extracting' && 'Extracting tables…'}
        {stage === 'matching' && 'Matching to metadata…'}
        {(stage === 'idle' || stage === 'error') && 'Auto-match →'}
      </button>
    </div>
  )
}
