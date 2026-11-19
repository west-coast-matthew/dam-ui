/** One node of the hierarchy passed to TreeControl. */
export interface TreeNode {
  id: string
  label: string
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
