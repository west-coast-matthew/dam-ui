import { isApiEnabled } from './apiClient'
import { searchAssets, type AssetSearchPage, type BrowsedAsset } from './assetBrowseService'
import { MOCK_ACCOUNT } from './mockCredentials'

// Lightboxes: saved sets of a catalog's assets, in the order the user chose (dam-api spec 009).
// The API's item, create-from-selection and group download endpoints aren't ready yet, so this
// service is always a mock, whether or not REACT_APP_API_URL is set. It keeps its data in memory,
// waits a random 300–1500 ms per call and, with REACT_APP_MOCK_FAILURE_RATE (0–1), fails that share
// of calls so the error states can be tried. Callers only depend on these signatures; when the API
// is ready the bodies become requests to:
//   GET/POST /lightboxes, GET/PUT/DELETE /lightboxes/{id}
//   GET/POST /lightboxes/{id}/items, POST /lightboxes/{id}/items/remove, PUT /lightboxes/{id}/items/order
//   POST /assets/download (zip of a set of assets), GET /lightboxes/{id}/download

export const LIGHTBOX_TITLE_MAX_LENGTH = 255
/** The API's largest page of items. */
export const LIGHTBOX_MAX_PAGE_SIZE = 200

/** Mirrors the API's LightboxInstanceDto. */
export interface Lightbox {
  id: string
  catalogId: string
  /** The owner: the signed-in user's username. */
  userId: string
  title: string
  /** Empty string when there is none. */
  description: string
  shared: boolean
  itemCount: number
}

export interface CreateLightboxInput {
  catalogId: string
  userId: string
  title: string
  description?: string
  shared?: boolean
  /** Added as items in this order; duplicates are ignored. */
  assets?: BrowsedAsset[]
}

export type LightboxPatch = Partial<Pick<Lightbox, 'title' | 'description' | 'shared'>>

export interface CallOptions {
  signal?: AbortSignal
}

/** Thrown when a call is refused (status as the API would answer) or fails. Its message is safe to show. */
export class LightboxServiceError extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'LightboxServiceError'
    this.status = status
  }
}

// ---- Mock plumbing ----

const failureRate = (() => {
  const rate = Number(import.meta.env.REACT_APP_MOCK_FAILURE_RATE ?? 0)
  return Number.isFinite(rate) ? Math.min(1, Math.max(0, rate)) : 0
})()

/** Waits 300–1500 ms like a slow network, then fails `failureRate` of the time. */
function mockLatency(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('The request was aborted.', 'AbortError'))
    }
    if (signal?.aborted) return abort()
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      if (Math.random() < failureRate) reject(new LightboxServiceError('The lightbox service failed (simulated). Please try again.', 503))
      else resolve()
    }, 300 + Math.random() * 1200)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

interface StoredLightbox {
  lightbox: Omit<Lightbox, 'itemCount'>
  items: BrowsedAsset[]
}

const store = new Map<string, StoredLightbox>()
const seeded = new Set<string>()

const snapshot = ({ lightbox, items }: StoredLightbox): Lightbox => ({ ...lightbox, itemCount: items.length })

function find(id: string): StoredLightbox {
  const entry = store.get(id)
  if (!entry) throw new LightboxServiceError('That lightbox no longer exists.', 404)
  return entry
}

function validTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) throw new LightboxServiceError('A lightbox needs a title.')
  if (trimmed.length > LIGHTBOX_TITLE_MAX_LENGTH) {
    throw new LightboxServiceError(`The title can be at most ${LIGHTBOX_TITLE_MAX_LENGTH} characters.`)
  }
  return trimmed
}

/** The assets not already in `items`, in order, without repeats; refuses other catalogs' assets. */
function newAssets(catalogId: string, items: BrowsedAsset[], assets: BrowsedAsset[]): BrowsedAsset[] {
  if (assets.some((a) => a.catalogId !== catalogId)) {
    throw new LightboxServiceError("Assets from another catalog can't be added to this lightbox.")
  }
  const seen = new Set(items.map((a) => a.id))
  return assets.filter((a) => !seen.has(a.id) && Boolean(seen.add(a.id)))
}

/** The first time a catalog is listed without an API, two sample lightboxes from its mock assets. */
async function seed(catalogId: string) {
  if (seeded.has(catalogId) || isApiEnabled()) return
  seeded.add(catalogId)
  const { items } = await searchAssets({ catalogId, page: 1, pageSize: 96 })
  if (items.length === 0) return
  const samples = [
    { title: 'Campaign shortlist', description: 'Favourites for the autumn campaign.', shared: true, items: items.slice(0, 8) },
    { title: 'Print candidates', description: '', shared: false, items: items.filter((_, i) => i % 3 === 1).slice(0, 12) },
  ]
  for (const s of samples) {
    const id = crypto.randomUUID()
    store.set(id, {
      lightbox: { id, catalogId, userId: MOCK_ACCOUNT.username, title: s.title, description: s.description, shared: s.shared },
      items: s.items,
    })
  }
}

// ---- Public API ----

/** GET /lightboxes?catalogId=: the catalog's lightboxes, by title. */
export async function listLightboxes(catalogId: string, options: CallOptions = {}): Promise<Lightbox[]> {
  await mockLatency(options.signal)
  await seed(catalogId)
  return [...store.values()]
    .filter((e) => e.lightbox.catalogId === catalogId)
    .map(snapshot)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}

/** GET /lightboxes/{id}. */
export async function getLightbox(id: string, options: CallOptions = {}): Promise<Lightbox> {
  await mockLatency(options.signal)
  return snapshot(find(id))
}

/** GET /lightboxes/{id}/items: one page (1-based) of the lightbox's assets, in lightbox order. */
export async function listLightboxItems(
  id: string,
  { page, pageSize }: { page: number; pageSize: number },
  options: CallOptions = {},
): Promise<AssetSearchPage> {
  await mockLatency(options.signal)
  if (pageSize < 1 || pageSize > LIGHTBOX_MAX_PAGE_SIZE) throw new LightboxServiceError(`The page size must be 1–${LIGHTBOX_MAX_PAGE_SIZE}.`)
  if (page < 1) throw new LightboxServiceError('The page must be 1 or more.')
  const { items } = find(id)
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  }
}

/** Every item of the lightbox, in order, read page by page (as the slideshow and download need). */
export async function listAllLightboxItems(id: string, options: CallOptions = {}): Promise<BrowsedAsset[]> {
  const all: BrowsedAsset[] = []
  for (let page = 1; ; page++) {
    const result = await listLightboxItems(id, { page, pageSize: LIGHTBOX_MAX_PAGE_SIZE }, options)
    all.push(...result.items)
    if (page >= result.totalPages) return all
  }
}

/** POST /lightboxes, with the selection's assets as its first items. */
export async function createLightbox(input: CreateLightboxInput, options: CallOptions = {}): Promise<Lightbox> {
  await mockLatency(options.signal)
  const title = validTitle(input.title)
  const items = newAssets(input.catalogId, [], input.assets ?? [])
  const id = crypto.randomUUID()
  const entry: StoredLightbox = {
    lightbox: {
      id,
      catalogId: input.catalogId,
      userId: input.userId,
      title,
      description: (input.description ?? '').trim(),
      shared: input.shared ?? false,
    },
    items,
  }
  store.set(id, entry)
  return snapshot(entry)
}

/** PUT /lightboxes/{id}: title, description and shared. */
export async function updateLightbox(id: string, patch: LightboxPatch, options: CallOptions = {}): Promise<Lightbox> {
  await mockLatency(options.signal)
  const entry = find(id)
  const next = { ...entry.lightbox }
  if (patch.title !== undefined) next.title = validTitle(patch.title)
  if (patch.description !== undefined) next.description = patch.description.trim()
  if (patch.shared !== undefined) next.shared = patch.shared
  entry.lightbox = next
  return snapshot(entry)
}

/** DELETE /lightboxes/{id}. The assets themselves stay. */
export async function deleteLightbox(id: string, options: CallOptions = {}): Promise<void> {
  await mockLatency(options.signal)
  find(id)
  store.delete(id)
}

/** POST /lightboxes/{id}/items: appends the assets, skipping those already in the lightbox. */
export async function addLightboxItems(id: string, assets: BrowsedAsset[], options: CallOptions = {}): Promise<Lightbox> {
  await mockLatency(options.signal)
  const entry = find(id)
  entry.items = [...entry.items, ...newAssets(entry.lightbox.catalogId, entry.items, assets)]
  return snapshot(entry)
}

/** POST /lightboxes/{id}/items/remove: ids not in the lightbox are ignored. */
export async function removeLightboxItems(id: string, assetIds: string[], options: CallOptions = {}): Promise<Lightbox> {
  await mockLatency(options.signal)
  const entry = find(id)
  const remove = new Set(assetIds)
  entry.items = entry.items.filter((a) => !remove.has(a.id))
  return snapshot(entry)
}

/** PUT /lightboxes/{id}/items/order: `assetIds` must be exactly the lightbox's current assets. */
export async function reorderLightboxItems(id: string, assetIds: string[], options: CallOptions = {}): Promise<Lightbox> {
  await mockLatency(options.signal)
  const entry = find(id)
  const byId = new Map(entry.items.map((a) => [a.id, a]))
  if (assetIds.length !== byId.size || new Set(assetIds).size !== assetIds.length || assetIds.some((a) => !byId.has(a))) {
    throw new LightboxServiceError("The new order must list exactly the lightbox's current assets. Reload it and try again.")
  }
  entry.items = assetIds.map((a) => byId.get(a)!)
  return snapshot(entry)
}

/** A file name without characters that file systems refuse. */
const safeFileName = (name: string) =>
  [...name].map((c) => (c < ' ' || '\\/:*?"<>|'.includes(c) ? '-' : c)).join('').trim().slice(0, 120) || 'assets'

const absolute = (url: string) => new URL(url, window.location.origin).href

/**
 * POST /assets/download. The mock saves `<name>.txt`, a manifest of each asset's file name and
 * download URL, in place of the API's zip.
 */
export async function downloadAssets(assets: BrowsedAsset[], name: string, options: CallOptions = {}): Promise<void> {
  await mockLatency(options.signal)
  if (assets.length === 0) throw new LightboxServiceError('There are no assets to download.')
  const withUrls = assets.some((a) => a.downloadUrl)
  const lines = [
    name,
    `${assets.length} ${assets.length === 1 ? 'asset' : 'assets'}, listed ${new Date().toLocaleString()}`,
    '',
    withUrls
      ? 'Stand-in for the zip download: once the API supports it, these files will come as one zip from POST /assets/download.'
      : 'Stand-in for the zip download. These assets have no download URLs yet.',
    '',
    ...assets.map((a) => `${a.originalFilename}\t${a.downloadUrl ? absolute(a.downloadUrl) : '(no download URL)'}`),
    '',
  ]
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFileName(name)}.txt`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
