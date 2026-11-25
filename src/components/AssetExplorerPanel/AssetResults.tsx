import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import {
  PAGE_SIZE_OPTIONS,
  parseSortKey,
  searchAssets,
  SORT_OPTIONS,
  sortKey,
  type AssetSearchQuery,
  type AssetSort,
  type BrowsedAsset,
} from '../../services/assetBrowseService'
import { Pagination } from '../AssetBrowsePanel'
import { ErrorState } from '../ErrorState'
import { Select } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { AssetGallery } from './AssetGallery'
import { AssetList } from './AssetList'
import { AssetPreviewModal } from './AssetPreviewModal'
import { useBrowseStore, type ResultsView } from './browseStore'
import { plural } from './format'
import { GalleryIcon, ListIcon } from './icons'

/** What to search for; paging and sort are kept by the results themselves. */
export type ResultsQuery = Omit<AssetSearchQuery, 'page' | 'pageSize' | 'sort'>

export interface AssetResultsProps {
  query: ResultsQuery
  /** Heading for the results, e.g. the category path. */
  heading: ReactNode
  /** Extra controls next to the heading, e.g. "include subcategories". */
  controls?: ReactNode
  emptyMessage: string
  /** Called when an asset is opened in the preview (for the Recents history). */
  onAssetViewed?: (asset: BrowsedAsset) => void
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

const VIEW_OPTIONS: { value: ResultsView; label: string; icon: ReactNode }[] = [
  { value: 'list', label: 'List', icon: <ListIcon /> },
  { value: 'gallery', label: 'Gallery', icon: <GalleryIcon /> },
]

/**
 * One page of assets matching `query`, as a list or a gallery, with page size, position and sort
 * controls. The parent remounts it (via `key`) when the query changes, which starts it on page 1.
 */
export function AssetResults({ query, heading, controls, emptyMessage, onAssetViewed }: AssetResultsProps) {
  const view = useBrowseStore((s) => s.view)
  const setView = useBrowseStore((s) => s.setView)
  const pageSize = useBrowseStore((s) => s.pageSize)
  const setPageSize = useBrowseStore((s) => s.setPageSize)
  const sort = useBrowseStore((s) => s.sort)
  const setSortPreference = useBrowseStore((s) => s.setSort)
  const [page, setPage] = useState(1)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const results = useQuery({
    queryKey: ['assetSearch', query, page, pageSize, sort],
    queryFn: ({ signal }) => searchAssets({ ...query, page, pageSize, sort }, { signal }),
    placeholderData: keepPreviousData,
  })
  const data = results.data
  const items = data?.items ?? []

  // A page past the end (e.g. after a bigger page size) moves back to the last page.
  if (data && data.totalPages > 0 && page > data.totalPages) setPage(data.totalPages)

  /** A new order starts again on page 1, and is remembered for next time. */
  const changeSort = (next: AssetSort) => {
    setSortPreference(next)
    setPage(1)
    setPreviewIndex(null)
  }

  const openPreview = (asset: BrowsedAsset) => {
    setPreviewIndex(items.findIndex((a) => a.id === asset.id))
    onAssetViewed?.(asset)
  }
  const movePreview = (index: number | null) => {
    setPreviewIndex(index)
    if (index !== null && items[index]) onAssetViewed?.(items[index])
  }

  let body: ReactNode
  if (results.isError && !data) {
    body = <ErrorState title="Couldn't load assets" message={errorMessage(results.error)} onRetry={() => void results.refetch()} />
  } else if (!data) {
    body = <LoadingState label="Loading assets…" />
  } else if (items.length === 0) {
    body = <p className="axp-empty">{emptyMessage}</p>
  } else {
    body = view === 'list'
      ? <AssetList items={items} sort={sort} onSortChange={changeSort} onOpen={openPreview} />
      : <AssetGallery items={items} onOpen={openPreview} />
  }

  const first = data && data.totalItems > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const last = data ? Math.min(data.page * data.pageSize, data.totalItems) : 0

  return (
    <div className="axp-results">
      <div className="axp-results__bar">
        <div className="axp-results__heading">
          <h3 className="axp-results__title">{heading}</h3>
          <p className="axp-results__count" aria-live="polite">
            {data
              ? data.totalItems === 0
                ? 'No assets'
                : `${first.toLocaleString()}–${last.toLocaleString()} of ${plural(data.totalItems, 'asset', 'assets')}`
              : ' '}
            {results.isFetching && data && <span className="axp-results__updating"> · Updating…</span>}
          </p>
        </div>
        {controls}
        <div className="axp-results__tools">
          <Select
            className="axp-results__select"
            aria-label="Sort"
            options={SORT_OPTIONS}
            value={sortKey(sort)}
            onChange={(e) => changeSort(parseSortKey(e.target.value))}
          />
          <div className="axp-view" role="radiogroup" aria-label="View">
            {VIEW_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={view === o.value}
                className={`axp-view__option${view === o.value ? ' axp-view__option--on' : ''}`}
                title={o.label}
                onClick={() => setView(o.value)}
              >
                {o.icon}
                <span className="axp-view__label">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="axp-results__body" aria-busy={results.isFetching || undefined}>{body}</div>

      <footer className="axp-results__footer">
        <label className="axp-page-size">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              // Keep the first asset of the current page in view.
              const firstIndex = (page - 1) * pageSize
              const size = Number(e.target.value)
              setPageSize(size)
              setPage(Math.floor(firstIndex / size) + 1)
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <fieldset className="axp-results__pages" disabled={!data || data.totalPages <= 1}>
          <Pagination page={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage} variant="full" label="Asset pages" />
        </fieldset>
      </footer>

      <AssetPreviewModal items={items} index={previewIndex} onIndexChange={movePreview} />
    </div>
  )
}
