import { useMemo, useState } from 'react'
import type { CategoryRecord } from '../../services/categoryService'
import { Button } from '../FormControls'
import { useBrowseStore, visitScore } from './browseStore'
import { plural, timeAgo } from './format'
import { HistoryIcon } from './icons'

export interface RecentsTabProps {
  workspaceId: string
  catalogId: string
  categories: CategoryRecord[] | undefined
  /** Opens the category in the Browse tab. */
  onOpenCategory: (categoryId: string) => void
}

const MAX_SHOWN = 20

/**
 * The categories this browser has viewed assets in, most frequently and recently viewed first.
 * The history lives only in this browser (localStorage).
 */
export function RecentsTab({ workspaceId, catalogId, categories, onOpenCategory }: RecentsTabProps) {
  const visits = useBrowseStore((s) => s.visits)
  const clearVisits = useBrowseStore((s) => s.clearVisits)
  // "Now" as of opening the tab; the tab remounts each time it's opened.
  const [now] = useState(() => Date.now())

  const ranked = useMemo(() => {
    const known = categories ? new Set(categories.map((c) => c.id)) : null
    return visits
      .filter((v) => v.workspaceId === workspaceId && v.catalogId === catalogId && (!known || known.has(v.categoryId)))
      .map((v) => ({ visit: v, score: visitScore(v, now) }))
      .sort((a, b) => b.score - a.score || b.visit.viewedAt[0] - a.visit.viewedAt[0])
      .slice(0, MAX_SHOWN)
  }, [visits, workspaceId, catalogId, categories, now])

  if (ranked.length === 0) {
    return (
      <div className="axp-recents axp-recents--empty">
        <HistoryIcon />
        <p>Nothing here yet. Categories appear here once you preview assets in them.</p>
      </div>
    )
  }

  return (
    <div className="axp-recents">
      <div className="axp-recents__bar">
        <p className="axp-recents__note">Most viewed recently first. Kept only in this browser.</p>
        <Button variant="ghost" size="sm" onClick={() => clearVisits(workspaceId)}>Clear history</Button>
      </div>
      <ol className="axp-recents__list">
        {ranked.map(({ visit }) => (
          <li key={visit.categoryId}>
            <button type="button" className="axp-recents__item" onClick={() => onOpenCategory(visit.categoryId)}>
              <span className="axp-path">
                {visit.path.map((name, i) => (
                  <span key={i} className={i === visit.path.length - 1 ? 'axp-path__name' : 'axp-path__ancestor'}>
                    {i > 0 && <span aria-hidden="true"> → </span>}
                    {name}
                  </span>
                ))}
              </span>
              <span className="axp-recents__meta">
                Viewed {plural(visit.views, 'time', 'times')} · last {timeAgo(visit.viewedAt[0], now)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
