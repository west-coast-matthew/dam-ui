import { useState, type ReactNode } from 'react'
import { ErrorState } from '../ErrorState'
import { LoadingState } from '../LoadingState'
import { AssetBrowseFooter } from './AssetBrowseFooter'
import { AssetBrowseHeader } from './AssetBrowseHeader'
import { AssetMasonry } from './AssetMasonry'
import { AssetPreviewDialog } from './AssetPreviewDialog'
import { EmptyIcon } from './icons'
import type { AssetPage, AssetSort, AssetTypeFilter, BrowseAsset, ThumbnailSize } from './types'
import './AssetBrowsePanel.css'

export interface AssetBrowsePanelProps {
  title: string
  /** The current page of assets; null until the first load finishes. */
  data: AssetPage | null
  isLoading: boolean
  isError: boolean
  /** True once data has been loaded. The header and footer stay disabled until then. */
  hasData: boolean
  /** Shown in the error state. */
  errorMessage?: ReactNode
  /** Current type filter; the caller owns it because it changes the API query. Start with DEFAULT_TYPE_FILTER. */
  typeFilter: AssetTypeFilter
  sort: AssetSort
  /** Called with the 1-based page to load. */
  onPageChange: (page: number) => void
  onTypeFilterChange: (type: AssetTypeFilter) => void
  onSortChange: (sort: AssetSort) => void
  /** When given, the error state shows a retry button. */
  onRetry?: () => void
  /** Called when an asset is opened in the preview modal. */
  onAssetOpen?: (asset: BrowseAsset) => void
}

/**
 * Browses asset thumbnails in a masonry layout. It never loads data itself: the page passes in the
 * data and lifecycle flags and handles the paging, filter and sort events.
 */
export function AssetBrowsePanel({
  title,
  data,
  isLoading,
  isError,
  hasData,
  errorMessage,
  typeFilter,
  sort,
  onPageChange,
  onTypeFilterChange,
  onSortChange,
  onRetry,
  onAssetOpen,
}: AssetBrowsePanelProps) {
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('small')
  const [selected, setSelected] = useState<BrowseAsset | null>(null)
  const controlsEnabled = hasData && !isLoading

  const open = (asset: BrowseAsset) => {
    setSelected(asset)
    onAssetOpen?.(asset)
  }

  let body: ReactNode
  if (isError) {
    body = <ErrorState title="Couldn't load assets" message={errorMessage} onRetry={onRetry} />
  } else if (isLoading) {
    body = <LoadingState label="Loading assets…" />
  } else if (hasData && data && data.items.length > 0) {
    body = <AssetMasonry items={data.items} size={thumbnailSize} onOpen={open} />
  } else {
    body = (
      <div className="abp-empty">
        <EmptyIcon />
        <p>{hasData ? 'No assets match these filters.' : 'No assets to show yet.'}</p>
      </div>
    )
  }

  return (
    <section className="abp" aria-label={title}>
      <AssetBrowseHeader
        title={title}
        page={hasData ? data : null}
        enabled={controlsEnabled}
        typeFilter={typeFilter}
        sort={sort}
        thumbnailSize={thumbnailSize}
        onTypeFilterChange={onTypeFilterChange}
        onSortChange={onSortChange}
        onThumbnailSizeChange={setThumbnailSize}
        onPageChange={onPageChange}
      />
      <div className="abp-display" aria-busy={isLoading || undefined}>
        {body}
      </div>
      <AssetBrowseFooter page={hasData ? data : null} enabled={controlsEnabled} onPageChange={onPageChange} />
      <AssetPreviewDialog asset={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
