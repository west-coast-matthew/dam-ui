import { createContext, useContext } from 'react'

export interface PanelGridContextValue {
  /** Id of the panel currently being dragged, if any. */
  draggingId: string | null
  startDrag: (id: string) => void
  endDrag: () => void
  /** Swap the dragged panel with the target panel. */
  dropOn: (targetId: string) => void
  /** Swap a panel with the nearest draggable panel before (-1) or after (+1) it. */
  moveBy: (id: string, delta: -1 | 1) => void
  isDraggable: (id: string) => boolean
}

export const PanelGridContext = createContext<PanelGridContextValue | null>(null)

export function usePanelGrid() {
  return useContext(PanelGridContext)
}
