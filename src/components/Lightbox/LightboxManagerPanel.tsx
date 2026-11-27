import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLightbox, useLightboxes } from '../../services/useLightboxes'
import { useWorkspace } from '../../workspace/useWorkspace'
import { plural } from '../AssetExplorerPanel/format'
import { useCatalogList } from '../CategoryManagementPanel/useCategories'
import { ErrorState } from '../ErrorState'
import { Button, Select } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { CartIcon, PlusIcon, SharedIcon } from './icons'
import { LightboxView } from './LightboxView'
import { SaveLightboxModal } from './SaveLightboxModal'
import { useSelection, useSelectionStore } from './selectionStore'
import { SelectionView } from './SelectionView'
import './Lightbox.css'

export interface LightboxManagerPanelProps {
  /** The lightbox shown (from the URL); null shows the current selection. */
  lightboxId: string | null
  className?: string
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

/**
 * Manages the lightboxes of a catalog in the current workspace: the list on the left (with the
 * current selection pinned at the top), the chosen one on the right. The chosen lightbox is in the
 * URL (/lightboxes/:lightboxId) so it can be linked to.
 */
export function LightboxManagerPanel(props: LightboxManagerPanelProps) {
  const { current } = useWorkspace()
  return <Manager key={current.id} workspaceId={current.id} workspaceName={current.name} {...props} />
}

interface ManagerProps extends LightboxManagerPanelProps {
  workspaceId: string
  workspaceName: string
}

function Manager({ workspaceId, workspaceName, lightboxId, className }: ManagerProps) {
  const navigate = useNavigate()
  const catalogs = useCatalogList(workspaceId)
  const chosenCatalogId = useSelectionStore((s) => s.catalogId)
  const setCatalog = useSelectionStore((s) => s.setCatalog)
  const catalogList = catalogs.data ?? []
  const lightbox = useLightbox(lightboxId)
  const [creating, setCreating] = useState(false)

  // The catalog is shared with the asset page's browse panel (and so is its selection).
  const catalog = catalogList.find((c) => c.id === chosenCatalogId) ?? catalogList[0]
  useEffect(() => {
    if (catalog && catalog.id !== chosenCatalogId) setCatalog(catalog.id)
  }, [catalog, chosenCatalogId, setCatalog])

  // A linked lightbox opens in its own catalog, once, when it loads.
  const linkedCatalogId = lightbox.data?.catalogId
  const linkedInWorkspace = catalogList.some((c) => c.id === linkedCatalogId)
  useEffect(() => {
    if (linkedCatalogId && linkedInWorkspace) setCatalog(linkedCatalogId)
  }, [linkedCatalogId, linkedInWorkspace, setCatalog])

  const classes = ['lbx-manager', className].filter(Boolean).join(' ')

  let content
  if (catalogs.isError && !catalogs.data) {
    content = <ErrorState title="Couldn't load catalogs" message={errorMessage(catalogs.error)} onRetry={() => void catalogs.refetch()} />
  } else if (!catalogs.data) {
    content = <LoadingState label="Loading catalogs…" />
  } else if (!catalog) {
    content = <p className="lbx-empty">{workspaceName} has no catalogs yet, so there are no lightboxes.</p>
  } else {
    let detail
    if (!lightboxId) {
      detail = <SelectionView catalogId={catalog.id} />
    } else if (lightbox.isError && !lightbox.data) {
      detail = <ErrorState title="Couldn't load this lightbox" message={errorMessage(lightbox.error)} onRetry={() => void lightbox.refetch()} />
    } else if (!lightbox.data) {
      detail = <LoadingState label="Loading lightbox…" />
    } else if (!linkedInWorkspace) {
      detail = <p className="lbx-empty">This lightbox belongs to a catalog in another workspace. Switch workspace to open it.</p>
    } else if (lightbox.data.catalogId !== catalog.id) {
      detail = <LoadingState label="Opening its catalog…" />
    } else {
      detail = <LightboxView lightbox={lightbox.data} onDeleted={() => navigate('/lightboxes')} />
    }

    content = (
      <div className="lbx-manager__body">
        <LightboxList catalogId={catalog.id} activeId={lightboxId} />
        <div className="lbx-manager__detail">{detail}</div>
      </div>
    )
  }

  return (
    <section className={classes} aria-label="Lightboxes">
      <header className="lbx-manager__titlebar">
        <h2 className="lbx-manager__heading">{catalog ? catalog.name : 'Lightboxes'}</h2>
        <div className="lbx-manager__tools">
          {catalogList.length > 1 && catalog && (
            <Select
              aria-label="Catalog"
              options={catalogList.map((c) => ({ value: c.id, label: c.name }))}
              value={catalog.id}
              onChange={(e) => {
                setCatalog(e.target.value)
                if (lightboxId) navigate('/lightboxes')
              }}
            />
          )}
          <Button size="sm" icon={<PlusIcon />} disabled={!catalog} onClick={() => setCreating(true)}>New lightbox</Button>
        </div>
      </header>
      {content}
      {creating && catalog && (
        <SaveLightboxModal
          catalogId={catalog.id}
          assets={[]}
          fromSelection={false}
          onSaved={(saved) => navigate(`/lightboxes/${saved.id}`)}
          onClose={() => setCreating(false)}
        />
      )}
    </section>
  )
}

/** The catalog's lightboxes, with the current selection pinned at the top. */
function LightboxList({ catalogId, activeId }: { catalogId: string; activeId: string | null }) {
  const lightboxes = useLightboxes(catalogId)
  const selectionCount = useSelection().length

  let rest
  if (lightboxes.isError && !lightboxes.data) {
    rest = <ErrorState size="sm" title="Couldn't load lightboxes" message={errorMessage(lightboxes.error)} onRetry={() => void lightboxes.refetch()} />
  } else if (!lightboxes.data) {
    rest = <LoadingState size="sm" label="Loading lightboxes…" />
  } else if (lightboxes.data.length === 0) {
    rest = <p className="lbx-list__empty">No lightboxes yet. Save the selection as one, or use New lightbox.</p>
  } else {
    rest = (
      <ul className="lbx-list__items">
        {lightboxes.data.map((l) => (
          <li key={l.id}>
            <Link to={`/lightboxes/${l.id}`} className={`lbx-list__link${activeId === l.id ? ' lbx-list__link--on' : ''}`}
              aria-current={activeId === l.id ? 'page' : undefined}>
              <span className="lbx-list__title">{l.title}</span>
              <span className="lbx-list__meta">
                {plural(l.itemCount, 'item', 'items')}
                {l.shared && <span className="lbx-badge"><SharedIcon /> Shared</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <nav className="lbx-list" aria-label="Lightboxes in this catalog">
      <Link to="/lightboxes" className={`lbx-list__link lbx-list__link--pinned${activeId ? '' : ' lbx-list__link--on'}`}
        aria-current={activeId ? undefined : 'page'}>
        <span className="lbx-list__title"><CartIcon /> Current selection</span>
        <span className="lbx-list__meta">{plural(selectionCount, 'asset', 'assets')} · not saved</span>
      </Link>
      <h3 className="lbx-list__heading">
        Lightboxes
        {lightboxes.isFetching && lightboxes.data && <span className="lbx-list__updating"> · Updating…</span>}
      </h3>
      {rest}
    </nav>
  )
}
