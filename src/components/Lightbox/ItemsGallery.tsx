import { useEffect, useRef, type ReactNode } from 'react'
import { displayTitle, PAGE_SIZE_OPTIONS, type BrowsedAsset } from '../../services/assetBrowseService'
import { Pagination } from '../AssetBrowsePanel'
import { AssetThumb } from '../AssetExplorerPanel/AssetThumb'
import { Button, Checkbox } from '../FormControls'
import { CloseIcon, NextIcon, PrevIcon, TrashIcon } from './icons'

export type MoveDirection = 'earlier' | 'later'

export interface ItemsGalleryProps {
  /** The page of items shown. */
  items: BrowsedAsset[]
  /** Position of the page's first item in the whole list (0-based). */
  offset: number
  totalItems: number
  /** Name used in labels, e.g. "the selection" or the lightbox's title. */
  listName: string
  checked: Set<string>
  onCheckedChange: (checked: Set<string>) => void
  onRemove: (assetIds: string[]) => void
  onMove: (asset: BrowsedAsset, direction: MoveDirection) => void
  /** Disables the controls while a change is saving. */
  busy?: boolean
  /** The button to focus once it's on screen again (after a move); cleared through onFocused. */
  focusTarget?: { assetId: string; direction: MoveDirection } | null
  onFocused?: () => void
  /** Announced politely, e.g. "Moved Harbor to position 3." */
  status?: string
  page: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  /** Shown above the gallery, e.g. an error. */
  notice?: ReactNode
}

/**
 * A lightbox's (or the selection's) items as a gallery, paged, in order. Each item can be checked
 * for removing several at once, removed on its own, or moved one place earlier or later with its
 * arrow buttons (so reordering works from the keyboard).
 */
export function ItemsGallery({
  items, offset, totalItems, listName, checked, onCheckedChange, onRemove, onMove, busy = false,
  focusTarget, onFocused, status, page, totalPages, pageSize, onPageChange, onPageSizeChange, notice,
}: ItemsGalleryProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const pageIds = items.map((a) => a.id)
  const checkedOnPage = pageIds.filter((id) => checked.has(id))
  const allOnPage = pageIds.length > 0 && checkedOnPage.length === pageIds.length

  // After a move the item may sit elsewhere (even on another page): focus its button again there.
  useEffect(() => {
    if (!focusTarget || busy) return
    const list = listRef.current
    const card = list?.querySelector<HTMLElement>(`[data-asset-id="${CSS.escape(focusTarget.assetId)}"]`)
    if (!card) return
    const wanted = card.querySelector<HTMLButtonElement>(`[data-move="${focusTarget.direction}"]`)
    const target = wanted && !wanted.disabled ? wanted : card.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)')
    target?.focus()
    onFocused?.()
  }, [focusTarget, busy, items, onFocused])

  const toggleAll = () => {
    const next = new Set(checked)
    for (const id of pageIds) {
      if (allOnPage) next.delete(id)
      else next.add(id)
    }
    onCheckedChange(next)
  }

  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onCheckedChange(next)
  }

  return (
    <div className="lbx-items">
      <div className="lbx-items__bar">
        <Checkbox
          label={allOnPage ? 'Unselect this page' : 'Select this page'}
          checked={allOnPage}
          indeterminate={!allOnPage && checkedOnPage.length > 0}
          onChange={toggleAll}
          disabled={busy || items.length === 0}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={<TrashIcon />}
          disabled={busy || checked.size === 0}
          onClick={() => onRemove([...checked])}
        >
          {checked.size ? `Remove ${checked.size} selected` : 'Remove selected'}
        </Button>
        <span className="lbx-items__status" role="status" aria-live="polite">{status}</span>
      </div>

      {notice}

      <ul ref={listRef} className="lbx-items__grid" aria-label={`Items in ${listName}`} aria-busy={busy || undefined}>
        {items.map((asset, i) => {
          const position = offset + i
          const title = displayTitle(asset)
          const isChecked = checked.has(asset.id)
          return (
            <li key={asset.id} data-asset-id={asset.id} className={`lbx-item${isChecked ? ' lbx-item--checked' : ''}`}>
              <div className="lbx-item__thumb">
                <AssetThumb asset={asset} shape="natural" />
                <span className="lbx-item__position" aria-hidden="true">{position + 1}</span>
              </div>
              <div className="lbx-item__body">
                <label className="lbx-item__check">
                  <input type="checkbox" className="fc-checkbox" checked={isChecked} disabled={busy} onChange={() => toggle(asset.id)}
                    aria-label={`Select ${title}, item ${position + 1} of ${totalItems}`} />
                  <span className="lbx-item__title" title={title}>{title}</span>
                </label>
                <div className="lbx-item__tools">
                  <button type="button" className="axp-icon-button" data-move="earlier" aria-label={`Move ${title} earlier`}
                    title="Move earlier" disabled={busy || position === 0} onClick={() => onMove(asset, 'earlier')}>
                    <PrevIcon size={16} />
                  </button>
                  <button type="button" className="axp-icon-button" data-move="later" aria-label={`Move ${title} later`}
                    title="Move later" disabled={busy || position === totalItems - 1} onClick={() => onMove(asset, 'later')}>
                    <NextIcon size={16} />
                  </button>
                  <button type="button" className="axp-icon-button lbx-item__remove" aria-label={`Remove ${title} from ${listName}`}
                    title="Remove" disabled={busy} onClick={() => onRemove([asset.id])}>
                    <CloseIcon />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <footer className="lbx-items__footer">
        <label className="axp-page-size">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value)
              onPageSizeChange(size)
              onPageChange(Math.floor(offset / size) + 1)
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <fieldset className="axp-results__pages" disabled={totalPages <= 1}>
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} variant="full" label="Item pages" />
        </fieldset>
      </footer>
    </div>
  )
}
