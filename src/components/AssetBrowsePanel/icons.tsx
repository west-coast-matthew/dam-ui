import type { SVGProps } from 'react'

function Icon({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

export const ChevronLeft = () => <Icon d="M15 18l-6-6 6-6" />
export const ChevronRight = () => <Icon d="M9 18l6-6-6-6" />
export const ChevronsLeft = () => <Icon d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
export const ChevronsRight = () => <Icon d="M13 17l5-5-5-5M6 17l5-5-5-5" />
export const CloseIcon = () => <Icon d="M18 6L6 18M6 6l12 12" />
export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
)
export const DocIcon = () => <Icon d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" width="12" height="12" />
export const EmptyIcon = () => (
  <Icon d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" width="32" height="32" strokeWidth="1.5" />
)
