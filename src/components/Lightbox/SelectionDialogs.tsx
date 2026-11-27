import type { BrowsedAsset } from '../../services/assetBrowseService'
import type { Lightbox } from '../../services/lightboxService'
import { plural } from '../AssetExplorerPanel/format'
import { AddToLightboxModal } from './AddToLightboxModal'
import { ConfirmModal } from './ConfirmModal'
import { SaveLightboxModal } from './SaveLightboxModal'
import { useSelectionStore } from './selectionStore'
import { Slideshow } from './Slideshow'

export type SelectionDialog = 'save' | 'add' | 'clear' | 'browse' | null

export interface SelectionDialogsProps {
  dialog: SelectionDialog
  onClose: () => void
  catalogId: string
  items: BrowsedAsset[]
  onSaved?: (saved: Lightbox) => void
}

/** The selection's dialogs: save as lightbox, add to lightbox, clear (confirmed) and browse mode. */
export function SelectionDialogs({ dialog, onClose, catalogId, items, onSaved }: SelectionDialogsProps) {
  const clear = useSelectionStore((s) => s.clear)

  switch (dialog) {
    case 'save':
      return (
        <SaveLightboxModal
          catalogId={catalogId}
          assets={items}
          fromSelection
          onSaved={onSaved}
          onClose={(result) => {
            if (result?.clearSelection) clear()
            onClose()
          }}
        />
      )
    case 'add':
      return (
        <AddToLightboxModal
          catalogId={catalogId}
          assets={items}
          onClose={(result) => {
            if (result?.clearSelection) clear()
            onClose()
          }}
        />
      )
    case 'clear':
      return (
        <ConfirmModal
          title="Clear the selection?"
          confirmLabel="Clear selection"
          onCancel={onClose}
          onConfirm={() => {
            clear()
            onClose()
          }}
        >
          <p>This takes all {plural(items.length, 'asset', 'assets')} out of the selection. The assets themselves aren't changed.</p>
        </ConfirmModal>
      )
    case 'browse':
      return <Slideshow title="Current selection" items={items} onClose={onClose} />
    default:
      return null
  }
}
