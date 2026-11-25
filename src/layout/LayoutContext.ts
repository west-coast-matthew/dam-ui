import { createContext, useContext } from 'react'

export interface LayoutContextValue {
  /** Whether the left menu is collapsed to icons. */
  navCollapsed: boolean
  /** Collapses or expands the left menu (and remembers the choice). */
  setNavCollapsed: (collapsed: boolean) => void
}

export const LayoutContext = createContext<LayoutContextValue | null>(null)

/** The app shell's layout controls. Outside AppLayout (e.g. mockups), returns a no-op version. */
export function useLayout(): LayoutContextValue {
  return useContext(LayoutContext) ?? { navCollapsed: false, setNavCollapsed: () => {} }
}
