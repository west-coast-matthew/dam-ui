import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  /** Shows the "some selected" dash. Visual only; `checked` still drives the value. */
  indeterminate?: boolean
  description?: ReactNode
}

export function Checkbox({ label, indeterminate = false, description, className, ...input }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <label className={['fc-choice', input.disabled && 'fc-choice--disabled', className].filter(Boolean).join(' ')}>
      <input ref={ref} type="checkbox" className="fc-checkbox" {...input} />
      <span className="fc-choice__text">
        {label}
        {description && <span className="fc-choice__description">{description}</span>}
      </span>
    </label>
  )
}
