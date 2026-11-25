import { ApiError, apiRequest, isApiEnabled } from './apiClient'
import { recordMockAssets } from './categoryService'
import { setMockAssetTags, recordMockUploadTags, normalizeTags } from './tagService'
import { recordMockUpload, type UploadFileType } from './uploadActivityService'

// Asset service. With REACT_APP_API_URL set it calls dam-api's POST /assets (multipart: an "asset"
// JSON part and the "file") and PUT /assets/{id}; otherwise it emulates the upload with a delay based
// on the file size, and edits in memory.
// Callers only depend on these signatures.

export const ASSET_TITLE_MAX_LENGTH = 255
export const ASSET_DESCRIPTION_MAX_LENGTH = 2000

/** One file to upload as a new asset. */
export interface AssetCreate {
  catalogId: string
  /** The category the asset goes into. */
  categoryId: string
  file: File
  /** Shown instead of the file name. Empty means none. */
  title: string
  /** Empty means none. */
  description: string
  versioningEnabled: boolean
  /** Tag names; unknown ones are created in the catalog. Optional, none by default. */
  tags?: string[]
}

/** The new asset, as the API returns it (the fields the UI uses). */
export interface AssetRecord {
  id: string
  catalogId: string
  originalFilename: string
  fileSize: number
  categoryIds: string[]
  title: string
  description: string
  tags: string[]
}

/** Metadata changes for PUT /assets/{id}. Fields left out stay as they are. */
export interface AssetUpdate {
  /** Replaces every tag; [] removes them all. */
  tags?: string[]
}

/** Thrown when the API refuses an upload, e.g. an unsupported type. Its message is safe to show. */
export class AssetServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssetServiceError'
  }
}

/** The API's AssetInstanceDto. Title and description travel in customMetadata, since the API has no fields for them. */
interface AssetDto {
  id: string
  catalogId: string
  originalFilename: string | null
  fileSize: number | null
  categoryIds: string[] | null
  customMetadata: Record<string, unknown> | null
  tags: string[] | null
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

const fromDto = (dto: AssetDto): AssetRecord => ({
  id: dto.id,
  catalogId: dto.catalogId,
  originalFilename: dto.originalFilename ?? '',
  fileSize: dto.fileSize ?? 0,
  categoryIds: dto.categoryIds ?? [],
  title: text(dto.customMetadata?.title),
  description: text(dto.customMetadata?.description),
  tags: dto.tags ?? [],
})

// ---- Mock ----

/**
 * For testing the error states: set localStorage['dam-ui.mock-asset-failure-rate'] to a number
 * between 0 and 1 and that share of uploads fails. Defaults to 0.
 */
const FAILURE_RATE_KEY = 'dam-ui.mock-asset-failure-rate'

function failureRate(): number {
  try {
    const rate = Number(localStorage.getItem(FAILURE_RATE_KEY))
    return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0
  } catch {
    return 0
  }
}

/** Waits like a network upload would: 0.6-1.2 s plus about 1 s per 20 MB. Rejects if aborted. */
function mockTransfer(bytes: number, signal?: AbortSignal): Promise<void> {
  const ms = 600 + Math.random() * 600 + (bytes / (20 * 1024 * 1024)) * 1000
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('The upload was cancelled.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}

function mockFileType(file: File): UploadFileType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf'
  return 'other'
}

async function mockUpload(asset: AssetCreate, signal?: AbortSignal): Promise<AssetRecord> {
  await mockTransfer(asset.file.size, signal)
  if (Math.random() < failureRate()) throw new Error("The upload didn't complete. Please try again.")
  const tags = normalizeTags(asset.tags ?? [])
  recordMockAssets(asset.catalogId, asset.categoryId, 1)
  recordMockUploadTags(asset.catalogId, tags)
  recordMockUpload(asset.catalogId, asset.categoryId, mockFileType(asset.file))
  return {
    id: crypto.randomUUID(),
    catalogId: asset.catalogId,
    originalFilename: asset.file.name,
    fileSize: asset.file.size,
    categoryIds: [asset.categoryId],
    title: asset.title.trim(),
    description: asset.description.trim(),
    tags,
  }
}

// ---- Public API ----

/** POST /assets: uploads one file as a new asset in the given category. */
export async function uploadAsset(asset: AssetCreate, options: { signal?: AbortSignal } = {}): Promise<AssetRecord> {
  if (!isApiEnabled()) return mockUpload(asset, options.signal)

  const title = asset.title.trim()
  const description = asset.description.trim()
  const metadata: Record<string, string> = {}
  if (title) metadata.title = title
  if (description) metadata.description = description

  const form = new FormData()
  const part = {
    catalogId: asset.catalogId,
    versioningEnabled: asset.versioningEnabled,
    categoryIds: [asset.categoryId],
    customMetadata: metadata,
    tags: normalizeTags(asset.tags ?? []),
  }
  form.append('asset', new Blob([JSON.stringify(part)], { type: 'application/json' }))
  form.append('file', asset.file, asset.file.name)

  try {
    const dto = await apiRequest<AssetDto>('/assets', { method: 'POST', body: form, signal: options.signal })
    return fromDto(dto)
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw new AssetServiceError(err.message)
    if (err instanceof ApiError) {
      // The API hides server faults behind a generic message; say what was being done.
      throw new AssetServiceError(
        `The DAM service couldn't store the file (error ${err.status}). Check that its storage folder exists and is writable.`,
      )
    }
    throw err
  }
}

/** The API's 4xx messages are safe to show; for server faults say what was being done. */
function updateError(err: unknown): unknown {
  if (err instanceof ApiError && err.status >= 400 && err.status < 500) return new AssetServiceError(err.message)
  if (err instanceof ApiError) return new AssetServiceError(`The DAM service couldn't save the asset (error ${err.status}). Please try again.`)
  return err
}

/** PUT /assets/{id}: changes the asset's metadata and returns its tags as saved. */
export async function updateAsset(id: string, patch: AssetUpdate, options: { signal?: AbortSignal } = {}): Promise<{ tags: string[] }> {
  const tags = patch.tags === undefined ? undefined : normalizeTags(patch.tags)
  if (!isApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 300))
    if (Math.random() < failureRate()) throw new AssetServiceError("The changes weren't saved. Please try again.")
    if (tags) setMockAssetTags(id, tags)
    return { tags: tags ?? [] }
  }
  try {
    const dto = await apiRequest<AssetDto>(`/assets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { tags },
      signal: options.signal,
    })
    return { tags: dto.tags ?? [] }
  } catch (err) {
    throw updateError(err)
  }
}
