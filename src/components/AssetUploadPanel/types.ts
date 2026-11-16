/** Whether the user is adding one asset or several at once. */
export type UploadMode = 'single' | 'multiple'

export interface UploadCatalogOption {
  id: string
  name: string
}

/** One file to upload, with the title the user gave it (if any). */
export interface AssetUploadItem {
  file: File
  /** Optional title; null when the user left it blank, so the file name is shown instead. */
  title: string | null
}

/**
 * What the panel hands to its parent when the user commits. The parent does the upload,
 * e.g. one POST /assets per item with the shared details in the "asset" part.
 */
export interface AssetUploadRequest {
  mode: UploadMode
  items: AssetUploadItem[]
  /** Set when the panel was given catalogs to choose from. */
  catalogId: string | null
  tags: string[]
  versioningEnabled: boolean
}

/** A file the panel refused, and why. */
export interface RejectedFile {
  name: string
  reason: string
}
