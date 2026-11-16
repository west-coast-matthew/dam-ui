import './LoadingState.css'

export interface LoadingStateProps {
  /** Text shown under the spinner and announced to screen readers. */
  label?: string
  className?: string
}

/** Placeholder shown while a component's data is loading. Look and feel to be refined in a later spec. */
export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div className={['loading-state', className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <span className="loading-state__spinner" aria-hidden="true" />
      <p className="loading-state__label">{label}</p>
    </div>
  )
}
