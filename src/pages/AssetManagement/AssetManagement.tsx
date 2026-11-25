import { AssetEntryPanel } from '../../components/AssetEntryPanel'
import { AssetExplorerPanel } from '../../components/AssetExplorerPanel'
import { RecentUploadsPanel } from '../../components/RecentUploadsPanel'
import { PageHeader } from '../../layout/PageHeader'
import './AssetManagement.css'

/** Asset management: browsing the current workspace's assets, adding new ones (one at a time or in bulk) and recent uploads. */
export function AssetManagement() {
  return (
    <>
      <PageHeader
        title="Asset management"
        description="Browse and search the current workspace's assets, upload new ones, and see recent uploads."
      />
      <div className="asset-management">
        <AssetExplorerPanel />
        <AssetEntryPanel />
        <RecentUploadsPanel />
      </div>
    </>
  )
}
