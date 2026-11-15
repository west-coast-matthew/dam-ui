import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  BarElement,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { useThemeTokens } from '../../../theme/useThemeTokens'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend)

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const UPLOADS = [120, 180, 150, 220, 260, 140, 110]
const DOWNLOADS = [200, 230, 210, 280, 300, 190, 170]

const TOKENS = ['--color-chart-1', '--color-chart-2', '--color-text-muted', '--color-grid', '--color-surface'] as const

function withAlpha(hex: string, alpha: number) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function useChartOptions() {
  const t = useThemeTokens(TOKENS)
  const axis = {
    grid: { color: t['--color-grid'] },
    border: { display: false },
    ticks: { color: t['--color-text-muted'] },
  }
  return {
    tokens: t,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: t['--color-text-muted'], boxWidth: 10, boxHeight: 10, usePointStyle: true } },
        tooltip: { backgroundColor: t['--color-surface'], titleColor: t['--color-text-muted'], bodyColor: t['--color-text-muted'] },
      },
      scales: { x: { ...axis, grid: { display: false } }, y: axis },
    },
  }
}

export function ActivityLineChart({ height = 220 }: { height?: number }) {
  const { tokens, options } = useChartOptions()
  const data = {
    labels: DAYS,
    datasets: [
      {
        label: 'Uploads',
        data: UPLOADS,
        borderColor: tokens['--color-chart-1'],
        backgroundColor: withAlpha(tokens['--color-chart-1'], 0.15),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Downloads',
        data: DOWNLOADS,
        borderColor: tokens['--color-chart-2'],
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  }
  return (
    <div style={{ height }}>
      <Line data={data} options={options} aria-label="Uploads and downloads this week" role="img" />
    </div>
  )
}

export function UploadsBarChart({ height = 180 }: { height?: number }) {
  const { tokens, options } = useChartOptions()
  const data = {
    labels: DAYS,
    datasets: [{ label: 'Uploads', data: UPLOADS, backgroundColor: tokens['--color-chart-1'], borderRadius: 6 }],
  }
  return (
    <div style={{ height }}>
      <Bar data={data} options={options} aria-label="Uploads per day this week" role="img" />
    </div>
  )
}
