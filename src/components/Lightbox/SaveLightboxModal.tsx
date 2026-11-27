import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { BrowsedAsset } from '../../services/assetBrowseService'
import { LIGHTBOX_TITLE_MAX_LENGTH, type Lightbox } from '../../services/lightboxService'
import { useCreateLightbox } from '../../services/useLightboxes'
import { Button, Checkbox, Switch, TextArea, TextField } from '../FormControls'
import { Modal } from '../Modal'
import { plural } from '../AssetExplorerPanel/format'

export interface SaveLightboxModalProps {
  catalogId: string
  /** The assets to save (the selection); empty for a new, empty lightbox. */
  assets: BrowsedAsset[]
  /** True when `assets` is the selection, so the confirmation offers to clear it. */
  fromSelection: boolean
  /** Called when the dialog closes; `saved` is set after a save, with whether to clear the selection. */
  onClose: (result?: { saved: Lightbox; clearSelection: boolean }) => void
  /** Called right after a save, e.g. to show the new lightbox. */
  onSaved?: (saved: Lightbox) => void
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "The lightbox wasn't saved.")

/**
 * Saves the selection (or nothing) as a new lightbox: title, description and shared. Afterwards it
 * confirms, links to the lightbox and offers to clear the selection. On failure it stays open.
 * Render it only while it's open.
 */
export function SaveLightboxModal({ catalogId, assets, fromSelection, onClose, onSaved }: SaveLightboxModalProps) {
  const formId = useId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [shared, setShared] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [clearSelection, setClearSelection] = useState(true)
  const create = useCreateLightbox()
  const saved = create.data

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Give the lightbox a title.')
      return
    }
    setTitleError(null)
    create.mutate(
      { catalogId, title, description, shared, assets },
      { onSuccess: (lightbox) => onSaved?.(lightbox) },
    )
  }

  const close = () => onClose(saved ? { saved, clearSelection: fromSelection && clearSelection } : undefined)

  if (saved) {
    return (
      <Modal open title="Lightbox saved" size="sm" onClose={close} footer={<Button onClick={close}>Done</Button>}>
        <div className="lbx-confirm" role="status">
          <p>
            Saved <strong>{saved.title}</strong> with {plural(saved.itemCount, 'asset', 'assets')}.
          </p>
          <p>
            <Link to={`/lightboxes/${saved.id}`} onClick={close}>Open it on the Lightboxes page</Link>
          </p>
          {fromSelection && (
            <Checkbox label="Clear the selection" checked={clearSelection} onChange={(e) => setClearSelection(e.target.checked)} />
          )}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      title={assets.length ? 'Save as lightbox' : 'New lightbox'}
      onClose={close}
      dismissible={!create.isPending}
      footer={
        <>
          <Button variant="ghost" disabled={create.isPending} onClick={close}>Cancel</Button>
          <Button type="submit" form={formId} loading={create.isPending}>
            {create.isPending ? 'Saving…' : 'Save lightbox'}
          </Button>
        </>
      }
    >
      <form id={formId} className="lbx-form" onSubmit={submit} noValidate>
        {assets.length > 0 && <p className="lbx-form__note">The lightbox starts with the {plural(assets.length, 'selected asset', 'selected assets')}, in the order you picked them.</p>}
        <TextField
          label="Title"
          required
          maxLength={LIGHTBOX_TITLE_MAX_LENGTH}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={titleError ?? undefined}
          disabled={create.isPending}
          autoFocus
        />
        <TextArea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={create.isPending}
        />
        <Switch
          label="Shared"
          description="Other users can see this lightbox."
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          disabled={create.isPending}
        />
        {create.isError && <p className="lbx-error" role="alert">{errorMessage(create.error)}</p>}
      </form>
    </Modal>
  )
}
