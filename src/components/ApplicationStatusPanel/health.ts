import type { ApplicationStatus, ServiceState } from '../../services/statusService'

/** Green, yellow or red. */
export type Health = 'healthy' | 'warning' | 'critical'

export const HEALTH_LABEL: Record<Health, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Down',
}

export interface Thresholds {
  /** Percent used at which storage turns yellow. */
  warning: number
  /** Percent used at which storage turns red. */
  critical: number
}

export const DEFAULT_THRESHOLDS: Thresholds = { warning: 80, critical: 95 }

export const serviceHealth = (state: ServiceState): Health => (state === 'UP' ? 'healthy' : 'critical')

export function usagePercent(used: number, total: number): number {
  return total > 0 ? Math.min(100, (used / total) * 100) : 0
}

export function storageHealth(percent: number, t: Thresholds): Health {
  if (percent >= t.critical) return 'critical'
  if (percent >= t.warning) return 'warning'
  return 'healthy'
}

/** The worst health across all dependencies. */
export function overallHealth(status: ApplicationStatus, t: Thresholds): Health {
  const parts: Health[] = [serviceHealth(status.database.state), serviceHealth(status.storageLocation.state)]
  if (status.storageUsage) parts.push(storageHealth(usagePercent(status.storageUsage.usedBytes, status.storageUsage.totalBytes), t))
  else parts.push('critical')
  return parts.includes('critical') ? 'critical' : parts.includes('warning') ? 'warning' : 'healthy'
}
