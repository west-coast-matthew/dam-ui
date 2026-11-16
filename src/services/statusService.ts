/**
 * Application status: the health of the services the DAM depends on.
 * The real API's GET /heartbeat reports the database today; storage details will need adding there.
 */

export type ServiceState = 'UP' | 'DOWN'

export interface DatabaseStatus {
  state: ServiceState
  /** e.g. "MariaDB 11.4" */
  product: string
  host: string
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
  storageLocation: StorageLocationStatus
  /** Null when the storage location can't be read. */
  storageUsage: StorageUsage | null
}

/** Mock scenarios, so the demo page can show every state. */
export type MockStatusScenario = 'healthy' | 'storage-warning' | 'storage-critical' | 'database-down' | 'storage-down' | 'unreachable'

const TB = 1024 ** 4
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Emulates the status call to the API. Replace the body with a real request once the API reports
 * storage alongside the database; callers only depend on the signature.
 */
export async function fetchApplicationStatus(scenario: MockStatusScenario = 'healthy', latencyMs = 700): Promise<ApplicationStatus> {
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
