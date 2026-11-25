import { useState } from 'react'
import { displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { MEDIA_LABEL } from './format'
import { AudioIcon, FileIcon, ImageIcon, PdfIcon, VideoIcon } from './icons'

const TYPE_ICON = { IMAGE: ImageIcon, VIDEO: VideoIcon, AUDIO: AudioIcon, DOCUMENT: PdfIcon, OTHER: FileIcon }

export interface AssetThumbProps {
  asset: BrowsedAsset
  /** 'square' crops to a square (list rows); 'natural' keeps the image's shape (gallery). */
  shape: 'square' | 'natural'
}

/**
 * The asset's thumbnail. An image without one (still being made, or generation failed) shows the
 * original file instead; anything else without one shows the type's icon on a tinted tile.
 */
export function AssetThumb({ asset, shape }: AssetThumbProps) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set())
  const candidates = [asset.thumbnailUrl, asset.mediaType === 'IMAGE' ? asset.fileUrl : null]
  const url = candidates.find((u): u is string => Boolean(u) && !failed.has(u!))

  if (url) {
    return (
      <img
        key={url}
        className={`axp-thumb axp-thumb--${shape}`}
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed((set) => new Set(set).add(url))}
      />
    )
  }
  const Icon = TYPE_ICON[asset.mediaType] ?? FileIcon
  const note = asset.status === 'PENDING_PROCESSING' ? 'Preparing preview…' : MEDIA_LABEL[asset.mediaType]
  return (
    <span className={`axp-thumb axp-thumb--${shape} axp-thumb--placeholder axp-thumb--${asset.mediaType.toLowerCase()}`}
      title={displayTitle(asset)}>
      <Icon />
      {shape === 'natural' && <span className="axp-thumb__note">{note}</span>}
    </span>
  )
}
