import { apiRequest, isApiEnabled } from './apiClient'

/**
 * Application status: the health of the services the DAM depends on.
 * When REACT_APP_API_URL is set it comes from the API's GET /heartbeat, which reports only the
 * database's state today; the other fields are null until the API reports them.
 */

export type ServiceState = 'UP' | 'DOWN'

export interface DatabaseStatus {
  state: ServiceState
  /** e.g. "MariaDB 11.4". Null when the API doesn't report it. */
  product: string | null
  /** Null when the API doesn't report it. */
  host: string | null
  /** Round-trip time of the health query, when it succeeded. */
  responseTimeMs: number | null
}

export interface StorageLocationStatus {
  state: ServiceState
  /** The configured root directory (dam.storage.root-dir). */
  path: string
  writable: boolean
}

export interface StorageUsage {
  totalBytes: number
  usedBytes: number
}

export interface ApplicationStatus {
  /** ISO date-time of the check. */
  checkedAt: string
  database: DatabaseStatus
  /** Null when the API doesn't report storage (GET /heartbeat doesn't yet). */
  storageLocation: StorageLocationStatus | null
  /** Null when the storage location can't be read or isn't reported. */
  storageUsage: StorageUsage | null
}

/** Mock scenarios, so the demo page can show every state. */
export type MockStatusScenario = 'healthy' | 'storage-warning' | 'storage-critical' | 'database-down' | 'storage-down' | 'unreachable'

const TB = 1024 ** 4
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The API's HeartbeatVO. It answers 200 when everything is UP and 503 (same body) otherwise. */
interface HeartbeatResponse {
  status: ServiceState
  database: ServiceState
  timestamp: string
}

/** The application's current status: from GET /heartbeat when an API is configured, otherwise the healthy mock. */
export async function fetchApplicationStatus(): Promise<ApplicationStatus> {
  if (!isApiEnabled()) return mockApplicationStatus()
  const heartbeat = await apiRequest<HeartbeatResponse>('/heartbeat', { acceptStatuses: [503] })
  return {
    checkedAt: heartbeat.timestamp,
    database: { state: heartbeat.database, product: null, host: null, responseTimeMs: null },
    storageLocation: null,
    storageUsage: null,
  }
}

/** Emulates the status call so the demo page can show every state. Always mocked, even with an API configured. */
export async function mockApplicationStatus(scenario: MockStatusScenario = 'healthy', latencyMs = 700): Promise<ApplicationStatus> {
  await delay(latencyMs)
  if (scenario === 'unreachable') throw new Error("The DAM service didn't respond to the status check.")

  const usedFraction = { 'storage-warning': 0.84, 'storage-critical': 0.97 }[scenario as string] ?? 0.46
  return {
    checkedAt: new Date().toISOString(),
    database:
      scenario === 'database-down'
        ? { state: 'DOWN', product: 'MariaDB 11.4', host: 'db.internal:3306', responseTimeMs: null }
        : { state: 'UP', product: 'MariaDB 11.4', host: 'db.internal:3306', responseTimeMs: 4 },
    storageLocation: {
      state: scenario === 'storage-down' ? 'DOWN' : 'UP',
      path: '/var/lib/dam/storage',
      writable: scenario !== 'storage-down',
    },
    storageUsage: scenario === 'storage-down' ? null : { totalBytes: 4 * TB, usedBytes: Math.round(4 * TB * usedFraction) },
  }
}
