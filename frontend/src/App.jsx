import { useState } from 'react'
import BatchFlow from './components/BatchFlow'
import SingleFileFlow from './components/SingleFileFlow'

export default function App() {
  const [mode, setMode] = useState('batch') // 'batch' | 'single'

  return mode === 'batch'
    ? <BatchFlow mode={mode} onModeChange={setMode} />
    : <SingleFileFlow mode={mode} onModeChange={setMode} />
}
