import type { RecentActivity } from '../../../components/RecentActivityPanel'

const MINUTE = 60_000

/** Mock activity with times relative to `now`, so "x minutes ago" always reads naturally. */
export function mockActivity(now: number): RecentActivity {
  const ago = (minutes: number) => new Date(now - minutes * MINUTE).toISOString()
  const thumb = (n: number) => `/mock-assets/thumbs/asset-${String(n).padStart(3, '0')}-small.svg`
  return {
    uploads: [
      { id: 'u1', title: 'Golden Harbor', originalFilename: 'harbor-001.png', mediaType: 'IMAGE', fileSize: 4_812_300, status: 'PENDING_PROCESSING', catalogName: 'Brand', thumbnailUrl: null, uploadedAt: ago(1) },
      { id: 'u2', title: null, originalFilename: 'atrium-003.jpg', mediaType: 'IMAGE', fileSize: 2_204_112, status: 'READY', catalogName: 'Product photography', thumbnailUrl: thumb(3), uploadedAt: ago(12) },
      { id: 'u3', title: 'Northern Launch', originalFilename: 'launch-052.mp4', mediaType: 'VIDEO', fileSize: 184_220_400, status: 'READY', catalogName: 'Campaigns 2026', thumbnailUrl: thumb(52), uploadedAt: ago(47) },
      { id: 'u4', title: 'Bold Annual Report', originalFilename: 'annual-report-068.pdf', mediaType: 'DOCUMENT', fileSize: 3_480_000, status: 'READY', catalogName: 'Brand', thumbnailUrl: thumb(68), uploadedAt: ago(130) },
      { id: 'u5', title: null, originalFilename: 'interview-raw.mov', mediaType: 'VIDEO', fileSize: 912_400_000, status: 'FAILED', catalogName: 'Campaigns 2026', thumbnailUrl: null, uploadedAt: ago(220) },
      { id: 'u6', title: 'Quiet Ridge', originalFilename: 'ridge-002.jpg', mediaType: 'IMAGE', fileSize: 1_602_880, status: 'READY', catalogName: 'Product photography', thumbnailUrl: thumb(2), uploadedAt: ago(26 * 60) },
      { id: 'u7', title: 'Jingle v2', originalFilename: 'jingle-v2.wav', mediaType: 'AUDIO', fileSize: 8_200_000, status: 'READY', catalogName: 'Brand', thumbnailUrl: null, uploadedAt: ago(3 * 24 * 60) },
      { id: 'u8', title: null, originalFilename: 'canopy-004.png', mediaType: 'IMAGE', fileSize: 980_441, status: 'READY', catalogName: 'Brand', thumbnailUrl: thumb(4), uploadedAt: ago(9 * 24 * 60) },
    ],
    categories: [
      { id: 'c1', name: 'Spring 2026', parentName: 'Campaigns', catalogName: 'Campaigns 2026', action: 'created', occurredAt: ago(5) },
      { id: 'c2', name: 'Logos', parentName: null, catalogName: 'Brand', action: 'updated', occurredAt: ago(64) },
      { id: 'c3', name: 'Lifestyle', parentName: 'Photography', catalogName: 'Product photography', action: 'created', occurredAt: ago(5 * 60) },
      { id: 'c4', name: 'Social cut-downs', parentName: 'Video', catalogName: 'Campaigns 2026', action: 'created', occurredAt: ago(30 * 60) },
      { id: 'c2', name: 'Logos', parentName: null, catalogName: 'Brand', action: 'created', occurredAt: ago(4 * 24 * 60) },
    ],
    lightboxes: [
      { id: 'l1', title: 'Homepage hero picks', description: 'Shortlist for the spring refresh', shared: true, itemCount: 14, catalogName: 'Campaigns 2026', createdAt: ago(18) },
      { id: 'l2', title: 'Legal review', description: null, shared: false, itemCount: 3, catalogName: 'Brand', createdAt: ago(6 * 60) },
      { id: 'l3', title: 'Trade show booth', description: 'Large-format prints', shared: true, itemCount: 27, catalogName: 'Product photography', createdAt: ago(2 * 24 * 60) },
    ],
  }
}
