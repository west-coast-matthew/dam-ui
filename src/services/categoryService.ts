import { ApiError, apiRequest, isApiEnabled } from './apiClient'

// Category service: the categories of one catalog. Any category can hold assets, and every catalog
// has one default category (where assets without a category go) that can't be deleted or nested.
//
// When REACT_APP_API_URL is set it calls dam-api's /categories. Otherwise it emulates the API: data
// lives in memory per catalog (reset on reload) and every call waits a random 3-5 seconds to mimic
// network latency. Callers only depend on these signatures.

/** One category, as the API returns it. The hierarchy is expressed through parentId. */
export interface CategoryRecord {
  id: string
  catalogId: string
  /** null for a top-level category. */
  parentId: string | null
  name: string
  /** Empty string when there is none. */
  description: string
  /** 0-based order among its siblings. */
  position: number
  /** Number of assets in the category itself (not its subcategories). Read-only. */
  assetCount: number
  /** True for the catalog's default category. It can be renamed but not deleted or moved inside another. Read-only. */
  isDefault: boolean
}

/** A category created in this change set. Its id is temporary; `parentId` may be another temporary id. */
export interface CategoryCreate {
  tempId: string
  parentId: string | null
  name: string
  description: string
  position: number
}

/** The new state of an existing category whose name, description, parent or position changed. */
export type CategoryUpdate = Pick<CategoryRecord, 'id' | 'parentId' | 'name' | 'description' | 'position'>

/** Everything a bulk save sends. It is applied all together or not at all. */
export interface CategoryChangeSet {
  /** In tree order, so a parent always comes before its children. */
  created: CategoryCreate[]
  updated: CategoryUpdate[]
  /** Ids of deleted categories; their descendants go with them. */
  deleted: string[]
}

export const CATEGORY_NAME_MAX_LENGTH = 255
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 2000

/** Thrown when a change set is refused, e.g. a duplicate name. Its message is safe to show. */
export class CategoryServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CategoryServiceError'
  }
}

// ---- API ----

/** The API's CategoryInstanceDto. */
interface CategoryDto {
  id: string
  catalogId: string
  parentId: string | null
  name: string
  slug: string
  description: string | null
  position: number | null
  defaultCategory: boolean | null
  assetCount: number | null
}

const fromDto = (dto: CategoryDto): CategoryRecord => ({
  id: dto.id,
  catalogId: dto.catalogId,
  parentId: dto.parentId,
  name: dto.name,
  description: dto.description ?? '',
  position: dto.position ?? 0,
  assetCount: dto.assetCount ?? 0,
  isDefault: dto.defaultCategory === true,
})

/** Turns API refusals (400, 404, 409) into CategoryServiceErrors so the UI shows their message. */
async function viaApi<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw new CategoryServiceError(err.message)
    throw err
  }
}

// ---- Mock ----

const MIN_DELAY_MS = 3000
const MAX_DELAY_MS = 5000

/**
 * For testing the error states: set localStorage['dam-ui.mock-category-failure-rate'] to a number
 * between 0 and 1 and that share of calls fails. Defaults to 0.
 */
const FAILURE_RATE_KEY = 'dam-ui.mock-category-failure-rate'

interface Seed {
  name: string
  description?: string
  assets?: number
  children?: Seed[]
}

/** Mock categories by catalog id (see catalogService's mock catalogs). */
const SEEDS: Record<string, Seed[]> = {
  'default:main': [
    {
      name: 'Marketing',
      description: 'Campaign creative, brand assets and social content.',
      children: [
        {
          name: 'Campaigns',
          description: 'Grouped by campaign year.',
          children: [
            {
              name: '2026',
              children: [
                { name: 'Spring launch', description: 'Hero images and banners for the March launch.', assets: 128 },
                { name: 'Summer sale', assets: 46 },
              ],
            },
            { name: '2025', children: [{ name: 'Rebrand', description: 'Archived after the 2026 refresh.', assets: 312 }] },
          ],
        },
        {
          name: 'Brand',
          description: 'Approved logos, colours and typography.',
          children: [{ name: 'Logos', assets: 24 }, { name: 'Typography', assets: 9 }],
        },
        { name: 'Social media' },
      ],
    },
    {
      name: 'Product',
      description: 'Product photography and renders.',
      children: [
        {
          name: 'Photography',
          children: [{ name: 'Studio', description: 'White-background studio shots.', assets: 540 }, { name: 'Lifestyle', assets: 87 }],
        },
        { name: '3D renders', assets: 15 },
      ],
    },
    { name: 'Animals', children: [{ name: 'Cats' }, { name: 'Dogs', assets: 234 }] },
  ],
  'default:archive': [{ name: '2024 campaigns', assets: 410 }],
  'workspace-1:main': [
    { name: 'Clients', description: 'One category per client account.', children: [{ name: 'Acme', assets: 61 }, { name: 'Globex', assets: 3 }] },
    { name: 'Internal' },
  ],
}

function seed(catalogId: string): CategoryRecord[] {
  // Like the API, every catalog starts with its default category.
  const out: CategoryRecord[] = [
    { id: crypto.randomUUID(), catalogId, parentId: null, name: 'Default', description: 'Assets without a category.', position: 0, assetCount: 7, isDefault: true },
  ]
  const walk = (list: Seed[], parentId: string | null, offset: number) =>
    list.forEach((s, i) => {
      const id = crypto.randomUUID()
      out.push({ id, catalogId, parentId, name: s.name, description: s.description ?? '', position: i + offset, assetCount: s.assets ?? 0, isDefault: false })
      if (s.children) walk(s.children, id, 0)
    })
  walk(SEEDS[catalogId] ?? [], null, 1)
  return out
}

const store = new Map<string, CategoryRecord[]>()

function categoriesOf(catalogId: string): CategoryRecord[] {
  let list = store.get(catalogId)
  if (!list) {
    list = seed(catalogId)
    store.set(catalogId, list)
  }
  return list
}

function failureRate(): number {
  try {
    const rate = Number(localStorage.getItem(FAILURE_RATE_KEY))
    return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0
  } catch {
    return 0
  }
}

/** Waits 3-5 seconds, then sometimes fails if a failure rate is set. */
async function network(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  await new Promise((resolve) => setTimeout(resolve, ms))
  if (Math.random() < failureRate()) throw new Error("The category service didn't respond. Please try again.")
}

const sorted = (list: CategoryRecord[]) =>
  [...list]
    .sort((a, b) => (a.parentId ?? '').localeCompare(b.parentId ?? '') || a.position - b.position)
    .map((c) => ({ ...c }))

function cleanFields(name: string, description: string) {
  const n = name.trim()
  const d = description.trim()
  if (!n) throw new CategoryServiceError('Category name is required.')
  if (n.length > CATEGORY_NAME_MAX_LENGTH) {
    throw new CategoryServiceError(`Category name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters.`)
  }
  if (d.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
    throw new CategoryServiceError(`Category description must be at most ${CATEGORY_DESCRIPTION_MAX_LENGTH} characters.`)
  }
  return { name: n, description: d }
}

/** Applies a change set to the mock store with the same rules as the API's POST /categories/changes. */
function applyMockChanges(catalogId: string, changes: CategoryChangeSet): CategoryRecord[] {
  const byId = new Map(categoriesOf(catalogId).map((c) => [c.id, { ...c }]))

  for (const id of changes.deleted) {
    const c = byId.get(id)
    if (!c) throw new CategoryServiceError('A category you deleted no longer exists. Reload and try again.')
    if (c.isDefault) throw new CategoryServiceError("The catalog's default category can't be deleted.")
  }
  for (const u of changes.updated) {
    const existing = byId.get(u.id)
    if (!existing) throw new CategoryServiceError('A category you changed no longer exists. Reload and try again.')
    if (existing.isDefault && u.parentId !== null) throw new CategoryServiceError("The catalog's default category must stay at the top level.")
    byId.set(u.id, { ...existing, ...cleanFields(u.name, u.description), parentId: u.parentId, position: u.position })
  }
  const realIds = new Map<string, string>()
  for (const c of changes.created) realIds.set(c.tempId, crypto.randomUUID())
  const resolve = (id: string | null) => (id === null ? null : (realIds.get(id) ?? id))
  for (const c of changes.created) {
    const id = realIds.get(c.tempId)!
    byId.set(id, { id, catalogId, parentId: resolve(c.parentId), position: c.position, assetCount: 0, isDefault: false, ...cleanFields(c.name, c.description) })
  }
  for (const c of byId.values()) {
    if (c.parentId !== null && !byId.has(c.parentId)) {
      throw new CategoryServiceError(`The parent of '${c.name}' no longer exists. Reload and try again.`)
    }
  }
  // No cycles: walking up from any category must reach the top.
  for (const c of byId.values()) {
    const seen = new Set<string>()
    for (let p = c.parentId; p !== null; p = byId.get(p)!.parentId) {
      if (seen.has(p) || p === c.id) throw new CategoryServiceError(`'${c.name}' can't be moved inside itself.`)
      seen.add(p)
    }
  }
  // Deletes take descendants (as they are after the moves above); orphaned assets go to the default.
  const deleted = new Set(changes.deleted)
  const doomed = (c: CategoryRecord): boolean => deleted.has(c.id) || (c.parentId !== null && doomed(byId.get(c.parentId)!))
  const next = [...byId.values()].filter((c) => !doomed(c))
  const moved = [...byId.values()].filter(doomed).reduce((n, c) => n + c.assetCount, 0)
  const fallback = next.find((c) => c.isDefault)
  if (fallback) fallback.assetCount += moved
  // Names are unique among siblings (case-insensitive).
  const siblingNames = new Set<string>()
  for (const c of next) {
    const key = `${c.parentId ?? ''}\u0000${c.name.toLowerCase()}`
    if (siblingNames.has(key)) {
      const parent = c.parentId ? `'${byId.get(c.parentId)!.name}'` : 'the top level'
      throw new CategoryServiceError(`There are two categories named '${c.name}' under ${parent}.`)
    }
    siblingNames.add(key)
  }
  store.set(catalogId, next)
  return sorted(next)
}

/** Mock only: the catalog's categories as they are now, without waiting (for other mocks). */
export function mockCategorySnapshot(catalogId: string): CategoryRecord[] {
  return categoriesOf(catalogId).map((c) => ({ ...c }))
}

/** Mock only: counts assets the mock asset service "uploaded" into a category. */
export function recordMockAssets(catalogId: string, categoryId: string, count: number) {
  const category = categoriesOf(catalogId).find((c) => c.id === categoryId)
  if (category) category.assetCount += count
}

// ---- Public API ----

/** GET /categories?catalogId=: every category in the catalog, flat. */
export async function listCategories(catalogId: string): Promise<CategoryRecord[]> {
  if (isApiEnabled()) {
    const list = await viaApi(() => apiRequest<CategoryDto[]>(`/categories?catalogId=${encodeURIComponent(catalogId)}`))
    return list.map(fromDto)
  }
  await network()
  return sorted(categoriesOf(catalogId))
}

/**
 * POST /categories/changes?catalogId=: applies a change set in one transaction and returns the
 * catalog's categories afterwards. Nothing is stored if any part is invalid.
 */
export async function saveCategoryChanges(catalogId: string, changes: CategoryChangeSet): Promise<CategoryRecord[]> {
  if (isApiEnabled()) {
    const list = await viaApi(() =>
      apiRequest<CategoryDto[]>(`/categories/changes?catalogId=${encodeURIComponent(catalogId)}`, { method: 'POST', body: changes }),
    )
    return list.map(fromDto)
  }
  await network()
  return applyMockChanges(catalogId, changes)
}
