import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { percentOf } from './utils'

export interface SliderProps {
  label: ReactNode
  min?: number
  max?: number
  step?: number
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  /** Values to mark under the track. */
  marks?: number[]
  /** Shows the current value next to the label (default true). */
  showValue?: boolean
  formatValue?: (value: number) => string
  disabled?: boolean
  hint?: ReactNode
}

export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = min,
  onChange,
  marks,
  showValue = true,
  formatValue = String,
  disabled,
  hint,
}: SliderProps) {
  const id = useId()
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal

  return (
    <div className={`fc-field fc-slider${disabled ? ' fc-field--disabled' : ''}`}>
      <div className="fc-slider__head">
        <label className="fc-label" htmlFor={id}>{label}</label>
        {showValue && <output htmlFor={id} className="fc-slider__value">{formatValue(current)}</output>}
      </div>
      <input
        id={id}
        type="range"
        className="fc-range"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        aria-valuetext={formatValue(current)}
        style={{ '--fill': `${percentOf(current, min, max)}%` } as CSSProperties}
        onChange={(e) => {
          const next = Number(e.target.value)
          setInternal(next)
          onChange?.(next)
        }}
      />
      {marks && (
        <div className="fc-slider__marks" aria-hidden="true">
          {marks.map((m) => (
            <span key={m} style={{ left: `${percentOf(m, min, max)}%` }}>{formatValue(m)}</span>
          ))}
        </div>
      )}
      {hint && <p className="fc-message">{hint}</p>}
    </div>
  )
}
