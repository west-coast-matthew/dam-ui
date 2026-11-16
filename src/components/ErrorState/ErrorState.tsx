import type { ReactNode } from 'react'
import { Button } from '../FormControls'
import './ErrorState.css'

export interface ErrorStateProps {
  title?: string
  /** Details about what went wrong. */
  message?: ReactNode
  /** When given, shows a retry button. */
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

/** Placeholder shown when a component's data failed to load. Look and feel to be refined in a later spec. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div className={['error-state', className].filter(Boolean).join(' ')} role="alert">
      <svg className="error-state__icon" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="error-state__title">{title}</p>
      {message && <p className="error-state__message">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
