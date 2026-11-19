import type { CategoryChangeSet, CategoryRecord } from '../../services/categoryService'
import { findTreeNode, type TreeNode } from '../TreeControl'

/** Prefix of ids given to categories that haven't been saved yet. */
const NEW_PREFIX = 'new-'

export const newCategoryId = () => `${NEW_PREFIX}${crypto.randomUUID()}`

/** Builds the tree from the API's flat list. */
export function toTree(records: CategoryRecord[]): TreeNode[] {
  const children = new Map<string | null, CategoryRecord[]>()
  for (const r of records) {
    const list = children.get(r.parentId) ?? []
    list.push(r)
    children.set(r.parentId, list)
  }
  const build = (parentId: string | null): TreeNode[] =>
    (children.get(parentId) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((r) => {
        const kids = build(r.id)
        return {
          id: r.id,
          label: r.name,
          description: r.description || undefined,
          ...(kids.length ? { children: kids } : {}),
        }
      })
  return build(null)
}

interface Flat {
  parentId: string | null
  position: number
  name: string
  description: string
}

/** Every node keyed by id, in tree order (parents before children). */
function flatten(nodes: TreeNode[]): Map<string, Flat> {
  const out = new Map<string, Flat>()
  const walk = (list: TreeNode[], parentId: string | null) =>
    list.forEach((n, position) => {
      out.set(n.id, { parentId, position, name: n.label, description: n.description ?? '' })
      if (n.children) walk(n.children, n.id)
    })
  walk(nodes, null)
  return out
}

/** The change set that turns `original` into `draft`. */
export function diffTrees(original: TreeNode[], draft: TreeNode[]): CategoryChangeSet {
  const before = flatten(original)
  const after = flatten(draft)
  const changes: CategoryChangeSet = { created: [], updated: [], deleted: [] }

  for (const [id, n] of after) {
    const old = before.get(id)
    if (!old) {
      changes.created.push({ tempId: id, ...n })
    } else if (old.parentId !== n.parentId || old.position !== n.position || old.name !== n.name || old.description !== n.description) {
      changes.updated.push({ id, ...n })
    }
  }
  // Only the top-most deleted categories; the API removes their descendants.
  for (const [id, old] of before) {
    if (!after.has(id) && (old.parentId === null || after.has(old.parentId))) changes.deleted.push(id)
  }
  return changes
}

export const isEmptyChangeSet = (c: CategoryChangeSet) => !c.created.length && !c.updated.length && !c.deleted.length

/** Short summary such as "2 added, 1 deleted, 3 changed". */
export function summarize(changes: CategoryChangeSet): string {
  const parts = [
    changes.created.length && `${changes.created.length} added`,
    changes.deleted.length && `${changes.deleted.length} deleted`,
    changes.updated.length && `${changes.updated.length} changed`,
  ].filter(Boolean)
  return parts.join(', ')
}

/** Whether a sibling list already uses the name (case-insensitive), ignoring one id. */
export function nameTaken(siblings: TreeNode[], name: string, exceptId?: string) {
  const lower = name.trim().toLowerCase()
  return siblings.some((s) => s.id !== exceptId && s.label.toLowerCase() === lower)
}

/** The children of `parentId`, or the top level when it is null. */
export function siblingsOf(nodes: TreeNode[], parentId: string | null): TreeNode[] {
  return parentId === null ? nodes : (findTreeNode(nodes, parentId)?.children ?? [])
}

/** Id of the node's parent, null at the top level, undefined when not found. */
export function parentIdOf(nodes: TreeNode[], id: string, parentId: string | null = null): string | null | undefined {
  for (const n of nodes) {
    if (n.id === id) return parentId
    const found = n.children ? parentIdOf(n.children, id, n.id) : undefined
    if (found !== undefined) return found
  }
  return undefined
}
