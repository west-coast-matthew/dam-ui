import { useState } from 'react'
import { AssetUploadPanel, type AssetUploadRequest } from '../../../components/AssetUploadPanel'
import { SegmentedControl } from '../../../components/FormControls'
import { Panel } from '../../../components/Panel'
import { ThemeSelect } from '../../../components/ThemeSelect'
import './AssetUploadDemo.css'

type Outcome = 'succeed' | 'fail'

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: 'succeed', label: 'Succeed' },
  { value: 'fail', label: 'Fail' },
]

const MOCK_CATALOGS = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Brand' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Campaigns 2026' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Product photography' },
]

const MAX_FILE_SIZE = 50 * 1024 * 1024

/** A loggable copy of the request: File objects become their name, size and type. */
function summarize(request: AssetUploadRequest) {
  return {
    ...request,
    items: request.items.map(({ file, title }) => ({ name: file.name, size: file.size, type: file.type, title })),
  }
}

/** Mockup page for AssetUploadPanel. The "upload" is simulated and every event is logged to the console. */
export function AssetUploadDemo() {
  const [outcome, setOutcome] = useState<Outcome>('succeed')
  const [lastRequest, setLastRequest] = useState<ReturnType<typeof summarize> | null>(null)

  const onSubmit = (request: AssetUploadRequest) => {
    const summary = summarize(request)
    console.log('[AssetUploadDemo] onSubmit', summary)
    setLastRequest(summary)
    // Stand-in for the real upload: wait, then succeed or fail.
    return new Promise<void>((resolve, reject) =>
      setTimeout(() => (outcome === 'succeed' ? resolve() : reject(new Error("The asset service didn't respond. Your files are still here; try again."))), 1500),
    )
  }

  return (
    <div className="aud-page">
      <header className="aud-header">
        <div>
          <h1>Asset upload panel</h1>
          <p className="aud-muted">Choose files and commit; the page simulates the upload and logs each event to the console.</p>
        </div>
        <ThemeSelect />
      </header>

      <div className="aud-controls">
        <SegmentedControl legend="Simulated upload" options={OUTCOMES} value={outcome} onChange={setOutcome} />
      </div>

      <AssetUploadPanel
        onSubmit={onSubmit}
        onCancel={() => console.log('[AssetUploadDemo] onCancel')}
        catalogs={MOCK_CATALOGS}
        maxFileSize={MAX_FILE_SIZE}
      />

      <div className="aud-grid">
        <AssetUploadPanel
          title="Bulk upload"
          defaultMode="multiple"
          maxFiles={10}
          onSubmit={onSubmit}
        />
        <div>
          <Panel title="Last request" subtitle="What the panel passed to onSubmit">
            <pre className="aud-request">{lastRequest ? JSON.stringify(lastRequest, null, 2) : 'Nothing submitted yet.'}</pre>
          </Panel>
        </div>
      </div>
    </div>
  )
}
