import type { TreeNode } from '../../../components/TreeControl'

/** Sample category hierarchy, as the categories API might return it. */
export const mockTree: TreeNode[] = [
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

/** Returns a copy of the tree with one node's label replaced. */
export function renameNode(nodes: TreeNode[], id: string, label: string): TreeNode[] {
  return nodes.map((n) =>
    n.id === id ? { ...n, label } : n.children ? { ...n, children: renameNode(n.children, id, label) } : n,
  )
}
