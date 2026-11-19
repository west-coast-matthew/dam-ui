/** The kinds of node the tree knows about. Categories hold other nodes; asset buckets hold assets. */
export type TreeNodeType = 'category' | 'assetBucket'

/** One node of the hierarchy passed to TreeControl. */
export interface TreeNode {
  id: string
  label: string
  /** Decides the node's icon, menu wording and whether it can hold children. Untyped nodes act like categories. */
  type?: TreeNodeType
  /** Number of assets in an asset bucket, shown after its label, e.g. "Dogs (234)". */
  count?: number
  /** Shown in a tooltip when the pointer rests on the node. */
  description?: string
  children?: TreeNode[]
}

/** Where a dragged node lands relative to the node it's dropped on. */
export type TreeDropPosition = 'before' | 'after' | 'inside'

/** A drag-and-drop move requested by the user. */
export interface TreeMove {
  node: TreeNode
  target: TreeNode
  position: TreeDropPosition
}
