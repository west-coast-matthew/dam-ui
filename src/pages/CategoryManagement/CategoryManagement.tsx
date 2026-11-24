import { CategoryManagementPanel } from '../../components/CategoryManagementPanel'
import { PageHeader } from '../../layout/PageHeader'

/** Hosts the category management panel for a catalog in the current workspace. */
export function CategoryManagement() {
  return (
    <>
      <PageHeader title="Categories" description="Organise the categories of a catalog in the current workspace. Changes are saved together." />
      <CategoryManagementPanel />
    </>
  )
}
