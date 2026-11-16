import type { AssetMediaType, BrowseAsset } from './types'

/** The asset's title, or its file name when it has no title. */
export function assetTitle(asset: BrowseAsset): string {
  return asset.title?.trim() || asset.originalFilename
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const MEDIA_TYPE_LABEL: Record<AssetMediaType, string> = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  DOCUMENT: 'PDF',
}
