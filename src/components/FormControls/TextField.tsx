import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Field, type FieldMessageProps } from './Field'
import { messageId } from './utils'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>, FieldMessageProps {
  label?: ReactNode
  /** Content inside the field before the text, e.g. an icon or "$". */
  prefix?: ReactNode
  /** Content inside the field after the text, e.g. a unit or a button. */
  suffix?: ReactNode
}

export function TextField({ label, hint, error, success, prefix, suffix, id, className, ...input }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hasMessage = Boolean(error ?? success ?? hint)
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} success={success}
      required={input.required} disabled={input.disabled} className={className}>
      <div className="fc-input">
        {prefix && <span className="fc-input__affix">{prefix}</span>}
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId(fieldId) : undefined}
          {...input}
        />
        {suffix && <span className="fc-input__affix">{suffix}</span>}
      </div>
    </Field>
  )
}
