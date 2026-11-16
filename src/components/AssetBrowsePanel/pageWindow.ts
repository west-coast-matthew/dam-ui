/** Page numbers to show around the current page, with null for a gap. */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: (number | null)[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(null)
    result.push(p)
  })
  return result
}
