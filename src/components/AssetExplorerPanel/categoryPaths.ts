import type { CategoryRecord } from '../../services/categoryService'

/** Names from the top-level category down to `id`, e.g. ['Food', 'American', 'BBQ']. */
export function pathNames(records: CategoryRecord[], id: string): string[] {
  const byId = new Map(records.map((r) => [r.id, r]))
  const names: string[] = []
  for (let r = byId.get(id); r && names.length <= records.length; r = r.parentId ? byId.get(r.parentId) : undefined) names.unshift(r.name)
  return names
}

/** Every category in editor order, indented by depth, for a <select>. */
export function categoryOptions(records: CategoryRecord[]): { value: string; label: string }[] {
  const children = new Map<string | null, CategoryRecord[]>()
  for (const r of records) children.set(r.parentId, [...(children.get(r.parentId) ?? []), r])
  const out: { value: string; label: string }[] = []
  const walk = (parentId: string | null, depth: number) =>
    (children.get(parentId) ?? []).sort((a, b) => a.position - b.position).forEach((r) => {
      out.push({ value: r.id, label: `${' '.repeat(depth)}${r.name}` })
      walk(r.id, depth + 1)
    })
  walk(null, 0)
  return out
}
