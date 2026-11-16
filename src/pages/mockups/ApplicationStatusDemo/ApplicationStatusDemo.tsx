import { useEffect, useState } from 'react'
import { ApplicationStatusPanel } from '../../../components/ApplicationStatusPanel'
import { SegmentedControl } from '../../../components/FormControls'
import { ThemeSelect } from '../../../components/ThemeSelect'
import { fetchApplicationStatus, type ApplicationStatus, type MockStatusScenario } from '../../../services/statusService'
import './ApplicationStatusDemo.css'

const SCENARIOS: { value: MockStatusScenario; label: string }[] = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'storage-warning', label: 'Storage 84%' },
  { value: 'storage-critical', label: 'Storage 97%' },
  { value: 'database-down', label: 'Database down' },
  { value: 'storage-down', label: 'Storage down' },
  { value: 'unreachable', label: 'API unreachable' },
]

interface LoadState {
  data: ApplicationStatus | null
  isLoading: boolean
  error: string | null
}

/** Mockup page for ApplicationStatusPanel, with a scenario picker for the mock status service. */
export function ApplicationStatusDemo() {
  const [scenario, setScenario] = useState<MockStatusScenario>('healthy')
  const [requestId, setRequestId] = useState(0)
  const [load, setLoad] = useState<LoadState>({ data: null, isLoading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetchApplicationStatus(scenario).then(
      (data) => !cancelled && setLoad({ data, isLoading: false, error: null }),
      (err: unknown) => !cancelled && setLoad({ data: null, isLoading: false, error: err instanceof Error ? err.message : String(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [scenario, requestId])

  const refresh = () => {
    console.log('[ApplicationStatusDemo] onRefresh')
    setLoad((s) => ({ ...s, isLoading: true, error: null }))
    setRequestId((n) => n + 1)
  }

  return (
    <div className="asd-page">
      <header className="asd-header">
        <div>
          <h1>Application status</h1>
          <p className="asd-muted">Pick a scenario for the mock status service; the panel updates after a short delay.</p>
        </div>
        <ThemeSelect />
      </header>
      <div className="asd-controls">
        <SegmentedControl legend="Mock scenario" options={SCENARIOS} value={scenario}
          onChange={(next) => {
            setLoad((s) => ({ ...s, isLoading: true, error: null }))
            setScenario(next)
          }} />
      </div>
      <div className="asd-panel">
        <ApplicationStatusPanel data={load.data} isLoading={load.isLoading} isError={load.error !== null}
          errorMessage={load.error} onRefresh={refresh} />
      </div>
    </div>
  )
}
