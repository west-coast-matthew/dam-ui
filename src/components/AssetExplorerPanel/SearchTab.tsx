import { useId, useMemo, useState, type FormEvent } from 'react'
import type { BrowsedAsset, TagMatch } from '../../services/assetBrowseService'
import type { CategoryRecord } from '../../services/categoryService'
import { CatalogTagInput } from '../CatalogTagInput'
import { Button, SegmentedControl, Select, TextField } from '../FormControls'
import { AssetResults, type ResultsQuery } from './AssetResults'
import { categoryOptions } from './categoryPaths'

export interface SearchTabProps {
  catalogId: string
  categories: CategoryRecord[] | undefined
  onAssetViewed: (asset: BrowsedAsset) => void
}

interface Form {
  text: string
  addedFrom: string
  addedTo: string
  tags: string[]
  tagMatch: TagMatch
  categoryId: string
}

const EMPTY: Form = { text: '', addedFrom: '', addedTo: '', tags: [], tagMatch: 'all', categoryId: '' }

const TAG_MATCH_OPTIONS: { value: TagMatch; label: string }[] = [
  { value: 'all', label: 'All tags' },
  { value: 'any', label: 'Any tag' },
]

/** Searches the catalog by file name, date added and tags, optionally within one category. */
export function SearchTab({ catalogId, categories, onAssetViewed }: SearchTabProps) {
  const formId = useId()
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitted, setSubmitted] = useState<Form | null>(null)
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(() => [{ value: '', label: 'Any category' }, ...(categories ? categoryOptions(categories) : [])], [categories])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (form.addedFrom && form.addedTo && form.addedTo < form.addedFrom) {
      setError("'Added to' can't be before 'Added from'.")
      return
    }
    setError(null)
    setSubmitted(form)
  }

  const query: ResultsQuery | null = submitted && {
    catalogId,
    text: submitted.text.trim() || undefined,
    addedFrom: submitted.addedFrom || undefined,
    addedTo: submitted.addedTo || undefined,
    tags: submitted.tags,
    tagMatch: submitted.tagMatch,
    categoryId: submitted.categoryId || null,
    includeSubcategories: Boolean(submitted.categoryId),
  }
  const filters = submitted ? describe(submitted, options) : ''

  return (
    <div className="axp-search">
      <form id={formId} className="axp-search__form" onSubmit={submit} noValidate>
        <TextField label="File name contains" placeholder="e.g. harbor" value={form.text} onChange={(e) => set('text', e.target.value)} />
        <TextField label="Added from" type="date" value={form.addedFrom} max={form.addedTo || undefined}
          onChange={(e) => set('addedFrom', e.target.value)} />
        <TextField label="Added to" type="date" value={form.addedTo} min={form.addedFrom || undefined}
          error={error ?? undefined} onChange={(e) => set('addedTo', e.target.value)} />
        <CatalogTagInput catalogId={catalogId} label="Tags" hint="Pick existing tags or type them." placeholder="e.g. brand"
          value={form.tags} onChange={(tags) => set('tags', tags)} />
        <div className="axp-search__match">
          <SegmentedControl legend="Match" options={TAG_MATCH_OPTIONS} value={form.tagMatch} onChange={(v) => set('tagMatch', v)} />
        </div>
        <Select label="Category" hint="Includes its subcategories." options={options} value={form.categoryId}
          onChange={(e) => set('categoryId', e.target.value)} />
        <div className="axp-search__actions">
          <Button type="submit">Search</Button>
          <Button variant="ghost" onClick={() => { setForm(EMPTY); setSubmitted(null); setError(null) }}>Reset</Button>
        </div>
      </form>

      {query ? (
        <AssetResults
          key={JSON.stringify(query)}
          query={query}
          heading="Search results"
          controls={<p className="axp-search__filters">{filters}</p>}
          emptyMessage="No assets match this search."
          onAssetViewed={onAssetViewed}
        />
      ) : (
        <p className="axp-empty">Set any of the filters above and choose Search. Leave them all empty to list every asset.</p>
      )}
    </div>
  )
}

function describe(f: Form, options: { value: string; label: string }[]): string {
  const parts: string[] = []
  if (f.text.trim()) parts.push(`name contains “${f.text.trim()}”`)
  if (f.addedFrom || f.addedTo) parts.push(`added ${f.addedFrom || '…'} to ${f.addedTo || '…'}`)
  const tags = f.tags
  if (tags.length) parts.push(`${f.tagMatch === 'all' && tags.length > 1 ? 'all of' : tags.length > 1 ? 'any of' : 'tag'} ${tags.join(', ')}`)
  if (f.categoryId) parts.push(`in ${options.find((o) => o.value === f.categoryId)?.label.trim() ?? 'category'}`)
  return parts.length ? `Filters: ${parts.join(' · ')}` : 'All assets'
}
