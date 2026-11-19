import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { allParentIds, hasChildren, subtreeParentIds, visibleNodes, type VisibleNode } from './treeUtils'
import type { TreeNode } from './types'
import './TreeControl.css'

export interface TreeControlProps {
  /** The hierarchy to display. The tree never fetches or changes data itself; the parent owns it. */
  nodes: TreeNode[]
  /** Accessible name for the tree. */
  label?: string
  /** Called when the user selects a node (click, Enter or Space). */
  onSelect?: (node: TreeNode) => void
  /**
   * Called with the new label after an inline edit. When present, labels can be edited
   * (double-click or F2); the parent applies the change by passing updated `nodes`.
   */
  onLabelEdit?: (node: TreeNode, newLabel: string) => void
  /** Called whenever a node is expanded or collapsed, e.g. to load its children on demand. */
  onExpandedChange?: (node: TreeNode, expanded: boolean) => void
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

const initialExpanded = (nodes: TreeNode[], expandAll: boolean, defaults?: string[]) =>
  new Set(expandAll ? allParentIds(nodes) : (defaults ?? []))

/** Hierarchical list with expand/collapse, selection, optional inline label editing and a subtree context menu. */
export function TreeControl({
  nodes,
  label = 'Tree',
  onSelect,
  onLabelEdit,
  onExpandedChange,
  selectedId: controlledSelectedId,
  defaultExpandedIds,
  expandAll = false,
  enableSubtreeExpand = false,
  maxHeight,
  emptyMessage = 'Nothing to show.',
  className,
}: TreeControlProps) {
  const [expanded, setExpanded] = useState(() => initialExpanded(nodes, expandAll, defaultExpandedIds))
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const treeRef = useRef<HTMLUListElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  const nodesRef = useRef(nodes)
  useEffect(() => {
    nodesRef.current = nodes
  })

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  const editable = onLabelEdit !== undefined

  // Toggling `expandAll` after mount expands or collapses everything.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // Keyed on the flag only (nodes come from a ref), so new data doesn't reset the user's expansion.
    setExpanded(new Set(expandAll ? allParentIds(nodesRef.current) : []))
  }, [expandAll])

  const rows = useMemo(() => visibleNodes(nodes, expanded), [nodes, expanded])

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

  // Close the context menu on outside click, Escape, scroll or resize.
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
    if (!enableSubtreeExpand || !hasChildren(node)) return
    setTooltip(null)
    setFocusedId(node.id)
    setMenu({ node, x, y })
  }

  const closeMenu = (node: TreeNode) => {
    setMenu(null)
    focusRow(node.id)
  }

  const onRowContextMenu = (e: MouseEvent, node: TreeNode) => {
    if (!enableSubtreeExpand || !hasChildren(node)) return
    e.preventDefault()
    openMenu(node, e.clientX, e.clientY)
  }

  const onRowKeyDown = (e: KeyboardEvent, row: VisibleNode, index: number) => {
    const { node } = row
    if (editingId === node.id) return
    const isOpen = expanded.has(node.id)
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
        if (!editable) return
        setEditingId(node.id)
        break
      case '*':
        if (!enableSubtreeExpand) return
        setSubtreeExpanded(node, true)
        break
      case 'ContextMenu':
        if (!enableSubtreeExpand || !hasChildren(node)) return
        openFromKeyboard(e.currentTarget as HTMLElement, node)
        break
      case 'F10':
        if (!e.shiftKey || !enableSubtreeExpand || !hasChildren(node)) return
        openFromKeyboard(e.currentTarget as HTMLElement, node)
        break
      default:
        return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  const openFromKeyboard = (rowEl: HTMLElement, node: TreeNode) => {
    const content = rowEl.querySelector('.tree__row') ?? rowEl
    const rect = content.getBoundingClientRect()
    openMenu(node, rect.left + 24, rect.bottom)
  }

  const showTooltip = (e: MouseEvent, node: TreeNode) => {
    if (!node.description || menu || editingId === node.id) return
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
        onKeyDown={(e) => onRowKeyDown(e, row, index)}
        onFocus={(e) => {
          if (e.target === e.currentTarget) setFocusedId(node.id)
        }}
      >
        <div
          className={`tree__row${isSelected ? ' tree__row--selected' : ''}`}
          style={{ paddingLeft: 8 + (level - 1) * 20 }}
          onClick={() => !isEditing && select(node)}
          onDoubleClick={() => editable && !isEditing && setEditingId(node.id)}
          onContextMenu={(e) => onRowContextMenu(e, node)}
          onMouseEnter={(e) => showTooltip(e, node)}
          onMouseLeave={() => setTooltip(null)}
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
          {isEditing ? (
            <LabelEditor
              initial={node.label}
              onCommit={(value) => commitEdit(node, value)}
              onCancel={() => cancelEdit(node)}
            />
          ) : (
            <span className="tree__label">{node.label}</span>
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

  return (
    <div className={`tree${className ? ` ${className}` : ''}`} style={{ maxHeight }}>
      {nodes.length === 0 ? (
        <p className="tree__empty">{emptyMessage}</p>
      ) : (
        // A flat list keeps keyboard handling and scrolling simple; aria-level conveys the nesting.
        <ul ref={treeRef} role="tree" aria-label={label} className="tree__list">
          {rows.map(renderRow)}
        </ul>
      )}

      {tooltip && (
        <div className="tree__tooltip" role="presentation" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Actions for ${menu.node.label}`}
          className="tree__menu"
          style={{ left: menu.x, top: menu.y }}
          onKeyDown={(e) => {
            const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
            const i = items.indexOf(document.activeElement as HTMLElement)
            if (e.key === 'ArrowDown') items[(i + 1) % items.length]?.focus()
            else if (e.key === 'ArrowUp') items[(i - 1 + items.length) % items.length]?.focus()
            else if (e.key === 'Escape' || e.key === 'Tab') closeMenu(menu.node)
            else return
            e.preventDefault()
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="tree__menu-item"
            onClick={() => {
              setSubtreeExpanded(menu.node, true)
              closeMenu(menu.node)
            }}
          >
            Expand all below
          </button>
          <button
            type="button"
            role="menuitem"
            className="tree__menu-item"
            onClick={() => {
              setSubtreeExpanded(menu.node, false)
              closeMenu(menu.node)
            }}
          >
            Collapse all below
          </button>
        </div>
      )}
    </div>
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
