import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { LoadingState } from '../LoadingState'
import {
  allParentIds,
  canBeTopLevel,
  canHaveChildren,
  hasChildren,
  subtreeIds,
  subtreeParentIds,
  typeNoun,
  visibleNodes,
  type VisibleNode,
} from './treeUtils'
import type { TreeDropPosition, TreeMove, TreeNode, TreeNodeType } from './types'
import './TreeControl.css'

export interface TreeControlProps {
  /**
   * The hierarchy to display. The tree never fetches or changes data itself; the parent owns it.
   * Leave it undefined while the data is loading and the tree shows a loading state.
   */
  nodes: TreeNode[] | undefined
  /** Shows the loading state even when `nodes` is set, e.g. during a refetch. */
  loading?: boolean
  loadingLabel?: string
  /** Accessible name for the tree. */
  label?: string
  /** Called when the user selects a node (click, Enter or Space). */
  onSelect?: (node: TreeNode) => void
  /** Called whenever a node is expanded or collapsed, e.g. to load its children on demand. */
  onExpandedChange?: (node: TreeNode, expanded: boolean) => void
  /**
   * Turns on editing. The tree never changes data itself: each edit raises one of the handlers
   * below, and the parent applies it by passing updated `nodes`. Menu wording follows each node's
   * type ("New asset bucket", "Delete category"), and each action appears only if its handler is given.
   */
  editable?: boolean
  /** Inline rename (double-click or F2), with the new label. */
  onLabelEdit?: (node: TreeNode, newLabel: string) => void
  /** Right-click "New category" / "New asset bucket" on a category. */
  onAdd?: (parent: TreeNode, type: TreeNodeType) => void
  /** Which kinds the "New …" menu offers in a typed tree. Defaults to both. */
  addTypes?: TreeNodeType[]
  /** Right-click "Edit …", e.g. to open a form for the node's details. */
  onEdit?: (node: TreeNode) => void
  /** Right-click "Delete …" or the Delete key. Ask for confirmation in the handler. */
  onDelete?: (node: TreeNode) => void
  /**
   * Drag-and-drop before, after or into other nodes. Asset buckets can't take children or sit at the
   * top level, so those drops are refused. moveTreeNode applies a move to plain TreeNode data.
   */
  onMove?: (move: TreeMove) => void
  /** Selected node id when the parent controls selection. */
  selectedId?: string | null
  /** Nodes expanded initially. Overrides the default (top level shown, everything collapsed). */
  defaultExpandedIds?: string[]
  /** Start with every node expanded. Changing it later expands or collapses the whole tree. */
  expandAll?: boolean
  /** Right-clicking a node offers to expand (or collapse) it and all its children. */
  enableSubtreeExpand?: boolean
  /** Maximum height before the tree scrolls, e.g. 320 or '40vh'. Defaults to the parent's height. */
  maxHeight?: number | string
  /** Shown when `nodes` is empty. */
  emptyMessage?: string
  className?: string
}

interface MenuItem {
  key: string
  label: string
  danger?: boolean
  /** The action opens a dialog, which takes focus, so the menu doesn't hand focus back to the row. */
  opensDialog?: boolean
  /** Starts a new group, drawn with a divider above it. */
  group: number
  run: () => void
}

interface ContextMenuState {
  node: TreeNode
  x: number
  y: number
}

interface TooltipState {
  text: string
  x: number
  y: number
}

interface DragState {
  node: TreeNode
  /** The dragged node and its descendants, which it can't be dropped on. */
  blocked: Set<string>
}

interface DropTarget {
  id: string
  position: TreeDropPosition
}

/** How long a drag must rest over a collapsed node before it opens. */
const DRAG_EXPAND_DELAY_MS = 600

const initialExpanded = (nodes: TreeNode[], expandAll: boolean, defaults?: string[]) =>
  new Set(expandAll ? allParentIds(nodes) : (defaults ?? []))

/**
 * Hierarchical list of categories and asset buckets (or untyped nodes) with expand/collapse,
 * selection and, when editable, inline renaming, right-click actions and drag-and-drop.
 */
export function TreeControl({
  nodes,
  loading = false,
  loadingLabel = 'Loading…',
  label = 'Tree',
  onSelect,
  onExpandedChange,
  editable = false,
  onLabelEdit: onLabelEditProp,
  onAdd: onAddProp,
  addTypes = ['category', 'assetBucket'],
  onEdit: onEditProp,
  onDelete: onDeleteProp,
  onMove: onMoveProp,
  selectedId: controlledSelectedId,
  defaultExpandedIds,
  expandAll = false,
  enableSubtreeExpand = false,
  maxHeight,
  emptyMessage = 'Nothing to show.',
  className,
}: TreeControlProps) {
  const [expanded, setExpanded] = useState(() => initialExpanded(nodes ?? [], expandAll, defaultExpandedIds))
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const treeRef = useRef<HTMLUListElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dragExpandTimer = useRef<{ id: string; timer: number } | null>(null)

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  // Edit handlers only count while the tree is editable.
  const onLabelEdit = editable ? onLabelEditProp : undefined
  const onAdd = editable ? onAddProp : undefined
  const onEdit = editable ? onEditProp : undefined
  const onDelete = editable ? onDeleteProp : undefined
  const onMove = editable ? onMoveProp : undefined
  const renamable = onLabelEdit !== undefined
  const draggable = onMove !== undefined
  const isLoading = loading || nodes === undefined

  // Toggling `expandAll` after mount expands or collapses everything. Data that arrives after mount
  // (e.g. from a query) gets the same treatment. Both adjust state during render rather than in an effect.
  const [prevExpandAll, setPrevExpandAll] = useState(expandAll)
  const [hadNodes, setHadNodes] = useState(nodes !== undefined)
  if (expandAll !== prevExpandAll) {
    setPrevExpandAll(expandAll)
    setExpanded(new Set(expandAll ? allParentIds(nodes ?? []) : []))
  }
  if (!hadNodes && nodes !== undefined) {
    setHadNodes(true)
    if (expandAll) setExpanded(new Set(allParentIds(nodes)))
  }

  const rows = useMemo(() => visibleNodes(nodes ?? [], expanded), [nodes, expanded])

  // Keep one row tabbable: the focused one, else the selected one, else the first.
  const tabStopId =
    rows.find((r) => r.node.id === focusedId)?.node.id ??
    rows.find((r) => r.node.id === selectedId)?.node.id ??
    rows[0]?.node.id

  const focusRow = (id: string) => {
    setFocusedId(id)
    treeRef.current?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`)?.focus()
  }

  const setNodeExpanded = (node: TreeNode, value: boolean) => {
    if (!hasChildren(node) || expanded.has(node.id) === value) return
    setExpanded((prev) => {
      const next = new Set(prev)
      if (value) next.add(node.id)
      else next.delete(node.id)
      return next
    })
    onExpandedChange?.(node, value)
  }

  /** Marks a node open even if it has no children yet, so a child added later shows straight away. */
  const markExpanded = (id: string) => setExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

  const setSubtreeExpanded = (node: TreeNode, value: boolean) => {
    const ids = subtreeParentIds(node)
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (value) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const select = (node: TreeNode) => {
    setInternalSelectedId(node.id)
    setFocusedId(node.id)
    onSelect?.(node)
  }

  const commitEdit = (node: TreeNode, value: string) => {
    setEditingId(null)
    const trimmed = value.trim()
    if (trimmed && trimmed !== node.label) onLabelEdit?.(node, trimmed)
    focusRow(node.id)
  }

  const cancelEdit = (node: TreeNode) => {
    setEditingId(null)
    focusRow(node.id)
  }

  // ---- Context menu ----

  const menuItems = (node: TreeNode): MenuItem[] => {
    const items: MenuItem[] = []
    if (enableSubtreeExpand && hasChildren(node)) {
      items.push(
        { key: 'expand', label: 'Expand all below', group: 0, run: () => setSubtreeExpanded(node, true) },
        { key: 'collapse', label: 'Collapse all below', group: 0, run: () => setSubtreeExpanded(node, false) },
      )
    }
    if (onAdd && canHaveChildren(node)) {
      const add = (type: TreeNodeType) => () => {
        markExpanded(node.id)
        onAdd(node, type)
      }
      // Typed trees offer both kinds; an untyped tree just adds an untyped child.
      if (node.type) {
        if (addTypes.includes('category')) {
          items.push({ key: 'add-category', label: 'New category', group: 1, opensDialog: true, run: add('category') })
        }
        if (addTypes.includes('assetBucket')) {
          items.push({ key: 'add-bucket', label: 'New asset bucket', group: 1, opensDialog: true, run: add('assetBucket') })
        }
      } else {
        items.push({ key: 'add', label: 'New item', group: 1, opensDialog: true, run: add('category') })
      }
    }
    const noun = typeNoun(node.type)
    if (onEdit) items.push({ key: 'edit', label: `Edit ${noun}`, group: 2, opensDialog: true, run: () => onEdit(node) })
    if (onDelete && !node.locked) {
      items.push({ key: 'delete', label: `Delete ${noun}`, danger: true, group: 3, opensDialog: true, run: () => onDelete(node) })
    }
    return items
  }

  // Close the context menu on outside click, scroll or resize.
  useEffect(() => {
    if (!menu) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const close = () => setMenu(null)
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  const openMenu = (node: TreeNode, x: number, y: number) => {
    setTooltip(null)
    setFocusedId(node.id)
    setMenu({ node, x, y })
  }

  const closeMenu = (node: TreeNode, returnFocus = true) => {
    setMenu(null)
    if (returnFocus) focusRow(node.id)
  }

  const onRowContextMenu = (e: MouseEvent, node: TreeNode) => {
    if (menuItems(node).length === 0) return
    e.preventDefault()
    openMenu(node, e.clientX, e.clientY)
  }

  const openFromKeyboard = (rowEl: HTMLElement, node: TreeNode) => {
    if (menuItems(node).length === 0) return false
    const content = rowEl.querySelector('.tree__row') ?? rowEl
    const rect = content.getBoundingClientRect()
    openMenu(node, rect.left + 24, rect.bottom)
    return true
  }

  // ---- Keyboard ----

  const onRowKeyDown = (e: KeyboardEvent, row: VisibleNode, index: number) => {
    const { node } = row
    if (editingId === node.id || e.target !== e.currentTarget) return
    const isOpen = expanded.has(node.id) && hasChildren(node)
    switch (e.key) {
      case 'ArrowDown':
        if (rows[index + 1]) focusRow(rows[index + 1].node.id)
        break
      case 'ArrowUp':
        if (rows[index - 1]) focusRow(rows[index - 1].node.id)
        break
      case 'Home':
        if (rows[0]) focusRow(rows[0].node.id)
        break
      case 'End':
        if (rows.length) focusRow(rows[rows.length - 1].node.id)
        break
      case 'ArrowRight':
        if (hasChildren(node) && !isOpen) setNodeExpanded(node, true)
        else if (isOpen) focusRow(node.children![0].id)
        break
      case 'ArrowLeft':
        if (isOpen) setNodeExpanded(node, false)
        else if (row.parentId) focusRow(row.parentId)
        break
      case 'Enter':
      case ' ':
        select(node)
        break
      case 'F2':
        if (!renamable) return
        setEditingId(node.id)
        break
      case 'Delete':
        if (!onDelete || node.locked) return
        onDelete(node)
        break
      case '*':
        if (!enableSubtreeExpand) return
        setSubtreeExpanded(node, true)
        break
      case 'ContextMenu':
        if (!openFromKeyboard(e.currentTarget as HTMLElement, node)) return
        break
      case 'F10':
        if (!e.shiftKey || !openFromKeyboard(e.currentTarget as HTMLElement, node)) return
        break
      default:
        return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  // ---- Drag and drop ----

  const clearDragExpand = () => {
    if (dragExpandTimer.current) window.clearTimeout(dragExpandTimer.current.timer)
    dragExpandTimer.current = null
  }

  const endDrag = () => {
    clearDragExpand()
    setDrag(null)
    setDropTarget(null)
  }

  const onDragStart = (e: DragEvent, node: TreeNode) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.label)
    setTooltip(null)
    setMenu(null)
    setDrag({ node, blocked: subtreeIds(node) })
  }

  const dropPosition = (e: DragEvent, target: TreeNode): TreeDropPosition => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const ratio = (e.clientY - rect.top) / rect.height
    // Nothing goes inside an asset bucket, so its row splits into before/after halves.
    if (!canHaveChildren(target)) return ratio < 0.5 ? 'before' : 'after'
    if (ratio < 0.25) return 'before'
    // The bottom edge of an open parent sits right above its first child, so treat it as "inside".
    if (ratio > 0.75 && !(hasChildren(target) && expanded.has(target.id))) return 'after'
    return 'inside'
  }

  const onDragOver = (e: DragEvent, row: VisibleNode) => {
    const target = row.node
    if (!drag || drag.blocked.has(target.id)) return
    const position = dropPosition(e, target)
    // Before/after a top-level node makes the dragged node top-level, which asset buckets can't be.
    if (position !== 'inside' && row.parentId === null && !canBeTopLevel(drag.node)) {
      if (dropTarget?.id === target.id) setDropTarget(null)
      return
    }
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dropTarget?.id !== target.id || dropTarget.position !== position) setDropTarget({ id: target.id, position })

    // Rest on a collapsed parent to open it.
    if (position === 'inside' && hasChildren(target) && !expanded.has(target.id)) {
      if (dragExpandTimer.current?.id !== target.id) {
        clearDragExpand()
        dragExpandTimer.current = {
          id: target.id,
          timer: window.setTimeout(() => setNodeExpanded(target, true), DRAG_EXPAND_DELAY_MS),
        }
      }
    } else {
      clearDragExpand()
    }
  }

  const onDrop = (e: DragEvent, target: TreeNode) => {
    e.preventDefault()
    if (drag && dropTarget && dropTarget.id === target.id && !drag.blocked.has(target.id)) {
      if (dropTarget.position === 'inside') markExpanded(target.id)
      onMove?.({ node: drag.node, target, position: dropTarget.position })
    }
    endDrag()
  }

  useEffect(() => clearDragExpand, [])

  // ---- Rendering ----

  const showTooltip = (e: MouseEvent, node: TreeNode) => {
    if (!node.description || menu || drag || editingId === node.id) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ text: node.description, x: rect.left + 28, y: rect.bottom + 4 })
  }

  const describedBy = (node: TreeNode) => (node.description ? `tree-desc-${node.id}` : undefined)

  const renderRow = (row: VisibleNode, index: number) => {
    const { node, level } = row
    const parent = hasChildren(node)
    const isOpen = parent && expanded.has(node.id)
    const isSelected = node.id === selectedId
    const isEditing = node.id === editingId
    const drop = dropTarget?.id === node.id ? dropTarget.position : null
    const rowClass = [
      'tree__row',
      isSelected && 'tree__row--selected',
      drag?.blocked.has(node.id) && 'tree__row--dragging',
      drop && `tree__row--drop-${drop}`,
    ].filter(Boolean).join(' ')

    return (
      <li
        key={node.id}
        role="treeitem"
        data-node-id={node.id}
        aria-level={level}
        aria-posinset={row.posInSet}
        aria-setsize={row.setSize}
        aria-expanded={parent ? isOpen : undefined}
        aria-selected={isSelected}
        aria-describedby={describedBy(node)}
        tabIndex={node.id === tabStopId ? 0 : -1}
        className="tree__item"
        draggable={draggable && !isEditing && !node.locked}
        onDragStart={draggable && !node.locked ? (e) => onDragStart(e, node) : undefined}
        onDragEnd={draggable ? endDrag : undefined}
        onKeyDown={(e) => onRowKeyDown(e, row, index)}
        onFocus={(e) => {
          if (e.target === e.currentTarget) setFocusedId(node.id)
        }}
      >
        <div
          className={rowClass}
          style={{ paddingLeft: 8 + (level - 1) * 20 }}
          onClick={() => !isEditing && select(node)}
          onDoubleClick={() => renamable && !isEditing && setEditingId(node.id)}
          onContextMenu={(e) => onRowContextMenu(e, node)}
          onMouseEnter={(e) => showTooltip(e, node)}
          onMouseLeave={() => setTooltip(null)}
          onDragOver={draggable ? (e) => onDragOver(e, row) : undefined}
          onDrop={draggable ? (e) => onDrop(e, node) : undefined}
        >
          {parent ? (
            <span
              className={`tree__toggle${isOpen ? ' tree__toggle--open' : ''}`}
              aria-hidden="true"
              onClick={(e) => {
                e.stopPropagation()
                setNodeExpanded(node, !isOpen)
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 16 16" width="14" height="14">
                <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : (
            <span className="tree__toggle tree__toggle--leaf" aria-hidden="true" />
          )}
          {node.type && <NodeIcon type={node.type} />}
          {isEditing ? (
            <LabelEditor
              initial={node.label}
              onCommit={(value) => commitEdit(node, value)}
              onCancel={() => cancelEdit(node)}
            />
          ) : (
            <span className="tree__label">{node.label}</span>
          )}
          {(node.type === 'assetBucket' || node.count !== undefined) && !isEditing && (
            <>
              <span className="tree__count" aria-hidden="true">({node.count ?? 0})</span>
              <span className="tree__sr-only">
                {node.type === 'assetBucket' && ', asset bucket'}, {node.count ?? 0} {node.count === 1 ? 'asset' : 'assets'}
              </span>
            </>
          )}
          {node.description && (
            <span id={describedBy(node)} className="tree__sr-only">
              {node.description}
            </span>
          )}
        </div>
      </li>
    )
  }

  const items = menu ? menuItems(menu.node) : []

  let body
  if (isLoading) {
    body = <LoadingState label={loadingLabel} size="sm" className="tree__loading" />
  } else if (rows.length === 0) {
    body = <p className="tree__empty">{emptyMessage}</p>
  } else {
    body = (
      // A flat list keeps keyboard handling and scrolling simple; aria-level conveys the nesting.
      <ul ref={treeRef} role="tree" aria-label={label} className="tree__list">
        {rows.map(renderRow)}
      </ul>
    )
  }

  return (
    <div className={`tree${className ? ` ${className}` : ''}`} style={{ maxHeight }} aria-busy={isLoading}>
      {body}

      {tooltip && (
        <div className="tree__tooltip" role="presentation" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      {menu && items.length > 0 && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Actions for ${menu.node.label}`}
          className="tree__menu"
          style={{ left: menu.x, top: menu.y }}
          onKeyDown={(e) => {
            const all = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
            const i = all.indexOf(document.activeElement as HTMLElement)
            if (e.key === 'ArrowDown') all[(i + 1) % all.length]?.focus()
            else if (e.key === 'ArrowUp') all[(i - 1 + all.length) % all.length]?.focus()
            else if (e.key === 'Escape' || e.key === 'Tab') closeMenu(menu.node)
            else return
            e.preventDefault()
          }}
        >
          {items.map((item, i) => (
            <Fragment key={item.key}>
              {i > 0 && items[i - 1].group !== item.group && <div className="tree__menu-divider" role="separator" />}
              <button
                type="button"
                role="menuitem"
                className={`tree__menu-item${item.danger ? ' tree__menu-item--danger' : ''}`}
                onClick={() => {
                  closeMenu(menu.node, !item.opensDialog)
                  item.run()
                }}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

/** Folder for a category, a box-shaped bucket for an asset bucket. */
function NodeIcon({ type }: { type: TreeNodeType }) {
  return (
    <span className={`tree__icon tree__icon--${type}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        {type === 'category' ? (
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        ) : (
          <>
            <path d="M4 7h16l-1.5 12a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8z" />
            <path d="M3 7h18M9 11h6" />
          </>
        )}
      </svg>
    </span>
  )
}

interface LabelEditorProps {
  initial: string
  onCommit: (value: string) => void
  onCancel: () => void
}

function LabelEditor({ initial, onCommit, onCancel }: LabelEditorProps) {
  const [value, setValue] = useState(initial)
  const done = useRef(false)

  const finish = (commit: boolean) => {
    if (done.current) return
    done.current = true
    if (commit) onCommit(value)
    else onCancel()
  }

  return (
    <input
      className="tree__input"
      aria-label="Node label"
      value={value}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') finish(true)
        else if (e.key === 'Escape') finish(false)
      }}
      onBlur={() => finish(true)}
    />
  )
}
