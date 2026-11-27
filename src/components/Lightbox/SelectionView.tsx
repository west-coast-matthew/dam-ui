import { useCallback, useState } from 'react'
import { DEFAULT_PAGE_SIZE, displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { selectionDownloadName, useDownloadAssets } from '../../services/useLightboxes'
import { plural } from '../AssetExplorerPanel/format'
import { Button } from '../FormControls'
import { DownloadIcon, LightboxIcon, PlayIcon, PlusIcon, SaveIcon, TrashIcon } from './icons'
import { ItemsGallery, type MoveDirection } from './ItemsGallery'
import { SelectionDialogs, type SelectionDialog } from './SelectionDialogs'
import { useSelection, useSelectionStore } from './selectionStore'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "The download didn't start.")

/** The manager's "Current selection": the selection store's items, managed like a lightbox's. */
export function SelectionView({ catalogId }: { catalogId: string }) {
  const items = useSelection()
  const removeMany = useSelectionStore((s) => s.removeMany)
  const move = useSelectionStore((s) => s.move)
  const download = useDownloadAssets()
  const [dialog, setDialog] = useState<SelectionDialog>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const [focusTarget, setFocusTarget] = useState<{ assetId: string; direction: MoveDirection } | null>(null)
  const [status, setStatus] = useState('')
  const empty = items.length === 0

  const totalPages = Math.ceil(items.length / pageSize)
  const current = Math.min(page, Math.max(1, totalPages))
  const offset = (current - 1) * pageSize
  const pageItems = items.slice(offset, offset + pageSize)
  const liveChecked = new Set([...checked].filter((id) => items.some((a) => a.id === id)))

  const remove = (ids: string[]) => {
    removeMany(ids)
    setChecked((c) => new Set([...c].filter((id) => !ids.includes(id))))
    setStatus(`Removed ${plural(ids.length, 'asset', 'assets')} from the selection.`)
  }

  const onMove = (asset: BrowsedAsset, direction: MoveDirection) => {
    const from = items.findIndex((a) => a.id === asset.id)
    const to = Math.min(items.length - 1, Math.max(0, from + (direction === 'earlier' ? -1 : 1)))
    move(asset.id, to - from)
    setPage(Math.floor(to / pageSize) + 1)
    setFocusTarget({ assetId: asset.id, direction })
    setStatus(`Moved ${displayTitle(asset)} to position ${to + 1}.`)
  }

  const onFocused = useCallback(() => setFocusTarget(null), [])

  return (
    <div className="lbx-detail">
      <header className="lbx-detail__header">
        <div className="lbx-detail__heading">
          <h3 className="lbx-detail__title">Current selection</h3>
          <p className="lbx-detail__meta">
            {plural(items.length, 'asset', 'assets')} · Kept in this browser until you save it as a lightbox or clear it.
          </p>
        </div>
        <div className="lbx-detail__actions">
          <Button size="sm" variant="secondary" icon={<PlayIcon />} disabled={empty} onClick={() => setDialog('browse')}>Browse</Button>
          <Button size="sm" variant="secondary" icon={<DownloadIcon />} disabled={empty} loading={download.isPending}
            onClick={() => download.mutate({ assets: items, name: selectionDownloadName() })}>
            {download.isPending ? 'Preparing…' : 'Download'}
          </Button>
          <Button size="sm" icon={<SaveIcon />} disabled={empty} onClick={() => setDialog('save')}>Save as lightbox</Button>
          <Button size="sm" variant="secondary" icon={<LightboxIcon />} disabled={empty} onClick={() => setDialog('add')}>Add to lightbox…</Button>
          <Button size="sm" variant="ghost" icon={<TrashIcon />} disabled={empty} onClick={() => setDialog('clear')}>Clear</Button>
        </div>
      </header>
      {download.isError && <p className="lbx-error lbx-detail__error" role="alert">{errorMessage(download.error)}</p>}

      {empty ? (
        <div className="lbx-empty">
          <span className="lbx-tray__empty-mark"><PlusIcon /></span>
          <p>Nothing is selected. On the Assets page, use the + on a tile or row, or Add page to selection, to collect assets here.</p>
        </div>
      ) : (
        <ItemsGallery
          items={pageItems}
          offset={offset}
          totalItems={items.length}
          listName="the selection"
          checked={liveChecked}
          onCheckedChange={setChecked}
          onRemove={remove}
          onMove={onMove}
          focusTarget={focusTarget}
          onFocused={onFocused}
          status={status}
          page={current}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <SelectionDialogs dialog={dialog} onClose={() => setDialog(null)} catalogId={catalogId} items={items} />
    </div>
  )
}
