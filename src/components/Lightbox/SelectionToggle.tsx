import type { KeyboardEvent, MouseEvent } from 'react'
import { displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { CheckIcon, PlusIcon } from './icons'
import { useIsSelected, useSelectionStore } from './selectionStore'

export interface SelectionToggleProps {
  asset: BrowsedAsset
  /** 'overlay' sits on a gallery tile; 'inline' fits a list row; 'button' is a labelled button. */
  variant: 'overlay' | 'inline' | 'button'
  className?: string
}

/**
 * Adds the asset to the selection, or takes it out. It stops its clicks and keys from reaching the
 * tile or row underneath, so it never opens the preview.
 */
export function SelectionToggle({ asset, variant, className }: SelectionToggleProps) {
  const selected = useIsSelected(asset)
  const toggle = useSelectionStore((s) => s.toggle)
  const title = displayTitle(asset)
  const hint = selected ? `Remove ${title} from the selection` : `Add ${title} to the selection`

  const onClick = (e: MouseEvent) => {
    e.stopPropagation()
    toggle(asset)
  }
  const stopDoubleClick = (e: MouseEvent) => e.stopPropagation()
  // Enter and Space press the button; they mustn't also reach a list row, which opens the preview.
  const stopActivation = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
  }

  const classes = ['lbx-toggle', `lbx-toggle--${variant}`, selected && 'lbx-toggle--on', className].filter(Boolean).join(' ')
  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      aria-label={variant === 'button' ? undefined : `Select ${title}`}
      title={hint}
      onClick={onClick}
      onDoubleClick={stopDoubleClick}
      onKeyDown={stopActivation}
    >
      <span className="lbx-toggle__mark">{selected ? <CheckIcon /> : <PlusIcon />}</span>
      {variant === 'button' && <span>{selected ? 'In selection' : 'Add to selection'}</span>}
    </button>
  )
}
