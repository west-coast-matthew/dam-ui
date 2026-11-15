import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { percentOf } from './utils'

export interface RangeSliderProps {
  label: ReactNode
  min?: number
  max?: number
  step?: number
  value?: [number, number]
  defaultValue?: [number, number]
  onChange?: (value: [number, number]) => void
  formatValue?: (value: number) => string
  disabled?: boolean
}

/** Two-thumb slider for picking a range. The thumbs can't cross. */
export function RangeSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = [min, max],
  onChange,
  formatValue = String,
  disabled,
}: RangeSliderProps) {
  const id = useId()
  const [internal, setInternal] = useState<[number, number]>(defaultValue)
  const [low, high] = value ?? internal

  const update = (next: [number, number]) => {
    setInternal(next)
    onChange?.(next)
  }

  const style = {
    '--from': `${percentOf(low, min, max)}%`,
    '--to': `${percentOf(high, min, max)}%`,
  } as CSSProperties

  return (
    <div className={`fc-field fc-slider${disabled ? ' fc-field--disabled' : ''}`} role="group" aria-labelledby={`${id}-label`}>
      <div className="fc-slider__head">
        <span id={`${id}-label`} className="fc-label">{label}</span>
        <output className="fc-slider__value">
          {formatValue(low)} – {formatValue(high)}
        </output>
      </div>
      <div className="fc-range-dual" style={style}>
        <input
          type="range"
          className="fc-range"
          aria-label="Minimum"
          aria-valuetext={formatValue(low)}
          min={min}
          max={max}
          step={step}
          value={low}
          disabled={disabled}
          onChange={(e) => update([Math.min(Number(e.target.value), high), high])}
        />
        <input
          type="range"
          className="fc-range"
          aria-label="Maximum"
          aria-valuetext={formatValue(high)}
          min={min}
          max={max}
          step={step}
          value={high}
          disabled={disabled}
          onChange={(e) => update([low, Math.max(Number(e.target.value), low)])}
        />
      </div>
    </div>
  )
}
