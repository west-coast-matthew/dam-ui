/** One node of the hierarchy passed to TreeControl. */
export interface TreeNode {
  id: string
  label: string
  /** Shown in a tooltip when the pointer rests on the node. */
  description?: string
  children?: TreeNode[]
}
