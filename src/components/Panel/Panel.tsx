import { useId, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePanelGrid } from './PanelGridContext'
import { PanelIcon } from './icons'
import './Panel.css'

export type PanelColumns = 1 | 2 | 3

export interface PanelProps {
  /** Stable id. Required when `draggable` is set, so the grid can track its position. */
  id?: string
  title: string
  subtitle?: string
  /** How many panels share a row: 1 (full width, default), 2 (half) or 3 (third). */
  columns?: PanelColumns
  /** Shows an expand/collapse button in the top right corner. */
  collapsible?: boolean
  defaultCollapsed?: boolean
  /** Shows a delete button in the top right corner; called when it is pressed. */
  onDelete?: () => void
  /** Lets the user reposition the panel inside a PanelGrid (not resize it). */
  draggable?: boolean
  children?: ReactNode
}

export function Panel({
  id,
  title,
  subtitle,
  columns = 1,
  collapsible = false,
  defaultCollapsed = false,
  onDelete,
  draggable = false,
  children,
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed)
  const [armed, setArmed] = useState(false)
  const [dropTarget, setDropTarget] = useState(false)
  const grid = usePanelGrid()
  const bodyId = useId()
  const titleId = useId()

  const canDrag = draggable && !!id && !!grid
  const dragging = canDrag && grid.draggingId === id
  const acceptsDrop = canDrag && grid.draggingId !== null && grid.draggingId !== id

  const onDragStart = (event: DragEvent) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id!)
    grid?.startDrag(id!)
  }
  const onDragEnd = () => {
    setArmed(false)
    setDropTarget(false)
    grid?.endDrag()
  }
  const onDragOver = (event: DragEvent) => {
    if (!acceptsDrop) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget(true)
  }
  const onDrop = (event: DragEvent) => {
    if (!acceptsDrop) return
    event.preventDefault()
    setDropTarget(false)
    grid.dropOn(id!)
  }
  const onHandleKey = (event: KeyboardEvent) => {
    if (!canDrag) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') grid.moveBy(id!, -1)
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') grid.moveBy(id!, 1)
    else return
    event.preventDefault()
  }

  const className = [
    'panel',
    `panel--cols-${columns}`,
    canDrag && 'panel--draggable',
    dragging && 'panel--dragging',
    dropTarget && 'panel--drop-target',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      className={className}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <section
        className="panel__card"
        aria-labelledby={titleId}
        draggable={canDrag && armed}
        onDragStart={canDrag ? onDragStart : undefined}
        onDragEnd={canDrag ? onDragEnd : undefined}
        onDragOver={onDragOver}
        onDragLeave={() => setDropTarget(false)}
        onDrop={onDrop}
      >
        <header className="panel__header">
          {canDrag && (
            <button
              type="button"
              className="panel__icon-button panel__handle"
              aria-label={`Move ${title}. Use arrow keys to reposition.`}
              title="Drag to reposition"
              onPointerDown={() => setArmed(true)}
              onPointerUp={() => setArmed(false)}
              onKeyDown={onHandleKey}
            >
              <PanelIcon name="grip" />
            </button>
          )}
          <div className="panel__titles">
            <h3 id={titleId} className="panel__title">{title}</h3>
            {subtitle && <p className="panel__subtitle">{subtitle}</p>}
          </div>
          {(collapsible || onDelete) && (
            <div className="panel__actions">
              {collapsible && (
                <button
                  type="button"
                  className="panel__icon-button panel__toggle"
                  aria-expanded={!collapsed}
                  aria-controls={bodyId}
                  aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
                  title={collapsed ? 'Expand' : 'Collapse'}
                  onClick={() => setCollapsed((c) => !c)}
                >
                  <PanelIcon name="chevron" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="panel__icon-button panel__delete"
                  aria-label={`Delete ${title}`}
                  title="Delete"
                  onClick={onDelete}
                >
                  <PanelIcon name="close" />
                </button>
              )}
            </div>
          )}
        </header>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              id={bodyId}
              className="panel__body-wrap"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="panel__body">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  )
}
