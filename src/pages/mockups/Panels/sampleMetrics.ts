export interface Metric {
  label: string
  value: string
  change?: number
}

export const SAMPLE_METRICS: Metric[] = [
  { label: 'Total assets', value: '2,100', change: 14 },
  { label: 'Uploads', value: '1,228', change: -3 },
  { label: 'Storage, TB', value: '6.92', change: 1 },
]
