import { Children, isValidElement, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { PanelGridContext, type PanelGridContextValue } from './PanelGridContext'
import { swapIds } from './reorder'

interface PanelGridProps {
  children: ReactNode
  /** Current panel order (panel ids). Needed only when some panels are draggable. */
  order?: readonly string[]
  /** Called with the new order after the user repositions a draggable panel. */
  onReorder?: (order: string[]) => void
}

/**
 * Responsive grid for Panels. A panel's `columns` sets how many panels share a row
 * (1 = full width, 2 = half, 3 = third); narrower screens fall back to fewer per row.
 *
 * Draggable panels can be repositioned by swapping places with another draggable panel.
 * Panels that aren't draggable keep their assigned position.
 */
export function PanelGrid({ children, order = [], onReorder }: PanelGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const draggableIds = useMemo(() => {
    const ids = new Set<string>()
    Children.forEach(children, (child) => {
      if (isValidElement<{ id?: string; draggable?: boolean }>(child) && child.props.draggable && child.props.id) {
        ids.add(child.props.id)
      }
    })
    return ids
  }, [children])

  const value = useMemo<PanelGridContextValue>(() => {
    const isDraggable = (id: string) => draggableIds.has(id)
    return {
      draggingId,
      isDraggable,
      startDrag: setDraggingId,
      endDrag: () => setDraggingId(null),
      dropOn: (targetId) => {
        if (draggingId && isDraggable(targetId)) onReorder?.(swapIds(order, draggingId, targetId))
        setDraggingId(null)
      },
      moveBy: (id, delta) => {
        const start = order.indexOf(id)
        if (start === -1) return
        for (let i = start + delta; i >= 0 && i < order.length; i += delta) {
          if (isDraggable(order[i])) {
            onReorder?.(swapIds(order, id, order[i]))
            return
          }
        }
      },
    }
  }, [draggingId, draggableIds, order, onReorder])

  return (
    <PanelGridContext.Provider value={value}>
      <div className="panel-grid">
        {/* toArray gives every child a stable key, which AnimatePresence requires. */}
        <AnimatePresence initial={false}>{Children.toArray(children)}</AnimatePresence>
      </div>
    </PanelGridContext.Provider>
  )
}
