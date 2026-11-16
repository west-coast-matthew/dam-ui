import type { SVGProps } from 'react'

function Icon({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

export const EditIcon = () => <Icon d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
/** Shown on active users: the action deactivates them. */
export const DeactivateIcon = () => <Icon d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 8l5 5M22 8l-5 5" />
/** Shown on inactive users: the action activates them. */
export const ActivateIcon = () => <Icon d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16 11l2 2 4-4" />
export const PlusIcon = () => <Icon d="M12 5v14M5 12h14" />
export const ArrowUpIcon = () => <Icon d="M12 19V5M6 11l6-6 6 6" width="16" height="16" />
export const ArrowDownIcon = () => <Icon d="M12 5v14M6 13l6 6 6-6" width="16" height="16" />
