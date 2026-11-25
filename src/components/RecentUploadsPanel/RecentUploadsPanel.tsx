import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'
import {
  ACTIVITY_PERIODS,
  DEFAULT_ACTIVITY_PERIOD,
  getUploadSummary,
  type ActivityPeriod,
  type CategoryUploadActivity,
} from '../../services/uploadActivityService'
import { useWorkspace } from '../../workspace/useWorkspace'
import { useCatalogList, useCategoryList } from '../CategoryManagementPanel/useCategories'
import { ErrorState } from '../ErrorState'
import { Button, SegmentedControl, Select } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { categoryOptions, FILE_TYPE_LABELS, fullTime, plural, timeAgo } from './format'
import './RecentUploadsPanel.css'

export interface RecentUploadsPanelProps {
  /** Time window the panel opens with. Defaults to the last 24 hours. */
  defaultPeriod?: ActivityPeriod
  className?: string
}

/** How often the summary refreshes on its own while the panel is open. */
const REFRESH_MS = 60_000

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
)

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
  </svg>
)

/**
 * Summary of recent upload operations in the current workspace, by category: each category that
 * received uploads in the time window is listed with its path and asset count, e.g.
 * "Food → American → BBQ (500)", and expands to its individual uploads. It can be narrowed to one
 * category (and its subcategories) and to a time window; the default is the last 24 hours.
 */
export function RecentUploadsPanel(props: RecentUploadsPanelProps) {
  const { current } = useWorkspace()
  // A different workspace has different catalogs and categories, so start over.
  return <RecentUploads key={current.id} workspaceId={current.id} workspaceName={current.name} {...props} />
}

interface RecentUploadsProps extends RecentUploadsPanelProps {
  workspaceId: string
  workspaceName: string
}

function RecentUploads({ workspaceId, workspaceName, defaultPeriod = DEFAULT_ACTIVITY_PERIOD, className }: RecentUploadsProps) {
  const headingId = useId()
  const catalogs = useCatalogList(workspaceId)
  const [chosenCatalogId, setChosenCatalogId] = useState<string | null>(null)
  const catalogList = catalogs.data ?? []
  const catalog = catalogList.find((c) => c.id === chosenCatalogId) ?? catalogList[0]
  const categories = useCategoryList(catalog?.id ?? '')

  const [period, setPeriod] = useState<ActivityPeriod>(defaultPeriod)
  /** The category filter, per catalog; '' means every category. */
  const [filter, setFilter] = useState<{ catalogId: string; categoryId: string } | null>(null)
  const categoryId =
    filter && filter.catalogId === catalog?.id && categories.data?.some((c) => c.id === filter.categoryId) ? filter.categoryId : ''

  const summary = useQuery({
    queryKey: ['uploadActivity', catalog?.id ?? '', categoryId, period],
    queryFn: () => getUploadSummary({ catalogId: catalog!.id, categoryId: categoryId || null, period }),
    enabled: Boolean(catalog),
    refetchInterval: REFRESH_MS,
    // Keep showing the last summary while a new filter loads, instead of flashing a spinner.
    placeholderData: keepPreviousData,
  })

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) =>
    setExpanded((open) => {
      const next = new Set(open)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const options = useMemo(
    () => [{ value: '', label: 'All categories' }, ...(categories.data ? categoryOptions(categories.data) : [])],
    [categories.data],
  )
  const periodText = ACTIVITY_PERIODS.find((p) => p.value === period)?.long ?? ''
  const data = summary.data
  const cardClass = ['rup', className].filter(Boolean).join(' ')

  let subtitle = `Uploads in ${periodText}, by category.`
  if (data) {
    subtitle = data.totalOperations === 0
      ? `No uploads in ${periodText}.`
      : `${plural(data.totalOperations, 'upload', 'uploads')} · ${plural(data.totalAssets, 'asset', 'assets')} in ${periodText}`
  }

  let body
  if (catalogs.isError && !catalogs.data) {
    body = <ErrorState size="sm" title="Couldn't load catalogs" message={errorMessage(catalogs.error)} onRetry={() => void catalogs.refetch()} />
  } else if (!catalogs.data) {
    body = <LoadingState size="sm" label={workspaceId ? 'Loading catalogs…' : 'Loading workspaces…'} />
  } else if (!catalog) {
    body = <p className="rup-empty">{workspaceName} has no catalogs yet, so there are no uploads to show.</p>
  } else if (summary.isError && !data) {
    body = <ErrorState size="sm" title="Couldn't load recent uploads" message={errorMessage(summary.error)} onRetry={() => void summary.refetch()} />
  } else if (!data) {
    body = <LoadingState size="sm" label="Loading recent uploads…" />
  } else if (data.categories.length === 0) {
    body = (
      <p className="rup-empty">
        {categoryId ? 'Nothing was uploaded to this category or its subcategories' : 'Nothing was uploaded'} in {periodText}.
      </p>
    )
  } else {
    body = (
      <ul className="rup-list">
        {data.categories.map((c) => (
          <CategoryRow key={c.categoryId} activity={c} now={data.to} open={expanded.has(c.categoryId)} onToggle={() => toggle(c.categoryId)} />
        ))}
      </ul>
    )
  }

  return (
    <section className={cardClass} aria-labelledby={headingId} aria-busy={summary.isFetching || undefined}>
      <header className="rup-header">
        <div className="rup-header__text">
          <h2 id={headingId} className="rup-header__title">Recent uploads</h2>
          <p className="rup-header__subtitle" aria-live="polite">{subtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshIcon />}
          aria-label="Refresh recent uploads"
          title="Refresh"
          className={summary.isFetching ? 'rup-refresh rup-refresh--busy' : 'rup-refresh'}
          disabled={!catalog}
          onClick={() => void summary.refetch()}
        />
      </header>

      <div className="rup-filters">
        {catalogList.length > 1 && catalog && (
          <Select
            className="rup-filter"
            aria-label="Catalog"
            options={catalogList.map((c) => ({ value: c.id, label: c.name }))}
            value={catalog.id}
            onChange={(e) => {
              setChosenCatalogId(e.target.value)
              setExpanded(new Set())
            }}
          />
        )}
        <Select
          className="rup-filter"
          aria-label="Category"
          options={options}
          value={categoryId}
          disabled={!catalog || !categories.data}
          onChange={(e) => catalog && setFilter({ catalogId: catalog.id, categoryId: e.target.value })}
        />
        <SegmentedControl legend="Time window" hideLegend options={ACTIVITY_PERIODS} value={period} onChange={setPeriod} />
      </div>

      <div className="rup-body">{body}</div>
    </section>
  )
}

interface CategoryRowProps {
  activity: CategoryUploadActivity
  now: Date
  open: boolean
  onToggle: () => void
}

/** "Food → American → BBQ (500)", expanding to the category's individual uploads. */
function CategoryRow({ activity, now, open, onToggle }: CategoryRowProps) {
  const eventsId = useId()
  const latest = activity.events[0]
  return (
    <li className={`rup-row${open ? ' rup-row--open' : ''}`}>
      <button type="button" className="rup-row__toggle" aria-expanded={open} aria-controls={open ? eventsId : undefined} onClick={onToggle}>
        <span className="rup-row__chevron"><ChevronIcon /></span>
        <span className="rup-row__path">
          {activity.path.map((name, i) => (
            <span key={i} className={i === activity.path.length - 1 ? 'rup-row__name' : 'rup-row__ancestor'}>
              {i > 0 && <span className="rup-row__sep" aria-hidden="true"> → </span>}
              {name}
            </span>
          ))}
          <span className="rup-row__count">
            ({activity.assets.toLocaleString()})<span className="fc-visually-hidden"> {activity.assets === 1 ? 'asset' : 'assets'}</span>
          </span>
        </span>
        <span className="rup-row__meta">
          {plural(activity.operations, 'upload', 'uploads')}
          {latest && <> · latest {timeAgo(latest.at, now)}</>}
        </span>
      </button>

      {open && (
        <table id={eventsId} className="rup-events">
          <caption className="fc-visually-hidden">Uploads to {activity.categoryName}</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col" className="rup-events__num">Assets</th>
              <th scope="col">File type</th>
            </tr>
          </thead>
          <tbody>
            {activity.events.map((e) => (
              <tr key={e.operationId}>
                <td>
                  <time dateTime={e.at.toISOString()} title={fullTime(e.at)}>{timeAgo(e.at, now)}</time>
                  <span className="rup-events__full">{fullTime(e.at)}</span>
                </td>
                <td className="rup-events__num">{e.assetCount.toLocaleString()}</td>
                <td><span className={`rup-type rup-type--${e.fileType}`}>{FILE_TYPE_LABELS[e.fileType]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </li>
  )
}
