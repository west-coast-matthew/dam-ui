import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ErrorState } from '../ErrorState'
import { LoadingState } from '../LoadingState'
import { fullDate, plural, timeAgo } from '../RecentActivityPanel/format'
import type { RecentAsset, RecentlyAddedAssets, UploadBatch } from './types'
import './RecentlyAddedAssetsPanel.css'

export interface RecentlyAddedAssetsPanelProps {
  title?: string
  /** Null until the first load finishes. */
  data: RecentlyAddedAssets | null
  isLoading: boolean
  isError: boolean
  errorMessage?: ReactNode
  onRetry?: () => void
  /** When given, thumbnails become buttons that call this. */
  onAssetOpen?: (asset: RecentAsset) => void
  /** When given, batch rows become buttons that call this. */
  onBatchOpen?: (batch: UploadBatch) => void
  /** Most batches listed. */
  maxBatches?: number
}

type Tab = 'latest' | 'batches'

const TABS: { id: Tab; label: string }[] = [
  { id: 'latest', label: 'Latest upload' },
  { id: 'batches', label: 'Batch uploads' },
]

const assetName = (a: RecentAsset) => a.title?.trim() || a.originalFilename

const MEDIA_BADGE: Partial<Record<RecentAsset['mediaType'], string>> = { VIDEO: 'Video', DOCUMENT: 'PDF' }

/**
 * Thumbnails from the most recent upload, and the most recent batch uploads by date.
 * Like the other panels, the page loads the data and passes it in.
 */
export function RecentlyAddedAssetsPanel({
  title = 'Recently added assets',
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onAssetOpen,
  onBatchOpen,
  maxBatches = 10,
}: RecentlyAddedAssetsPanelProps) {
  const baseId = useId()
  const [tab, setTab] = useState<Tab>('latest')
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const [clock] = useState(() => Date.now())
  const ready = !isLoading && !isError && data !== null

  const onTabKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const index = TABS.findIndex((t) => t.id === tab)
    const target = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    setTab(TABS[target].id)
    tabRefs.current[TABS[target].id]?.focus()
  }

  let body: ReactNode
  if (isError) {
    body = <ErrorState size="sm" title="Couldn't load recent assets" message={errorMessage} onRetry={onRetry} />
  } else if (!ready) {
    body = <LoadingState size="sm" label="Loading recent assets…" />
  } else if (tab === 'latest') {
    const latest = data.latest
    body = !latest || latest.assets.length === 0 ? (
      <p className="raa-empty">Nothing has been uploaded yet.</p>
    ) : (
      <>
        <p className="raa-summary">
          <span className="raa-pill">{latest.kind === 'batch' ? 'Batch' : 'Single upload'}</span>
          {plural(latest.assets.length, 'asset')} to {latest.catalogName} ·{' '}
          <time dateTime={latest.uploadedAt} title={fullDate(latest.uploadedAt)}>{timeAgo(latest.uploadedAt, clock)}</time>
        </p>
        <ul className="raa-thumbs">
          {latest.assets.map((asset) => {
            const name = assetName(asset)
            const content = (
              <>
                <img src={asset.thumbnail.url} alt="" loading="lazy" />
                {MEDIA_BADGE[asset.mediaType] && <span className="raa-thumb__badge">{MEDIA_BADGE[asset.mediaType]}</span>}
              </>
            )
            return (
              <li key={asset.id}>
                {onAssetOpen ? (
                  <button type="button" className="raa-thumb raa-thumb--interactive" title={name} aria-label={`Open ${name}`}
                    onClick={() => onAssetOpen(asset)}>
                    {content}
                  </button>
                ) : (
                  <div className="raa-thumb" title={name} role="img" aria-label={name}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </>
    )
  } else {
    const batches = data.batches.slice(0, maxBatches)
    body = batches.length === 0 ? (
      <p className="raa-empty">No batch uploads yet.</p>
    ) : (
      <ol className="raa-batches">
        {batches.map((batch) => {
          const content = (
            <>
              <span className="raa-batch__date">
                <time dateTime={batch.uploadedAt}>{fullDate(batch.uploadedAt)}</time>
                <span className="raa-batch__ago">{timeAgo(batch.uploadedAt, clock)}</span>
              </span>
              <span className="raa-batch__meta">
                {plural(batch.assetCount, 'asset')}
                {batch.skippedCount > 0 && <span className="raa-batch__skipped"> · {batch.skippedCount} skipped</span>}
                <span className="raa-batch__catalog">{batch.catalogName}</span>
              </span>
            </>
          )
          return (
            <li key={batch.id}>
              {onBatchOpen ? (
                <button type="button" className="raa-batch raa-batch--interactive" onClick={() => onBatchOpen(batch)}>{content}</button>
              ) : (
                <div className="raa-batch">{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <section className="raa" aria-labelledby={`${baseId}-title`}>
      <header className="raa-header">
        <h2 id={`${baseId}-title`} className="raa-header__title">{title}</h2>
        <div className="raa-tabs" role="tablist" aria-label="Recently added" onKeyDown={onTabKey}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`${baseId}-panel`}
              tabIndex={tab === id ? 0 : -1}
              className="raa-tab"
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} aria-busy={isLoading || undefined}
        className="raa-body">
        {body}
      </div>
    </section>
  )
}
