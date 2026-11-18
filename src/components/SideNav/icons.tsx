import type { SVGProps } from 'react'

function Icon({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

export const DashboardIcon = () => <Icon d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />
export const UsersIcon = () => (
  <Icon d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7" />
)
export const LightboxIcon = () => <Icon d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
export const AssetsIcon = () => <Icon d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5h.01" />
export const InitializeIcon = () => <Icon d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
export const CollapseIcon = () => <Icon d="M15 18l-6-6 6-6M20 4v16" />
export const ExpandIcon = () => <Icon d="M9 18l6-6-6-6M4 4v16" />
