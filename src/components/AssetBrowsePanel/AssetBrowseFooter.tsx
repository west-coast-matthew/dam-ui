import { Pagination } from './Pagination'
import type { AssetPage } from './types'

export interface AssetBrowseFooterProps {
  page: AssetPage | null
  /** False until the panel has data (and while a new page loads); disables the controls. */
  enabled: boolean
  onPageChange: (page: number) => void
}

function rangeText(page: AssetPage | null) {
  if (!page || page.totalItems === 0) return 'Showing 0 assets'
  const first = (page.page - 1) * page.pageSize + 1
  const last = first + page.items.length - 1
  return `Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${page.totalItems.toLocaleString()}`
}

/** Bottom filter panel: item range and full pagination. */
export function AssetBrowseFooter({ page, enabled, onPageChange }: AssetBrowseFooterProps) {
  return (
    <footer className={`abp-footer${enabled ? '' : ' abp-footer--disabled'}`}>
      <fieldset className="abp-footer__controls" disabled={!enabled}>
        <legend className="fc-visually-hidden">Pagination</legend>
        <p className="abp-footer__range">{rangeText(page)}</p>
        <Pagination variant="full" label="Pages (bottom)" page={page?.page ?? 0} totalPages={page?.totalPages ?? 0} onPageChange={onPageChange} />
      </fieldset>
    </footer>
  )
}
