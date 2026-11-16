import { assetTitle, MEDIA_TYPE_LABEL } from './format'
import { DocIcon, PlayIcon } from './icons'
import type { BrowseAsset, ThumbnailSize } from './types'

export interface AssetTileProps {
  asset: BrowseAsset
  size: ThumbnailSize
  onOpen: (asset: BrowseAsset) => void
}

/** One thumbnail. Hover or focus highlights the border and scales it up 10%; click or Enter opens the preview. */
export function AssetTile({ asset, size, onOpen }: AssetTileProps) {
  const thumb = asset.thumbnails[size]
  const title = assetTitle(asset)
  return (
    <button
      type="button"
      className="abp-tile"
      onClick={() => onOpen(asset)}
      aria-label={`Open ${title} (${MEDIA_TYPE_LABEL[asset.mediaType]})`}
    >
      <img
        className="abp-tile__img"
        src={thumb.url}
        width={thumb.width}
        height={thumb.height}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {asset.mediaType !== 'IMAGE' && (
        <span className="abp-tile__badge" aria-hidden="true">
          {asset.mediaType === 'VIDEO' ? <PlayIcon /> : <DocIcon />}
          {MEDIA_TYPE_LABEL[asset.mediaType]}
        </span>
      )}
      <span className="abp-tile__caption" aria-hidden="true">{title}</span>
    </button>
  )
}
