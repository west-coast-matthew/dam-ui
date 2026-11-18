import './StepProgress.css'

export interface StepProgressStep {
  id: string
  label: string
}

export interface StepProgressProps {
  steps: StepProgressStep[]
  /** Index of the current step (0-based). Pass steps.length when every step is done. */
  current: number
  /**
   * Furthest step the user has reached. Steps before it count as finished even after going back,
   * and it stays clickable, so the user can jump forward again. Defaults to `current`.
   */
  reached?: number
  /** When given, finished steps become buttons that jump back to them. */
  onStepSelect?: (index: number) => void
  /** Accessible name for the list. */
  label?: string
  className?: string
}

/** 'visited' is the furthest step reached, after the user went back from it. */
type StepState = 'complete' | 'current' | 'visited' | 'upcoming'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5 10 17l9-10" />
  </svg>
)

/**
 * Numbered steps joined by a line, for wizards and other multi-step flows.
 * Finished steps show a tick; the current step is highlighted. On narrow screens only the
 * current step's label shows, with "Step x of y".
 */
export function StepProgress({ steps, current, reached, onStepSelect, label = 'Progress', className }: StepProgressProps) {
  const total = steps.length
  const position = Math.min(current + 1, total)
  const furthest = Math.max(current, reached ?? current)
  // Share of the connecting line that is filled.
  const fill = total > 1 ? (Math.min(furthest, total - 1) / (total - 1)) * 100 : 0

  return (
    <nav className={['step-progress', className].filter(Boolean).join(' ')} aria-label={label}>
      <p className="step-progress__summary">
        {current >= total ? 'All steps complete' : <>Step {position} of {total}: <strong>{steps[current]?.label}</strong></>}
      </p>
      <ol className="step-progress__list" style={{ ['--step-count' as string]: total, ['--step-fill' as string]: `${fill}%` }}>
        {steps.map((step, i) => {
          const state: StepState =
            i === current ? 'current' : i < furthest ? 'complete' : i === furthest ? 'visited' : 'upcoming'
          const marker = (
            <>
              <span className="step-progress__marker" aria-hidden="true">
                {state === 'complete' ? <CheckIcon /> : i + 1}
              </span>
              <span className="step-progress__label">{step.label}</span>
              <span className="fc-visually-hidden">
                {state === 'complete' ? ' (completed)' : state === 'current' ? ' (current step)' : state === 'visited' ? ' (visited)' : ''}
              </span>
            </>
          )
          return (
            <li key={step.id} className={`step-progress__step step-progress__step--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}>
              {(state === 'complete' || state === 'visited') && onStepSelect ? (
                <button type="button" className="step-progress__item" onClick={() => onStepSelect(i)}>
                  {marker}
                </button>
              ) : (
                <span className="step-progress__item">{marker}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
