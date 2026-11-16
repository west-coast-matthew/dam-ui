import { useEffect, useState } from 'react'
import { SegmentedControl } from '../../../components/FormControls'
import { RecentActivityPanel, type ActivityItem, type RecentActivity } from '../../../components/RecentActivityPanel'
import { ThemeSelect } from '../../../components/ThemeSelect'
import { mockActivity } from './mockActivity'
import './RecentActivityDemo.css'

type ResponseMode = 'success' | 'slow' | 'empty' | 'error'

const MODES: { value: ResponseMode; label: string }[] = [
  { value: 'success', label: 'Succeed' },
  { value: 'slow', label: 'Slow (4s)' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Fail' },
]

const EMPTY: RecentActivity = { uploads: [], categories: [], lightboxes: [] }

interface LoadState {
  data: RecentActivity | null
  isLoading: boolean
  isError: boolean
}

/** Mockup page for RecentActivityPanel, fed by a simulated API. Event handlers log to the console. */
export function RecentActivityDemo() {
  const [mode, setMode] = useState<ResponseMode>('success')
  const [requestId, setRequestId] = useState(0)
  const [load, setLoad] = useState<LoadState>({ data: null, isLoading: true, isError: false })

  // Simulated request; the handlers below mark the panel as loading before triggering it.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (mode === 'error') setLoad({ data: null, isLoading: false, isError: true })
        else setLoad({ data: mode === 'empty' ? EMPTY : mockActivity(Date.now()), isLoading: false, isError: false })
      },
      mode === 'slow' ? 4000 : 700,
    )
    return () => clearTimeout(timer)
  }, [mode, requestId])

  const startLoading = () => setLoad({ data: null, isLoading: true, isError: false })
  const onRetry = () => {
    console.log('[RecentActivityDemo] onRetry')
    startLoading()
    setRequestId((n) => n + 1)
  }
  const onItemOpen = ({ section, item }: ActivityItem) => console.log('[RecentActivityDemo] onItemOpen', section, item)
  const onViewAll = (section: string) => console.log('[RecentActivityDemo] onViewAll', section)

  const shared = { data: load.data, isLoading: load.isLoading, isError: load.isError, onRetry,
    errorMessage: "The activity service didn't respond. (Simulated failure.)" }

  return (
    <div className="rad-page">
      <header className="rad-header">
        <div>
          <h1>Recent activity panel</h1>
          <p className="rad-muted">Data comes from a simulated API on this page. Every event the panel raises is logged to the console.</p>
        </div>
        <ThemeSelect />
      </header>

      <div className="rad-controls">
        <SegmentedControl legend="Simulated response" options={MODES} value={mode}
          onChange={(m) => {
            startLoading()
            setMode(m)
          }} />
      </div>

      <div className="rad-grid">
        <div>
          <h2 className="rad-caption">Wide, with item and "View all" handlers</h2>
          <RecentActivityPanel {...shared} onItemOpen={onItemOpen} onViewAll={onViewAll} />
        </div>
        <div>
          <h2 className="rad-caption">Sidebar width, read-only, 4 items, opens on Categories</h2>
          <RecentActivityPanel {...shared} title="Activity" maxItems={4} defaultSection="categories" />
        </div>
      </div>
    </div>
  )
}
