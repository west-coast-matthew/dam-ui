import type { ReactNode } from 'react'
import { Button } from '../FormControls'
import './AwaitingResponse.css'

export interface AwaitingResponseProgress {
  /** Steps finished so far, e.g. files uploaded. */
  done: number
  /** All steps. */
  total: number
  /** Replaces the default "3 of 12" text. */
  label?: string
}

export interface AwaitingResponseProps {
  /** What was submitted, e.g. "Uploading assets". Announced to screen readers. */
  title?: string
  /** More detail, e.g. which file is on its way. */
  message?: ReactNode
  /** When given, the ring fills up and a bar shows how far along the work is. */
  progress?: AwaitingResponseProgress
  /** When given, shows a button to stop waiting. */
  onCancel?: () => void
  cancelLabel?: string
  /** Disables the cancel button, e.g. once cancelling has started. */
  cancelling?: boolean
  /** sm for inline areas, md (default) for panels. */
  size?: 'sm' | 'md'
  className?: string
}

const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Shown after the user submits something and the app is waiting for the server, e.g. a large
 * upload. Like LoadingState, but it says what was sent, can show progress and can offer to cancel.
 */
export function AwaitingResponse({
  title = 'Waiting for a response…',
  message,
  progress,
  onCancel,
  cancelLabel = 'Cancel',
  cancelling = false,
  size = 'md',
  className,
}: AwaitingResponseProps) {
  const fraction = progress && progress.total > 0 ? Math.min(Math.max(progress.done / progress.total, 0), 1) : null
  const progressText = progress ? (progress.label ?? `${progress.done.toLocaleString()} of ${progress.total.toLocaleString()}`) : null

  return (
    <div
      className={['awaiting', `awaiting--${size}`, fraction !== null && 'awaiting--determinate', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="awaiting__indicator" aria-hidden="true">
        <svg className="awaiting__ring" viewBox="0 0 48 48">
          <circle className="awaiting__track" cx="24" cy="24" r={RADIUS} />
          <circle
            className="awaiting__arc"
            cx="24"
            cy="24"
            r={RADIUS}
            style={fraction !== null ? { strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE * (1 - fraction) } : undefined}
          />
        </svg>
        {/* An arrow travelling up: something has been sent and the answer is on its way. */}
        <svg className="awaiting__arrow" viewBox="0 0 24 24">
          <path d="M12 18V6m0 0-5 5m5-5 5 5" />
        </svg>
      </span>

      <p className="awaiting__title">{title}</p>
      {message && <p className="awaiting__message">{message}</p>}

      {fraction !== null && (
        <div className="awaiting__progress">
          <div
            className="awaiting__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress!.total}
            aria-valuenow={progress!.done}
            aria-valuetext={progressText ?? undefined}
          >
            <span style={{ width: `${fraction * 100}%` }} />
          </div>
          <span className="awaiting__count">{progressText}</span>
        </div>
      )}

      {onCancel && (
        <Button variant="secondary" size="sm" disabled={cancelling} onClick={onCancel}>
          {cancelling ? 'Cancelling…' : cancelLabel}
        </Button>
      )}
    </div>
  )
}
