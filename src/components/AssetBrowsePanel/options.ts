import type { AssetSort, AssetTypeFilter, ThumbnailSize } from './types'

/** The type filter starts on images. */
export const DEFAULT_TYPE_FILTER: AssetTypeFilter = 'IMAGE'
export const DEFAULT_SORT: AssetSort = 'newest'

export const TYPE_FILTER_OPTIONS: { value: AssetTypeFilter; label: string }[] = [
  { value: 'IMAGE', label: 'Images' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'DOCUMENT', label: 'PDFs' },
  { value: 'ALL', label: 'All' },
]

export const SORT_OPTIONS: { value: AssetSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'largest', label: 'Largest file' },
  { value: 'smallest', label: 'Smallest file' },
]

export const THUMBNAIL_SIZE_OPTIONS: { value: ThumbnailSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'large', label: 'Large' },
]

/** Target column width for each thumbnail size, in pixels. */
export const COLUMN_WIDTH: Record<ThumbnailSize, number> = { small: 200, large: 300 }
