import { ApiError, apiRequest, isApiEnabled } from './apiClient'

// Catalog service. A workspace holds catalogs, and each catalog holds its own categories and assets.
// When REACT_APP_API_URL is set it calls dam-api's /catalogs; otherwise it returns mock catalogs.
// Callers only depend on these signatures.

/** Mirrors the API's CatalogInstanceDto. */
export interface CatalogRecord {
  id: string
  workspaceId: string
  name: string
  /** Empty string when there is none. */
  description: string
  /** ISO date-time. */
  createdAt: string
}

/** Thrown when a request is refused. Its message is safe to show. */
export class CatalogServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogServiceError'
  }
}

interface CatalogDto {
  id: string
  workspaceId: string
  name: string
  description: string | null
  createdAt: string
}

const fromDto = (dto: CatalogDto): CatalogRecord => ({ ...dto, description: dto.description ?? '' })

const byName = (a: CatalogRecord, b: CatalogRecord) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

const MOCK_LATENCY_MS = 600

/** Mock catalogs: every workspace has a main catalog, and the default workspace also has an archive. */
function mockCatalogs(workspaceId: string): CatalogRecord[] {
  const createdAt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const main: CatalogRecord = { id: `${workspaceId}:main`, workspaceId, name: 'Main catalog', description: 'Created during installation.', createdAt }
  if (workspaceId !== 'default') return [main]
  return [main, { id: `${workspaceId}:archive`, workspaceId, name: 'Archive', description: 'Retired campaigns.', createdAt }]
}

/** GET /catalogs?workspaceId=: the workspace's catalogs, sorted by name. */
export async function listCatalogs(workspaceId: string): Promise<CatalogRecord[]> {
  if (!isApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
    return mockCatalogs(workspaceId).sort(byName)
  }
  try {
    const list = await apiRequest<CatalogDto[]>(`/catalogs?workspaceId=${encodeURIComponent(workspaceId)}`)
    return list.map(fromDto).sort(byName)
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw new CatalogServiceError(err.message)
    throw err
  }
}
