import { useState } from 'react'

const FREQUENCY_OPTIONS = ['Annual', 'Monthly', 'Quarterly', 'Decennial', 'Ad-hoc']

const CONFIDENCE_LABEL = {
  exact: 'Exact ID match',
  stem: 'ID match (ignoring year/version typo)',
  code: 'Table-code match',
  'code+keyword': 'Table-code + keyword match',
  grouped: 'Grouped with siblings (no exact row)',
  manual: 'Manually assigned',
}

function MetadataForm({ metadata, onChange }) {
  const set = (field, value) => onChange({ ...metadata, [field]: value })
  return (
    <div className="push-new-form">
      <div className="push-field">
        <label className="push-label">Title *</label>
        <input className="push-input" value={metadata.title || ''} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Product</label>
        <input className="push-input" value={metadata.product || ''} onChange={(e) => set('product', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Category</label>
        <input className="push-input" value={metadata.category || ''} onChange={(e) => set('category', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Geography</label>
        <input className="push-input" value={metadata.geography || ''} onChange={(e) => set('geography', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Frequency</label>
        <select className="push-input" value={metadata.frequency || ''} onChange={(e) => set('frequency', e.target.value)}>
          <option value="">— select —</option>
          {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="push-field">
        <label className="push-label">Time Period</label>
        <input className="push-input" value={metadata.time_period || ''} onChange={(e) => set('time_period', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Source</label>
        <input className="push-input" value={metadata.data_source || ''} onChange={(e) => set('data_source', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Description</label>
        <textarea className="push-input push-textarea" value={metadata.description || ''} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Last Updated</label>
        <input className="push-input" value={metadata.last_updated || ''} onChange={(e) => set('last_updated', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Future Release</label>
        <input className="push-input" value={metadata.future_release || ''} onChange={(e) => set('future_release', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Key Statistics</label>
        <textarea className="push-input push-textarea" value={metadata.key_statistics || ''} onChange={(e) => set('key_statistics', e.target.value)} />
      </div>
      <div className="push-field">
        <label className="push-label">Remarks</label>
        <textarea className="push-input push-textarea" value={metadata.remarks || ''} onChange={(e) => set('remarks', e.target.value)} />
      </div>
    </div>
  )
}

export default function BatchReview({ matchResult, metadataFiles, onDone, onCancel }) {
  const [groups, setGroups] = useState(matchResult.groups)
  const [assignments, setAssignments] = useState({}) // unmatchedTableIndex -> groupIndex ('' = skip)
  const [step, setStep] = useState('review') // review | pushing | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const updateMetadata = (groupIndex, metadata) => {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? { ...g, metadata } : g)))
  }

  const assignedCount = Object.values(assignments).filter((v) => v !== '' && v !== undefined).length
  const totalMatched = groups.reduce((sum, g) => sum + g.matched_tables.length, 0) + assignedCount

  const handlePush = async () => {
    setStep('pushing')
    setError('')
    try {
      const finalGroups = groups.map((g) => ({ ...g, matched_tables: [...g.matched_tables] }))
      matchResult.unmatched_tables.forEach((u, idx) => {
        const target = assignments[idx]
        if (target !== undefined && target !== '') {
          finalGroups[Number(target)].matched_tables.push({ table: u.table, confidence: 'manual' })
        }
      })

      const fd = new FormData()
      fd.append('groups_json', JSON.stringify(finalGroups))
      metadataFiles.forEach((f) => fd.append('metadata_files', f))

      const res = await fetch('/api/catalogue/batch-push', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Push failed' }))
        throw new Error(err.detail || 'Push failed')
      }
      const data = await res.json()
      setResult(data)
      setStep('done')
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  if (step === 'done' && result) {
    return (
      <div className="batch-review">
        <div className="push-success">
          <div className="push-success-icon">✓</div>
          <div className="push-success-msg">
            {result.groups_pushed} metadata group{result.groups_pushed !== 1 ? 's' : ''} pushed
          </div>
          <button className="push-btn" onClick={onDone}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="batch-review">
      <div className="batch-review-header">
        <h2>Review auto-mapped catalogue</h2>
        <p>
          {totalMatched} table{totalMatched !== 1 ? 's' : ''} matched across {groups.length} metadata group{groups.length !== 1 ? 's' : ''}.
          Nothing is pushed until you confirm below.
        </p>
      </div>

      {error && <div className="error-banner"><strong>Error:</strong> {error}</div>}

      {groups.map((g, gi) => (
        <div className="batch-group" key={gi}>
          <div className="batch-group-header">
            <span className="batch-group-file">{g.file_name}</span>
            <span className="batch-group-count">{g.matched_tables.length} table{g.matched_tables.length !== 1 ? 's' : ''}</span>
          </div>

          <MetadataForm metadata={g.metadata} onChange={(m) => updateMetadata(gi, m)} />

          {g.matched_tables.length > 0 && (
            <table className="batch-table-list">
              <thead>
                <tr><th>Dataset ID</th><th>Title</th><th>Match basis</th></tr>
              </thead>
              <tbody>
                {g.matched_tables.map((mt, ti) => (
                  <tr key={ti}>
                    <td className="batch-table-id">{mt.table.id}</td>
                    <td>{mt.table.description || mt.table.title}</td>
                    <td>
                      <span className="batch-confidence" data-confidence={mt.confidence}>
                        {CONFIDENCE_LABEL[mt.confidence] || mt.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {matchResult.unmatched_tables.length > 0 && (
        <div className="batch-group batch-group-warn">
          <div className="batch-group-header">
            <span className="batch-group-file">⚠ Extracted tables with no metadata match ({matchResult.unmatched_tables.length})</span>
          </div>
          <p className="batch-hint">
            Not included in the push below unless you assign them to a group manually.
          </p>
          <table className="batch-table-list">
            <thead><tr><th>Dataset ID</th><th>Title</th><th>Assign to group</th></tr></thead>
            <tbody>
              {matchResult.unmatched_tables.map((u, idx) => (
                <tr key={idx}>
                  <td className="batch-table-id">{u.table.id}</td>
                  <td>{u.table.description || u.table.title}</td>
                  <td>
                    <select
                      className="push-input"
                      value={assignments[idx] ?? ''}
                      onChange={(e) => setAssignments((prev) => ({ ...prev, [idx]: e.target.value }))}
                    >
                      <option value="">Skip (don't push)</option>
                      {groups.map((g, gi) => (
                        <option key={gi} value={gi}>{g.metadata.title || g.file_name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {matchResult.unmatched_inventory.length > 0 && (
        <div className="batch-group batch-group-info">
          <div className="batch-group-header">
            <span className="batch-group-file">ℹ Metadata entries with no matching table ({matchResult.unmatched_inventory.length})</span>
          </div>
          <p className="batch-hint">
            Cataloged in the metadata file but no uploaded dataset table matched them — likely missing from what was uploaded.
          </p>
          <table className="batch-table-list">
            <thead><tr><th>Unique dataset ID</th><th>Description</th></tr></thead>
            <tbody>
              {matchResult.unmatched_inventory.map((u, idx) => (
                <tr key={idx}>
                  <td className="batch-table-id">{u.inventory_item.unique_dataset_id}</td>
                  <td>{u.inventory_item.short_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="push-modal-footer batch-review-footer">
        <button className="push-btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="push-btn" disabled={step === 'pushing' || totalMatched === 0} onClick={handlePush}>
          {step === 'pushing' ? 'Pushing…' : `Push ${totalMatched} tables across ${groups.length} groups →`}
        </button>
      </div>
    </div>
  )
}
