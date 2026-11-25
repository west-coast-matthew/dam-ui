import mockAssetData from '../pages/mockups/AssetBrowseDemo/mockAssets.json'
import { ApiError, apiRequest, apiUrl, isApiEnabled } from './apiClient'
import { mockCategorySnapshot } from './categoryService'
import { mockAssetTags, registerMockAssetSource } from './tagService'

// Asset browsing: a paged, filtered listing of a catalog's assets (dam-api GET /assets/search),
// plus the URLs of each asset's thumbnail and file. Without REACT_APP_API_URL it pages through the
// mock assets, spread over the mock categories. Callers only depend on these signatures.

export type BrowseMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER'
export type AssetSortField = 'added' | 'name' | 'size' | 'type'
export type SortDirection = 'asc' | 'desc'

export interface AssetSort {
  field: AssetSortField
  direction: SortDirection
}

/** The direction a field starts in: newest and largest first, names and types A–Z. */
export const DEFAULT_DIRECTION: Record<AssetSortField, SortDirection> = { added: 'desc', name: 'asc', size: 'desc', type: 'asc' }

export const DEFAULT_SORT: AssetSort = { field: 'added', direction: 'desc' }
export type TagMatch = 'all' | 'any'

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const
export const DEFAULT_PAGE_SIZE = 24

/** Every sort, for the sort menu. `value` is "field:direction". */
export const SORT_OPTIONS: { value: `${AssetSortField}:${SortDirection}`; label: string }[] = [
  { value: 'added:desc', label: 'Newest first' },
  { value: 'added:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'File name A–Z' },
  { value: 'name:desc', label: 'File name Z–A' },
  { value: 'size:desc', label: 'Largest first' },
  { value: 'size:asc', label: 'Smallest first' },
  { value: 'type:asc', label: 'Type A–Z' },
  { value: 'type:desc', label: 'Type Z–A' },
]

export const sortKey = (sort: AssetSort) => `${sort.field}:${sort.direction}` as const

export function parseSortKey(key: string): AssetSort {
  const [field, direction] = key.split(':') as [AssetSortField, SortDirection]
  return { field, direction }
}

export interface BrowsedAsset {
  id: string
  catalogId: string
  /** The title given at upload, or '' (show the file name instead). */
  title: string
  description: string
  originalFilename: string
  mediaType: BrowseMediaType
  mimeType: string
  fileSize: number
  /** PENDING_PROCESSING until the thumbnail has been made. */
  status: string
  createdAt: Date
  categoryIds: string[]
  tags: string[]
  /** Null when there's no API (and no mock image). The image may 404 while it's being made. */
  thumbnailUrl: string | null
  /** The original file, shown in the preview. */
  fileUrl: string | null
  downloadUrl: string | null
}

export interface AssetSearchQuery {
  catalogId: string
  categoryId?: string | null
  includeSubcategories?: boolean
  /** yyyy-mm-dd, inclusive. */
  addedFrom?: string
  /** yyyy-mm-dd, inclusive. */
  addedTo?: string
  tags?: string[]
  tagMatch?: TagMatch
  /** Part of the file name. */
  text?: string
  /** 1-based. */
  page: number
  pageSize: number
  sort?: AssetSort
}

export interface AssetSearchPage {
  items: BrowsedAsset[]
  /** 1-based. */
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

/** Thrown when the API refuses a search. Its message is safe to show. */
export class AssetBrowseServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssetBrowseServiceError'
  }
}

export const displayTitle = (asset: Pick<BrowsedAsset, 'title' | 'originalFilename'>) => asset.title.trim() || asset.originalFilename

/** The API's date-times are server-local without a zone, with microseconds; read them as local time. */
const parseLocal = (value: string) => new Date(value.replace(/(\.\d{3})\d+/, '$1'))

const text = (value: unknown) => (typeof value === 'string' ? value : '')

// ---- API ----

interface AssetDto {
  id: string
  catalogId: string
  originalFilename: string
  mediaType: BrowseMediaType
  mimeType: string
  fileSize: number
  status: string
  customMetadata: Record<string, unknown> | null
  categoryIds: string[] | null
  tags: string[] | null
  createdAt: string
}

interface AssetPageDto {
  items: AssetDto[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

const fromDto = (dto: AssetDto): BrowsedAsset => ({
  id: dto.id,
  catalogId: dto.catalogId,
  title: text(dto.customMetadata?.title),
  description: text(dto.customMetadata?.description),
  originalFilename: dto.originalFilename,
  mediaType: dto.mediaType,
  mimeType: dto.mimeType,
  fileSize: dto.fileSize,
  status: dto.status,
  createdAt: parseLocal(dto.createdAt),
  categoryIds: dto.categoryIds ?? [],
  tags: dto.tags ?? [],
  thumbnailUrl: apiUrl(`/assets/${dto.id}/thumbnail`),
  fileUrl: apiUrl(`/assets/${dto.id}/file`),
  downloadUrl: apiUrl(`/assets/${dto.id}/file?download=true`),
})

// ---- Mock ----

interface MockSource {
  id: string
  title: string
  originalFilename: string
  mediaType: BrowseMediaType
  mimeType: string
  fileSize: number
  createdAt: string
  thumbnails: { large: { url: string }; preview: { url: string } }
}

const TAG_POOL = ['brand', 'campaign', '2026', 'hero', 'social', 'print', 'archive', 'approved']

/** The mock assets, spread over the catalog's categories (the default category gets a few too). */
function mockAssets(catalogId: string): BrowsedAsset[] {
  const categories = mockCategorySnapshot(catalogId)
  if (categories.length === 0) return []
  return (mockAssetData as MockSource[]).map((m, i) => ({
    id: `${catalogId}:${m.id}`,
    catalogId,
    title: m.title,
    description: '',
    originalFilename: m.originalFilename,
    mediaType: m.mediaType,
    mimeType: m.mimeType,
    fileSize: m.fileSize,
    status: 'READY',
    createdAt: new Date(m.createdAt),
    categoryIds: [categories[(i * 7) % categories.length].id],
    tags:
      mockAssetTags(`${catalogId}:${m.id}`) ??
      [TAG_POOL[i % TAG_POOL.length], TAG_POOL[(i * 3 + 1) % TAG_POOL.length]].filter((t, j, all) => all.indexOf(t) === j),
    thumbnailUrl: m.thumbnails.large.url,
    fileUrl: m.thumbnails.preview.url,
    downloadUrl: m.thumbnails.preview.url,
  }))
}

registerMockAssetSource(mockAssets)

function descendants(catalogId: string, categoryId: string): Set<string> {
  const records = mockCategorySnapshot(catalogId)
  const ids = new Set([categoryId])
  let grew = true
  while (grew) {
    grew = false
    for (const r of records) {
      if (r.parentId && ids.has(r.parentId) && !ids.has(r.id)) {
        ids.add(r.id)
        grew = true
      }
    }
  }
  return ids
}

async function mockSearch(q: AssetSearchQuery): Promise<AssetSearchPage> {
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 400))
  let list = mockAssets(q.catalogId)
  if (q.categoryId) {
    const scope = q.includeSubcategories ? descendants(q.catalogId, q.categoryId) : new Set([q.categoryId])
    list = list.filter((a) => a.categoryIds.some((id) => scope.has(id)))
  }
  if (q.addedFrom) {
    const from = new Date(`${q.addedFrom}T00:00:00`)
    list = list.filter((a) => a.createdAt >= from)
  }
  if (q.addedTo) {
    const to = new Date(`${q.addedTo}T00:00:00`)
    to.setDate(to.getDate() + 1)
    list = list.filter((a) => a.createdAt < to)
  }
  const tags = (q.tags ?? []).map((t) => t.toLowerCase())
  if (tags.length) {
    list = list.filter((a) => {
      const own = a.tags.map((t) => t.toLowerCase())
      return q.tagMatch === 'any' ? tags.some((t) => own.includes(t)) : tags.every((t) => own.includes(t))
    })
  }
  if (q.text?.trim()) {
    const needle = q.text.trim().toLowerCase()
    list = list.filter((a) => a.originalFilename.toLowerCase().includes(needle))
  }
  const sort = q.sort ?? DEFAULT_SORT
  const sign = sort.direction === 'asc' ? 1 : -1
  const byName = (a: BrowsedAsset, b: BrowsedAsset) => a.originalFilename.localeCompare(b.originalFilename)
  list.sort((a, b) => {
    switch (sort.field) {
      case 'name': return sign * byName(a, b)
      case 'size': return sign * (a.fileSize - b.fileSize)
      case 'type': return sign * a.mediaType.localeCompare(b.mediaType) || byName(a, b)
      default: return sign * (a.createdAt.getTime() - b.createdAt.getTime())
    }
  })
  const totalPages = Math.ceil(list.length / q.pageSize)
  const start = (q.page - 1) * q.pageSize
  return { items: list.slice(start, start + q.pageSize), page: q.page, pageSize: q.pageSize, totalItems: list.length, totalPages }
}

// ---- Public API ----

/** GET /assets/search: one page of the catalog's assets matching the filters. */
export async function searchAssets(q: AssetSearchQuery, options: { signal?: AbortSignal } = {}): Promise<AssetSearchPage> {
  if (!isApiEnabled()) return mockSearch(q)

  const params = new URLSearchParams({ catalogId: q.catalogId, page: String(q.page - 1), size: String(q.pageSize) })
  if (q.categoryId) {
    params.set('categoryId', q.categoryId)
    if (q.includeSubcategories) params.set('includeSubcategories', 'true')
  }
  if (q.addedFrom) params.set('addedFrom', q.addedFrom)
  if (q.addedTo) params.set('addedTo', q.addedTo)
  for (const tag of q.tags ?? []) params.append('tags', tag)
  if (q.tags?.length && q.tagMatch) params.set('tagMatch', q.tagMatch)
  if (q.text?.trim()) params.set('q', q.text.trim())
  if (q.sort) {
    params.set('sort', q.sort.field)
    params.set('direction', q.sort.direction)
  }

  try {
    const dto = await apiRequest<AssetPageDto>(`/assets/search?${params}`, { signal: options.signal })
    return { items: dto.items.map(fromDto), page: dto.page + 1, pageSize: dto.size, totalItems: dto.totalItems, totalPages: dto.totalPages }
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw new AssetBrowseServiceError(err.message)
    throw err
  }
}
