import { useId, useState, type DragEvent, type ReactNode } from 'react'

export interface FileDropProps {
  label: ReactNode
  accept?: string
  multiple?: boolean
  hint?: ReactNode
  disabled?: boolean
  onFiles?: (files: File[]) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Drop zone + file picker. Lists the chosen files; doesn't upload anything. */
export function FileDrop({ label, accept, multiple, hint, disabled, onFiles }: FileDropProps) {
  const id = useId()
  const [files, setFiles] = useState<File[]>([])
  const [over, setOver] = useState(false)

  const take = (list: FileList | null) => {
    const next = list ? Array.from(list) : []
    setFiles(next)
    onFiles?.(next)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (!disabled) take(e.dataTransfer.files)
  }

  return (
    <div className={`fc-field${disabled ? ' fc-field--disabled' : ''}`}>
      <span className="fc-label" id={`${id}-label`}>{label}</span>
      <label
        htmlFor={id}
        className={`fc-drop${over ? ' fc-drop--over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <span><strong>Choose {multiple ? 'files' : 'a file'}</strong> or drag {multiple ? 'them' : 'it'} here</span>
        {hint && <span className="fc-drop__hint">{hint}</span>}
        <input id={id} type="file" accept={accept} multiple={multiple} disabled={disabled}
          aria-labelledby={`${id}-label`} className="fc-visually-hidden" onChange={(e) => take(e.target.files)} />
      </label>
      {files.length > 0 && (
        <ul className="fc-drop__files">
          {files.map((f) => (
            <li key={f.name + f.size}>
              <span>{f.name}</span>
              <span className="fc-drop__hint">{formatSize(f.size)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
