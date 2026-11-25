import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type KeyboardEvent } from 'react'
import type { AssetSearchPage, BrowsedAsset } from '../../services/assetBrowseService'
import { updateAsset } from '../../services/assetService'
import { catalogTagsKey } from '../../services/useCatalogTags'
import { CatalogTagInput } from '../CatalogTagInput'
import { Button } from '../FormControls'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "The tags weren't saved.")

/**
 * The preview's Tags entry: the asset's tags, and an editor (PUT /assets/{id}) behind Edit tags.
 * Saving updates the cached search pages straight away and then refetches them, so the list,
 * gallery and filters agree with the server.
 */
export function AssetTagEditor({ asset }: { asset: BrowsedAsset }) {
  const client = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string[]>(asset.tags)

  const save = useMutation({
    mutationFn: (tags: string[]) => updateAsset(asset.id, { tags }),
    onSuccess: ({ tags }) => {
      client.setQueriesData<AssetSearchPage>({ queryKey: ['assetSearch'] }, (page) =>
        page && { ...page, items: page.items.map((a) => (a.id === asset.id ? { ...a, tags } : a)) },
      )
      void client.invalidateQueries({ queryKey: ['assetSearch'] })
      void client.invalidateQueries({ queryKey: catalogTagsKey(asset.catalogId) })
      setEditing(false)
    },
  })

  const start = () => {
    setDraft(asset.tags)
    save.reset()
    setEditing(true)
  }
  const cancel = () => {
    setEditing(false)
    save.reset()
  }

  // Escape leaves the editor rather than closing the preview. (TagInput handles it first while its
  // suggestion list is open.)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !save.isPending) {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    }
  }

  if (!editing) {
    return (
      <div className="axp-preview__wide axp-tags">
        <dt>Tags</dt>
        <dd>
          {asset.tags.length ? (
            <ul className="axp-tags__list" aria-label="Tags">
              {asset.tags.map((t) => <li key={t}>{t}</li>)}
            </ul>
          ) : (
            <span className="axp-tags__none">No tags</span>
          )}
          <Button variant="ghost" size="sm" onClick={start}>{asset.tags.length ? 'Edit tags' : 'Add tags'}</Button>
        </dd>
      </div>
    )
  }

  return (
    <div className="axp-preview__wide axp-tags axp-tags--editing" onKeyDown={onKeyDown}>
      <dt className="fc-visually-hidden">Tags</dt>
      <dd>
        <form
          className="axp-tags__form"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate(draft)
          }}
        >
          <CatalogTagInput
            catalogId={asset.catalogId}
            label="Tags"
            hint="Pick existing tags or type new ones; press Enter or comma to add."
            value={draft}
            onChange={setDraft}
            disabled={save.isPending}
            error={save.isError ? errorMessage(save.error) : undefined}
            autoFocus
          />
          <div className="axp-tags__actions">
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={save.isPending} onClick={cancel}>Cancel</Button>
          </div>
        </form>
      </dd>
    </div>
  )
}
