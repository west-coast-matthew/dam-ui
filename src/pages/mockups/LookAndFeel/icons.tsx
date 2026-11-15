// Simple stroke icons for the navigation rail.
const paths = {
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  assets: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4',
  collections: 'M3 7h7l2 2h9v10H3z',
  reports: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
  logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
} as const

export type IconName = keyof typeof paths

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
