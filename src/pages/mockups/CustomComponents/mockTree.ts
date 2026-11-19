import type { TreeNode } from '../../../components/TreeControl'

/** Sample hierarchy before node types are applied; see `typed` below. */
const raw: TreeNode[] = [
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Campaign creative, brand assets and social content.',
    children: [
      {
        id: 'campaigns',
        label: 'Campaigns',
        description: 'Grouped by campaign year.',
        children: [
          {
            id: 'campaigns-2026',
            label: '2026',
            children: [
              { id: 'spring-launch', label: 'Spring launch', description: 'Hero images and banners for the March launch.' },
              { id: 'summer-sale', label: 'Summer sale' },
              { id: 'holiday-2026', label: 'Holiday', description: 'Still in review with the brand team.' },
            ],
          },
          {
            id: 'campaigns-2025',
            label: '2025',
            children: [
              { id: 'rebrand', label: 'Rebrand', description: 'Archived after the 2026 refresh.' },
              { id: 'fall-promo', label: 'Fall promo' },
            ],
          },
        ],
      },
      {
        id: 'brand',
        label: 'Brand',
        description: 'Approved logos, colours and typography.',
        children: [
          { id: 'logos', label: 'Logos' },
          { id: 'typography', label: 'Typography' },
          { id: 'templates', label: 'Templates', description: 'Slide, document and email templates.' },
        ],
      },
      { id: 'social', label: 'Social media' },
    ],
  },
  {
    id: 'product',
    label: 'Product',
    description: 'Product photography and renders.',
    children: [
      {
        id: 'photography',
        label: 'Photography',
        children: [
          { id: 'studio', label: 'Studio', description: 'White-background studio shots.' },
          { id: 'lifestyle', label: 'Lifestyle' },
        ],
      },
      { id: 'renders', label: '3D renders' },
      { id: 'packaging', label: 'Packaging' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    children: [
      { id: 'conference', label: 'Annual conference', description: 'Stage photos, speaker headshots and recordings.' },
      { id: 'webinars', label: 'Webinars' },
    ],
  },
  { id: 'uncategorized', label: 'Uncategorized', description: 'Assets that have not been filed yet.' },
]

/** Stable pseudo-random asset count per id, so the demo looks the same on every load. */
const countFor = (id: string) => [...id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7) % 400

/** Nodes with children become categories; leaves become asset buckets with an asset count. */
const typed = (nodes: TreeNode[]): TreeNode[] =>
  nodes.map((n) =>
    n.children?.length
      ? { ...n, type: 'category', children: typed(n.children) }
      : { ...n, type: 'assetBucket', count: n.id === 'uncategorized' ? 0 : countFor(n.id) },
  )

/** Sample category hierarchy with asset buckets, as the categories API might return it. */
export const mockTree: TreeNode[] = [
  ...typed(raw.filter((n) => n.id !== 'uncategorized')),
  // Asset buckets can't be top-level, so the loose bucket lives in its own category.
  { id: 'inbox', label: 'Inbox', type: 'category', description: 'Assets waiting to be filed.', children: typed(raw.filter((n) => n.id === 'uncategorized')) },
]

/** Returns a copy of the tree with one node's label replaced. */
export function renameNode(nodes: TreeNode[], id: string, label: string): TreeNode[] {
  return nodes.map((n) =>
    n.id === id ? { ...n, label } : n.children ? { ...n, children: renameNode(n.children, id, label) } : n,
  )
}
