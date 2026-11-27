import { displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { SelectionToggle } from '../Lightbox/SelectionToggle'
import { AssetThumb } from './AssetThumb'

export interface AssetGalleryProps {
  items: BrowsedAsset[]
  /** Ids of the assets in the selection. */
  selected: Set<string>
  onOpen: (asset: BrowsedAsset) => void
}

/**
 * Pinterest-style gallery: CSS columns, so each tile keeps its image's own height and no sizes are
 * needed up front. Clicking a tile opens the preview; its + / ✓ button adds it to or removes it
 * from the selection.
 */
export function AssetGallery({ items, selected, onOpen }: AssetGalleryProps) {
  return (
    <ul className="axp-gallery">
      {items.map((asset) => (
        <li key={asset.id} className={`axp-gallery__item${selected.has(asset.id) ? ' axp-gallery__item--picked' : ''}`}>
          <button type="button" className="axp-tile" onClick={() => onOpen(asset)} aria-label={`Preview ${displayTitle(asset)}`}>
            <AssetThumb asset={asset} shape="natural" />
            <span className="axp-tile__caption">
              <span className="axp-tile__title">{displayTitle(asset)}</span>
            </span>
          </button>
          <SelectionToggle asset={asset} variant="overlay" />
        </li>
      ))}
    </ul>
  )
}
