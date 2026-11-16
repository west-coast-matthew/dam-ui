import type { AssetThumbnail } from '../AssetBrowsePanel'

export type RecentAssetMediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT'

/** One asset in the latest upload. */
export interface RecentAsset {
  id: string
  title?: string | null
  originalFilename: string
  mediaType: RecentAssetMediaType
  /** The small thumbnail. */
  thumbnail: AssetThumbnail
}

/** The most recent upload operation: one asset, or a batch. */
export interface LatestUpload {
  uploadedAt: string
  kind: 'single' | 'batch'
  catalogName: string
  assets: RecentAsset[]
}

/** A past batch upload (e.g. a POST /assets/bulk). */
export interface UploadBatch {
  id: string
  uploadedAt: string
  /** Assets created by the batch. */
  assetCount: number
  /** Files in the batch that weren't imported. */
  skippedCount: number
  catalogName: string
}

export interface RecentlyAddedAssets {
  /** Null when nothing has been uploaded yet. */
  latest: LatestUpload | null
  /** Newest first. */
  batches: UploadBatch[]
}
