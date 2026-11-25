import { useEffect, useRef, useState } from 'react'
import { displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { AssetThumb } from './AssetThumb'
import { formatBytes, formatDateTime, MEDIA_LABEL } from './format'
import { CloseIcon, DownloadIcon, NextIcon, PrevIcon } from './icons'

export interface AssetPreviewModalProps {
  /** The assets on the current page; the arrows move through them. */
  items: BrowsedAsset[]
  /** Index of the asset shown; null closes the modal. */
  index: number | null
  onIndexChange: (index: number | null) => void
}

/** The asset itself: the image, a video player, the PDF, or (for anything else) its thumbnail. */
function Media({ asset }: { asset: BrowsedAsset }) {
  const [failed, setFailed] = useState(false)
  const title = displayTitle(asset)
  if (!asset.fileUrl || failed) return <AssetThumb asset={asset} shape="natural" />
  switch (asset.mediaType) {
    case 'IMAGE':
      return <img src={asset.fileUrl} alt={title} onError={() => setFailed(true)} />
    case 'VIDEO':
      return <video src={asset.fileUrl} controls preload="metadata" aria-label={title} />
    case 'AUDIO':
      return <audio src={asset.fileUrl} controls aria-label={title} />
    case 'DOCUMENT':
      return <iframe src={asset.fileUrl} title={title} />
    default:
      return <AssetThumb asset={asset} shape="natural" />
  }
}

/**
 * Previews one asset in a modal (native <dialog>: focus trap and Escape). Left and right arrows, or
 * the buttons, move to the previous or next asset on the page.
 */
export function AssetPreviewModal({ items, index, onIndexChange }: AssetPreviewModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const asset = index === null ? null : items[index]

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (asset && !dialog.open) dialog.showModal()
    else if (!asset && dialog.open) dialog.close()
  }, [asset])

  const close = () => onIndexChange(null)
  const go = (step: number) => {
    if (index === null) return
    const next = index + step
    if (next >= 0 && next < items.length) onIndexChange(next)
  }

  return (
    <dialog
      ref={ref}
      className="axp-preview"
      aria-labelledby="axp-preview-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      onKeyDown={(e) => {
        // Arrows move between assets, except inside the video/audio controls.
        if ((e.target as HTMLElement).closest('video, audio')) return
        if (e.key === 'ArrowLeft') go(-1)
        if (e.key === 'ArrowRight') go(1)
      }}
    >
      {asset && (
        <div className="axp-preview__body">
          <header className="axp-preview__header">
            <h2 id="axp-preview-title" className="axp-preview__title">{displayTitle(asset)}</h2>
            <span className="axp-preview__position">{index! + 1} of {items.length}</span>
            {asset.downloadUrl && (
              <a className="axp-preview__action" href={asset.downloadUrl} download={asset.originalFilename}>
                <DownloadIcon /> Download
              </a>
            )}
            <button type="button" className="axp-icon-button" aria-label="Close preview" onClick={close}>
              <CloseIcon />
            </button>
          </header>

          <div className="axp-preview__stage">
            <button type="button" className="axp-preview__nav axp-preview__nav--prev" aria-label="Previous asset"
              disabled={index === 0} onClick={() => go(-1)}>
              <PrevIcon />
            </button>
            <div className={`axp-preview__media axp-preview__media--${asset.mediaType.toLowerCase()}`}>
              <Media key={asset.id} asset={asset} />
            </div>
            <button type="button" className="axp-preview__nav axp-preview__nav--next" aria-label="Next asset"
              disabled={index === items.length - 1} onClick={() => go(1)}>
              <NextIcon />
            </button>
          </div>

          <dl className="axp-preview__meta">
            <div><dt>File name</dt><dd>{asset.originalFilename}</dd></div>
            <div><dt>Type</dt><dd>{MEDIA_LABEL[asset.mediaType]} · {asset.mimeType}</dd></div>
            <div><dt>Size</dt><dd>{formatBytes(asset.fileSize)}</dd></div>
            <div><dt>Added</dt><dd>{formatDateTime(asset.createdAt)}</dd></div>
            {asset.tags.length > 0 && <div><dt>Tags</dt><dd>{asset.tags.join(', ')}</dd></div>}
            {asset.description.trim() && <div className="axp-preview__wide"><dt>Description</dt><dd>{asset.description}</dd></div>}
          </dl>
        </div>
      )}
    </dialog>
  )
}
