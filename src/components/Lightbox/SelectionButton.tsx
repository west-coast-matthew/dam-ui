import { useState } from 'react'
import { CartIcon } from './icons'
import { SelectionTray } from './SelectionTray'
import { useSelection } from './selectionStore'

/** The selection indicator for a panel header: the item count, opening the selection tray. */
export function SelectionButton({ catalogId }: { catalogId: string }) {
  const count = useSelection().length
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={`lbx-indicator${count ? ' lbx-indicator--on' : ''}`}
        aria-label={`Selection: ${count} ${count === 1 ? 'asset' : 'assets'}. Open the selection.`}
        title="Selection"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <CartIcon />
        <span className="lbx-indicator__label">Selection</span>
        <span className="lbx-indicator__count" aria-hidden="true">{count}</span>
      </button>
      <SelectionTray catalogId={catalogId} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
