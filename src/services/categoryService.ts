// Category service: categories and the asset buckets inside them. For now it emulates the API: data lives in memory per workspace (reset on
// reload) and every call waits a random 3-5 seconds to mimic network latency. Replace the bodies with
// real requests once the UI talks to the API; callers only depend on these signatures.

/** Categories hold categories and asset buckets; asset buckets hold assets. */
export type CategoryNodeType = 'category' | 'assetBucket'

/** One category or asset bucket, as the API returns it. The hierarchy is expressed through parentId. */
export interface CategoryRecord {
  id: string
  workspaceId: string
  type: CategoryNodeType
  /** null for a top-level category. Asset buckets always have a category as parent. */
  parentId: string | null
  name: string
  /** Empty string when there is none. */
  description: string
  /** 0-based order among its siblings. */
  position: number
  /** Number of assets in an asset bucket; always 0 for a category. Read-only. */
  assetCount: number
}

/** A category or asset bucket created in this change set. Its id is temporary; `parentId` may be another temporary id. */
export interface CategoryCreate {
  tempId: string
  type: CategoryNodeType
  parentId: string | null
  name: string
  description: string
  position: number
}

/** The new state of an existing node whose name, description, parent or position changed. Its type can't change. */
export type CategoryUpdate = Pick<CategoryRecord, 'id' | 'parentId' | 'name' | 'description' | 'position'>

/** Everything a bulk save sends. It is applied all together or not at all. */
export interface CategoryChangeSet {
  /** In tree order, so a parent always comes before its children. */
  created: CategoryCreate[]
  updated: CategoryUpdate[]
  /** Ids of deleted nodes; their descendants go with them. */
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
  /** Present on asset buckets: how many assets they hold. */
  assets?: number
  children?: Seed[]
}

const SEEDS: Record<string, Seed[]> = {
  default: [
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
        { name: 'Social media', assets: 0 },
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
    { name: 'Animals', children: [{ name: 'Cats', assets: 0 }, { name: 'Dogs', assets: 234 }] },
  ],
  'workspace-1': [
    { name: 'Clients', description: 'One category per client account.', children: [{ name: 'Acme', assets: 61 }, { name: 'Globex', assets: 3 }] },
    { name: 'Internal', children: [] },
  ],
}

function seed(workspaceId: string): CategoryRecord[] {
  const out: CategoryRecord[] = []
  const walk = (list: Seed[], parentId: string | null) =>
    list.forEach((s, position) => {
      const id = crypto.randomUUID()
      const type: CategoryNodeType = s.assets === undefined ? 'category' : 'assetBucket'
      out.push({ id, workspaceId, type, parentId, name: s.name, description: s.description ?? '', position, assetCount: s.assets ?? 0 })
      if (s.children) walk(s.children, id)
    })
  walk(SEEDS[workspaceId] ?? [], null)
  return out
}

const store = new Map<string, CategoryRecord[]>()

function categoriesOf(workspaceId: string): CategoryRecord[] {
  let list = store.get(workspaceId)
  if (!list) {
    list = seed(workspaceId)
    store.set(workspaceId, list)
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

function cleanFields(name: string, description: string, type: CategoryNodeType) {
  const n = name.trim()
  const d = description.trim()
  const Noun = type === 'assetBucket' ? 'Asset bucket' : 'Category'
  if (!n) throw new CategoryServiceError(`${Noun} name is required.`)
  if (n.length > CATEGORY_NAME_MAX_LENGTH) {
    throw new CategoryServiceError(`${Noun} name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters.`)
  }
  if (d.length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
    throw new CategoryServiceError(`${Noun} description must be at most ${CATEGORY_DESCRIPTION_MAX_LENGTH} characters.`)
  }
  return { name: n, description: d }
}

/** GET /workspaces/{workspaceId}/categories: every category and asset bucket, flat, ordered by parent then position. */
export async function listCategories(workspaceId: string): Promise<CategoryRecord[]> {
  await network()
  return sorted(categoriesOf(workspaceId))
}

/**
 * POST /workspaces/{workspaceId}/categories/changes: applies a change set in one transaction and
 * returns the resulting categories. Nothing is stored if any part is invalid.
 */
export async function saveCategoryChanges(workspaceId: string, changes: CategoryChangeSet): Promise<CategoryRecord[]> {
  await network()
  const byId = new Map(categoriesOf(workspaceId).map((c) => [c.id, { ...c }]))

  // Deletes cascade to descendants.
  const doomed = new Set<string>()
  const markDeleted = (id: string) => {
    if (doomed.has(id)) return
    doomed.add(id)
    for (const c of byId.values()) if (c.parentId === id) markDeleted(c.id)
  }
  for (const id of changes.deleted) {
    if (!byId.has(id)) throw new CategoryServiceError('A category you deleted no longer exists. Reload and try again.')
    markDeleted(id)
  }
  doomed.forEach((id) => byId.delete(id))

  for (const u of changes.updated) {
    const existing = byId.get(u.id)
    if (!existing) throw new CategoryServiceError('A category you changed no longer exists. Reload and try again.')
    byId.set(u.id, { ...existing, ...cleanFields(u.name, u.description, existing.type), parentId: u.parentId, position: u.position })
  }

  const realIds = new Map<string, string>()
  const resolve = (id: string | null) => (id === null ? null : (realIds.get(id) ?? id))
  for (const c of changes.created) {
    const id = crypto.randomUUID()
    realIds.set(c.tempId, id)
    byId.set(id, {
      id, workspaceId, type: c.type, parentId: resolve(c.parentId), position: c.position, assetCount: 0,
      ...cleanFields(c.name, c.description, c.type),
    })
  }

  const next = [...byId.values()]
  for (const c of next) {
    if (c.parentId !== null && !byId.has(c.parentId)) {
      throw new CategoryServiceError(`The parent of '${c.name}' no longer exists. Reload and try again.`)
    }
    // Asset buckets live inside a category and hold no other nodes.
    if (c.type === 'assetBucket' && c.parentId === null) {
      throw new CategoryServiceError(`Asset bucket '${c.name}' must be inside a category.`)
    }
    if (c.parentId !== null && byId.get(c.parentId)!.type === 'assetBucket') {
      throw new CategoryServiceError(`'${c.name}' can't be inside asset bucket '${byId.get(c.parentId)!.name}'.`)
    }
  }
  // No cycles: walking up from any category must reach the top.
  for (const c of next) {
    const seen = new Set<string>()
    for (let p = c.parentId; p !== null; p = byId.get(p)!.parentId) {
      if (seen.has(p) || p === c.id) throw new CategoryServiceError(`'${c.name}' can't be moved inside itself.`)
      seen.add(p)
    }
  }
  // Names are unique among siblings (case-insensitive).
  const siblingNames = new Set<string>()
  for (const c of next) {
    const key = `${c.parentId ?? ''}\u0000${c.name.toLowerCase()}`
    if (siblingNames.has(key)) {
      const parent = c.parentId ? `'${byId.get(c.parentId)!.name}'` : 'the top level'
      throw new CategoryServiceError(`There are two items named '${c.name}' under ${parent}.`)
    }
    siblingNames.add(key)
  }

  store.set(workspaceId, next)
  return sorted(next)
}
