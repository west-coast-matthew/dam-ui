import { createContext } from 'react'
import type { Workspace } from './workspaces'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  /** The selected workspace. Its id is '' while the API's list is loading, or when there are none. */
  current: Workspace
  /** 'loading' or 'error' only apply when the list comes from the API. */
  status: 'loading' | 'ready' | 'error'
  error: unknown
  /** Fetches the workspace list again, e.g. after an error. */
  reload: () => void
  selectWorkspace: (id: string) => void
  /** Adds a workspace (through the API when one is configured), selects it and returns it. */
  createWorkspace: (name: string) => Promise<Workspace>
  /** Adds the workspace, or renames it if its id is known, without changing the selection. */
  upsertWorkspace: (workspace: Workspace) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
