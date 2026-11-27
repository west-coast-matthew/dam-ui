import { useCallback, useState, type FormEvent } from 'react'
import { DEFAULT_PAGE_SIZE, displayTitle, type BrowsedAsset } from '../../services/assetBrowseService'
import { LIGHTBOX_TITLE_MAX_LENGTH, type Lightbox } from '../../services/lightboxService'
import {
  useDeleteLightbox,
  useDownloadLightbox,
  useLightboxItems,
  useMoveLightboxItem,
  useRemoveLightboxItems,
  useUpdateLightbox,
} from '../../services/useLightboxes'
import { plural } from '../AssetExplorerPanel/format'
import { ErrorState } from '../ErrorState'
import { Button, Switch, TextArea, TextField } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { ConfirmModal } from './ConfirmModal'
import { DownloadIcon, PlayIcon, TrashIcon } from './icons'
import { ItemsGallery, type MoveDirection } from './ItemsGallery'
import { Slideshow } from './Slideshow'

const errorMessage = (error: unknown, fallback = 'Something went wrong.') => (error instanceof Error ? error.message : fallback)

export interface LightboxViewProps {
  lightbox: Lightbox
  /** Called once the lightbox has been deleted. */
  onDeleted: () => void
}

/** One lightbox in the manager: its details (editable), its items, and Browse, Download and Delete. */
export function LightboxView({ lightbox, onDeleted }: LightboxViewProps) {
  const [dialog, setDialog] = useState<'browse' | 'delete' | null>(null)
  const download = useDownloadLightbox()
  const remove = useDeleteLightbox()
  const empty = lightbox.itemCount === 0

  return (
    <div className="lbx-detail">
      <header className="lbx-detail__header">
        <LightboxDetailsForm key={lightbox.id} lightbox={lightbox} />
        <div className="lbx-detail__actions">
          <Button size="sm" variant="secondary" icon={<PlayIcon />} disabled={empty} onClick={() => setDialog('browse')}>Browse</Button>
          <Button size="sm" variant="secondary" icon={<DownloadIcon />} disabled={empty} loading={download.isPending}
            onClick={() => download.mutate({ id: lightbox.id, title: lightbox.title })}>
            {download.isPending ? 'Preparing…' : 'Download'}
          </Button>
          <Button size="sm" variant="ghost" icon={<TrashIcon />} onClick={() => { remove.reset(); setDialog('delete') }}>
            Delete lightbox
          </Button>
        </div>
      </header>
      {download.isError && <p className="lbx-error lbx-detail__error" role="alert">{errorMessage(download.error, "The download didn't start.")}</p>}

      <LightboxItems key={lightbox.id} lightbox={lightbox} />

      {dialog === 'browse' && <Slideshow title={lightbox.title} lightboxId={lightbox.id} onClose={() => setDialog(null)} />}
      {dialog === 'delete' && (
        <ConfirmModal
          title="Delete this lightbox?"
          confirmLabel="Delete lightbox"
          pendingLabel="Deleting…"
          pending={remove.isPending}
          error={remove.isError ? errorMessage(remove.error, "The lightbox wasn't deleted.") : null}
          onCancel={() => setDialog(null)}
          onConfirm={() => remove.mutate(lightbox.id, { onSuccess: () => { setDialog(null); onDeleted() } })}
        >
          <p>
            <strong>{lightbox.title}</strong> and its list of {plural(lightbox.itemCount, 'asset', 'assets')} will be deleted.
            The assets themselves stay in the catalog.
          </p>
        </ConfirmModal>
      )}
    </div>
  )
}

/** Title, description and shared, saved together (Save/Cancel appear once something changed). */
function LightboxDetailsForm({ lightbox }: { lightbox: Lightbox }) {
  const [title, setTitle] = useState(lightbox.title)
  const [description, setDescription] = useState(lightbox.description)
  const [shared, setShared] = useState(lightbox.shared)
  const [titleError, setTitleError] = useState<string | null>(null)
  const update = useUpdateLightbox(lightbox.id)
  const dirty = title !== lightbox.title || description !== lightbox.description || shared !== lightbox.shared

  const cancel = () => {
    setTitle(lightbox.title)
    setDescription(lightbox.description)
    setShared(lightbox.shared)
    setTitleError(null)
    update.reset()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Give the lightbox a title.')
      return
    }
    setTitleError(null)
    update.mutate({ title, description, shared }, {
      onSuccess: (saved) => {
        setTitle(saved.title)
        setDescription(saved.description)
        setShared(saved.shared)
      },
    })
  }

  return (
    <form className="lbx-details" onSubmit={submit} noValidate aria-label="Lightbox details">
      <TextField label="Title" required maxLength={LIGHTBOX_TITLE_MAX_LENGTH} value={title} disabled={update.isPending}
        error={titleError ?? undefined} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Description" rows={2} value={description} disabled={update.isPending}
        onChange={(e) => setDescription(e.target.value)} />
      <div className="lbx-details__row">
        <Switch label="Shared" description="Other users can see this lightbox." checked={shared} disabled={update.isPending}
          onChange={(e) => setShared(e.target.checked)} />
        <span className="lbx-details__owner">Owner: {lightbox.userId || 'unknown'} · {plural(lightbox.itemCount, 'item', 'items')}</span>
      </div>
      {update.isError && <p className="lbx-error" role="alert">{errorMessage(update.error, "The changes weren't saved.")}</p>}
      {update.isSuccess && !dirty && <p className="lbx-saved" role="status">Saved.</p>}
      {(dirty || update.isPending) && (
        <div className="lbx-details__buttons">
          <Button type="submit" size="sm" loading={update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Button>
          <Button variant="ghost" size="sm" disabled={update.isPending} onClick={cancel}>Cancel</Button>
        </div>
      )}
    </form>
  )
}

/** The lightbox's items, a page at a time from the service, with remove and reorder. */
function LightboxItems({ lightbox }: { lightbox: Lightbox }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const [focusTarget, setFocusTarget] = useState<{ assetId: string; direction: MoveDirection } | null>(null)
  const [status, setStatus] = useState('')
  const items = useLightboxItems(lightbox.id, page, pageSize)
  const remove = useRemoveLightboxItems(lightbox.id)
  const move = useMoveLightboxItem(lightbox.id)
  const onFocused = useCallback(() => setFocusTarget(null), [])
  const data = items.data

  // A page past the end (after removing items) moves back to the last page.
  if (data && data.totalPages > 0 && page > data.totalPages) setPage(data.totalPages)

  const onRemove = (ids: string[]) => {
    move.reset()
    remove.mutate(ids, {
      onSuccess: () => {
        setChecked((c) => new Set([...c].filter((id) => !ids.includes(id))))
        setStatus(`Removed ${plural(ids.length, 'item', 'items')}.`)
      },
    })
  }

  const onMove = (asset: BrowsedAsset, direction: MoveDirection) => {
    remove.reset()
    setStatus('')
    move.mutate({ assetId: asset.id, delta: direction === 'earlier' ? -1 : 1 }, {
      onSuccess: (to) => {
        if (to === null) return
        setPage(Math.floor(to / pageSize) + 1)
        setFocusTarget({ assetId: asset.id, direction })
        setStatus(`Moved ${displayTitle(asset)} to position ${to + 1}.`)
      },
    })
  }

  if (items.isError && !data) {
    return <ErrorState title="Couldn't load the items" message={errorMessage(items.error)} onRetry={() => void items.refetch()} />
  }
  if (!data) return <LoadingState label="Loading items…" />
  if (data.totalItems === 0) {
    return <p className="lbx-empty">This lightbox is empty. Add assets to the selection on the Assets page, then use Add to lightbox….</p>
  }

  const failure = remove.isError ? errorMessage(remove.error, "The items weren't removed.")
    : move.isError ? errorMessage(move.error, "The item wasn't moved.")
    : items.isError ? errorMessage(items.error)
    : null
  const busy = remove.isPending || move.isPending

  return (
    <ItemsGallery
      items={data.items}
      offset={(data.page - 1) * data.pageSize}
      totalItems={data.totalItems}
      listName={lightbox.title}
      checked={checked}
      onCheckedChange={setChecked}
      onRemove={onRemove}
      onMove={onMove}
      busy={busy || items.isFetching}
      focusTarget={focusTarget}
      onFocused={onFocused}
      status={remove.isPending ? 'Removing…' : move.isPending ? 'Moving…' : items.isFetching ? 'Updating…' : status}
      page={data.page}
      totalPages={data.totalPages}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      notice={failure && <p className="lbx-error" role="alert">{failure}</p>}
    />
  )
}
