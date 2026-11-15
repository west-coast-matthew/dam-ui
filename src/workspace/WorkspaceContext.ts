import { createContext } from 'react'
import type { Workspace } from './workspaces'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  current: Workspace
  selectWorkspace: (id: string) => void
  /** Adds a workspace, selects it and returns it. */
  createWorkspace: (name: string) => Workspace
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
