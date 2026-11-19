import { createContext } from 'react'
import type { Workspace } from './workspaces'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  current: Workspace
  selectWorkspace: (id: string) => void
  /** Adds a workspace, selects it and returns it. */
  createWorkspace: (name: string) => Workspace
  /** Adds the workspace, or renames it if its id is known, without changing the selection. */
  upsertWorkspace: (workspace: Workspace) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
