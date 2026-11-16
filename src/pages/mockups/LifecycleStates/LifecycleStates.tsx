import { useState } from 'react'
import { ErrorState } from '../../../components/ErrorState'
import { SegmentedControl } from '../../../components/FormControls'
import { LoadingState } from '../../../components/LoadingState'
import { Panel, PanelGrid } from '../../../components/Panel'
import { ThemeSelect } from '../../../components/ThemeSelect'
import './LifecycleStates.css'

type Phase = 'loading' | 'error' | 'loaded'

const PHASES: { value: Phase; label: string }[] = [
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
  { value: 'loaded', label: 'Loaded' },
]

const logRetry = (where: string) => () => console.log('[LifecycleStates] onRetry', where)

/** A panel whose body switches between the lifecycle states, as components using them will. */
function LiveExample() {
  const [phase, setPhase] = useState<Phase>('loading')
  return (
    <Panel title="In a panel" subtitle="Switch the state to see how a component's body changes" columns={1}>
      <SegmentedControl legend="State" options={PHASES} value={phase} onChange={setPhase} />
      <div className="lcs-live">
        {phase === 'loading' && <LoadingState label="Loading recent uploads…" />}
        {phase === 'error' && (
          <ErrorState
            title="Couldn't load recent uploads"
            message="The asset service didn't respond. Check your connection and try again."
            onRetry={() => {
              logRetry('live example')()
              setPhase('loading')
            }}
          />
        )}
        {phase === 'loaded' && (
          <ul className="lcs-loaded">
            {['harbor-001.png', 'teaser-049.mp4', 'press-kit-067.pdf'].map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}

/** Mockup page for the shared LoadingState and ErrorState components. */
export function LifecycleStates() {
  return (
    <div className="lcs-page">
      <header className="lcs-header">
        <div>
          <h1>Lifecycle states</h1>
          <p className="lcs-muted">The loading and error states components show while their data loads, in every theme</p>
        </div>
        <ThemeSelect />
      </header>

      <PanelGrid>
        <Panel title="Loading, small" subtitle='size="sm"' columns={3}>
          <LoadingState size="sm" />
        </Panel>
        <Panel title="Loading, medium" subtitle="Default size" columns={3}>
          <LoadingState label="Loading assets…" />
        </Panel>
        <Panel title="Loading, large" subtitle='size="lg", for whole pages' columns={3}>
          <LoadingState size="lg" label="Loading workspace…" />
        </Panel>

        <Panel title="Error with retry" subtitle="Title, message and onRetry" columns={2}>
          <ErrorState
            title="Couldn't load assets"
            message="The asset service returned an error (503). Try again in a moment."
            onRetry={logRetry('error with retry')}
          />
        </Panel>
        <Panel title="Error, small" subtitle='size="sm", default title, no retry' columns={2}>
          <ErrorState size="sm" message="This widget couldn't load." />
        </Panel>

        <LiveExample />
      </PanelGrid>
    </div>
  )
}
