import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { isApiEnabled } from '../services/apiClient'
import { createWorkspace as createWorkspaceRecord, listWorkspaces } from '../services/workspaceService'
import { WorkspaceContext, type WorkspaceContextValue } from './WorkspaceContext'
import { INITIAL_WORKSPACES, type Workspace } from './workspaces'

/** Same key as the workspace management panel's list, so both share one cached copy. */
const WORKSPACE_LIST_KEY = ['workspaces', 'list'] as const

/** Stands in for the current workspace until the API's list arrives (or when it's empty). */
const NO_WORKSPACE: Workspace = { id: '', name: 'No workspace' }

const SELECTED_KEY = 'dam-ui.selected-workspace'

function rememberedId(): string | null {
  try {
    return localStorage.getItem(SELECTED_KEY)
  } catch {
    return null
  }
}

function remember(id: string) {
  try {
    localStorage.setItem(SELECTED_KEY, id)
  } catch {
    // The selection just won't survive a reload.
  }
}

function slug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'
}

/**
 * Holds the globally selected workspace. With REACT_APP_API_URL set the list comes from the API
 * (GET /workspaces) and new workspaces are created there; otherwise it is mocked in memory and
 * resets on reload. The selection is remembered in this browser.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const api = isApiEnabled()
  const client = useQueryClient()
  const query = useQuery({ queryKey: WORKSPACE_LIST_KEY, queryFn: listWorkspaces, enabled: api })
  const [mockList, setMockList] = useState<Workspace[]>(INITIAL_WORKSPACES)
  const [currentId, setCurrentId] = useState<string | null>(rememberedId)

  const workspaces = useMemo<Workspace[]>(
    () => (api ? (query.data ?? []).map((w) => ({ id: w.id, name: w.name })) : mockList),
    [api, query.data, mockList],
  )

  const selectWorkspace = useCallback((id: string) => {
    setCurrentId(id)
    remember(id)
  }, [])

  const createWorkspace = useCallback(
    async (name: string): Promise<Workspace> => {
      if (api) {
        const saved = await createWorkspaceRecord({ name, description: '' })
        await client.invalidateQueries({ queryKey: ['workspaces'] })
        selectWorkspace(saved.id)
        return { id: saved.id, name: saved.name }
      }
      const base = slug(name)
      let id = base
      for (let n = 2; mockList.some((w) => w.id === id); n++) id = `${base}-${n}`
      const workspace = { id, name: name.trim() }
      setMockList((list) => [...list, workspace])
      selectWorkspace(id)
      return workspace
    },
    [api, client, mockList, selectWorkspace],
  )

  const upsertWorkspace = useCallback(
    (workspace: Workspace) => {
      // With the API, the shared query refreshes the list after a save.
      if (api) return
      setMockList((list) =>
        list.some((w) => w.id === workspace.id)
          ? list.map((w) => (w.id === workspace.id ? { ...w, name: workspace.name } : w))
          : [...list, { id: workspace.id, name: workspace.name }],
      )
    },
    [api],
  )

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      current: workspaces.find((w) => w.id === currentId) ?? workspaces[0] ?? NO_WORKSPACE,
      status: !api || query.data ? 'ready' : query.isError ? 'error' : 'loading',
      error: query.error,
      reload: () => void query.refetch(),
      selectWorkspace,
      createWorkspace,
      upsertWorkspace,
    }),
    [workspaces, currentId, api, query, selectWorkspace, createWorkspace, upsertWorkspace],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
