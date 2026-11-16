import { Button } from '../FormControls'
import { pageWindow } from './pageWindow'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from './icons'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Compact shows previous/next and "Page x of y"; full adds first/last and page numbers. */
  variant?: 'compact' | 'full'
  label: string
}

/**
 * Previous/next page controls. With no pages yet (totalPages 0) it shows dashes; the caller
 * disables it through a surrounding <fieldset disabled>.
 */
export function Pagination({ page, totalPages, onPageChange, variant = 'compact', label }: PaginationProps) {
  const known = totalPages > 0
  const atStart = !known || page <= 1
  const atEnd = !known || page >= totalPages
  const go = (p: number) => {
    if (p !== page && p >= 1 && p <= totalPages) onPageChange(p)
  }

  return (
    <nav className={`abp-pagination abp-pagination--${variant}`} aria-label={label}>
      {variant === 'full' && (
        <Button variant="ghost" size="sm" icon={<ChevronsLeft />} aria-label="First page" disabled={atStart} onClick={() => go(1)} />
      )}
      <Button variant="ghost" size="sm" icon={<ChevronLeft />} aria-label="Previous page" disabled={atStart} onClick={() => go(page - 1)} />
      {variant === 'full' && known ? (
        <ol className="abp-pagination__pages">
          {pageWindow(page, totalPages).map((p, i) =>
            p === null ? (
              <li key={`gap-${i}`} className="abp-pagination__gap" aria-hidden="true">…</li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  className="abp-pagination__page"
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                  onClick={() => go(p)}
                >
                  {p}
                </button>
              </li>
            ),
          )}
        </ol>
      ) : (
        <span className="abp-pagination__status" aria-live="polite">
          Page {known ? page : '–'} of {known ? totalPages : '–'}
        </span>
      )}
      <Button variant="ghost" size="sm" icon={<ChevronRight />} aria-label="Next page" disabled={atEnd} onClick={() => go(page + 1)} />
      {variant === 'full' && (
        <Button variant="ghost" size="sm" icon={<ChevronsRight />} aria-label="Last page" disabled={atEnd} onClick={() => go(totalPages)} />
      )}
    </nav>
  )
}
