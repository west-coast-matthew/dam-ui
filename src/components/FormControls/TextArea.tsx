import { useId, useState, type ChangeEvent, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Field, type FieldMessageProps } from './Field'
import { messageId } from './utils'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldMessageProps {
  label?: ReactNode
}

/** Multi-line text. Shows a character counter when `maxLength` is set. */
export function TextArea({ label, hint, error, success, id, className, onChange, ...textarea }: TextAreaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const initial = String(textarea.value ?? textarea.defaultValue ?? '')
  const [length, setLength] = useState(initial.length)
  const count = textarea.value !== undefined ? String(textarea.value).length : length
  const hasMessage = Boolean(error ?? success ?? hint)

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} success={success}
      required={textarea.required} disabled={textarea.disabled} className={className}>
      <div className="fc-input fc-input--multiline">
        <textarea
          id={fieldId}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId(fieldId) : undefined}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            setLength(e.target.value.length)
            onChange?.(e)
          }}
          {...textarea}
        />
      </div>
      {textarea.maxLength !== undefined && (
        <span className="fc-counter" aria-live="polite">
          {count} / {textarea.maxLength}
        </span>
      )}
    </Field>
  )
}
