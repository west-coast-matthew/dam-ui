import { useMemo, useState } from 'react'
import type { BrowsedAsset } from '../../services/assetBrowseService'
import type { CategoryRecord } from '../../services/categoryService'
import { toTree } from '../CategoryManagementPanel/categoryTree'
import { Checkbox } from '../FormControls'
import { TreeControl } from '../TreeControl'
import { AssetResults } from './AssetResults'
import { pathNames } from './categoryPaths'

export interface BrowseTabProps {
  catalogId: string
  categories: CategoryRecord[] | undefined
  /** The category shown, owned by the panel so Recents can jump here. */
  categoryId: string | null
  onCategoryChange: (id: string) => void
  maximized: boolean
  onAssetViewed: (asset: BrowsedAsset, categoryId: string) => void
}

/** Category tree on the left; the selected category's assets on the right. */
export function BrowseTab({ catalogId, categories, categoryId, onCategoryChange, maximized, onAssetViewed }: BrowseTabProps) {
  const tree = useMemo(() => (categories ? toTree(categories) : undefined), [categories])
  const [includeSubcategories, setIncludeSubcategories] = useState(false)
  const selected = categories?.find((c) => c.id === categoryId) ?? null
  const path = selected && categories ? pathNames(categories, selected.id) : []
  // Open the chosen category's ancestors, so a category picked from Recents is visible.
  const expandedIds = path.length > 1 && categories ? ancestorsOf(categories, selected!.id) : undefined

  return (
    <div className="axp-browse">
      <div className="axp-browse__tree">
        <TreeControl
          key={catalogId}
          nodes={tree}
          label="Categories"
          loadingLabel="Loading categories…"
          selectedId={categoryId}
          defaultExpandedIds={expandedIds}
          onSelect={(node) => onCategoryChange(node.id)}
          enableSubtreeExpand
          maxHeight={maximized ? 'calc(100vh - 260px)' : 520}
          emptyMessage="This catalog has no categories."
        />
      </div>
      <div className="axp-browse__results">
        {selected ? (
          <AssetResults
            key={`${selected.id}:${includeSubcategories}`}
            query={{ catalogId, categoryId: selected.id, includeSubcategories }}
            heading={
              <span className="axp-path">
                {path.map((name, i) => (
                  <span key={i} className={i === path.length - 1 ? 'axp-path__name' : 'axp-path__ancestor'}>
                    {i > 0 && <span aria-hidden="true"> → </span>}
                    {name}
                  </span>
                ))}
              </span>
            }
            controls={
              <Checkbox
                label="Include subcategories"
                checked={includeSubcategories}
                onChange={(e) => setIncludeSubcategories(e.target.checked)}
              />
            }
            emptyMessage={includeSubcategories
              ? `There are no assets in ${selected.name} or its subcategories.`
              : `There are no assets directly in ${selected.name}.`}
            onAssetViewed={(asset) => onAssetViewed(asset, selected.id)}
          />
        ) : (
          <p className="axp-empty">{categories ? 'Choose a category to see its assets.' : ' '}</p>
        )}
      </div>
    </div>
  )
}

function ancestorsOf(records: CategoryRecord[], id: string): string[] {
  const byId = new Map(records.map((r) => [r.id, r]))
  const out: string[] = []
  for (let p = byId.get(id)?.parentId ?? null; p && out.length <= records.length; p = byId.get(p)?.parentId ?? null) out.push(p)
  return out
}
