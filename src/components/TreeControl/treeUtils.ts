import type { TreeDropPosition, TreeNode } from './types'

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

/** Ids of the node and all its descendants. */
export function subtreeIds(node: TreeNode, out: Set<string> = new Set()): Set<string> {
  out.add(node.id)
  node.children?.forEach((c) => subtreeIds(c, out))
  return out
}

/** Number of descendants below the node. */
export const descendantCount = (node: TreeNode) => subtreeIds(node).size - 1

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

// Immutable helpers a parent can use to apply the tree's events to its own data.

/** Finds a node by id. */
export function findTreeNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = n.children && findTreeNode(n.children, id)
    if (found) return found
  }
  return undefined
}

/** Returns a copy of the tree with one node's fields replaced. */
export function updateTreeNode(nodes: TreeNode[], id: string, patch: Partial<Omit<TreeNode, 'id' | 'children'>>): TreeNode[] {
  return nodes.map((n) =>
    n.id === id ? { ...n, ...patch } : n.children ? { ...n, children: updateTreeNode(n.children, id, patch) } : n,
  )
}

/** Returns a copy of the tree without the node (and its descendants). */
export function removeTreeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeTreeNode(n.children, id) } : n))
}

/** Returns a copy of the tree with `node` added as the last child of `parentId`, or as a root when it is null. */
export function appendTreeNode(nodes: TreeNode[], parentId: string | null, node: TreeNode): TreeNode[] {
  if (parentId === null) return [...nodes, node]
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children ?? []), node] }
      : n.children ? { ...n, children: appendTreeNode(n.children, parentId, node) } : n,
  )
}

/**
 * Returns a copy of the tree with `nodeId` moved before, after or inside `targetId`.
 * Moving a node into itself or one of its descendants returns the tree unchanged.
 */
export function moveTreeNode(nodes: TreeNode[], nodeId: string, targetId: string, position: TreeDropPosition): TreeNode[] {
  const node = findTreeNode(nodes, nodeId)
  if (!node || subtreeIds(node).has(targetId)) return nodes
  const without = removeTreeNode(nodes, nodeId)
  if (position === 'inside') return appendTreeNode(without, targetId, node)

  const insert = (list: TreeNode[]): TreeNode[] => {
    const i = list.findIndex((n) => n.id === targetId)
    if (i >= 0) {
      const copy = [...list]
      copy.splice(position === 'before' ? i : i + 1, 0, node)
      return copy
    }
    return list.map((n) => (n.children ? { ...n, children: insert(n.children) } : n))
  }
  return insert(without)
}
