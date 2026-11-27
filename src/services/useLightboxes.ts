import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import type { BrowsedAsset } from './assetBrowseService'
import {
  addLightboxItems,
  createLightbox,
  deleteLightbox,
  downloadAssets,
  getLightbox,
  listAllLightboxItems,
  listLightboxes,
  listLightboxItems,
  removeLightboxItems,
  reorderLightboxItems,
  updateLightbox,
  type CreateLightboxInput,
  type LightboxPatch,
} from './lightboxService'

// React Query wrappers for lightboxService. Every key starts with 'lightboxes', and every mutation
// invalidates them all, so lists, counts and item pages agree after any change.

export const lightboxKeys = {
  all: ['lightboxes'] as const,
  list: (catalogId: string) => ['lightboxes', 'list', catalogId] as const,
  detail: (id: string) => ['lightboxes', 'detail', id] as const,
  items: (id: string, page: number, pageSize: number) => ['lightboxes', 'items', id, page, pageSize] as const,
  allItems: (id: string) => ['lightboxes', 'allItems', id] as const,
}

/** The catalog's lightboxes, by title. */
export function useLightboxes(catalogId: string) {
  return useQuery({
    queryKey: lightboxKeys.list(catalogId),
    queryFn: ({ signal }) => listLightboxes(catalogId, { signal }),
    enabled: catalogId !== '',
  })
}

export function useLightbox(id: string | null) {
  return useQuery({
    queryKey: lightboxKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getLightbox(id!, { signal }),
    enabled: Boolean(id),
  })
}

/** One page (1-based) of a lightbox's items; the previous page stays shown while the next loads. */
export function useLightboxItems(id: string | null, page: number, pageSize: number) {
  return useQuery({
    queryKey: lightboxKeys.items(id ?? '', page, pageSize),
    queryFn: ({ signal }) => listLightboxItems(id!, { page, pageSize }, { signal }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

/** Every item of a lightbox (for the slideshow), loaded page by page. */
export function useAllLightboxItems(id: string | null) {
  return useQuery({
    queryKey: lightboxKeys.allItems(id ?? ''),
    queryFn: ({ signal }) => listAllLightboxItems(id!, { signal }),
    enabled: Boolean(id),
    staleTime: 0,
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: lightboxKeys.all })
}

/** Creates a lightbox owned by the signed-in user. */
export function useCreateLightbox() {
  const { user } = useAuth()
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: Omit<CreateLightboxInput, 'userId'>) => createLightbox({ ...input, userId: user?.username ?? '' }),
    onSuccess: invalidate,
  })
}

export function useUpdateLightbox(id: string) {
  const client = useQueryClient()
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (patch: LightboxPatch) => updateLightbox(id, patch),
    onSuccess: (saved) => {
      client.setQueryData(lightboxKeys.detail(id), saved)
      return invalidate()
    },
  })
}

export function useDeleteLightbox() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLightbox(id),
    // Not awaited, so the caller can leave the deleted lightbox before anything refetches it.
    onSuccess: (_, id) => {
      client.removeQueries({ predicate: (q) => q.queryKey[0] === 'lightboxes' && q.queryKey[2] === id })
      void client.invalidateQueries({ queryKey: ['lightboxes', 'list'] })
    },
  })
}

export function useAddLightboxItems() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, assets }: { id: string; assets: BrowsedAsset[] }) => addLightboxItems(id, assets),
    onSuccess: invalidate,
  })
}

export function useRemoveLightboxItems(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (assetIds: string[]) => removeLightboxItems(id, assetIds),
    onSuccess: invalidate,
  })
}

/**
 * Moves one item earlier or later by `delta` places. The API takes the whole order, so this reads
 * every item first; it resolves to the item's new 0-based position.
 */
export function useMoveLightboxItem(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ assetId, delta }: { assetId: string; delta: number }) => {
      const ids = (await listAllLightboxItems(id)).map((a) => a.id)
      const from = ids.indexOf(assetId)
      const to = Math.min(ids.length - 1, Math.max(0, from + delta))
      if (from < 0) return null
      if (from !== to) {
        ids.splice(to, 0, ...ids.splice(from, 1))
        await reorderLightboxItems(id, ids)
      }
      return to
    },
    // Not awaited: the item page's own refetch (shown as busy) decides when focus returns to the item.
    onSuccess: () => void invalidate(),
  })
}

/** Downloads a set of assets as one file (a mock manifest until the API's zip is ready). */
export function useDownloadAssets() {
  return useMutation({
    mutationFn: ({ assets, name }: { assets: BrowsedAsset[]; name: string }) => downloadAssets(assets, name),
  })
}

/** Downloads every item of a lightbox, named after its title (GET /lightboxes/{id}/download later). */
export function useDownloadLightbox() {
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => downloadAssets(await listAllLightboxItems(id), title),
  })
}

/** Download name for a set of assets with no title of its own, like the API's zip name. */
export function selectionDownloadName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `assets-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
}
