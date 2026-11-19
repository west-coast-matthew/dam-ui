import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listCategories, saveCategoryChanges, type CategoryChangeSet } from '../../services/categoryService'

const categoriesKey = (workspaceId: string) => ['categories', workspaceId] as const

/** Every category in the workspace, flat. */
export function useCategoryList(workspaceId: string) {
  return useQuery({ queryKey: categoriesKey(workspaceId), queryFn: () => listCategories(workspaceId) })
}

/** Saves a change set in one go; the saved list replaces the cached one. */
export function useSaveCategories(workspaceId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (changes: CategoryChangeSet) => saveCategoryChanges(workspaceId, changes),
    onSuccess: (saved) => client.setQueryData(categoriesKey(workspaceId), saved),
  })
}
