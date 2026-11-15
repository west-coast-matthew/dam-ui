import type { InputHTMLAttributes, ReactNode } from 'react'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label: ReactNode
  description?: ReactNode
}

/** On/off toggle. A checkbox underneath, announced as a switch. */
export function Switch({ label, description, className, ...input }: SwitchProps) {
  return (
    <label className={['fc-choice fc-switch', input.disabled && 'fc-choice--disabled', className].filter(Boolean).join(' ')}>
      <span className="fc-choice__text">
        {label}
        {description && <span className="fc-choice__description">{description}</span>}
      </span>
      <input type="checkbox" role="switch" className="fc-switch__input" {...input} />
    </label>
  )
}
