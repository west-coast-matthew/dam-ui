import { useEffect, useMemo, useState } from 'react'
import type { CatalogRecord } from '../../services/catalogService'
import { useWorkspace } from '../../workspace/useWorkspace'
import { ErrorState } from '../ErrorState'
import { Button, Select } from '../FormControls'
import { LoadingState } from '../LoadingState'
import {
  appendTreeNode,
  findTreeNode,
  moveTreeNode,
  removeTreeNode,
  TreeControl,
  updateTreeNode,
  type TreeMove,
  type TreeNode,
} from '../TreeControl'
import { CategoryFormModal, type CategoryFields } from './CategoryFormModal'
import { diffTrees, isEmptyChangeSet, nameTaken, newCategoryId, parentIdOf, siblingsOf, summarize, toTree } from './categoryTree'
import { DeleteCategoryModal } from './DeleteCategoryModal'
import { useCatalogList, useCategoryList, useSaveCategories } from './useCategories'
import './CategoryManagementPanel.css'

export interface CategoryManagementPanelProps {
  className?: string
}

interface Notice {
  tone: 'success' | 'warning'
  text: string
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong.')

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/**
 * Shows the categories of one catalog in the current workspace (workspace → catalog → categories)
 * and edits them: add categories (top level or inside another), edit a title and description,
 * rename inline, move by drag and drop, and delete. Any category can hold assets. The catalog's
 * default category can be renamed but not deleted or moved. Edits collect as pending changes and are
 * saved together with Save changes, or thrown away with Cancel changes.
 */
export function CategoryManagementPanel({ className }: CategoryManagementPanelProps) {
  const { current } = useWorkspace()
  // Switching workspace starts over with that workspace's catalogs.
  return <CatalogChooser key={current.id} workspaceId={current.id} workspaceName={current.name} className={className} />
}

interface CatalogChooserProps {
  workspaceId: string
  workspaceName: string
  className?: string
}

function CatalogChooser({ workspaceId, workspaceName, className }: CatalogChooserProps) {
  const catalogs = useCatalogList(workspaceId)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const list = catalogs.data ?? []
  const catalog = list.find((c) => c.id === chosenId) ?? list[0]
  const cardClass = `cm-card${className ? ` ${className}` : ''}`

  if (catalogs.isError && !catalogs.data) {
    return (
      <section className={cardClass} aria-label="Categories">
        <div className="cm-body">
          <ErrorState title="Couldn't load catalogs" message={errorMessage(catalogs.error)} onRetry={() => void catalogs.refetch()} />
        </div>
      </section>
    )
  }
  if (!catalogs.data || !catalog) {
    return (
      <section className={cardClass} aria-label="Categories">
        <div className="cm-body">
          {catalogs.data
            ? <p className="cm-help">{workspaceName} has no catalogs yet, so there are no categories to manage.</p>
            : <LoadingState size="sm" label="Loading catalogs…" />}
        </div>
      </section>
    )
  }
  // Switching catalog starts over with that catalog's categories.
  return <CategoryEditor key={catalog.id} catalog={catalog} catalogs={list} onCatalogChange={setChosenId} className={cardClass} />
}

interface CategoryEditorProps {
  catalog: CatalogRecord
  catalogs: CatalogRecord[]
  onCatalogChange: (id: string) => void
  className: string
}

function CategoryEditor({ catalog, catalogs, onCatalogChange, className }: CategoryEditorProps) {
  const categories = useCategoryList(catalog.id)
  const save = useSaveCategories(catalog.id)
  const saved = useMemo(() => (categories.data ? toTree(categories.data) : undefined), [categories.data])
  /** Pending edits; null when there are none. */
  const [draft, setDraft] = useState<TreeNode[] | null>(null)
  const [adding, setAdding] = useState<{ parent: TreeNode | null } | null>(null)
  const [editing, setEditing] = useState<TreeNode | null>(null)
  const [deleting, setDeleting] = useState<TreeNode | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const tree = draft ?? saved
  const changes = useMemo(() => (saved && draft ? diffTrees(saved, draft) : null), [saved, draft])
  const dirty = changes !== null && !isEmptyChangeSet(changes)
  const busy = save.isPending

  // Warn before the page is closed or reloaded with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const edit = (next: TreeNode[]) => {
    setDraft(next)
    setNotice(null)
    save.reset()
  }

  /** Whether another node at the same level as `node` already has the name. */
  const clashes = (node: TreeNode, name: string) =>
    !!tree && nameTaken(siblingsOf(tree, parentIdOf(tree, node.id) ?? null), name, node.id)

  const onLabelEdit = (node: TreeNode, label: string) => {
    if (!tree) return
    if (clashes(node, label)) {
      setNotice({ tone: 'warning', text: `There's already something named '${label}' at that level, so the name wasn't changed.` })
      return
    }
    edit(updateTreeNode(tree, node.id, { label }))
  }

  const onMove = ({ node, target, position }: TreeMove) => {
    if (!tree) return
    const newParentId = position === 'inside' ? target.id : (parentIdOf(tree, target.id) ?? null)
    if (nameTaken(siblingsOf(tree, newParentId), node.label, node.id)) {
      const where = position === 'inside' ? target.label : 'that level'
      setNotice({ tone: 'warning', text: `'${node.label}' wasn't moved: ${where} already has something with that name.` })
      return
    }
    edit(moveTreeNode(tree, node.id, target.id, position))
  }

  const addNode = ({ name, description }: CategoryFields) => {
    if (!tree || !adding) return
    const node: TreeNode = {
      id: newCategoryId(),
      label: name,
      type: 'category',
      count: 0,
      description: description || undefined,
    }
    edit(appendTreeNode(tree, adding.parent?.id ?? null, node))
    setAdding(null)
  }

  const applyEdit = ({ name, description }: CategoryFields) => {
    if (!tree || !editing) return
    edit(updateTreeNode(tree, editing.id, { label: name, description: description || undefined }))
    setEditing(null)
  }

  const deleteCategory = () => {
    if (!tree || !deleting) return
    edit(removeTreeNode(tree, deleting.id))
    setDeleting(null)
  }

  const saveChanges = () => {
    if (!changes || !dirty) return
    save.mutate(changes, {
      onSuccess: () => {
        setDraft(null)
        setNotice({ tone: 'success', text: 'Your category changes were saved.' })
      },
    })
  }

  const cancelChanges = () => {
    setDraft(null)
    save.reset()
    setNotice(null)
  }

  let status: string | undefined
  if (busy) status = 'Saving changes…'
  else if (dirty) status = `Unsaved changes: ${summarize(changes!)}`
  else if (categories.data) {
    const n = categories.data.length
    status = `${n} ${n === 1 ? 'category' : 'categories'} in ${catalog.name}`
  }
  const defaultName = categories.data?.find((c) => c.isDefault)?.name ?? 'the default category'

  return (
    <section className={className} aria-labelledby="cm-title">
      <header className="cm-header">
        <div>
          <h2 id="cm-title" className="cm-header__title">Categories</h2>
          <p className={`cm-header__status${dirty && !busy ? ' cm-header__status--dirty' : ''}`} aria-live="polite">
            {busy && <span className="fc-spinner" aria-hidden="true" />}
            {status}
          </p>
        </div>
        <div className="cm-actions">
          {catalogs.length > 1 && (
            <Select aria-label="Catalog" className="cm-catalog" value={catalog.id} disabled={dirty || busy}
              title={dirty ? 'Save or cancel your changes before switching catalog.' : undefined}
              options={catalogs.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(e) => onCatalogChange(e.target.value)} />
          )}
          <Button variant="ghost" icon={<PlusIcon />} disabled={!tree || busy}
            onClick={() => setAdding({ parent: null })}>
            New category
          </Button>
          <Button variant="secondary" disabled={!dirty || busy} onClick={cancelChanges}>Cancel changes</Button>
          <Button disabled={!dirty} loading={busy} onClick={saveChanges}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </header>

      {notice && (
        <div className={`cm-notice cm-notice--${notice.tone}`} role={notice.tone === 'warning' ? 'alert' : 'status'}>
          <span>{notice.text}</span>
          <button type="button" className="cm-notice__dismiss" aria-label="Dismiss" onClick={() => setNotice(null)}>×</button>
        </div>
      )}
      {save.isError && (
        <p className="cm-error" role="alert">
          Your changes weren't saved: {errorMessage(save.error)} Nothing was changed; your edits are still here.
        </p>
      )}

      <div className="cm-body">
        {categories.isError && !categories.data ? (
          <ErrorState title="Couldn't load categories" message={errorMessage(categories.error)}
            onRetry={() => void categories.refetch()} />
        ) : (
          <>
            <TreeControl
              label={`Categories in ${catalog.name}`}
              nodes={tree}
              loadingLabel="Loading categories…"
              maxHeight="60vh"
              emptyMessage="This catalog has no categories yet. Use New category to add the first one."
              enableSubtreeExpand
              editable={!busy}
              onLabelEdit={onLabelEdit}
              onAdd={(parent) => setAdding({ parent })}
              addTypes={['category']}
              onEdit={setEditing}
              onDelete={setDeleting}
              onMove={onMove}
            />
            {tree && tree.length > 0 && (
              <p className="cm-help">
                Right-click a category to add a category inside it, edit it or delete it. Double-click a name (or press
                F2) to rename it, and drag categories to reorganise them. The number after a name is how many assets
                it holds. {defaultName} is the catalog's default category: assets without a category go there, so it
                can't be deleted or moved.
              </p>
            )}
          </>
        )}
      </div>

      {adding && tree && (
        <CategoryFormModal
          parentName={adding.parent?.label ?? null}
          validateName={(name) =>
            nameTaken(siblingsOf(tree, adding.parent?.id ?? null), name)
              ? `There's already something named '${name.trim()}' here.`
              : undefined}
          onCancel={() => setAdding(null)}
          onSubmit={addNode}
        />
      )}
      {editing && tree && findTreeNode(tree, editing.id) && (
        <CategoryFormModal
          initial={{ name: editing.label, description: editing.description ?? '' }}
          validateName={(name) =>
            clashes(editing, name) ? `There's already something named '${name.trim()}' at this level.` : undefined}
          onCancel={() => setEditing(null)}
          onSubmit={applyEdit}
        />
      )}
      {deleting && (
        <DeleteCategoryModal node={deleting} defaultName={defaultName} onCancel={() => setDeleting(null)} onConfirm={deleteCategory} />
      )}
    </section>
  )
}
