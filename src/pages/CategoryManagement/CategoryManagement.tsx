import { CategoryManagementPanel } from '../../components/CategoryManagementPanel'
import { PageHeader } from '../../layout/PageHeader'

/** Hosts the category management panel for the current workspace. */
export function CategoryManagement() {
  return (
    <>
      <PageHeader title="Categories" description="Organise the current workspace's categories and the asset buckets inside them. Changes are saved together." />
      <CategoryManagementPanel />
    </>
  )
}
