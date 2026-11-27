import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { BrowsedAsset } from '../../services/assetBrowseService'
import { useLayout } from '../../layout/LayoutContext'
import { useWorkspace } from '../../workspace/useWorkspace'
import { useCatalogList, useCategoryList } from '../CategoryManagementPanel/useCategories'
import { ErrorState } from '../ErrorState'
import { SelectionButton, useSelectionStore } from '../Lightbox'
import { Select } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { BrowseTab } from './BrowseTab'
import { useBrowseStore } from './browseStore'
import { pathNames } from './categoryPaths'
import { MaximizeIcon, MinimizeIcon, ExpandIcon, RestoreIcon } from './icons'
import { RecentsTab } from './RecentsTab'
import { SearchTab } from './SearchTab'
import './AssetExplorerPanel.css'

export interface AssetExplorerPanelProps {
  title?: string
  className?: string
}

type Tab = 'browse' | 'recents' | 'search'
type WindowState = 'normal' | 'minimized' | 'maximized'

const TABS: { id: Tab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'recents', label: 'Recents' },
  { id: 'search', label: 'Search' },
]

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

/**
 * Browses the current workspace's assets in three tabs: Browse (category tree and the chosen
 * category's assets), Recents (categories this browser viewed assets in) and Search (file name,
 * date added, tags). Results show as a list or a gallery, paged, with a preview modal.
 *
 * The title bar's buttons minimize the panel to its title bar, or maximize it: the left menu
 * collapses (if it was expanded) and the panel fills the window; restoring expands the menu again.
 */
export function AssetExplorerPanel(props: AssetExplorerPanelProps) {
  const { current } = useWorkspace()
  return <AssetExplorer key={current.id} workspaceId={current.id} workspaceName={current.name} {...props} />
}

interface AssetExplorerProps extends AssetExplorerPanelProps {
  workspaceId: string
  workspaceName: string
}

function AssetExplorer({ workspaceId, workspaceName, title = 'Browse assets', className }: AssetExplorerProps) {
  const headingId = useId()
  const tabIds = useId()
  const { navCollapsed, setNavCollapsed } = useLayout()
  const [windowState, setWindowState] = useState<WindowState>('normal')
  /** Whether maximizing collapsed the menu, so restoring should expand it again. */
  const collapsedNavForUs = useRef(false)
  const [tab, setTab] = useState<Tab>('browse')
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ browse: null, recents: null, search: null })

  const catalogs = useCatalogList(workspaceId)
  // The chosen catalog is shared with the selection (and the Lightboxes page): its selection is the one shown.
  const chosenCatalogId = useSelectionStore((s) => s.catalogId)
  const setChosenCatalogId = useSelectionStore((s) => s.setCatalog)
  const catalogList = catalogs.data ?? []
  const catalog = catalogList.find((c) => c.id === chosenCatalogId) ?? catalogList[0]
  useEffect(() => {
    if (catalog && catalog.id !== chosenCatalogId) setChosenCatalogId(catalog.id)
  }, [catalog, chosenCatalogId, setChosenCatalogId])
  const categories = useCategoryList(catalog?.id ?? '')
  const records = catalog ? categories.data : undefined
  const [browseCategory, setBrowseCategory] = useState<{ catalogId: string; id: string } | null>(null)
  const browseCategoryId = browseCategory && browseCategory.catalogId === catalog?.id ? browseCategory.id : null
  const recordView = useBrowseStore((s) => s.recordView)

  // ---- Window state ----
  const maximize = useCallback(() => {
    if (!navCollapsed) {
      setNavCollapsed(true)
      collapsedNavForUs.current = true
    }
    setWindowState('maximized')
  }, [navCollapsed, setNavCollapsed])

  const restore = useCallback(() => {
    if (collapsedNavForUs.current) {
      setNavCollapsed(false)
      collapsedNavForUs.current = false
    }
    setWindowState('normal')
  }, [setNavCollapsed])

  const minimize = () => {
    if (windowState === 'maximized') restore()
    setWindowState('minimized')
  }

  // While maximized: Escape restores and the page behind doesn't scroll.
  useEffect(() => {
    if (windowState !== 'maximized') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      // A preview modal handles its own Escape.
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) restore()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [windowState, restore])

  // Leaving the page while maximized gives the menu back.
  useEffect(() => () => {
    if (collapsedNavForUs.current) setNavCollapsed(false)
  }, [setNavCollapsed])

  // ---- Tabs (arrow keys move between them, as in the ARIA tabs pattern) ----
  const onTabKeyDown = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length
      : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length
      : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null
    if (next === null) return
    e.preventDefault()
    setTab(TABS[next].id)
    tabRefs.current[TABS[next].id]?.focus()
  }

  const viewed = (asset: BrowsedAsset, categoryId?: string) => {
    const id = categoryId ?? asset.categoryIds[0]
    if (!catalog || !id || !records?.some((r) => r.id === id)) return
    recordView({ workspaceId, catalogId: catalog.id, categoryId: id, path: pathNames(records, id) })
  }

  const openInBrowse = (categoryId: string) => {
    if (!catalog) return
    setBrowseCategory({ catalogId: catalog.id, id: categoryId })
    setTab('browse')
    tabRefs.current.browse?.focus()
  }

  // ---- Content ----
  let content
  if (catalogs.isError && !catalogs.data) {
    content = <ErrorState title="Couldn't load catalogs" message={errorMessage(catalogs.error)} onRetry={() => void catalogs.refetch()} />
  } else if (!catalogs.data) {
    content = <LoadingState label={workspaceId ? 'Loading catalogs…' : 'Loading workspaces…'} />
  } else if (!catalog) {
    content = <p className="axp-empty">{workspaceName} has no catalogs yet, so there are no assets to browse.</p>
  } else if (categories.isError && !categories.data) {
    content = <ErrorState title="Couldn't load categories" message={errorMessage(categories.error)} onRetry={() => void categories.refetch()} />
  } else if (tab === 'browse') {
    content = (
      <BrowseTab
        catalogId={catalog.id}
        categories={records}
        categoryId={browseCategoryId}
        onCategoryChange={(id) => setBrowseCategory({ catalogId: catalog.id, id })}
        maximized={windowState === 'maximized'}
        onAssetViewed={viewed}
      />
    )
  } else if (tab === 'recents') {
    content = <RecentsTab workspaceId={workspaceId} catalogId={catalog.id} categories={records} onOpenCategory={openInBrowse} />
  } else {
    content = <SearchTab key={catalog.id} catalogId={catalog.id} categories={records} onAssetViewed={(a) => viewed(a)} />
  }

  const minimized = windowState === 'minimized'
  const maximized = windowState === 'maximized'
  const classes = ['axp', `axp--${windowState}`, className].filter(Boolean).join(' ')

  return (
      <section className={classes} aria-labelledby={headingId} role={maximized ? 'region' : undefined}>
        <header className="axp-titlebar">
          <h2 id={headingId} className="axp-titlebar__title">{title}</h2>
          {!minimized && (
            <div className="axp-tabs" role="tablist" aria-label="Browse modes" onKeyDown={onTabKeyDown}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el }}
                  type="button"
                  role="tab"
                  id={`${tabIds}-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`${tabIds}-panel`}
                  tabIndex={tab === t.id ? 0 : -1}
                  className={`axp-tab${tab === t.id ? ' axp-tab--on' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="axp-titlebar__tools">
            {catalog && <SelectionButton catalogId={catalog.id} />}
            {!minimized && catalogList.length > 1 && catalog && (
              <Select
                className="axp-catalog"
                aria-label="Catalog"
                options={catalogList.map((c) => ({ value: c.id, label: c.name }))}
                value={catalog.id}
                onChange={(e) => setChosenCatalogId(e.target.value)}
              />
            )}
            {minimized ? (
              <button type="button" className="axp-icon-button" aria-label={`Expand ${title}`} title="Expand"
                onClick={() => setWindowState('normal')}>
                <ExpandIcon />
              </button>
            ) : (
              <button type="button" className="axp-icon-button" aria-label={`Minimize ${title}`} title="Minimize" onClick={minimize}>
                <MinimizeIcon />
              </button>
            )}
            {maximized ? (
              <button type="button" className="axp-icon-button" aria-label={`Restore ${title}`} title="Restore (Esc)" onClick={restore}>
                <RestoreIcon />
              </button>
            ) : (
              <button type="button" className="axp-icon-button" aria-label={`Maximize ${title}`} title="Maximize" onClick={maximize}>
                <MaximizeIcon />
              </button>
            )}
          </div>
        </header>

        {!minimized && (
          <div
            id={`${tabIds}-panel`}
            className="axp-body"
            role="tabpanel"
            aria-labelledby={`${tabIds}-${tab}`}
          >
            {content}
          </div>
        )}
      </section>
  )
}
