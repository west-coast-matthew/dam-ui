status: completed

# 026 — Asset tagging support

## Summary

Users need to associate tags with assets when uploading a single asset, during bulk upload (the selected tags are applied to every asset in the batch), and when editing a single asset from the browse panel. The API already accepts `tags` (a list of tag names) on `POST /assets`, `POST /assets/bulk` and `PUT /assets/{id}`, and dam-api spec 023 adds `GET /tags?catalogId=&q=&limit=` (returns `{ id, name, assetCount }[]`) for listing a catalog's existing tags.

Today `AssetUploadPanel` only has a free-text comma-separated tags field, the bulk upload flow in `AssetEntryPanel` has no tags at all, and `AssetPreviewModal` shows tags read-only.

## Requirements

1. **Tag service**: add `src/services/tagService.ts` with `listTags(catalogId, { q?, limit? })` that calls `GET /tags`, with an in-memory mock used when `REACT_APP_API_URL` is unset (consistent with the other services). Add a React Query hook (e.g. `useCatalogTags(catalogId, q)`).
2. **TagInput form control**: add a reusable `TagInput` to `src/components/FormControls`:
   - Selected tags show as removable chips. Typing filters suggestions from the catalog's existing tags, and Enter or a comma adds the typed text as a new tag.
   - Matching is case-insensitive and duplicates are ignored. Backspace in an empty input removes the last chip.
   - Keyboard accessible: arrow keys move through suggestions, Enter selects, Escape closes. It uses the existing form control styling and theme tokens, and supports `label`, `hint`, `error` and `disabled` like the other fields.
   - Add it to the `FormControlPalette` mockup page.
3. **Single asset upload**: replace the comma-separated tags text field in `AssetUploadPanel` with `TagInput`, scoped to the selected catalog. The chosen tags are sent as `tags` on the create request.
4. **Bulk upload**: add a `TagInput` to `AssetEntryPanel`, scoped to the selected catalog. The selected tags are applied to every asset in the batch, shown in the review step of `ConfirmPanel`, and sent with each upload request. Changing the workspace or catalog clears the selected tags.
5. **Edit a single asset**: in the browse panel (`AssetExplorerPanel` → `AssetPreviewModal`), add an edit mode for tags. It shows the asset's tags in a `TagInput` with Save/Cancel, and Save calls `PUT /assets/{id}` with `{ tags }`. Add `updateAsset(id, patch)` to `assetService.ts` (with mock support). After saving, refresh the modal and the affected browse/search queries, and show API errors inline.
6. **Search**: the Search tab's tags field uses `TagInput` (with suggestions) instead of comma-separated text. The all/any match control is kept.
7. Update `CLAUDE.md`'s API connection section to list `GET /tags` and `PUT /assets/{id}` as used.

## Acceptance criteria

- Tags can be chosen (existing or new) on single upload, bulk upload, and asset edit, and they are persisted through the API (or the mock when the API is not configured).
- Bulk upload applies the same tags to every uploaded asset.
- Editing tags in the preview modal updates the asset, and the change shows in browse/search results without a page reload.
- `TagInput` works with the keyboard only and in every theme.
- `npm run build` and `npm run lint` pass.
