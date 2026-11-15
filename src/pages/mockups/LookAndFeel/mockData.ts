// Static placeholder data for the look-and-feel mockup. Not wired to the API.

export interface Kpi {
  label: string
  value: string
  change: number
}

export const KPIS: Kpi[] = [
  { label: 'Total assets', value: '2,100', change: 14 },
  { label: 'Uploads this week', value: '1,228', change: -3 },
  { label: 'Storage used, TB', value: '6.92', change: 1 },
  { label: 'Avg downloads / day', value: '2.3k', change: 21 },
]

export const SPARKLINE = [42, 55, 38, 61, 47, 66, 58, 72, 64, 80]

export const ACTIVITY_DAYS = [
  '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28',
]

export const ACTIVITY = [
  { name: 'Uploads', values: [310, 320, 180, 140, 190, 230, 250, 240, 210, 270, 300, 340, 310, 190] },
  { name: 'Downloads', values: [220, 240, 260, 230, 210, 200, 220, 260, 280, 250, 230, 250, 270, 260] },
]

export const RANGES = ['Today', '7d', '2w', '1m', '3m', '1y'] as const

export interface Stat {
  label: string
  value: number
  max: number
}

export const STATS: Stat[] = [
  { label: 'Active users', value: 312, max: 512 },
  { label: 'Pending reviews', value: 136, max: 381 },
]

export interface Collection {
  label: string
  name: string
  count: number
  unit: string
}

export const COLLECTIONS: Collection[] = [
  { label: 'Top collection', name: 'Brand Assets', count: 1883, unit: 'files' },
  { label: 'Top format', name: 'JPEG', count: 420, unit: 'files' },
  { label: 'Top contributor', name: 'Marketing', count: 2010, unit: 'files' },
]

export const RECENT_ASSETS = [
  { name: 'spring-campaign-hero.jpg', type: 'Image', size: '4.2 MB', updated: '2h ago' },
  { name: 'product-demo.mp4', type: 'Video', size: '128 MB', updated: '5h ago' },
  { name: 'brand-guidelines.pdf', type: 'Document', size: '12 MB', updated: 'Yesterday' },
  { name: 'logo-pack.zip', type: 'Archive', size: '36 MB', updated: '2d ago' },
]
