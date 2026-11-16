import { useEffect, useState } from 'react'
import { PageHeader } from '../../layout/PageHeader'
import { ApplicationStatusPanel } from '../../components/ApplicationStatusPanel'
import { RecentActivityPanel, type RecentActivity } from '../../components/RecentActivityPanel'
import { RecentlyAddedAssetsPanel, type RecentlyAddedAssets } from '../../components/RecentlyAddedAssetsPanel'
import { fetchApplicationStatus, type ApplicationStatus } from '../../services/statusService'
import { useWorkspace } from '../../workspace/useWorkspace'
import { mockActivity } from '../mockups/RecentActivityDemo/mockActivity'
import { mockRecentlyAdded } from './mockDashboard'
import './DefaultDashboard.css'

interface DashboardData {
  recentlyAdded: RecentlyAddedAssets
  activity: RecentActivity
}

interface LoadState {
  data: DashboardData | null
  isLoading: boolean
  isError: boolean
}

/** The page users land on after signing in: a high-level overview of the workspace. */
export function DefaultDashboard() {
  const { current } = useWorkspace()
  const [requestId, setRequestId] = useState(0)
  const [load, setLoad] = useState<LoadState>({ data: null, isLoading: true, isError: false })

  // Simulated request until the API is connected.
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = Date.now()
      setLoad({ data: { recentlyAdded: mockRecentlyAdded(now), activity: mockActivity(now) }, isLoading: false, isError: false })
    }, 600)
    return () => clearTimeout(timer)
  }, [requestId])

  // Application status is its own (mock) API call, so it loads and refreshes independently.
  const [statusRequest, setStatusRequest] = useState(0)
  const [status, setStatus] = useState<{ data: ApplicationStatus | null; isLoading: boolean; error: string | null }>({
    data: null,
    isLoading: true,
    error: null,
  })
  useEffect(() => {
    let cancelled = false
    fetchApplicationStatus().then(
      (data) => !cancelled && setStatus({ data, isLoading: false, error: null }),
      (err: unknown) =>
        !cancelled && setStatus((s) => ({ ...s, isLoading: false, error: err instanceof Error ? err.message : String(err) })),
    )
    return () => {
      cancelled = true
    }
  }, [statusRequest])
  const refreshStatus = () => {
    setStatus((s) => ({ ...s, isLoading: true, error: null }))
    setStatusRequest((n) => n + 1)
  }

  const onRetry = () => {
    setLoad({ data: null, isLoading: true, isError: false })
    setRequestId((n) => n + 1)
  }

  return (
    <>
      <PageHeader title="Dashboard" description={`An overview of recent work in ${current.name}.`} />
      <div className="dashboard-grid">
        <div className="dashboard-grid__one">
          <RecentlyAddedAssetsPanel
            data={load.data?.recentlyAdded ?? null}
            isLoading={load.isLoading}
            isError={load.isError}
            onRetry={onRetry}
            onAssetOpen={(asset) => console.log('[DefaultDashboard] open asset', asset.id, asset.originalFilename)}
            onBatchOpen={(batch) => console.log('[DefaultDashboard] open batch', batch.id, batch.uploadedAt)}
          />
          <ApplicationStatusPanel
            data={status.data}
            isLoading={status.isLoading}
            isError={status.error !== null}
            errorMessage={status.error}
            onRefresh={refreshStatus}
          />
        </div>
        <div className="dashboard-grid__two">
          <RecentActivityPanel
            title="Recent activity"
            data={load.data?.activity ?? null}
            isLoading={load.isLoading}
            isError={load.isError}
            onRetry={onRetry}
            onItemOpen={({ section, item }) => console.log('[DefaultDashboard] open activity', section, item.id)}
            onViewAll={(section) => console.log('[DefaultDashboard] view all', section)}
          />
        </div>
      </div>
    </>
  )
}
