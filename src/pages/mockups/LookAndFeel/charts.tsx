// Small dependency-free SVG charts for the mockup. Colours come from theme tokens.
import { useEffect, useRef, useState } from 'react'

function toPoints(values: number[], width: number, height: number, max: number, pad = 4) {
  const step = (width - pad * 2) / (values.length - 1)
  return values.map((v, i) => [pad + i * step, height - pad - (v / max) * (height - pad * 2)] as const)
}

function smoothPath(points: ReadonlyArray<readonly [number, number]>) {
  return points.reduce((path, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = points[i - 1]
    const cx = (px + x) / 2
    return `${path} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`
  }, '')
}

export function Sparkline({ values }: { values: number[] }) {
  const width = 220
  const height = 64
  const points = toPoints(values, width, height, Math.max(...values) * 1.1)
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={smoothPath(points)} fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}

interface Series {
  name: string
  values: number[]
}

/** Tracks an element's rendered width so the chart draws at 1:1 pixel scale. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

export function LineChart({ series, labels }: { series: Series[]; labels: string[] }) {
  const [ref, width] = useWidth<HTMLElement>(640)
  const height = 220
  const max = 400
  const gridLines = [0, 100, 200, 300, 400]
  const colors = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)']

  return (
    <figure className="line-chart" ref={ref}>
      <svg viewBox={`0 0 ${width} ${height + 24}`} width={width} height={height + 24} role="img" aria-label="Asset activity over two weeks">
        {gridLines.map((g) => {
          const y = height - 4 - (g / max) * (height - 8)
          return (
            <g key={g}>
              <line x1="32" x2={width} y1={y} y2={y} stroke="var(--color-grid)" />
              <text x="0" y={y + 4} className="line-chart__axis">{g}</text>
            </g>
          )
        })}
        <g transform="translate(32 0)">
          {series.map((s, i) => (
            <path
              key={s.name}
              d={smoothPath(toPoints(s.values, width - 32, height, max))}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="2.5"
            />
          ))}
          {toPoints(labels.map(() => 0), width - 32, height, max).map(([x], i) => (
            <text key={labels[i]} x={x} y={height + 20} textAnchor="middle" className="line-chart__axis">
              {labels[i]}
            </text>
          ))}
        </g>
      </svg>
      <figcaption className="line-chart__legend">
        {series.map((s, i) => (
          <span key={s.name}>
            <i style={{ background: colors[i % colors.length] }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

export function RingGauge({ value, max }: { value: number; max: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const filled = (value / max) * circumference
  return (
    <svg className="ring-gauge" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-grid)" strokeWidth="5" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 32 32)"
      />
    </svg>
  )
}
