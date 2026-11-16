import { useEffect, useState } from 'react'
import {
  AssetBrowsePanel,
  DEFAULT_SORT,
  DEFAULT_TYPE_FILTER,
  type AssetPage,
  type AssetSort,
  type AssetTypeFilter,
  type BrowseAsset,
} from '../../../components/AssetBrowsePanel'
import { Button, SegmentedControl } from '../../../components/FormControls'
import { TitleBar } from '../../../components/TitleBar'
import { mockAssetPage, type AssetQuery } from './mockApi'
import './AssetBrowseDemo.css'

type ResponseMode = 'success' | 'slow' | 'error'

const MODE_OPTIONS: { value: ResponseMode; label: string }[] = [
  { value: 'success', label: 'Succeed' },
  { value: 'slow', label: 'Slow (4s)' },
  { value: 'error', label: 'Fail' },
]

interface LoadState {
  data: AssetPage | null
  isLoading: boolean
  isError: boolean
  hasData: boolean
}

const INITIAL: LoadState = { data: null, isLoading: true, isError: false, hasData: false }

/** Mockup page: the asset browse panel fed by a simulated API. Event handlers log to the console. */
export function AssetBrowseDemo() {
  const [query, setQuery] = useState<AssetQuery>({ page: 1, typeFilter: DEFAULT_TYPE_FILTER, sort: DEFAULT_SORT })
  const [mode, setMode] = useState<ResponseMode>('success')
  const [requestId, setRequestId] = useState(0)
  const [load, setLoad] = useState<LoadState>(INITIAL)

  // Simulated request: runs whenever the query, response mode or retry counter changes.
  // Each handler below marks the panel as loading before changing what triggers this.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (mode === 'error') {
          setLoad((s) => ({ ...s, isLoading: false, isError: true }))
        } else {
          setLoad({ data: mockAssetPage(query), isLoading: false, isError: false, hasData: true })
        }
      },
      mode === 'slow' ? 4000 : 700,
    )
    return () => clearTimeout(timer)
  }, [query, mode, requestId])

  const startLoading = () => setLoad((s) => ({ ...s, isLoading: true, isError: false }))

  const onPageChange = (page: number) => {
    console.log('[AssetBrowseDemo] onPageChange', page)
    setQuery((q) => ({ ...q, page }))
    startLoading()
  }
  const onTypeFilterChange = (typeFilter: AssetTypeFilter) => {
    console.log('[AssetBrowseDemo] onTypeFilterChange', typeFilter)
    setQuery((q) => ({ ...q, typeFilter, page: 1 }))
    startLoading()
  }
  const onSortChange = (sort: AssetSort) => {
    console.log('[AssetBrowseDemo] onSortChange', sort)
    setQuery((q) => ({ ...q, sort, page: 1 }))
    startLoading()
  }
  const onRetry = () => {
    console.log('[AssetBrowseDemo] onRetry')
    startLoading()
    setRequestId((n) => n + 1)
  }
  const onAssetOpen = (asset: BrowseAsset) => console.log('[AssetBrowseDemo] onAssetOpen', asset.id, asset.title ?? '(no title)', asset.originalFilename)

  const startOver = () => {
    console.log('[AssetBrowseDemo] start over')
    setLoad(INITIAL)
    setRequestId((n) => n + 1)
  }

  return (
    <>
      <TitleBar userName="Alex Morgan" onLogout={() => console.log('[AssetBrowseDemo] onLogout')} />
      <main className="abd-content">
        <h1>Asset browse panel</h1>
        <p className="abd-muted">
          Data comes from a simulated API on this page. Every event the panel raises is logged to the console.
        </p>

        <div className="abd-controls">
          <SegmentedControl legend="Simulated response" options={MODE_OPTIONS} value={mode}
            onChange={(m) => {
              startLoading()
              setMode(m)
            }} />
          <Button variant="secondary" onClick={startOver}>Start over (no data)</Button>
        </div>

        <AssetBrowsePanel
          title="Browse assets"
          data={load.data}
          isLoading={load.isLoading}
          isError={load.isError}
          hasData={load.hasData}
          errorMessage="The asset service didn't respond. (Simulated failure.)"
          typeFilter={query.typeFilter}
          sort={query.sort}
          onPageChange={onPageChange}
          onTypeFilterChange={onTypeFilterChange}
          onSortChange={onSortChange}
          onRetry={onRetry}
          onAssetOpen={onAssetOpen}
        />
      </main>
    </>
  )
}
