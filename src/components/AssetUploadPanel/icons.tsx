import type { SVGProps } from 'react'

function Icon({ d, size = 16, ...props }: SVGProps<SVGSVGElement> & { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

export const UploadIcon = () => <Icon size={32} strokeWidth={1.6} d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
export const RemoveIcon = () => <Icon d="M18 6 6 18M6 6l12 12" />
export const VideoIcon = () => <Icon size={22} d="M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10l5-3v10l-5-3" />
export const PdfIcon = () => <Icon size={22} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" />
export const FileIcon = () => <Icon size={22} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
export const CheckIcon = () => <Icon size={18} strokeWidth={2.2} d="M5 12.5 10 17l9-10" />
