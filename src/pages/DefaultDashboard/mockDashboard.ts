import type { BrowseAsset } from '../../components/AssetBrowsePanel'
import type { RecentlyAddedAssets, UploadBatch } from '../../components/RecentlyAddedAssetsPanel'
import mockAssets from '../mockups/AssetBrowseDemo/mockAssets.json'

// Mock data until the dashboard is connected to the API. Reuses the generated thumbnails from spec 009.

const ASSETS = mockAssets as BrowseAsset[]
const HOUR = 3_600_000
const DAY = 24 * HOUR

/** The latest upload is a batch of a mix of images, a video and a PDF; times are relative to `now`. */
export function mockRecentlyAdded(now: number): RecentlyAddedAssets {
  const picks = [ASSETS[0], ASSETS[4], ASSETS[9], ASSETS[50], ASSETS[13], ASSETS[66], ASSETS[21], ASSETS[30], ASSETS[2]]
  const catalogs = ['Campaigns 2026', 'Brand', 'Product photography']
  // Batches every one to three days, going back from 40 minutes ago; more than 10 so the limit shows.
  const batches: UploadBatch[] = Array.from({ length: 13 }, (_, i) => ({
    id: `batch-${i + 1}`,
    uploadedAt: new Date(now - 40 * 60_000 - i * (1 + (i % 3)) * DAY - (i * 7 % 11) * HOUR).toISOString(),
    assetCount: i === 0 ? picks.length : 4 + ((i * 13) % 37),
    skippedCount: i % 4 === 2 ? 1 + (i % 3) : 0,
    catalogName: catalogs[i % catalogs.length],
  }))
  return {
    latest: {
      uploadedAt: batches[0].uploadedAt,
      kind: 'batch',
      catalogName: batches[0].catalogName,
      assets: picks.map((a) => ({
        id: a.id,
        title: a.title,
        originalFilename: a.originalFilename,
        mediaType: a.mediaType,
        thumbnail: a.thumbnails.small,
      })),
    },
    batches,
  }
}
