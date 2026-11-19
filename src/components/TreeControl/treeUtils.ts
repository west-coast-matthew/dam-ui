import type { TreeNode } from './types'

export interface VisibleNode {
  node: TreeNode
  level: number
  parentId: string | null
  /** 1-based position among siblings, and sibling count, for aria-posinset / aria-setsize. */
  posInSet: number
  setSize: number
}

export const hasChildren = (node: TreeNode) => (node.children?.length ?? 0) > 0

/** Ids of every node in the tree that has children. */
export function allParentIds(nodes: TreeNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (hasChildren(n)) {
      out.push(n.id)
      allParentIds(n.children!, out)
    }
  }
  return out
}

/** Ids of the node and every descendant that has children. */
export function subtreeParentIds(node: TreeNode): string[] {
  return allParentIds([node])
}

/** The nodes currently on screen, in display order. */
export function visibleNodes(nodes: TreeNode[], expanded: ReadonlySet<string>): VisibleNode[] {
  const out: VisibleNode[] = []
  const walk = (list: TreeNode[], level: number, parentId: string | null) => {
    list.forEach((node, i) => {
      out.push({ node, level, parentId, posInSet: i + 1, setSize: list.length })
      if (hasChildren(node) && expanded.has(node.id)) walk(node.children!, level + 1, node.id)
    })
  }
  walk(nodes, 1, null)
  return out
}
