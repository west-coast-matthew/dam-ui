import { useId, type ReactNode } from 'react'

export interface RadioOption {
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps {
  legend: ReactNode
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  name?: string
  direction?: 'vertical' | 'horizontal'
  disabled?: boolean
  error?: ReactNode
}

export function RadioGroup({
  legend,
  options,
  value,
  defaultValue,
  onChange,
  name,
  direction = 'vertical',
  disabled,
  error,
}: RadioGroupProps) {
  const autoName = useId()
  const groupName = name ?? autoName
  return (
    <fieldset className={`fc-group fc-group--${direction}${error ? ' fc-field--error' : ''}`} disabled={disabled}>
      <legend className="fc-label">{legend}</legend>
      <div className="fc-group__options">
        {options.map((o) => (
          <label key={o.value} className={`fc-choice${disabled || o.disabled ? ' fc-choice--disabled' : ''}`}>
            <input
              type="radio"
              className="fc-radio"
              name={groupName}
              value={o.value}
              disabled={o.disabled}
              {...(value !== undefined
                ? { checked: value === o.value }
                : { defaultChecked: defaultValue === o.value })}
              onChange={() => onChange?.(o.value)}
            />
            <span className="fc-choice__text">
              {o.label}
              {o.description && <span className="fc-choice__description">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="fc-message" role="alert">{error}</p>}
    </fieldset>
  )
}
