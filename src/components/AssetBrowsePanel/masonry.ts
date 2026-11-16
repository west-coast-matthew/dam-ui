import type { AssetThumbnail } from './types'

/** How many columns of roughly `columnWidth` fit in `width`. */
export function columnCount(width: number, columnWidth: number, gap: number): number {
  return Math.max(1, Math.floor((width + gap) / (columnWidth + gap)))
}

/**
 * Splits items into columns, always adding to the shortest column, so portrait and landscape
 * thumbnails pack tightly while keeping roughly left-to-right, top-to-bottom order.
 */
export function distribute<T>(items: T[], columns: number, thumb: (item: T) => AssetThumbnail): T[][] {
  const result: T[][] = Array.from({ length: columns }, () => [])
  const heights = new Array<number>(columns).fill(0)
  for (const item of items) {
    const { width, height } = thumb(item)
    let shortest = 0
    for (let c = 1; c < columns; c++) if (heights[c] < heights[shortest]) shortest = c
    result[shortest].push(item)
    // Height relative to column width, so all thumbnail sizes compare equally.
    heights[shortest] += width > 0 ? height / width : 1
  }
  return result
}
