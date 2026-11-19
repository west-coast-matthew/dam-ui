import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createWorkspace,
  listWorkspaces,
  updateWorkspace,
  type WorkspaceInput,
} from '../../services/workspaceService'
import { useWorkspace } from '../../workspace/useWorkspace'

const WORKSPACES = ['workspaces'] as const

/** Every workspace, sorted by name. */
export function useWorkspaceList() {
  return useQuery({ queryKey: [...WORKSPACES, 'list'], queryFn: listWorkspaces })
}

/**
 * Creates a workspace (no id) or updates one, then refreshes the list and passes the
 * new name to the title bar's workspace menu.
 */
export function useSaveWorkspace() {
  const client = useQueryClient()
  const { upsertWorkspace } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: WorkspaceInput }) =>
      id ? updateWorkspace(id, input) : createWorkspace(input),
    onSuccess: (saved) => {
      upsertWorkspace({ id: saved.id, name: saved.name })
      return client.invalidateQueries({ queryKey: WORKSPACES })
    },
  })
}
