const paths = {
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'M6 9l6 6 6-6',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
} as const

export function PanelIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth={name === 'grip' ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
