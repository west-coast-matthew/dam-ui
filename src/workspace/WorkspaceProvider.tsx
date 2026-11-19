import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { WorkspaceContext } from './WorkspaceContext'
import { INITIAL_WORKSPACES, type Workspace } from './workspaces'

function slug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'
}

/**
 * Holds the globally selected workspace. Mocked in memory for now: the list resets
 * on reload. Swap the internals for API calls once the endpoints exist.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES)
  const [currentId, setCurrentId] = useState(INITIAL_WORKSPACES[0].id)

  const createWorkspace = useCallback(
    (name: string) => {
      const base = slug(name)
      let id = base
      for (let n = 2; workspaces.some((w) => w.id === id); n++) id = `${base}-${n}`
      const workspace = { id, name: name.trim() }
      setWorkspaces((list) => [...list, workspace])
      setCurrentId(id)
      return workspace
    },
    [workspaces],
  )

  const upsertWorkspace = useCallback((workspace: Workspace) => {
    setWorkspaces((list) =>
      list.some((w) => w.id === workspace.id)
        ? list.map((w) => (w.id === workspace.id ? { ...w, name: workspace.name } : w))
        : [...list, { id: workspace.id, name: workspace.name }],
    )
  }, [])

  const value = useMemo(
    () => ({
      workspaces,
      current: workspaces.find((w) => w.id === currentId) ?? workspaces[0],
      selectWorkspace: setCurrentId,
      createWorkspace,
      upsertWorkspace,
    }),
    [workspaces, currentId, createWorkspace, upsertWorkspace],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
