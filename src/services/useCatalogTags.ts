import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { listTags } from './tagService'

/** Query key prefix for a catalog's tag list; invalidate it after tags change. */
export const catalogTagsKey = (catalogId: string) => ['tags', catalogId] as const

/** Waits until `value` has stopped changing for `ms`. */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return settled
}

/** The catalog's tags containing `q` (debounced), for TagInput suggestions. Disabled without a catalog. */
export function useCatalogTags(catalogId: string | null | undefined, q = '') {
  const text = useDebounced(q.trim(), 200)
  return useQuery({
    queryKey: [...catalogTagsKey(catalogId ?? ''), text],
    queryFn: ({ signal }) => listTags(catalogId!, { q: text, signal }),
    enabled: Boolean(catalogId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
