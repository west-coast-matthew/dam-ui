import './LoadingState.css'

export type LoadingStateSize = 'sm' | 'md' | 'lg'

export interface LoadingStateProps {
  /** Text shown under the spinner and announced to screen readers. */
  label?: string
  /** Spinner size: sm for inline areas, md (default) for panels, lg for whole pages. */
  size?: LoadingStateSize
  className?: string
}

/** Shown while a component's data is loading: a spinner with a short label. */
export function LoadingState({ label = 'Loading…', size = 'md', className }: LoadingStateProps) {
  return (
    <div className={['loading-state', `loading-state--${size}`, className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <svg className="loading-state__spinner" viewBox="0 0 48 48" aria-hidden="true">
        <circle className="loading-state__track" cx="24" cy="24" r="20" />
        <circle className="loading-state__arc" cx="24" cy="24" r="20" />
      </svg>
      <p className="loading-state__label">{label}</p>
    </div>
  )
}
