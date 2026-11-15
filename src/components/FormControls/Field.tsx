import type { ReactNode } from 'react'
import { messageId } from './utils'

export interface FieldMessageProps {
  /** Helper text shown under the control when there is no error or success message. */
  hint?: ReactNode
  /** Error message; marks the control invalid. */
  error?: ReactNode
  /** Success message, e.g. after validation passes. */
  success?: ReactNode
}

interface FieldProps extends FieldMessageProps {
  id: string
  label?: ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
}

/** Label + control + message wrapper shared by the text-style controls. */
export function Field({ id, label, hint, error, success, required, disabled, className, children }: FieldProps) {
  const state = error ? 'error' : success ? 'success' : undefined
  const message = error ?? success ?? hint
  return (
    <div className={['fc-field', state && `fc-field--${state}`, disabled && 'fc-field--disabled', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="fc-label" htmlFor={id}>
          {label}
          {required && <span className="fc-required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {message && (
        <p id={messageId(id)} className="fc-message" role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  )
}
