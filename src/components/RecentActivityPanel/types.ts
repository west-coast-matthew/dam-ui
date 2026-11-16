/** Mirrors the API's MediaType. */
export type ActivityMediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER'

/** Mirrors the API's AssetStatus. */
export type UploadStatus = 'PENDING_PROCESSING' | 'READY' | 'FAILED'

/** An asset upload, built from the API's AssetInstanceDto. */
export interface RecentUpload {
  /** The asset's id. */
  id: string
  title?: string | null
  originalFilename: string
  mediaType: ActivityMediaType
  fileSize: number
  status: UploadStatus
  catalogName: string
  /** Small thumbnail, when one has been generated. */
  thumbnailUrl?: string | null
  /** ISO date-time (the asset's createdAt). */
  uploadedAt: string
}

/**
 * A category that was created or updated, built from the API's CategoryInstanceDto.
 * The API doesn't record category timestamps yet, so occurredAt is a front-end addition.
 */
export interface RecentCategory {
  id: string
  name: string
  /** Name of the parent category; null for a top-level category. */
  parentName: string | null
  catalogName: string
  action: 'created' | 'updated'
  /** ISO date-time of the create or update. */
  occurredAt: string
}

/**
 * A newly created lightbox, built from the API's LightboxInstanceDto.
 * The API doesn't record lightbox timestamps yet, so createdAt is a front-end addition.
 */
export interface RecentLightbox {
  id: string
  title: string
  description?: string | null
  shared: boolean
  itemCount: number
  catalogName: string
  createdAt: string
}

/** Everything the panel shows. Each list should already be newest first. */
export interface RecentActivity {
  uploads: RecentUpload[]
  categories: RecentCategory[]
  lightboxes: RecentLightbox[]
}

export type ActivitySection = keyof RecentActivity

/** What onItemOpen receives: which list the item came from, and the item. */
export type ActivityItem =
  | { section: 'uploads'; item: RecentUpload }
  | { section: 'categories'; item: RecentCategory }
  | { section: 'lightboxes'; item: RecentLightbox }
