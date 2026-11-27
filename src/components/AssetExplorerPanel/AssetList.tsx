import { useState, type KeyboardEvent } from 'react'
import { DEFAULT_DIRECTION, displayTitle, type AssetSort, type AssetSortField, type BrowsedAsset } from '../../services/assetBrowseService'
import { SelectionToggle } from '../Lightbox/SelectionToggle'
import { AssetThumb } from './AssetThumb'
import { formatBytes, formatDate, MEDIA_LABEL } from './format'

export interface AssetListProps {
  items: BrowsedAsset[]
  /** Ids of the assets in the selection. */
  selected: Set<string>
  sort: AssetSort
  onSortChange: (sort: AssetSort) => void
  onOpen: (asset: BrowsedAsset) => void
}

const SortArrow = ({ direction }: { direction: 'asc' | 'desc' | null }) => (
  <svg className="axp-sort__arrow" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direction === 'asc' ? <path d="M12 19V5m0 0-5 5m5-5 5 5" />
      : direction === 'desc' ? <path d="M12 5v14m0 0-5-5m5 5 5-5" />
      : <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />}
  </svg>
)

/**
 * Assets as rows. A click selects a row; a double-click (or Enter) opens the preview. Column
 * headers sort: clicking the current column flips its direction, another column starts in its
 * natural direction (newest, largest, A–Z).
 */
export function AssetList({ items, selected, sort, onSortChange, onOpen }: AssetListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, asset: BrowsedAsset, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(asset)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const rows = e.currentTarget.parentElement?.children
      const next = rows?.[index + (e.key === 'ArrowDown' ? 1 : -1)] as HTMLElement | undefined
      next?.focus()
    }
  }

  const header = (field: AssetSortField, label: string, className?: string) => {
    const active = sort.field === field
    const next = active ? (sort.direction === 'asc' ? 'desc' : 'asc') : DEFAULT_DIRECTION[field]
    return (
      <th scope="col" className={className} aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={`axp-sort${active ? ' axp-sort--on' : ''}`}
          title={`Sort by ${label.toLowerCase()} ${next === 'asc' ? 'ascending' : 'descending'}`}
          onClick={() => onSortChange({ field, direction: next })}
        >
          {label}
          <SortArrow direction={active ? sort.direction : null} />
        </button>
      </th>
    )
  }

  return (
    <table className="axp-list">
      <caption className="fc-visually-hidden">Assets. Double-click a row, or press Enter, to preview it.</caption>
      <thead>
        <tr>
          <th scope="col" className="axp-list__pick"><span className="fc-visually-hidden">In selection</span></th>
          <th scope="col"><span className="fc-visually-hidden">Thumbnail</span></th>
          {header('name', 'Title')}
          {header('type', 'Type', 'axp-list__optional')}
          {header('size', 'Size', 'axp-list__optional axp-list__num')}
          {header('added', 'Added')}
        </tr>
      </thead>
      <tbody>
        {items.map((asset, i) => (
          <tr
            key={asset.id}
            tabIndex={0}
            className={['axp-list__row', selectedId === asset.id && 'axp-list__row--selected', selected.has(asset.id) && 'axp-list__row--picked']
              .filter(Boolean).join(' ')}
            onClick={() => setSelectedId(asset.id)}
            onFocus={() => setSelectedId(asset.id)}
            onDoubleClick={() => onOpen(asset)}
            onKeyDown={(e) => onKeyDown(e, asset, i)}
          >
            <td className="axp-list__pick"><SelectionToggle asset={asset} variant="inline" /></td>
            <td className="axp-list__thumb"><AssetThumb asset={asset} shape="square" /></td>
            <td>
              <span className="axp-list__title">{displayTitle(asset)}</span>
              {asset.title.trim() && <span className="axp-list__file">{asset.originalFilename}</span>}
            </td>
            <td className="axp-list__optional">{MEDIA_LABEL[asset.mediaType]}</td>
            <td className="axp-list__optional axp-list__num">{formatBytes(asset.fileSize)}</td>
            <td>{formatDate(asset.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
