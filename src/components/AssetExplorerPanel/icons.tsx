import type { SVGProps } from 'react'

function Icon({ d, size = 16, ...props }: SVGProps<SVGSVGElement> & { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

export const MaximizeIcon = () => <Icon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
export const RestoreIcon = () => <Icon d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
export const MinimizeIcon = () => <Icon d="M5 12h14" />
export const ExpandIcon = () => <Icon d="M6 9l6 6 6-6" />
export const ListIcon = () => <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
export const GalleryIcon = () => <Icon d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z" />
export const CloseIcon = () => <Icon d="M18 6 6 18M6 6l12 12" />
export const DownloadIcon = () => <Icon d="M12 4v11m0 0-4-4m4 4 4-4M4 19h16" />
export const PrevIcon = () => <Icon size={20} d="M15 18l-6-6 6-6" />
export const NextIcon = () => <Icon size={20} d="M9 18l6-6-6-6" />
export const ImageIcon = () => <Icon size={28} strokeWidth={1.4} d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01" />
export const VideoIcon = () => <Icon size={28} strokeWidth={1.4} d="M4 6h11v12H4zM15 10l5-3v10l-5-3" />
export const PdfIcon = () => <Icon size={28} strokeWidth={1.4} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" />
export const AudioIcon = () => <Icon size={28} strokeWidth={1.4} d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" />
export const FileIcon = () => <Icon size={28} strokeWidth={1.4} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
export const HistoryIcon = () => <Icon size={28} strokeWidth={1.4} d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" />
