import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CatalogTagInput } from '../CatalogTagInput'
import { Button, SegmentedControl, Select, Switch } from '../FormControls'
import { DEFAULT_ACCEPT, fileKind, formatBytes, screenFiles } from './fileRules'
import { CheckIcon } from './icons'
import { UploadDropZone } from './UploadDropZone'
import { UploadFileRow } from './UploadFileRow'
import type { AssetUploadRequest, RejectedFile, UploadCatalogOption, UploadMode } from './types'
import './AssetUploadPanel.css'

export interface AssetUploadPanelProps {
  /** Called when the user commits. Return a promise to keep the panel busy until the upload finishes:
   *  it clears the files when the promise resolves and shows the error message when it rejects. */
  onSubmit: (request: AssetUploadRequest) => void | Promise<unknown>
  /** When given, shows a Cancel button. */
  onCancel?: () => void
  title?: string
  /** Mode the panel opens in. */
  defaultMode?: UploadMode
  /** Accepted file types, as in <input accept>. Defaults to images, video and PDFs. */
  accept?: string
  /** Largest allowed file, in bytes. */
  maxFileSize?: number
  /** Most files allowed in multiple mode. */
  maxFiles?: number
  /** Catalogs the assets can go into. When given, choosing one is required. */
  catalogs?: UploadCatalogOption[]
  defaultCatalogId?: string
  disabled?: boolean
}

interface Entry {
  id: number
  file: File
  title: string
  previewUrl: string | null
}

const MODE_OPTIONS: { value: UploadMode; label: string }[] = [
  { value: 'single', label: 'Single asset' },
  { value: 'multiple', label: 'Multiple assets' },
]

function errorText(error: unknown) {
  return error instanceof Error ? error.message : typeof error === 'string' ? error : 'The upload failed.'
}

/**
 * Collects one asset or a series of assets, with shared details, and hands them to the parent
 * through onSubmit. It never uploads anything itself.
 */
export function AssetUploadPanel({
  onSubmit,
  onCancel,
  title = 'Upload assets',
  defaultMode = 'single',
  accept = DEFAULT_ACCEPT,
  maxFileSize,
  maxFiles = 50,
  catalogs,
  defaultCatalogId,
  disabled = false,
}: AssetUploadPanelProps) {
  const headingId = useId()
  const nextId = useRef(1)
  const [mode, setMode] = useState<UploadMode>(defaultMode)
  const [entries, setEntries] = useState<Entry[]>([])
  const [rejected, setRejected] = useState<RejectedFile[]>([])
  const [catalogId, setCatalogId] = useState(defaultCatalogId ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [versioning, setVersioning] = useState(true)
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sentCount, setSentCount] = useState<number | null>(null)

  // Image preview URLs still in use, released when the panel goes away.
  const liveUrls = useRef(new Set<string>())
  useEffect(() => {
    const urls = liveUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const locked = disabled || submitting
  const needsCatalog = Boolean(catalogs && catalogs.length > 0)
  const catalogError = attempted && needsCatalog && !catalogId ? 'Choose a catalog.' : undefined
  const filesError = attempted && entries.length === 0 ? `Add ${mode === 'single' ? 'a file' : 'at least one file'} to upload.` : undefined
  const totalSize = entries.reduce((sum, e) => sum + e.file.size, 0)

  const makeEntry = (file: File): Entry => {
    const previewUrl = fileKind(file) === 'image' ? URL.createObjectURL(file) : null
    if (previewUrl) liveUrls.current.add(previewUrl)
    return { id: nextId.current++, file, title: '', previewUrl }
  }

  const release = (list: Entry[]) =>
    list.forEach((e) => {
      if (!e.previewUrl) return
      URL.revokeObjectURL(e.previewUrl)
      liveUrls.current.delete(e.previewUrl)
    })

  const addFiles = (files: File[]) => {
    if (files.length === 0) return
    setSentCount(null)
    setSubmitError(null)
    if (mode === 'single') {
      // Single mode: the newest acceptable file replaces the current one.
      const { accepted, rejected: refused } = screenFiles(files, { accept, maxFileSize, existing: [] })
      const [first, ...extra] = accepted
      setRejected([...refused, ...extra.map((f) => ({ name: f.name, reason: 'only one file in single-asset mode' }))])
      if (first) {
        release(entries)
        setEntries([makeEntry(first)])
      }
      return
    }
    const { accepted, rejected: refused } = screenFiles(files, { accept, maxFileSize, existing: entries.map((e) => e.file) })
    const room = Math.max(0, maxFiles - entries.length)
    const kept = accepted.slice(0, room)
    const overflow = accepted.slice(room).map((f) => ({ name: f.name, reason: `limit of ${maxFiles} files reached` }))
    setRejected([...refused, ...overflow])
    setEntries([...entries, ...kept.map(makeEntry)])
  }

  const removeEntry = (id: number) => {
    release(entries.filter((e) => e.id === id))
    setEntries(entries.filter((e) => e.id !== id))
  }

  const changeMode = (next: UploadMode) => {
    setMode(next)
    setRejected([])
    if (next === 'single' && entries.length > 1) {
      // Keep the first file; say which ones were dropped.
      const [first, ...rest] = entries
      release(rest)
      setEntries([first])
      setRejected(rest.map((e) => ({ name: e.file.name, reason: 'removed when switching to single-asset mode' })))
    }
  }

  const clear = () => {
    release(entries)
    setEntries([])
    setRejected([])
    setAttempted(false)
    setSubmitError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    setSentCount(null)
    if (entries.length === 0 || (needsCatalog && !catalogId) || locked) return

    const request: AssetUploadRequest = {
      mode,
      items: entries.map((entry) => ({ file: entry.file, title: entry.title.trim() || null })),
      catalogId: needsCatalog ? catalogId : null,
      tags,
      versioningEnabled: versioning,
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      await onSubmit(request)
      setSentCount(request.items.length)
      release(entries)
      setEntries([])
      setRejected([])
      setAttempted(false)
    } catch (error) {
      setSubmitError(errorText(error))
    } finally {
      setSubmitting(false)
    }
  }

  const count = entries.length
  const submitLabel = count > 1 ? `Upload ${count} assets` : count === 1 || mode === 'single' ? 'Upload asset' : 'Upload assets'

  return (
    <section className="aup" aria-labelledby={headingId}>
      <form onSubmit={submit} noValidate>
        <header className="aup-header">
          <div>
            <h2 id={headingId} className="aup-header__title">{title}</h2>
            <p className="aup-header__subtitle">
              {mode === 'single' ? 'Add one file as a new asset.' : `Add up to ${maxFiles} files; each becomes its own asset.`}
            </p>
          </div>
          <fieldset className="aup-header__mode" disabled={locked}>
            <SegmentedControl legend="Upload" hideLegend options={MODE_OPTIONS} value={mode} onChange={changeMode} />
          </fieldset>
        </header>

        <fieldset className="aup-body" disabled={locked}>
          <legend className="fc-visually-hidden">Files and details</legend>

          <div className={`aup-files${filesError ? ' aup-files--error' : ''}`}>
            {!(mode === 'single' && count === 1) && (
              <UploadDropZone
                multiple={mode === 'multiple'}
                accept={accept}
                disabled={locked}
                hint={[
                  'Images, video or PDF',
                  maxFileSize !== undefined && `up to ${formatBytes(maxFileSize)} each`,
                ].filter(Boolean).join(', ')}
                onFiles={addFiles}
              />
            )}
            {filesError && <p className="aup-message aup-message--error" role="alert">{filesError}</p>}

            {rejected.length > 0 && (
              <div className="aup-rejected" role="status">
                <p>
                  {rejected.length === 1 ? '1 file was' : `${rejected.length} files were`} not added:
                </p>
                <ul>
                  {rejected.map((r, i) => (
                    <li key={`${r.name}-${i}`}><strong>{r.name}</strong> ({r.reason})</li>
                  ))}
                </ul>
              </div>
            )}

            {count > 0 && (
              <>
                {mode === 'multiple' && (
                  <div className="aup-files__summary">
                    <span>{count} {count === 1 ? 'file' : 'files'} · {formatBytes(totalSize)}</span>
                    <Button variant="ghost" size="sm" onClick={clear}>Remove all</Button>
                  </div>
                )}
                <ul className="aup-files__list">
                  {entries.map((entry) => (
                    <UploadFileRow
                      key={entry.id}
                      file={entry.file}
                      previewUrl={entry.previewUrl}
                      title={entry.title}
                      disabled={locked}
                      onTitleChange={(value) =>
                        setEntries((current) => current.map((e) => (e.id === entry.id ? { ...e, title: value } : e)))
                      }
                      onRemove={() => removeEntry(entry.id)}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="aup-details">
            <h3 className="aup-details__title">{mode === 'single' ? 'Details' : 'Details for every file'}</h3>
            {needsCatalog && (
              <Select
                label="Catalog"
                required
                placeholder="Choose a catalog"
                options={catalogs!.map((c) => ({ value: c.id, label: c.name }))}
                value={catalogId}
                error={catalogError}
                onChange={(e) => {
                  // Tags belong to a catalog, so a different catalog starts with none.
                  setCatalogId(e.target.value)
                  setTags([])
                }}
              />
            )}
            <CatalogTagInput
              catalogId={needsCatalog ? catalogId || null : null}
              label="Tags"
              hint={mode === 'multiple' ? 'Every file gets these tags. Press Enter or comma to add.' : 'Pick existing tags or type new ones; press Enter or comma to add.'}
              placeholder="e.g. campaign"
              value={tags}
              onChange={setTags}
            />
            <Switch
              label="Keep versions"
              description="Replacing the file later keeps the earlier versions."
              checked={versioning}
              onChange={(e) => setVersioning(e.target.checked)}
            />
          </div>
        </fieldset>

        <footer className="aup-footer">
          <div className="aup-footer__status" aria-live="polite">
            {submitError && <p className="aup-message aup-message--error" role="alert">{submitError}</p>}
            {sentCount !== null && !submitError && (
              <p className="aup-message aup-message--success">
                <CheckIcon />
                {sentCount === 1 ? '1 asset uploaded.' : `${sentCount} assets uploaded.`}
              </p>
            )}
          </div>
          <div className="aup-footer__actions">
            {onCancel && (
              <Button variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button>
            )}
            {count > 0 && mode === 'single' && (
              <Button variant="ghost" disabled={locked} onClick={clear}>Clear</Button>
            )}
            <Button type="submit" loading={submitting} disabled={disabled}>
              {submitting ? 'Uploading…' : submitLabel}
            </Button>
          </div>
        </footer>
      </form>
    </section>
  )
}
