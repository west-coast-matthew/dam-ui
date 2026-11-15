import { createContext, useContext } from 'react'

export const MenuContext = createContext<{ close: () => void } | null>(null)

export function useMenu() {
  return useContext(MenuContext)
}
