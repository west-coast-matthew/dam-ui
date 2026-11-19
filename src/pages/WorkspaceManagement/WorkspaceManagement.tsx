import { WorkspaceManagementPanel } from '../../components/WorkspaceManagementPanel'
import { PageHeader } from '../../layout/PageHeader'

/** Hosts the workspace management panel. */
export function WorkspaceManagement() {
  return (
    <>
      <PageHeader title="Workspace management" description="Create workspaces and change their name and description." />
      <WorkspaceManagementPanel />
    </>
  )
}
