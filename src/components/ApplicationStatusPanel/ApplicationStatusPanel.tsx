import { useEffect, useState, type ReactNode } from 'react'
import type { ApplicationStatus } from '../../services/statusService'
import { ErrorState } from '../ErrorState'
import { Button } from '../FormControls'
import { LoadingState } from '../LoadingState'
import { formatBytes, fullDate, timeAgo } from '../RecentActivityPanel/format'
import {
  DEFAULT_THRESHOLDS,
  overallHealth,
  serviceHealth,
  storageHealth,
  usagePercent,
  type Health,
  type Thresholds,
} from './health'
import './ApplicationStatusPanel.css'

export interface ApplicationStatusPanelProps {
  title?: string
  /** Null until the first check finishes. */
  data: ApplicationStatus | null
  isLoading: boolean
  isError: boolean
  errorMessage?: ReactNode
  /** When given, shows a refresh button (and the error state's retry button). */
  onRefresh?: () => void
  /** Percent of storage used at which it turns yellow (default 80) and red (default 95). */
  thresholds?: Partial<Thresholds>
}

const OVERALL_TEXT: Record<Health, string> = {
  healthy: 'All systems healthy',
  warning: 'Needs attention',
  critical: 'Issues detected',
}

function StatusDot({ health }: { health: Health }) {
  return <span className={`asp-dot asp-dot--${health}`} aria-hidden="true" />
}

function StatusLabel({ health, children }: { health: Health; children: ReactNode }) {
  return <span className={`asp-status asp-status--${health}`}>{children}</span>
}

interface RowProps {
  health: Health
  name: string
  detail: ReactNode
  status: string
  children?: ReactNode
}

function DependencyRow({ health, name, detail, status, children }: RowProps) {
  return (
    <li className="asp-row">
      <StatusDot health={health} />
      <div className="asp-row__main">
        <p className="asp-row__name">{name}</p>
        <p className="asp-row__detail">{detail}</p>
        {children}
      </div>
      <StatusLabel health={health}>{status}</StatusLabel>
    </li>
  )
}

/**
 * Health of the DAM's dependencies: the database, the storage location and storage space.
 * Green is healthy, red is down; storage space turns yellow at the warning threshold.
 */
export function ApplicationStatusPanel({
  title = 'Application status',
  data,
  isLoading,
  isError,
  errorMessage,
  onRefresh,
  thresholds,
}: ApplicationStatusPanelProps) {
  const t: Thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  // Ticks once a minute so "checked x minutes ago" stays current.
  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  let body: ReactNode
  if (isError) {
    body = <ErrorState size="sm" title="Couldn't check application status" message={errorMessage} onRetry={onRefresh} />
  } else if (!data) {
    body = <LoadingState size="sm" label="Checking services…" />
  } else {
    const { database, storageLocation, storageUsage } = data
    const percent = storageUsage ? usagePercent(storageUsage.usedBytes, storageUsage.totalBytes) : null
    const usage: Health = percent === null ? 'critical' : storageHealth(percent, t)
    body = (
      <ul className="asp-list">
        <DependencyRow
          health={serviceHealth(database.state)}
          name="Database"
          detail={<>{database.product} · {database.host}{database.responseTimeMs !== null && <> · {database.responseTimeMs} ms</>}</>}
          status={database.state === 'UP' ? 'Connected' : 'Unreachable'}
        />
        <DependencyRow
          health={serviceHealth(storageLocation.state)}
          name="Storage location"
          detail={<code className="asp-path">{storageLocation.path}</code>}
          status={storageLocation.state === 'DOWN' ? 'Unavailable' : storageLocation.writable ? 'Available' : 'Read-only'}
        />
        <DependencyRow
          health={usage}
          name="Storage space"
          detail={
            storageUsage && percent !== null
              ? <>{formatBytes(storageUsage.usedBytes)} of {formatBytes(storageUsage.totalBytes)} used · {formatBytes(storageUsage.totalBytes - storageUsage.usedBytes)} free</>
              : 'Unknown: the storage location can’t be read.'
          }
          status={percent === null ? 'Unknown' : `${Math.round(percent)}% used`}
        >
          {percent !== null && (
            <div
              className={`asp-meter asp-meter--${usage}`}
              role="meter"
              aria-label="Storage space used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
              aria-valuetext={`${Math.round(percent)}% used`}
            >
              <span className="asp-meter__fill" style={{ width: `${percent}%` }} />
              {/* Marks where storage turns yellow. */}
              <span className="asp-meter__threshold" style={{ left: `${t.warning}%` }} title={`Warning at ${t.warning}%`} />
            </div>
          )}
        </DependencyRow>
      </ul>
    )
  }

  const overall = data && !isError ? overallHealth(data, t) : null

  return (
    <section className="asp" aria-label={title} aria-busy={isLoading || undefined}>
      <header className="asp-header">
        <div className="asp-header__titles">
          <h2 className="asp-header__title">{title}</h2>
          {overall && (
            <p className="asp-header__summary">
              <StatusDot health={overall} />
              <span>{OVERALL_TEXT[overall]}</span>
              {data && (
                <time className="asp-header__checked" dateTime={data.checkedAt} title={fullDate(data.checkedAt)}>
                  · checked {timeAgo(data.checkedAt, Math.max(clock, Date.parse(data.checkedAt)))}
                </time>
              )}
            </p>
          )}
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} loading={isLoading && data !== null} disabled={isLoading}
            aria-label="Check status again" title="Check status again"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
              </svg>
            }
          />
        )}
      </header>
      <div className="asp-body">{body}</div>
    </section>
  )
}
