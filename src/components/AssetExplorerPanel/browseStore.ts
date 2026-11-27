import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT, type AssetSort } from '../../services/assetBrowseService'

export type ResultsView = 'list' | 'gallery'

/** Seconds each slideshow item shows for. */
export const SLIDE_INTERVALS = [3, 5, 10, 20] as const
export type SlideInterval = (typeof SLIDE_INTERVALS)[number]

/** One category the user has viewed assets in. Kept only in this browser. */
export interface CategoryVisit {
  workspaceId: string
  catalogId: string
  categoryId: string
  /** Names from the top-level category down, as they were when last viewed. */
  path: string[]
  views: number
  /** Epoch ms of the most recent views, newest first (at most MAX_STAMPS). */
  viewedAt: number[]
}

interface BrowseState {
  view: ResultsView
  pageSize: number
  sort: AssetSort
  visits: CategoryVisit[]
  slideInterval: SlideInterval
  setView: (view: ResultsView) => void
  setPageSize: (size: number) => void
  setSort: (sort: AssetSort) => void
  setSlideInterval: (seconds: SlideInterval) => void
  /** Records that an asset in this category was viewed (opened in the preview). */
  recordView: (visit: Omit<CategoryVisit, 'views' | 'viewedAt'>) => void
  clearVisits: (workspaceId: string) => void
}

const MAX_STAMPS = 20
const MAX_VISITS = 200
const DAY = 24 * 60 * 60 * 1000

/**
 * Browse preferences and history, saved in localStorage (zustand persist). History never leaves the
 * browser; it powers the Recents tab.
 */
export const useBrowseStore = create<BrowseState>()(
  persist(
    (set) => ({
      view: 'gallery',
      pageSize: DEFAULT_PAGE_SIZE,
      sort: DEFAULT_SORT,
      visits: [],
      slideInterval: 5,
      setView: (view) => set({ view }),
      setPageSize: (pageSize) => set({ pageSize }),
      setSort: (sort) => set({ sort }),
      setSlideInterval: (slideInterval) => set({ slideInterval }),
      recordView: (visit) =>
        set((state) => {
          const now = Date.now()
          const existing = state.visits.find((v) => v.categoryId === visit.categoryId)
          const updated: CategoryVisit = existing
            ? { ...existing, path: visit.path, views: existing.views + 1, viewedAt: [now, ...existing.viewedAt].slice(0, MAX_STAMPS) }
            : { ...visit, views: 1, viewedAt: [now] }
          const others = state.visits.filter((v) => v.categoryId !== visit.categoryId)
          return { visits: [updated, ...others].slice(0, MAX_VISITS) }
        }),
      clearVisits: (workspaceId) => set((state) => ({ visits: state.visits.filter((v) => v.workspaceId !== workspaceId) })),
    }),
    {
      name: 'dam-ui.asset-browse',
      version: 1,
      // localStorage can be missing (private mode); zustand then keeps the state in memory only.
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Frecency: recent views count more than old ones (today 4, this week 2, this month 1, older 0.25),
 * so a category viewed often and lately ranks first.
 */
export function visitScore(visit: CategoryVisit, now = Date.now()): number {
  return visit.viewedAt.reduce((sum, at) => {
    const age = now - at
    return sum + (age < DAY ? 4 : age < 7 * DAY ? 2 : age < 30 * DAY ? 1 : 0.25)
  }, 0)
}
