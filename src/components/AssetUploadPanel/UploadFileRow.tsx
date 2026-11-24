import { Button, TextField } from '../FormControls'
import { fileKind, formatBytes } from './fileRules'
import { FileIcon, PdfIcon, RemoveIcon, VideoIcon } from './icons'

export interface UploadFileRowProps {
  file: File
  /** Object URL for image previews. */
  previewUrl: string | null
  title: string
  /** Shows the title field. Defaults to true. */
  showTitle?: boolean
  /** Longest title allowed. Defaults to 120. */
  titleMaxLength?: number
  disabled?: boolean
  onTitleChange: (title: string) => void
  onRemove: () => void
}

/** One chosen file: preview, name, size, an optional title and a remove button. */
export function UploadFileRow({ file, previewUrl, title, showTitle = true, titleMaxLength = 120, disabled, onTitleChange, onRemove }: UploadFileRowProps) {
  const kind = fileKind(file)
  return (
    <li className={`aup-file${showTitle ? '' : ' aup-file--no-title'}`}>
      <span className={`aup-file__thumb aup-file__thumb--${kind}`}>
        {previewUrl ? (
          <img src={previewUrl} alt="" />
        ) : kind === 'video' ? (
          <VideoIcon />
        ) : kind === 'pdf' ? (
          <PdfIcon />
        ) : (
          <FileIcon />
        )}
      </span>
      <div className="aup-file__details">
        <p className="aup-file__name" title={file.name}>{file.name}</p>
        <p className="aup-file__meta">
          {formatBytes(file.size)} · {file.type || 'unknown type'}
        </p>
      </div>
      {showTitle && (
        <TextField
          className="aup-file__title"
          aria-label={`Title for ${file.name}`}
          placeholder="Title (optional)"
          value={title}
          maxLength={titleMaxLength}
          disabled={disabled}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      )}
      <Button variant="ghost" size="sm" icon={<RemoveIcon />} aria-label={`Remove ${file.name}`} disabled={disabled} onClick={onRemove} />
    </li>
  )
}
