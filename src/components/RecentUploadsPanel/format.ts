import type { CategoryRecord } from '../../services/categoryService'
import type { UploadFileType } from '../../services/uploadActivityService'

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' })
const absolute = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** "5 min. ago", "3 hr. ago", "yesterday". */
export function timeAgo(at: Date, now: Date): string {
  const seconds = Math.round((at.getTime() - now.getTime()) / 1000)
  if (seconds > -45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes > -60) return relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours > -24) return relative.format(hours, 'hour')
  return relative.format(Math.round(hours / 24), 'day')
}

export const fullTime = (at: Date) => absolute.format(at)

export const FILE_TYPE_LABELS: Record<UploadFileType, string> = {
  image: 'Images',
  video: 'Video',
  pdf: 'PDF',
  audio: 'Audio',
  other: 'Other',
  mixed: 'Mixed',
}

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

/** Category filter options: every category in editor order, indented by depth. */
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
