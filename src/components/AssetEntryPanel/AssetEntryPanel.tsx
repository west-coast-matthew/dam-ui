import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ASSET_DESCRIPTION_MAX_LENGTH, ASSET_TITLE_MAX_LENGTH } from '../../services/assetService'
import type { CategoryRecord } from '../../services/categoryService'
import { useWorkspace } from '../../workspace/useWorkspace'
import { DEFAULT_ACCEPT, fileKind, formatBytes, screenFiles, UploadDropZone, UploadFileRow, type RejectedFile } from '../AssetUploadPanel'
import { toTree } from '../CategoryManagementPanel/categoryTree'
import { useCatalogList, useCategoryList } from '../CategoryManagementPanel/useCategories'
import { CatalogTagInput } from '../CatalogTagInput'
import { ErrorState } from '../ErrorState'
import { Button, SegmentedControl, Select, TextArea, TextField } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { TreeControl } from '../TreeControl'
import { ConfirmPanel } from './ConfirmPanel'
import { useUploadRun } from './useUploadRun'
import './AssetEntryPanel.css'

export type AssetEntryMode = 'single' | 'bulk'

export interface AssetEntryPanelProps {
  /** Mode the panel opens in. */
  defaultMode?: AssetEntryMode
  /** Accepted file types, as in <input accept>. Defaults to images, video and PDFs. */
  accept?: string
  /** Largest allowed file, in bytes. */
  maxFileSize?: number
  /** Most files in one bulk upload. */
  maxFiles?: number
  className?: string
}

interface Entry {
  key: number
  file: File
  /** Bulk mode's per-file title. Single mode uses the shared title field instead. */
  title: string
  previewUrl: string | null
}

type Stage = 'edit' | 'review' | 'run'

const MODE_OPTIONS: { value: AssetEntryMode; label: string }[] = [
  { value: 'single', label: 'Single asset' },
  { value: 'bulk', label: 'Bulk upload' },
]

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

/** "Marketing / Campaigns / 2026" for a category id. */
function categoryPath(records: CategoryRecord[], id: string): string {
  const byId = new Map(records.map((r) => [r.id, r]))
  const names: string[] = []
  for (let r = byId.get(id); r && names.length <= records.length; r = r.parentId ? byId.get(r.parentId) : undefined) names.unshift(r.name)
  return names.join(' / ')
}

/** The file name without its extension, as a title suggestion. */
const baseName = (name: string) => name.replace(/\.[^.]+$/, '')

/**
 * Adds assets to the current workspace, one file or many at once. The left column is the catalog's
 * category tree, where the user picks the category the assets go into; the right column takes the
 * files (drag and drop or browse) and the asset's title and description. Continue swipes in a
 * review panel; confirming uploads the files (POST /assets, one per file) and shows the progress.
 */
export function AssetEntryPanel(props: AssetEntryPanelProps) {
  const { current } = useWorkspace()
  // Switching workspace starts over: its catalogs and categories are different.
  return <AssetEntry key={current.id} workspaceId={current.id} workspaceName={current.name} {...props} />
}

interface AssetEntryProps extends AssetEntryPanelProps {
  workspaceId: string
  workspaceName: string
}

function AssetEntry({
  workspaceId,
  workspaceName,
  defaultMode = 'single',
  accept = DEFAULT_ACCEPT,
  maxFileSize,
  maxFiles = 100,
  className,
}: AssetEntryProps) {
  const headingId = useId()
  const reduceMotion = useReducedMotion()
  const nextKey = useRef(1)
  const continueId = `${headingId}-continue`

  const catalogs = useCatalogList(workspaceId)
  const [chosenCatalogId, setChosenCatalogId] = useState<string | null>(null)
  const catalogList = catalogs.data ?? []
  const catalog = catalogList.find((c) => c.id === chosenCatalogId) ?? catalogList[0]
  const categories = useCategoryList(catalog?.id ?? '')
  const records = useMemo(() => (catalog && categories.data ? categories.data : undefined), [catalog, categories.data])
  const tree = useMemo(() => (records ? toTree(records) : undefined), [records])

  // The chosen category, remembered per catalog; until one is chosen, the catalog's default category.
  const [chosenCategory, setChosenCategory] = useState<{ catalogId: string; id: string } | null>(null)
  const categoryId =
    (chosenCategory && chosenCategory.catalogId === catalog?.id && records?.some((r) => r.id === chosenCategory.id)
      ? chosenCategory.id
      : records?.find((r) => r.isDefault)?.id) ?? null

  const [mode, setMode] = useState<AssetEntryMode>(defaultMode)
  const [entries, setEntries] = useState<Entry[]>([])
  const [rejected, setRejected] = useState<RejectedFile[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Tags for every file; they belong to the catalog, so switching catalogs clears them.
  const [tagState, setTagState] = useState<{ catalogId: string; tags: string[] }>({ catalogId: '', tags: [] })
  const tags = tagState.catalogId === catalog?.id ? tagState.tags : []
  const setTags = (next: string[]) => catalog && setTagState({ catalogId: catalog.id, tags: next })
  const [attempted, setAttempted] = useState(false)
  const [stage, setStage] = useState<Stage>('edit')
  const run = useUploadRun()

  // Image preview URLs still in use, released when the panel goes away.
  const liveUrls = useRef(new Set<string>())
  useEffect(() => {
    const urls = liveUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  // Warn before the page is closed while files are waiting or uploading.
  const unsaved = entries.length > 0 || run.running
  useEffect(() => {
    if (!unsaved) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  const makeEntry = (file: File): Entry => {
    const previewUrl = fileKind(file) === 'image' ? URL.createObjectURL(file) : null
    if (previewUrl) liveUrls.current.add(previewUrl)
    return { key: nextKey.current++, file, title: '', previewUrl }
  }

  const release = (list: Entry[]) =>
    list.forEach((e) => {
      if (!e.previewUrl) return
      URL.revokeObjectURL(e.previewUrl)
      liveUrls.current.delete(e.previewUrl)
    })

  const addFiles = (files: File[]) => {
    if (files.length === 0) return
    if (mode === 'single') {
      // The newest acceptable file replaces the current one.
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
    const overflow = accepted.slice(room).map((f) => ({ name: f.name, reason: `limit of ${maxFiles} files reached` }))
    setRejected([...refused, ...overflow])
    setEntries([...entries, ...accepted.slice(0, room).map(makeEntry)])
  }

  const removeEntry = (key: number) => {
    release(entries.filter((e) => e.key === key))
    setEntries(entries.filter((e) => e.key !== key))
    setRejected([])
  }

  const clearFiles = () => {
    release(entries)
    setEntries([])
    setRejected([])
    setAttempted(false)
  }

  const changeMode = (next: AssetEntryMode) => {
    setMode(next)
    setRejected([])
    if (next === 'single' && entries.length > 1) {
      const [first, ...rest] = entries
      release(rest)
      setEntries([first])
      setRejected(rest.map((e) => ({ name: e.file.name, reason: 'removed when switching to single-asset mode' })))
    }
    // A single asset's title moves to its file row in bulk mode, and back.
    if (next === 'bulk' && entries.length === 1 && title.trim()) {
      setEntries([{ ...entries[0], title }])
      setTitle('')
    } else if (next === 'single' && entries[0]?.title.trim()) {
      setTitle(entries[0].title)
    }
  }

  const filesError = attempted && entries.length === 0 ? `Add ${mode === 'single' ? 'a file' : 'at least one file'} to upload.` : undefined
  const categoryError = attempted && !categoryId ? 'Choose the category the assets go into.' : undefined
  const ready = Boolean(catalog && records)

  const onContinue = () => {
    setAttempted(true)
    if (!ready || entries.length === 0 || !categoryId) return
    setStage('review')
  }

  /** The files as they will be sent, with their final titles. */
  const reviewFiles = entries.map((e) => ({ key: e.key, file: e.file, title: mode === 'single' ? title : e.title }))

  const upload = (only?: Set<number>) => {
    if (!catalog || !categoryId) return
    const files = reviewFiles.filter((f) => !only || only.has(f.key)).map((f) => ({ ...f, description }))
    setStage('run')
    void run.start(files, { catalogId: catalog.id, categoryId, tags }).then((results) => {
      // Keep only the files that didn't go in, so they can be retried or changed.
      const uploaded = new Set(results.filter((r) => r.status === 'done').map((r) => r.key))
      if (uploaded.size === 0) return
      setEntries((list) => {
        release(list.filter((e) => uploaded.has(e.key)))
        return list.filter((e) => !uploaded.has(e.key))
      })
    })
  }

  const retry = () => {
    const again = new Set(run.items.filter((i) => i.status !== 'done').map((i) => i.key))
    upload(again)
  }

  const backToEdit = () => {
    setStage('edit')
    if (!run.running) run.reset()
    // Once everything went in, start fresh.
    if (run.items.length > 0 && run.items.every((i) => i.status === 'done')) {
      setTitle('')
      setDescription('')
      setTags([])
      setAttempted(false)
    }
    requestAnimationFrame(() => document.getElementById(continueId)?.focus())
  }

  const count = entries.length
  const totalSize = entries.reduce((sum, e) => sum + e.file.size, 0)
  const overlay = stage !== 'edit'
  const cardClass = ['aep', className].filter(Boolean).join(' ')

  // ---- Catalog states ----
  let notReady: ReactNode = null
  if (catalogs.isError && !catalogs.data) {
    notReady = <ErrorState title="Couldn't load catalogs" message={errorMessage(catalogs.error)} onRetry={() => void catalogs.refetch()} />
  } else if (!catalogs.data) {
    notReady = <LoadingState size="sm" label={workspaceId ? 'Loading catalogs…' : 'Loading workspaces…'} />
  } else if (!catalog) {
    notReady = <p className="aep-help">{workspaceName} has no catalogs yet, so there's nowhere to put assets.</p>
  }

  return (
    <section className={cardClass} aria-labelledby={headingId}>
      <header className="aep-header">
        <div>
          <h2 id={headingId} className="aep-header__title">Add assets</h2>
          <p className="aep-header__subtitle">
            {mode === 'single' ? 'Upload one file as a new asset.' : `Upload up to ${maxFiles} files at once; each becomes its own asset.`}
          </p>
        </div>
        <div className="aep-header__controls">
          {catalogList.length > 1 && catalog && (
            <Select
              className="aep-catalog"
              aria-label="Catalog"
              options={catalogList.map((c) => ({ value: c.id, label: c.name }))}
              value={catalog.id}
              disabled={overlay}
              onChange={(e) => setChosenCatalogId(e.target.value)}
            />
          )}
          <fieldset className="aep-header__mode" disabled={overlay}>
            <SegmentedControl legend="Upload" hideLegend options={MODE_OPTIONS} value={mode} onChange={changeMode} />
          </fieldset>
        </div>
      </header>

      <div className="aep-stage">
        {notReady ? (
          <div className="aep-body aep-body--message">{notReady}</div>
        ) : (
          <div className="aep-body" inert={overlay}>
            {/* ---- Left: where the assets go ---- */}
            <div className={`aep-categories${categoryError ? ' aep-categories--error' : ''}`}>
              <h3 className="aep-column__title" id={`${headingId}-category`}>Category</h3>
              {categories.isError && !categories.data ? (
                <ErrorState
                  size="sm"
                  title="Couldn't load categories"
                  message={errorMessage(categories.error)}
                  onRetry={() => void categories.refetch()}
                />
              ) : (
                <TreeControl
                  nodes={tree}
                  loadingLabel="Loading categories…"
                  label="Category"
                  selectedId={categoryId}
                  onSelect={(node) => catalog && setChosenCategory({ catalogId: catalog.id, id: node.id })}
                  enableSubtreeExpand
                  maxHeight={420}
                  emptyMessage="This catalog has no categories."
                />
              )}
              {categoryError && <p className="aep-message aep-message--error" role="alert">{categoryError}</p>}
              {records && categoryId && (
                <p className="aep-categories__chosen">
                  Goes into <strong>{categoryPath(records, categoryId)}</strong>
                </p>
              )}
            </div>

            {/* ---- Right: files and details ---- */}
            <div className="aep-entry">
              <div className={`aep-files${filesError ? ' aup-files--error' : ''}`}>
                {!(mode === 'single' && count === 1) && (
                  <UploadDropZone
                    multiple={mode === 'bulk'}
                    accept={accept}
                    hint={['Images, video or PDF', maxFileSize !== undefined && `up to ${formatBytes(maxFileSize)} each`].filter(Boolean).join(', ')}
                    onFiles={addFiles}
                  />
                )}
                {filesError && <p className="aep-message aep-message--error" role="alert">{filesError}</p>}

                {rejected.length > 0 && (
                  <div className="aup-rejected" role="status">
                    <p>{rejected.length === 1 ? '1 file was' : `${rejected.length} files were`} not added:</p>
                    <ul>
                      {rejected.map((r, i) => (
                        <li key={`${r.name}-${i}`}><strong>{r.name}</strong> ({r.reason})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {count > 0 && (
                  <>
                    {mode === 'bulk' && (
                      <div className="aup-files__summary">
                        <span>{count} {count === 1 ? 'file' : 'files'} · {formatBytes(totalSize)}</span>
                        <Button variant="ghost" size="sm" onClick={clearFiles}>Remove all</Button>
                      </div>
                    )}
                    <ul className="aup-files__list aep-files__list">
                      {entries.map((entry) => (
                        <UploadFileRow
                          key={entry.key}
                          file={entry.file}
                          previewUrl={entry.previewUrl}
                          title={entry.title}
                          showTitle={mode === 'bulk'}
                          titleMaxLength={ASSET_TITLE_MAX_LENGTH}
                          onTitleChange={(value) =>
                            setEntries((list) => list.map((e) => (e.key === entry.key ? { ...e, title: value } : e)))
                          }
                          onRemove={() => removeEntry(entry.key)}
                        />
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="aep-fields">
                {mode === 'single' && (
                  <TextField
                    label="Title"
                    hint="Leave it empty to use the file name."
                    placeholder={entries[0] ? baseName(entries[0].file.name) : 'e.g. Spring launch hero'}
                    value={title}
                    maxLength={ASSET_TITLE_MAX_LENGTH}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                )}
                <TextArea
                  label={mode === 'single' ? 'Description' : 'Description for every file'}
                  hint={mode === 'bulk' ? 'Give each file its own title in the list above.' : undefined}
                  placeholder="What is it, and where can it be used?"
                  value={description}
                  rows={3}
                  maxLength={ASSET_DESCRIPTION_MAX_LENGTH}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <CatalogTagInput
                  catalogId={catalog?.id}
                  label={mode === 'single' ? 'Tags' : 'Tags for every file'}
                  hint="Pick existing tags or type new ones; press Enter or comma to add."
                  value={tags}
                  onChange={setTags}
                />
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {overlay && catalog && records && categoryId && (
            <motion.div
              key="confirm"
              className="aep-overlay"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={reduceMotion ? { duration: 0 } : { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.38 }}
            >
              <ConfirmPanel
                stage={stage === 'run' ? 'run' : 'review'}
                workspaceName={workspaceName}
                catalogName={catalog.name}
                categoryPath={categoryPath(records, categoryId)}
                files={reviewFiles}
                description={description}
                tags={tags}
                items={run.items}
                running={run.running}
                cancelling={run.cancelling}
                onBack={backToEdit}
                onConfirm={() => upload()}
                onCancelUpload={run.cancel}
                onRetry={retry}
                onDone={backToEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="aep-footer" inert={overlay}>
        <p className="aep-footer__status" aria-live="polite">
          {count === 0 ? 'No files added yet.' : `${count} ${count === 1 ? 'file' : 'files'} ready · ${formatBytes(totalSize)}`}
        </p>
        <div className="aep-footer__actions">
          {count > 0 && mode === 'single' && <Button variant="ghost" onClick={clearFiles}>Clear</Button>}
          <Button id={continueId} disabled={!ready} onClick={onContinue}>Continue</Button>
        </div>
      </footer>
    </section>
  )
}
