import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AssetTile } from './AssetTile'
import { columnCount, distribute } from './masonry'
import { COLUMN_WIDTH } from './options'
import type { BrowseAsset, ThumbnailSize } from './types'

const GAP = 16

export interface AssetMasonryProps {
  items: BrowseAsset[]
  size: ThumbnailSize
  onOpen: (asset: BrowseAsset) => void
}

/** Pinterest-style layout: a flex row of columns, each a flex column of variable-height tiles. */
export function AssetMasonry({ items, size, onOpen }: AssetMasonryProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const columns = useMemo(
    () => distribute(items, columnCount(width, COLUMN_WIDTH[size], GAP), (a) => a.thumbnails[size]),
    [items, width, size],
  )

  return (
    <div ref={ref} className="abp-masonry" style={{ gap: GAP }}>
      {width > 0 &&
        columns.map((column, c) => (
          <ul key={c} className="abp-masonry__column" style={{ gap: GAP }}>
            {column.map((asset) => (
              <li key={asset.id}>
                <AssetTile asset={asset} size={size} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
