// Shared client for the DAM REST API (../dam-api). The API's root comes from REACT_APP_API_URL,
// e.g. REACT_APP_API_URL=http://localhost:8080. When it isn't set, the services keep using their
// in-memory mocks, so the UI still runs without a backend.
//
// Under `vite` (dev) requests go to /dam-api on the UI's own origin and Vite's proxy forwards them
// to REACT_APP_API_URL (see vite.config.ts), so the API needs no CORS setup. A production build
// calls REACT_APP_API_URL directly, so the API (or a reverse proxy in front of both) must allow that.

const rawUrl = (import.meta.env.REACT_APP_API_URL ?? '').trim()

/** The API's root URL without a trailing slash, or null when no API is configured. */
export const API_URL: string | null = rawUrl ? rawUrl.replace(/\/+$/, '') : null

/** True when REACT_APP_API_URL is set and the services should call the real API. */
export const isApiEnabled = (): boolean => API_URL !== null

/** Matches API_PROXY_PREFIX in vite.config.ts. */
const DEV_PROXY_PREFIX = '/dam-api'

/** Where requests are actually sent: the dev proxy under `vite`, the API itself in a build. */
const requestBase = import.meta.env.DEV ? DEV_PROXY_PREFIX : API_URL

/** Mirrors the API's ErrorResponseVO, the body of every error response. */
export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  details: string[]
}

/** Thrown when the API answers with an error status. Its message comes from the API and is safe to show. */
export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/** Thrown when the API can't be reached at all (down, wrong URL, blocked by CORS, or the dev proxy got no answer). */
export class ApiUnreachableError extends Error {
  constructor() {
    super(`The DAM service at ${API_URL} didn't respond. Please try again.`)
    this.name = 'ApiUnreachableError'
  }
}

function isErrorResponse(body: unknown): body is ErrorResponse {
  return typeof body === 'object' && body !== null && typeof (body as ErrorResponse).message === 'string'
}

/** Ends a sentence with a full stop, as the UI's own messages do. */
const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`)

/** Builds a readable message from an error body, including validation details. */
function errorMessageFrom(status: number, body: unknown): { message: string; details: string[] } {
  if (!isErrorResponse(body)) return { message: `The DAM service answered with an error (${status}).`, details: [] }
  const details = Array.isArray(body.details) ? body.details : []
  const message = details.length ? `${sentence(body.message)} ${details.map(sentence).join(' ')}` : sentence(body.message)
  return { message, details }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Sent as JSON. */
  body?: unknown
  /** Error statuses whose body should be returned instead of thrown, e.g. 503 from /heartbeat. */
  acceptStatuses?: number[]
  signal?: AbortSignal
}

/**
 * Calls the API at `path` (e.g. '/workspaces') and returns the parsed JSON body. Throws ApiError for
 * error statuses and ApiUnreachableError when the request doesn't get an answer.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (API_URL === null) throw new Error('REACT_APP_API_URL is not set.')
  const { method = 'GET', body, acceptStatuses = [], signal } = options

  let response: Response
  try {
    response = await fetch(`${requestBase}${path}`, {
      method,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiUnreachableError()
  }

  const parsed = await readBody(response)
  // The dev proxy answers 502 with no body when the API is down; real API errors always have a body.
  if (response.status >= 500 && parsed === undefined) throw new ApiUnreachableError()
  if (response.ok || acceptStatuses.includes(response.status)) return parsed as T
  const { message, details } = errorMessageFrom(response.status, parsed)
  throw new ApiError(response.status, message, details)
}
