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
  /** sm for inline areas, md (default) for panels. */
  size?: 'sm' | 'md'
  className?: string
}

/** Warning triangle with an exclamation mark. */
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9v4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  )
}

/** Shown when a component's data failed to load: an alert icon, a message and an optional retry. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  size = 'md',
  className,
}: ErrorStateProps) {
  return (
    <div className={['error-state', `error-state--${size}`, className].filter(Boolean).join(' ')} role="alert">
      <span className="error-state__icon">
        <AlertIcon />
      </span>
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
