/** Asset types the browse panel can show. Mirrors the API's MediaType (audio and other aren't browsable yet). */
export type AssetMediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT'

/** The type filter in the header. */
export type AssetTypeFilter = AssetMediaType | 'ALL'

export type AssetSort = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'largest' | 'smallest'

/** Which thumbnail the grid shows. The preview is only used in the modal. */
export type ThumbnailSize = 'small' | 'large'

export interface AssetThumbnail {
  url: string
  /** Pixel size of the thumbnail; used to reserve space and lay out the masonry columns. */
  width: number
  height: number
}

/** The three thumbnails generated for every asset. */
export interface AssetThumbnails {
  small: AssetThumbnail
  large: AssetThumbnail
  /** The largest version, shown in the preview modal. */
  preview: AssetThumbnail
}

/** One asset in the browse panel: the fields of the API's AssetInstanceDto the panel needs, plus thumbnails. */
export interface BrowseAsset {
  id: string
  /** Title given to the asset; null or empty when none has been assigned. */
  title?: string | null
  originalFilename: string
  mediaType: AssetMediaType
  mimeType: string
  fileSize: number
  /** ISO local date-time, as the API returns it. */
  createdAt: string
  thumbnails: AssetThumbnails
}

/** One page of assets. Page numbers start at 1. */
export interface AssetPage {
  items: BrowseAsset[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
