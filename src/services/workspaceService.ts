import { INITIAL_WORKSPACES } from '../workspace/workspaces'
import { ApiError, apiRequest, isApiEnabled } from './apiClient'

// Workspace service. When REACT_APP_API_URL is set it calls dam-api's /workspaces. Otherwise it
// emulates the API: data lives in memory (reset on reload) and every call waits a random 2-8 seconds
// to mimic network latency. Callers only depend on these signatures.

/** Mirrors the API's WorkspaceInstanceDto. */
export interface WorkspaceRecord {
  id: string
  name: string
  /** Empty string when there is none. */
  description: string
  /** ISO date-time. */
  createdAt: string
}

/** Fields a create or update sends. */
export type WorkspaceInput = Pick<WorkspaceRecord, 'name' | 'description'>

/** Same limits as the API's Workspace entity. */
export const WORKSPACE_NAME_MAX_LENGTH = 255
export const WORKSPACE_DESCRIPTION_MAX_LENGTH = 2000

/** Thrown when an operation is refused, e.g. a duplicate name. Its message is safe to show. */
export class WorkspaceServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkspaceServiceError'
  }
}

const MIN_DELAY_MS = 2000
const MAX_DELAY_MS = 8000

/**
 * For testing the error states: set localStorage['dam-ui.mock-workspace-failure-rate'] to a number
 * between 0 and 1 and that share of calls fails. Defaults to 0.
 */
const FAILURE_RATE_KEY = 'dam-ui.mock-workspace-failure-rate'

const DAY_MS = 24 * 60 * 60 * 1000

// Seeded with the same ids and names as the title bar's workspace list so the two agree.
let workspaces: WorkspaceRecord[] = INITIAL_WORKSPACES.map((w, i) => ({
  ...w,
  description: i === 0 ? 'Created during installation.' : '',
  createdAt: new Date(Date.now() - (INITIAL_WORKSPACES.length - i) * 30 * DAY_MS).toISOString(),
}))

function failureRate(): number {
  try {
    const rate = Number(localStorage.getItem(FAILURE_RATE_KEY))
    return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0
  } catch {
    return 0
  }
}

/** Waits 2-8 seconds, then sometimes fails if a failure rate is set. */
async function network(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  await new Promise((resolve) => setTimeout(resolve, ms))
  if (Math.random() < failureRate()) throw new Error("The workspace service didn't respond. Please try again.")
}

const copy = (w: WorkspaceRecord): WorkspaceRecord => ({ ...w })

const byName = (a: WorkspaceRecord, b: WorkspaceRecord) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

function clean(input: WorkspaceInput): WorkspaceInput {
  const name = input.name.trim()
  const description = input.description.trim()
  if (!name) throw new WorkspaceServiceError('Workspace name is required.')
  if (name.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw new WorkspaceServiceError(`Workspace name must be at most ${WORKSPACE_NAME_MAX_LENGTH} characters.`)
  }
  if (description.length > WORKSPACE_DESCRIPTION_MAX_LENGTH) {
    throw new WorkspaceServiceError(`Workspace description must be at most ${WORKSPACE_DESCRIPTION_MAX_LENGTH} characters.`)
  }
  return { name, description }
}

/** The API answers 409 for a duplicate name. */
function assertUniqueName(name: string, exceptId?: string) {
  if (workspaces.some((w) => w.name.toLowerCase() === name.toLowerCase() && w.id !== exceptId)) {
    throw new WorkspaceServiceError(`A workspace named '${name}' already exists.`)
  }
}

/** The API's WorkspaceInstanceDto as it arrives: description may be null. */
interface WorkspaceDto {
  id: string
  name: string
  description: string | null
  createdAt: string
}

const fromDto = (dto: WorkspaceDto): WorkspaceRecord => ({
  id: dto.id,
  name: dto.name,
  description: dto.description ?? '',
  createdAt: dto.createdAt,
})

/** Turns API refusals (400, 404, 409) into WorkspaceServiceErrors so the UI shows their message. */
async function viaApi<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
      throw new WorkspaceServiceError(err.status === 404 ? 'That workspace no longer exists.' : err.message)
    }
    throw err
  }
}

function find(id: string): WorkspaceRecord {
  const workspace = workspaces.find((w) => w.id === id)
  if (!workspace) throw new WorkspaceServiceError('That workspace no longer exists.')
  return workspace
}

/** GET /workspaces, sorted by name. */
export async function listWorkspaces(): Promise<WorkspaceRecord[]> {
  if (isApiEnabled()) {
    const list = await viaApi(() => apiRequest<WorkspaceDto[]>('/workspaces'))
    return list.map(fromDto).sort(byName)
  }
  await network()
  return [...workspaces].sort(byName).map(copy)
}

/** POST /workspaces */
export async function createWorkspace(input: WorkspaceInput): Promise<WorkspaceRecord> {
  if (isApiEnabled()) {
    const body = clean(input)
    return fromDto(await viaApi(() => apiRequest<WorkspaceDto>('/workspaces', { method: 'POST', body })))
  }
  await network()
  const data = clean(input)
  assertUniqueName(data.name)
  const workspace: WorkspaceRecord = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  workspaces = [...workspaces, workspace]
  return copy(workspace)
}

/** PUT /workspaces/{id}: replaces the name and description. */
export async function updateWorkspace(id: string, input: WorkspaceInput): Promise<WorkspaceRecord> {
  if (isApiEnabled()) {
    const body = clean(input)
    return fromDto(await viaApi(() => apiRequest<WorkspaceDto>(`/workspaces/${encodeURIComponent(id)}`, { method: 'PUT', body })))
  }
  await network()
  const data = clean(input)
  find(id)
  assertUniqueName(data.name, id)
  workspaces = workspaces.map((w) => (w.id === id ? { ...w, ...data } : w))
  return copy(find(id))
}
