import type { RejectedFile } from './types'

/** Images, video and PDFs: the asset types the DAM generates thumbnails for. */
export const DEFAULT_ACCEPT = 'image/*,video/*,application/pdf'

export type FileKind = 'image' | 'video' | 'pdf' | 'other'

export function fileKind(file: File): FileKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf'
  return 'other'
}

/** Whether a file matches an accept string like "image/*,.pdf". Dropped files skip the picker's filter, so check them here. */
export function matchesAccept(file: File, accept: string): boolean {
  const rules = accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean)
  if (rules.length === 0) return true
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

/** Splits files into the ones to keep and the ones refused, with a reason for each refusal. */
export function screenFiles(
  files: File[],
  { accept, maxFileSize, existing }: { accept: string; maxFileSize?: number; existing: File[] },
): { accepted: File[]; rejected: RejectedFile[] } {
  const accepted: File[] = []
  const rejected: RejectedFile[] = []
  const seen = new Set(existing.map((f) => `${f.name}:${f.size}:${f.lastModified}`))
  for (const file of files) {
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (!matchesAccept(file, accept)) rejected.push({ name: file.name, reason: 'type not supported' })
    else if (maxFileSize !== undefined && file.size > maxFileSize)
      rejected.push({ name: file.name, reason: `larger than ${formatBytes(maxFileSize)}` })
    else if (file.size === 0) rejected.push({ name: file.name, reason: 'file is empty' })
    else if (seen.has(key)) rejected.push({ name: file.name, reason: 'already added' })
    else {
      seen.add(key)
      accepted.push(file)
    }
  }
  return { accepted, rejected }
}

/** "brand, launch ,  2026" -> ["brand", "launch", "2026"], without duplicates. */
export function parseTags(text: string): string[] {
  return [...new Set(text.split(',').map((t) => t.trim()).filter(Boolean))]
}
