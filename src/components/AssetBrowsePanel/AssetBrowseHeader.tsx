import { Select, SegmentedControl } from '../FormControls'
import { SORT_OPTIONS, THUMBNAIL_SIZE_OPTIONS, TYPE_FILTER_OPTIONS } from './options'
import { Pagination } from './Pagination'
import type { AssetPage, AssetSort, AssetTypeFilter, ThumbnailSize } from './types'

export interface AssetBrowseHeaderProps {
  title: string
  page: AssetPage | null
  /** False until the panel has data (and while a new page loads); disables every control. */
  enabled: boolean
  typeFilter: AssetTypeFilter
  sort: AssetSort
  thumbnailSize: ThumbnailSize
  onTypeFilterChange: (type: AssetTypeFilter) => void
  onSortChange: (sort: AssetSort) => void
  onThumbnailSizeChange: (size: ThumbnailSize) => void
  onPageChange: (page: number) => void
}

/** Top filter panel: title, type filter, sort, thumbnail size and compact pagination. */
export function AssetBrowseHeader({
  title,
  page,
  enabled,
  typeFilter,
  sort,
  thumbnailSize,
  onTypeFilterChange,
  onSortChange,
  onThumbnailSizeChange,
  onPageChange,
}: AssetBrowseHeaderProps) {
  return (
    <header className={`abp-header${enabled ? '' : ' abp-header--disabled'}`}>
      <div className="abp-header__titles">
        <h2 className="abp-header__title">{title}</h2>
        <p className="abp-header__count">
          {page ? `${page.totalItems.toLocaleString()} ${page.totalItems === 1 ? 'asset' : 'assets'}` : 'No assets loaded'}
        </p>
      </div>
      {/* A disabled fieldset disables every control inside it. */}
      <fieldset className="abp-header__controls" disabled={!enabled}>
        <legend className="fc-visually-hidden">Browse options</legend>
        <SegmentedControl legend="Asset type" hideLegend options={TYPE_FILTER_OPTIONS} value={typeFilter} onChange={onTypeFilterChange} />
        <Select
          aria-label="Sort by"
          className="abp-header__sort"
          options={SORT_OPTIONS}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as AssetSort)}
        />
        <SegmentedControl legend="Thumbnail size" hideLegend options={THUMBNAIL_SIZE_OPTIONS} value={thumbnailSize} onChange={onThumbnailSizeChange} />
        <Pagination label="Pages (top)" page={page?.page ?? 0} totalPages={page?.totalPages ?? 0} onPageChange={onPageChange} />
      </fieldset>
    </header>
  )
}
