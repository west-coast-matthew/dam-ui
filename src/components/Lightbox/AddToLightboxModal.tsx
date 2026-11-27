import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { BrowsedAsset } from '../../services/assetBrowseService'
import type { Lightbox } from '../../services/lightboxService'
import { useAddLightboxItems, useLightboxes } from '../../services/useLightboxes'
import { plural } from '../AssetExplorerPanel/format'
import { ErrorState } from '../ErrorState'
import { Button, Checkbox } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { Modal } from '../Modal'

export interface AddToLightboxModalProps {
  catalogId: string
  /** The selection. */
  assets: BrowsedAsset[]
  onClose: (result?: { clearSelection: boolean }) => void
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

/**
 * Adds the selection to one of the catalog's lightboxes (assets already in it are skipped). Then
 * confirms with a link and offers to clear the selection. Render it only while it's open.
 */
export function AddToLightboxModal({ catalogId, assets, onClose }: AddToLightboxModalProps) {
  const formId = useId()
  const lightboxes = useLightboxes(catalogId)
  const add = useAddLightboxItems()
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [clearSelection, setClearSelection] = useState(true)
  const [result, setResult] = useState<{ lightbox: Lightbox; added: number } | null>(null)
  const list = lightboxes.data ?? []

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const target = list.find((l) => l.id === chosenId)
    if (!target) return
    add.mutate(
      { id: target.id, assets },
      { onSuccess: (lightbox) => setResult({ lightbox, added: lightbox.itemCount - target.itemCount }) },
    )
  }

  const close = () => onClose(result ? { clearSelection } : undefined)

  if (result) {
    const skipped = assets.length - result.added
    return (
      <Modal open title="Added to lightbox" size="sm" onClose={close} footer={<Button onClick={close}>Done</Button>}>
        <div className="lbx-confirm" role="status">
          <p>
            Added {plural(result.added, 'asset', 'assets')} to <strong>{result.lightbox.title}</strong>
            {skipped > 0 && ` (${skipped} ${skipped === 1 ? 'was' : 'were'} already in it)`}.
            It now has {plural(result.lightbox.itemCount, 'asset', 'assets')}.
          </p>
          <p>
            <Link to={`/lightboxes/${result.lightbox.id}`} onClick={close}>Open it on the Lightboxes page</Link>
          </p>
          <Checkbox label="Clear the selection" checked={clearSelection} onChange={(e) => setClearSelection(e.target.checked)} />
        </div>
      </Modal>
    )
  }

  let body
  if (lightboxes.isError && !lightboxes.data) {
    body = <ErrorState size="sm" title="Couldn't load lightboxes" message={errorMessage(lightboxes.error)} onRetry={() => void lightboxes.refetch()} />
  } else if (!lightboxes.data) {
    body = <LoadingState size="sm" label="Loading lightboxes…" />
  } else if (list.length === 0) {
    body = <p className="lbx-form__note">This catalog has no lightboxes yet. Use Save as lightbox to make one.</p>
  } else {
    body = (
      <form id={formId} className="lbx-form" onSubmit={submit}>
        <fieldset className="lbx-pick" disabled={add.isPending}>
          <legend>Add the {plural(assets.length, 'selected asset', 'selected assets')} to</legend>
          {list.map((l) => (
            <label key={l.id} className={`lbx-pick__option${chosenId === l.id ? ' lbx-pick__option--on' : ''}`}>
              <input type="radio" name={`${formId}-lightbox`} value={l.id} checked={chosenId === l.id} onChange={() => setChosenId(l.id)} />
              <span className="lbx-pick__title">{l.title}</span>
              <span className="lbx-pick__meta">{plural(l.itemCount, 'item', 'items')}{l.shared ? ' · Shared' : ''}</span>
            </label>
          ))}
        </fieldset>
        {add.isError && <p className="lbx-error" role="alert">{errorMessage(add.error)}</p>}
      </form>
    )
  }

  return (
    <Modal
      open
      title="Add to lightbox"
      onClose={close}
      dismissible={!add.isPending}
      footer={
        <>
          <Button variant="ghost" disabled={add.isPending} onClick={close}>Cancel</Button>
          <Button type="submit" form={formId} loading={add.isPending} disabled={!chosenId || list.length === 0}>
            {add.isPending ? 'Adding…' : 'Add'}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  )
}
