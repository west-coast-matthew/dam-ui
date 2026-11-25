import { ApiError, apiRequest, isApiEnabled } from './apiClient'

// Catalog tags (dam-api spec 023). With REACT_APP_API_URL set it calls GET /tags; otherwise it
// counts the mock assets' tags plus the tags given to mock uploads and edits. Tags are assigned
// through the asset endpoints (uploads and PUT /assets/{id}), by name. Callers only depend on these
// signatures.

export const TAG_NAME_MAX_LENGTH = 255

/** A tag in a catalog, with the number of assets carrying it. */
export interface TagRecord {
  id: string
  name: string
  assetCount: number
}

/** Thrown when the API refuses the request. Its message is safe to show. */
export class TagServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TagServiceError'
  }
}

/**
 * Tags as the API stores them: trimmed, blanks dropped, duplicates (ignoring case) removed, first
 * spelling kept.
 */
export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const tag = raw.trim()
    const key = tag.toLowerCase()
    if (tag && !seen.has(key)) {
      seen.add(key)
      out.push(tag)
    }
  }
  return out
}

/** Sorts names A–Z ignoring case, as the API does. */
export const byTagName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) || a.localeCompare(b)

// ---- Mock ----

/** Mock asset tags changed through updateAsset, by asset id. */
const assetTags = new Map<string, string[]>()
/** Mock uploads' tag usage, by catalog id: lower-case name -> { name, count }. */
const uploadedTags = new Map<string, Map<string, { name: string; count: number }>>()

/** Mock only: the asset's edited tags, or undefined if they weren't changed. */
export function mockAssetTags(assetId: string): string[] | undefined {
  return assetTags.get(assetId)
}

/** Mock only: replaces a mock asset's tags. */
export function setMockAssetTags(assetId: string, tags: string[]) {
  assetTags.set(assetId, tags)
}

/** Mock only: counts the tags given to a mock upload. */
export function recordMockUploadTags(catalogId: string, tags: string[]) {
  const byName = uploadedTags.get(catalogId) ?? new Map<string, { name: string; count: number }>()
  for (const tag of normalizeTags(tags)) {
    const entry = byName.get(tag.toLowerCase())
    if (entry) entry.count++
    else byName.set(tag.toLowerCase(), { name: tag, count: 1 })
  }
  uploadedTags.set(catalogId, byName)
}

type MockAssetSource = (catalogId: string) => { tags: string[] }[]
let mockAssetSource: MockAssetSource = () => []

/** Mock only: assetBrowseService registers its mock assets so their tags can be counted. */
export function registerMockAssetSource(source: MockAssetSource) {
  mockAssetSource = source
}

async function mockList(catalogId: string, q: string, limit: number): Promise<TagRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200))
  const counts = new Map<string, { name: string; count: number }>()
  const add = (name: string, n: number) => {
    const entry = counts.get(name.toLowerCase())
    if (entry) entry.count += n
    else counts.set(name.toLowerCase(), { name, count: n })
  }
  for (const asset of mockAssetSource(catalogId)) asset.tags.forEach((t) => add(t, 1))
  for (const { name, count } of uploadedTags.get(catalogId)?.values() ?? []) add(name, count)
  const needle = q.trim().toLowerCase()
  return [...counts.values()]
    .filter((t) => !needle || t.name.toLowerCase().includes(needle))
    .sort((a, b) => byTagName(a.name, b.name))
    .slice(0, limit)
    .map((t) => ({ id: `${catalogId}:${t.name.toLowerCase()}`, name: t.name, assetCount: t.count }))
}

// ---- Public API ----

/** GET /tags: the catalog's tags sorted by name, optionally only those containing `q` (ignoring case). */
export async function listTags(
  catalogId: string,
  options: { q?: string; limit?: number; signal?: AbortSignal } = {},
): Promise<TagRecord[]> {
  const { q = '', limit = 50, signal } = options
  if (!isApiEnabled()) return mockList(catalogId, q, limit)

  const params = new URLSearchParams({ catalogId, limit: String(limit) })
  if (q.trim()) params.set('q', q.trim())
  try {
    return await apiRequest<TagRecord[]>(`/tags?${params}`, { signal })
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw new TagServiceError(err.message)
    throw err
  }
}
