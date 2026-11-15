import { SAMPLE_METRICS, type Metric } from './sampleMetrics'

export function Metrics({ items = SAMPLE_METRICS }: { items?: Metric[] }) {
  return (
    <dl className="demo-metrics">
      {items.map((m) => (
        <div key={m.label}>
          <dt>{m.label}</dt>
          <dd>
            {m.value}
            {m.change !== undefined && (
              <span className={m.change >= 0 ? 'demo-up' : 'demo-down'}>
                {m.change >= 0 ? '+' : ''}
                {m.change}%
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
