import { AssetEntryPanel } from '../../components/AssetEntryPanel'
import { RecentUploadsPanel } from '../../components/RecentUploadsPanel'
import { PageHeader } from '../../layout/PageHeader'
import './AssetManagement.css'

/** Asset management: adding assets to the current workspace (one at a time or in bulk) and its recent uploads. */
export function AssetManagement() {
  return (
    <>
      <PageHeader
        title="Asset management"
        description="Upload assets into a category of the current workspace, one at a time or in bulk."
      />
      <div className="asset-management">
        <AssetEntryPanel />
        <RecentUploadsPanel />
      </div>
    </>
  )
}
