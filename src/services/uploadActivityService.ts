import { ApiError, apiRequest, isApiEnabled } from './apiClient'
import { mockCategorySnapshot, type CategoryRecord } from './categoryService'

// Upload activity service: recent upload operations, broken down by category. With
// REACT_APP_API_URL set it calls dam-api's GET /assets/activity/summary; otherwise it builds a
// summary from mock events (seeded per catalog, plus whatever the mock asset service uploads).
// Callers only depend on these signatures.

/** How far back to look. The API accepts these as its `period`. */
export type ActivityPeriod = '15m' | '1h' | '8h' | '24h' | '7d'

export const ACTIVITY_PERIODS: { value: ActivityPeriod; label: string; long: string }[] = [
  { value: '15m', label: '15 min', long: 'the last 15 minutes' },
  { value: '1h', label: '1 hour', long: 'the last hour' },
  { value: '8h', label: '8 hours', long: 'the last 8 hours' },
  { value: '24h', label: '24 hours', long: 'the last 24 hours' },
  { value: '7d', label: '7 days', long: 'the last 7 days' },
]

export const DEFAULT_ACTIVITY_PERIOD: ActivityPeriod = '24h'

/** image, video, pdf, audio, other, or mixed for one upload holding several types. */
export type UploadFileType = 'image' | 'video' | 'pdf' | 'audio' | 'other' | 'mixed'

/** One upload request and the assets it put directly in a category. */
export interface UploadEvent {
  operationId: string
  at: Date
  assetCount: number
  fileType: UploadFileType
}

/** A category's own uploads in the window (not its subcategories'). */
export interface CategoryUploadActivity {
  categoryId: string
  categoryName: string
  /** Names from the top-level category down, e.g. ['Food', 'American', 'BBQ']. */
  path: string[]
  operations: number
  assets: number
  /** Newest first. */
  events: UploadEvent[]
}

export interface UploadSummary {
  period: ActivityPeriod
  from: Date
  to: Date
  /** Upload operations in scope; a bulk upload counts once. */
  totalOperations: number
  /** Assets in scope; an asset in several categories counts once. */
  totalAssets: number
  /** Only categories with uploads, in category-editor order. */
  categories: CategoryUploadActivity[]
}

export interface UploadSummaryQuery {
  catalogId: string
  /** Narrows the summary to this category and its subcategories. */
  categoryId?: string | null
  period?: ActivityPeriod
}

/** Thrown when the API refuses the request. Its message is safe to show. */
export class UploadActivityServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadActivityServiceError'
  }
}

const FILE_TYPES: UploadFileType[] = ['image', 'video', 'pdf', 'audio', 'other', 'mixed']
const asFileType = (value: string): UploadFileType => (FILE_TYPES as string[]).includes(value) ? (value as UploadFileType) : 'other'

/**
 * The API sends server-local date-times without a zone and with microseconds. Trim to milliseconds
 * (not every browser parses more) and read them as local time.
 */
function parseLocal(value: string): Date {
  return new Date(value.replace(/(\.\d{3})\d+/, '$1'))
}

// ---- API ----

interface SummaryDto {
  lastSampleTimePeriod: number
  from: string
  to: string
  totalAssetUploadOperations: number
  totalAssetsUploaded: number
  categories: {
    categoryId: string
    categoryName: string
    path: string[]
    uploadOperations: number
    assetsUploaded: number
    uploadEvents: { operationId: string; dateTime: string; uploadCount: number; fileType: string }[]
  }[]
}

const fromDto = (dto: SummaryDto, period: ActivityPeriod): UploadSummary => ({
  period,
  from: parseLocal(dto.from),
  to: parseLocal(dto.to),
  totalOperations: dto.totalAssetUploadOperations,
  totalAssets: dto.totalAssetsUploaded,
  categories: dto.categories.map((c) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    path: c.path,
    operations: c.uploadOperations,
    assets: c.assetsUploaded,
    events: c.uploadEvents.map((e) => ({
      operationId: e.operationId,
      at: parseLocal(e.dateTime),
      assetCount: e.uploadCount,
      fileType: asFileType(e.fileType),
    })),
  })),
})

// ---- Mock ----

const PERIOD_MS: Record<ActivityPeriod, number> = {
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '8h': 8 * 60 * 60_000,
  '24h': 24 * 60 * 60_000,
  '7d': 7 * 24 * 60 * 60_000,
}

interface MockEvent {
  catalogId: string
  categoryId: string
  operationId: string
  at: Date
  assetCount: number
  fileType: UploadFileType
}

const mockEvents: MockEvent[] = []
const seededCatalogs = new Set<string>()

/** A handful of past uploads spread over the last week, into categories that hold assets. */
function seedMockEvents(catalogId: string) {
  if (seededCatalogs.has(catalogId)) return
  seededCatalogs.add(catalogId)
  const withAssets = mockCategorySnapshot(catalogId).filter((c) => c.assetCount > 0)
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000)
  const plan: [number, number, UploadFileType][] = [
    [6, 1, 'image'], [42, 12, 'mixed'], [95, 1, 'pdf'], [5 * 60, 48, 'image'], [11 * 60, 2, 'video'],
    [20 * 60, 1, 'image'], [30 * 60, 140, 'mixed'], [3 * 24 * 60, 9, 'image'], [5 * 24 * 60, 1, 'pdf'],
  ]
  plan.forEach(([minutes, count, fileType], i) => {
    const category = withAssets[(i * 3) % Math.max(withAssets.length, 1)]
    if (!category) return
    mockEvents.push({ catalogId, categoryId: category.id, operationId: crypto.randomUUID(), at: ago(minutes), assetCount: count, fileType })
  })
}

/** Mock only: records an upload made by the mock asset service so the panel shows it. */
export function recordMockUpload(catalogId: string, categoryId: string, fileType: UploadFileType) {
  seedMockEvents(catalogId)
  mockEvents.push({ catalogId, categoryId, operationId: crypto.randomUUID(), at: new Date(), assetCount: 1, fileType })
}

function pathOf(records: CategoryRecord[], id: string): CategoryRecord[] {
  const byId = new Map(records.map((r) => [r.id, r]))
  const path: CategoryRecord[] = []
  for (let r = byId.get(id); r && path.length <= records.length; r = r.parentId ? byId.get(r.parentId) : undefined) path.unshift(r)
  return path
}

/** Depth-first, siblings by position: the order the category editor shows. */
function editorOrder(records: CategoryRecord[]): CategoryRecord[] {
  const children = new Map<string | null, CategoryRecord[]>()
  for (const r of records) children.set(r.parentId, [...(children.get(r.parentId) ?? []), r])
  const out: CategoryRecord[] = []
  const walk = (parentId: string | null) =>
    (children.get(parentId) ?? []).sort((a, b) => a.position - b.position).forEach((r) => {
      out.push(r)
      walk(r.id)
    })
  walk(null)
  return out
}

async function mockSummary({ catalogId, categoryId, period = DEFAULT_ACTIVITY_PERIOD }: UploadSummaryQuery): Promise<UploadSummary> {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))
  seedMockEvents(catalogId)
  const records = mockCategorySnapshot(catalogId)
  if (categoryId && !records.some((r) => r.id === categoryId)) {
    throw new UploadActivityServiceError('That category no longer exists.')
  }
  const to = new Date()
  const from = new Date(to.getTime() - PERIOD_MS[period])
  const inScope = (id: string) => !categoryId || pathOf(records, id).some((r) => r.id === categoryId)
  const events = mockEvents
    .filter((e) => e.catalogId === catalogId && e.at >= from && inScope(e.categoryId))
    .sort((a, b) => b.at.getTime() - a.at.getTime())

  const categories: CategoryUploadActivity[] = []
  for (const r of editorOrder(records)) {
    const own = events.filter((e) => e.categoryId === r.id)
    if (own.length === 0) continue
    categories.push({
      categoryId: r.id,
      categoryName: r.name,
      path: pathOf(records, r.id).map((p) => p.name),
      operations: own.length,
      assets: own.reduce((n, e) => n + e.assetCount, 0),
      events: own.map(({ operationId, at, assetCount, fileType }) => ({ operationId, at, assetCount, fileType })),
    })
  }
  return {
    period,
    from,
    to,
    totalOperations: events.length,
    totalAssets: events.reduce((n, e) => n + e.assetCount, 0),
    categories,
  }
}

// ---- Public API ----

/** GET /assets/activity/summary: recent uploads in a catalog (or one category's subtree), by category. */
export async function getUploadSummary(query: UploadSummaryQuery): Promise<UploadSummary> {
  if (!isApiEnabled()) return mockSummary(query)
  const period = query.period ?? DEFAULT_ACTIVITY_PERIOD
  const params = new URLSearchParams({ catalogId: query.catalogId, period })
  if (query.categoryId) params.set('categoryId', query.categoryId)
  try {
    return fromDto(await apiRequest<SummaryDto>(`/assets/activity/summary?${params}`), period)
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw new UploadActivityServiceError(err.message)
    throw err
  }
}
