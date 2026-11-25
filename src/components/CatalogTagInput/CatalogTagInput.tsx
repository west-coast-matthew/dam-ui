import { useMemo, useState } from 'react'
import { useCatalogTags } from '../../services/useCatalogTags'
import { TagInput, type TagInputProps } from '../FormControls'

export interface CatalogTagInputProps extends Omit<TagInputProps, 'suggestions' | 'onInputChange' | 'loading'> {
  /** The catalog whose existing tags are offered. Without one, tags can still be typed. */
  catalogId: string | null | undefined
}

/** TagInput offering the catalog's existing tags (GET /tags), with how many assets carry each. */
export function CatalogTagInput({ catalogId, ...props }: CatalogTagInputProps) {
  const [text, setText] = useState('')
  const tags = useCatalogTags(catalogId, text)
  const suggestions = useMemo(() => (tags.data ?? []).map((t) => ({ name: t.name, count: t.assetCount })), [tags.data])
  return <TagInput {...props} suggestions={suggestions} onInputChange={setText} loading={tags.isFetching} />
}
