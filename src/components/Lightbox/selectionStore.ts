import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { BrowsedAsset } from '../../services/assetBrowseService'

const EMPTY: BrowsedAsset[] = []

interface SelectionState {
  /** The catalog being browsed; its selection is the one shown and used. */
  catalogId: string | null
  /** Selected assets per catalog, as snapshots, in the order they were added. */
  byCatalog: Record<string, BrowsedAsset[]>
  setCatalog: (catalogId: string) => void
  /** Adds to the asset's own catalog's selection. */
  add: (asset: BrowsedAsset) => void
  addMany: (assets: BrowsedAsset[]) => void
  remove: (assetId: string) => void
  removeMany: (assetIds: string[]) => void
  toggle: (asset: BrowsedAsset) => void
  /** Moves an asset `delta` places earlier (negative) or later in the current selection. */
  move: (assetId: string, delta: number) => void
  clear: () => void
  has: (assetId: string) => boolean
}

const current = (s: Pick<SelectionState, 'catalogId' | 'byCatalog'>) => (s.catalogId ? s.byCatalog[s.catalogId] ?? EMPTY : EMPTY)

/**
 * The selection set ("cart"): assets picked while browsing, kept per catalog in localStorage
 * (zustand persist), so it survives a reload. It can be downloaded, browsed as a slideshow or saved
 * as a lightbox.
 */
export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => {
      const update = (catalogId: string | null, fn: (items: BrowsedAsset[]) => BrowsedAsset[]) => {
        if (!catalogId) return
        set((s) => ({ byCatalog: { ...s.byCatalog, [catalogId]: fn(s.byCatalog[catalogId] ?? EMPTY) } }))
      }
      const addAll = (assets: BrowsedAsset[]) => {
        for (const catalogId of new Set(assets.map((a) => a.catalogId))) {
          update(catalogId, (items) => {
            const ids = new Set(items.map((a) => a.id))
            const added = assets.filter((a) => a.catalogId === catalogId && !ids.has(a.id) && Boolean(ids.add(a.id)))
            return added.length ? [...items, ...added] : items
          })
        }
      }
      return {
        catalogId: null,
        byCatalog: {},
        setCatalog: (catalogId) => set({ catalogId }),
        add: (asset) => addAll([asset]),
        addMany: addAll,
        remove: (assetId) => update(get().catalogId, (items) => items.filter((a) => a.id !== assetId)),
        removeMany: (assetIds) => {
          const ids = new Set(assetIds)
          update(get().catalogId, (items) => items.filter((a) => !ids.has(a.id)))
        },
        toggle: (asset) => {
          const own = get().byCatalog[asset.catalogId] ?? EMPTY
          if (own.some((a) => a.id === asset.id)) update(asset.catalogId, (items) => items.filter((a) => a.id !== asset.id))
          else addAll([asset])
        },
        move: (assetId, delta) =>
          update(get().catalogId, (items) => {
            const from = items.findIndex((a) => a.id === assetId)
            const to = Math.min(items.length - 1, Math.max(0, from + delta))
            if (from < 0 || from === to) return items
            const next = [...items]
            next.splice(to, 0, ...next.splice(from, 1))
            return next
          }),
        clear: () => update(get().catalogId, () => EMPTY),
        has: (assetId) => current(get()).some((a) => a.id === assetId),
      }
    },
    {
      name: 'dam-ui.selection',
      version: 1,
      partialize: (s) => ({ catalogId: s.catalogId, byCatalog: s.byCatalog }),
      // localStorage can be missing (private mode); zustand then keeps the state in memory only.
      // Dates come back from JSON as strings.
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => (key === 'createdAt' && typeof value === 'string' ? new Date(value) : value),
      }),
    },
  ),
)

/** The current catalog's selection, in the order added. */
export const useSelection = () => useSelectionStore(current)

/** Whether the asset is in its catalog's selection. */
export const useIsSelected = (asset: BrowsedAsset) =>
  useSelectionStore((s) => (s.byCatalog[asset.catalogId] ?? EMPTY).some((a) => a.id === asset.id))

/** Ids of the current selection, for quick lookups. */
export function selectedIds(items: BrowsedAsset[]): Set<string> {
  return new Set(items.map((a) => a.id))
}
