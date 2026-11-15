import { useId, type ReactNode } from 'react'

export interface SegmentedControlProps<T extends string> {
  legend: ReactNode
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  hideLegend?: boolean
}

/** A small set of mutually exclusive options shown as joined buttons. */
export function SegmentedControl<T extends string>({ legend, options, value, onChange, hideLegend }: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset className="fc-segmented">
      <legend className={hideLegend ? 'fc-visually-hidden' : 'fc-label'}>{legend}</legend>
      <div className="fc-segmented__options">
        {options.map((o) => (
          <label key={o.value}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
