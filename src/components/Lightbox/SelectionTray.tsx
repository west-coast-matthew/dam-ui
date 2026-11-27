import { useEffect, useId, useRef, useState } from 'react'
import { displayTitle } from '../../services/assetBrowseService'
import { selectionDownloadName, useDownloadAssets } from '../../services/useLightboxes'
import { AssetThumb } from '../AssetExplorerPanel/AssetThumb'
import { plural } from '../AssetExplorerPanel/format'
import { Button } from '../FormControls'
import { CloseIcon, DownloadIcon, LightboxIcon, PlayIcon, PlusIcon, SaveIcon, TrashIcon } from './icons'
import { SelectionDialogs, type SelectionDialog } from './SelectionDialogs'
import { useSelection, useSelectionStore } from './selectionStore'

export interface SelectionTrayProps {
  catalogId: string
  open: boolean
  onClose: () => void
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "The download didn't start.")

/**
 * The selection as a drawer on the right (a modal <dialog>): each asset with a remove button, and
 * Download, Save as lightbox, Add to lightbox…, Browse and Clear.
 */
export function SelectionTray({ catalogId, open, onClose }: SelectionTrayProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const items = useSelection()
  const remove = useSelectionStore((s) => s.remove)
  const download = useDownloadAssets()
  const [dialog, setDialog] = useState<SelectionDialog>(null)
  const empty = items.length === 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  return (
    <>
      <dialog
        ref={ref}
        className="lbx-tray"
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault()
          onClose()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {open && (
          <div className="lbx-tray__inner">
            <header className="lbx-tray__header">
              <div>
                <h2 id={titleId} className="lbx-tray__title">Selection</h2>
                <p className="lbx-tray__count" aria-live="polite">{empty ? 'Nothing selected' : plural(items.length, 'asset', 'assets')}</p>
              </div>
              <button type="button" className="axp-icon-button" aria-label="Close the selection" onClick={onClose}>
                <CloseIcon />
              </button>
            </header>

            {empty ? (
              <div className="lbx-tray__empty">
                <span className="lbx-tray__empty-mark"><PlusIcon /></span>
                <p>Use the + on a tile or row, or Add page to selection, to collect assets here.</p>
              </div>
            ) : (
              <ul className="lbx-tray__list">
                {items.map((asset) => (
                  <li key={asset.id} className="lbx-tray__item">
                    <AssetThumb asset={asset} shape="square" />
                    <span className="lbx-tray__name">
                      <span className="lbx-tray__item-title">{displayTitle(asset)}</span>
                      {asset.title.trim() && <span className="lbx-tray__file">{asset.originalFilename}</span>}
                    </span>
                    <button type="button" className="axp-icon-button" aria-label={`Remove ${displayTitle(asset)} from the selection`}
                      title="Remove" onClick={() => remove(asset.id)}>
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <footer className="lbx-tray__actions">
              {download.isError && <p className="lbx-error" role="alert">{errorMessage(download.error)}</p>}
              <div className="lbx-tray__buttons">
                <Button size="sm" icon={<DownloadIcon />} disabled={empty} loading={download.isPending}
                  onClick={() => download.mutate({ assets: items, name: selectionDownloadName() })}>
                  {download.isPending ? 'Preparing…' : 'Download'}
                </Button>
                <Button size="sm" variant="secondary" icon={<SaveIcon />} disabled={empty} onClick={() => setDialog('save')}>
                  Save as lightbox
                </Button>
                <Button size="sm" variant="secondary" icon={<LightboxIcon />} disabled={empty} onClick={() => setDialog('add')}>
                  Add to lightbox…
                </Button>
                <Button size="sm" variant="secondary" icon={<PlayIcon />} disabled={empty} onClick={() => setDialog('browse')}>
                  Browse
                </Button>
                <Button size="sm" variant="ghost" icon={<TrashIcon />} disabled={empty} onClick={() => setDialog('clear')}>
                  Clear
                </Button>
              </div>
            </footer>
          </div>
        )}
      </dialog>
      <SelectionDialogs dialog={dialog} onClose={() => setDialog(null)} catalogId={catalogId} items={items} />
    </>
  )
}
