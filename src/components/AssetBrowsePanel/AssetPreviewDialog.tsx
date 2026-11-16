import { useEffect, useRef } from 'react'
import { Button } from '../FormControls'
import { assetTitle, formatBytes, formatDate, MEDIA_TYPE_LABEL } from './format'
import { CloseIcon } from './icons'
import type { BrowseAsset } from './types'

export interface AssetPreviewDialogProps {
  /** The asset to show; null closes the dialog. */
  asset: BrowseAsset | null
  onClose: () => void
}

/** Modal showing an asset's largest (preview) thumbnail. Uses the native <dialog> for focus trapping and Escape. */
export function AssetPreviewDialog({ asset, onClose }: AssetPreviewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (asset && !dialog.open) dialog.showModal()
    else if (!asset && dialog.open) dialog.close()
  }, [asset])

  const preview = asset?.thumbnails.preview
  const title = asset ? assetTitle(asset) : ''
  return (
    <dialog
      ref={ref}
      className="abp-dialog"
      aria-labelledby="abp-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {asset && preview && (
        <div className="abp-dialog__body">
          <div className="abp-dialog__header">
            <h2 id="abp-dialog-title" className="abp-dialog__title">{title}</h2>
            <Button variant="ghost" size="sm" icon={<CloseIcon />} aria-label="Close preview" onClick={onClose} />
          </div>
          <div className="abp-dialog__media">
            <img src={preview.url} width={preview.width} height={preview.height} alt={`Preview of ${title}`} />
          </div>
          <dl className="abp-dialog__meta">
            <div><dt>File name</dt><dd>{asset.originalFilename}</dd></div>
            <div><dt>Type</dt><dd>{MEDIA_TYPE_LABEL[asset.mediaType]} · {asset.mimeType}</dd></div>
            <div><dt>File size</dt><dd>{formatBytes(asset.fileSize)}</dd></div>
            <div><dt>Preview</dt><dd>{preview.width} × {preview.height}</dd></div>
            <div><dt>Added</dt><dd>{formatDate(asset.createdAt)}</dd></div>
          </dl>
        </div>
      )}
    </dialog>
  )
}
