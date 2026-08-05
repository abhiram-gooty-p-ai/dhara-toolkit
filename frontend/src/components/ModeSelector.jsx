export default function ModeSelector({ mode, onModeChange }) {
  return (
    <div className="mode-selector">
      <button
        className={`mode-btn${mode === 'batch' ? ' mode-btn-active' : ''}`}
        onClick={() => onModeChange('batch')}
      >
        Batch Auto-Map
      </button>
      <button
        className={`mode-btn${mode === 'single' ? ' mode-btn-active' : ''}`}
        onClick={() => onModeChange('single')}
      >
        Single File (Manual)
      </button>
    </div>
  )
}
