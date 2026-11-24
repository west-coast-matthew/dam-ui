import { AssetEntryPanel } from '../../components/AssetEntryPanel'
import { PageHeader } from '../../layout/PageHeader'

/** Asset management: for now, adding assets to the current workspace, one at a time or in bulk. */
export function AssetManagement() {
  return (
    <>
      <PageHeader
        title="Asset management"
        description="Upload assets into a category of the current workspace, one at a time or in bulk."
      />
      <AssetEntryPanel />
    </>
  )
}
