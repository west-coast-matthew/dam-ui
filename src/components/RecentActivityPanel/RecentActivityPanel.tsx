import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ErrorState } from '../ErrorState'
import { Button } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { CategoryList, LightboxList, UploadList } from './ActivityLists'
import { ChevronRight, FolderIcon, LightboxIcon, UploadIcon } from './icons'
import type { ActivityItem, ActivitySection, RecentActivity } from './types'
import './RecentActivityPanel.css'

export interface RecentActivityPanelProps {
  title?: string
  /** The recent activity; null until the first load finishes. */
  data: RecentActivity | null
  isLoading: boolean
  isError: boolean
  /** Shown in the error state. */
  errorMessage?: ReactNode
  /** When given, the error state shows a retry button. */
  onRetry?: () => void
  /** When given, every row becomes a button that calls this. */
  onItemOpen?: (activity: ActivityItem) => void
  /** When given, each list ends with a "View all" link that calls this. */
  onViewAll?: (section: ActivitySection) => void
  /** Most items shown per list. */
  maxItems?: number
  /** Which list shows first. */
  defaultSection?: ActivitySection
  /** Time "x minutes ago" is measured from; defaults to now. */
  now?: number
}

const SECTIONS: { id: ActivitySection; label: string; noun: string; icon: () => React.JSX.Element }[] = [
  { id: 'uploads', label: 'Uploads', noun: 'uploads', icon: UploadIcon },
  { id: 'categories', label: 'Categories', noun: 'category changes', icon: FolderIcon },
  { id: 'lightboxes', label: 'Lightboxes', noun: 'lightboxes', icon: LightboxIcon },
]

/**
 * Recent uploads, category changes and new lightboxes, one list per tab. It never loads data:
 * the page passes in the data and lifecycle flags and handles the events.
 */
export function RecentActivityPanel({
  title = 'Recent activity',
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onItemOpen,
  onViewAll,
  maxItems = 6,
  defaultSection = 'uploads',
  now,
}: RecentActivityPanelProps) {
  const baseId = useId()
  const [section, setSection] = useState<ActivitySection>(defaultSection)
  const tabRefs = useRef<Partial<Record<ActivitySection, HTMLButtonElement | null>>>({})
  // Ticks once a minute so "x minutes ago" stays current.
  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    if (now !== undefined) return
    const timer = setInterval(() => setClock(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [now])
  const reference = now ?? clock
  const ready = !isLoading && !isError && data !== null

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const onTabKey = (e: KeyboardEvent) => {
    const index = SECTIONS.findIndex((s) => s.id === section)
    const target =
      e.key === 'ArrowRight' ? (index + 1) % SECTIONS.length
      : e.key === 'ArrowLeft' ? (index - 1 + SECTIONS.length) % SECTIONS.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? SECTIONS.length - 1
      : -1
    if (target < 0) return
    e.preventDefault()
    const next = SECTIONS[target].id
    setSection(next)
    tabRefs.current[next]?.focus()
  }

  const current = SECTIONS.find((s) => s.id === section)!
  let body: ReactNode
  if (isError) {
    body = <ErrorState size="sm" title="Couldn't load recent activity" message={errorMessage} onRetry={onRetry} />
  } else if (!ready) {
    body = <LoadingState size="sm" label="Loading recent activity…" />
  } else {
    const total = data[section].length
    const hidden = Math.max(0, total - maxItems)
    body =
      total === 0 ? (
        <p className="rap-empty">No recent {current.noun}.</p>
      ) : (
        <>
          {section === 'uploads' && (
            <UploadList items={data.uploads.slice(0, maxItems)} now={reference}
              onOpen={onItemOpen && ((item) => onItemOpen({ section: 'uploads', item }))} />
          )}
          {section === 'categories' && (
            <CategoryList items={data.categories.slice(0, maxItems)} now={reference}
              onOpen={onItemOpen && ((item) => onItemOpen({ section: 'categories', item }))} />
          )}
          {section === 'lightboxes' && (
            <LightboxList items={data.lightboxes.slice(0, maxItems)} now={reference}
              onOpen={onItemOpen && ((item) => onItemOpen({ section: 'lightboxes', item }))} />
          )}
          {onViewAll && (
            <div className="rap-more">
              <Button variant="ghost" size="sm" onClick={() => onViewAll(section)}>
                View all {current.noun}
                {hidden > 0 && ` (${total.toLocaleString()})`}
                <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )
  }

  return (
    <section className="rap" aria-labelledby={`${baseId}-title`}>
      <header className="rap-header">
        <h2 id={`${baseId}-title`} className="rap-header__title">{title}</h2>
        <div className="rap-tabs" role="tablist" aria-label="Activity type" onKeyDown={onTabKey}>
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const selected = id === section
            const count = ready ? data[id].length : null
            return (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                className="rap-tab"
                onClick={() => setSection(id)}
              >
                <Icon />
                <span>{label}</span>
                {count !== null && <span className="rap-tab__count">{count}</span>}
              </button>
            )
          })}
        </div>
      </header>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${section}`}
        aria-busy={isLoading || undefined}
        className="rap-body"
      >
        {body}
      </div>
    </section>
  )
}
