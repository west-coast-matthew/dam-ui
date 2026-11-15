export interface Workspace {
  id: string
  name: string
}

/** Mock workspaces until the API provides them. */
export const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'default', name: 'Default' },
  { id: 'workspace-1', name: 'Workspace 1' },
  { id: 'workspace-2', name: 'Workspace 2' },
]
