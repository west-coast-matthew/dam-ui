import { displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { AssetThumb } from './AssetThumb'

export interface AssetGalleryProps {
  items: BrowsedAsset[]
  onOpen: (asset: BrowsedAsset) => void
}

/**
 * Pinterest-style gallery: CSS columns, so each tile keeps its image's own height and no sizes are
 * needed up front. Clicking a tile opens the preview.
 */
export function AssetGallery({ items, onOpen }: AssetGalleryProps) {
  return (
    <ul className="axp-gallery">
      {items.map((asset) => (
        <li key={asset.id} className="axp-gallery__item">
          <button type="button" className="axp-tile" onClick={() => onOpen(asset)} aria-label={`Preview ${displayTitle(asset)}`}>
            <AssetThumb asset={asset} shape="natural" />
            <span className="axp-tile__caption">
              <span className="axp-tile__title">{displayTitle(asset)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
