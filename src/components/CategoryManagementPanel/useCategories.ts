import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listCatalogs } from '../../services/catalogService'
import { listCategories, saveCategoryChanges, type CategoryChangeSet } from '../../services/categoryService'

const categoriesKey = (catalogId: string) => ['categories', catalogId] as const

/** The workspace's catalogs, sorted by name. */
export function useCatalogList(workspaceId: string) {
  return useQuery({ queryKey: ['catalogs', workspaceId], queryFn: () => listCatalogs(workspaceId), enabled: workspaceId !== '' })
}

/** Every category in the catalog, flat. */
export function useCategoryList(catalogId: string) {
  return useQuery({ queryKey: categoriesKey(catalogId), queryFn: () => listCategories(catalogId), enabled: catalogId !== '' })
}

/** Saves a change set in one go; the saved list replaces the cached one. */
export function useSaveCategories(catalogId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (changes: CategoryChangeSet) => saveCategoryChanges(catalogId, changes),
    onSuccess: (saved) => client.setQueryData(categoriesKey(catalogId), saved),
  })
}
