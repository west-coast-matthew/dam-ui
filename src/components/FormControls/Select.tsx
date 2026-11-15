import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Field, type FieldMessageProps } from './Field'
import { messageId } from './utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldMessageProps {
  label?: ReactNode
  options: SelectOption[]
  /** Adds a first, empty option with this text. */
  placeholder?: string
}

export function Select({ label, hint, error, success, options, placeholder, id, className, ...select }: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hasMessage = Boolean(error ?? success ?? hint)
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} success={success}
      required={select.required} disabled={select.disabled} className={className}>
      <div className={`fc-input fc-select${select.multiple ? ' fc-select--multiple' : ''}`}>
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId(fieldId) : undefined}
          {...select}
        >
          {placeholder !== undefined && (
            <option value="" disabled={select.required}>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </Field>
  )
}
