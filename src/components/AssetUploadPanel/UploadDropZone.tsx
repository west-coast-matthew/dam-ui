import { useId, useRef, useState, type DragEvent } from 'react'
import { UploadIcon } from './icons'

export interface UploadDropZoneProps {
  multiple: boolean
  accept: string
  disabled?: boolean
  hint?: string
  onFiles: (files: File[]) => void
}

/** Drag-and-drop area that also opens the file picker on click, Enter or Space. */
export function UploadDropZone({ multiple, accept, disabled, hint, onFiles }: UploadDropZoneProps) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  // dragenter/dragleave fire for every child, so count them to know when the drag really leaves.
  const depth = useRef(0)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    depth.current = 0
    setOver(false)
    if (!disabled) onFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div
      className={['aup-drop', over && 'aup-drop--over', disabled && 'aup-drop--disabled'].filter(Boolean).join(' ')}
      onDragEnter={(e) => {
        e.preventDefault()
        depth.current++
        if (!disabled) setOver(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setOver(false)
      }}
      onDrop={onDrop}
      onClick={(e) => {
        // Clicking anywhere in the zone opens the picker; the label and input already do it themselves.
        if (!disabled && !(e.target as HTMLElement).closest('label, input')) input.current?.click()
      }}
    >
      <UploadIcon />
      <p className="aup-drop__text">
        {over ? (
          <strong>Drop to add {multiple ? 'them' : 'it'}</strong>
        ) : (
          <>
            Drag {multiple ? 'files' : 'a file'} here, or{' '}
            <label htmlFor={id} className="aup-drop__browse">browse</label>
          </>
        )}
      </p>
      {hint && <p className="aup-drop__hint">{hint}</p>}
      <input
        ref={input}
        id={id}
        type="file"
        className="aup-drop__input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={multiple ? 'Choose files to upload' : 'Choose a file to upload'}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          // Clear it so picking the same file again still fires a change.
          e.target.value = ''
        }}
      />
    </div>
  )
}
