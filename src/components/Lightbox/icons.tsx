import type { SVGProps } from 'react'

function Icon({ d, size = 16, ...props }: SVGProps<SVGSVGElement> & { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

export const CheckIcon = () => <Icon strokeWidth={2.6} d="M5 12.5l4.5 4.5L19 7.5" />
export const PlusIcon = () => <Icon strokeWidth={2.4} d="M12 5v14M5 12h14" />
export const CartIcon = () => (
  <Icon size={18} d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2M9.5 20.5h.01M17 20.5h.01" />
)
export const CloseIcon = () => <Icon d="M18 6 6 18M6 6l12 12" />
export const TrashIcon = () => <Icon d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
export const DownloadIcon = () => <Icon d="M12 4v11m0 0-4-4m4 4 4-4M4 19h16" />
export const PlayIcon = ({ size = 16 }: { size?: number }) => <Icon size={size} fill="currentColor" d="M7 5v14l12-7z" />
export const PauseIcon = ({ size = 16 }: { size?: number }) => <Icon size={size} fill="currentColor" d="M7 5h3v14H7zM14 5h3v14h-3z" />
export const PrevIcon = ({ size = 20 }: { size?: number }) => <Icon size={size} d="M15 18l-6-6 6-6" />
export const NextIcon = ({ size = 20 }: { size?: number }) => <Icon size={size} d="M9 18l6-6-6-6" />
export const SaveIcon = () => <Icon d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />
export const LightboxIcon = ({ size = 16 }: { size?: number }) => <Icon size={size} d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
export const SharedIcon = () => <Icon size={12} d="M16 11a3 3 0 1 0-3-3M8 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM2 20a6 6 0 0 1 12 0M14 14.5a6 6 0 0 1 8 5.5" />
