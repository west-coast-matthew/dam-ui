status: ready

# 027 — Asset lightbox support

## Summary

When browsing assets, users need to make selections the way a shopper adds items to a cart on an e-commerce site. The selection is managed on the client. It lets a user group assets for a download, or convert the selection into a lightbox (a saved cart). When viewing the selection or a saved lightbox, the user can manage its items and start a browse mode (slideshow) that shows each asset for a set time before moving on to the next one automatically.

The lightbox APIs are not ready yet (they are defined in dam-api spec 009), so this spec mocks them. Data is fetched with React Query, through a new service that returns mock data after random delays. Loading and error states use the existing `LoadingState` and `ErrorState` components, consistent with the rest of the app.

## Requirements

### 1. Selection set (cart)

- Add a zustand store `src/components/Lightbox/selectionStore.ts` holding the selected assets per catalog (as `BrowsedAsset` snapshots, in the order they were added), persisted to localStorage like `browseStore`. Actions: `add`, `remove`, `toggle`, `addMany`, `clear`, `has`. The current catalog's selection is the one shown and used.
- In the browse panel (`AssetExplorerPanel`: Browse, Search and Recents results), each gallery tile and list row gets an add/remove toggle (a check or cart button that doesn't open the preview). Selected items look clearly selected in every theme. The results bar gets "Add page to selection". The preview modal (`AssetPreviewModal`) gets an add/remove button too.
- A selection indicator in the explorer panel header shows the item count and opens the selection tray.
- **Selection tray**: a drawer or panel listing the selected assets (thumbnail, title, remove button) with actions **Download**, **Save as lightbox**, **Add to lightbox…**, **Browse** (slideshow, see 5) and **Clear** (with confirmation).

### 2. Mock lightbox service

- Add `src/services/lightboxService.ts` with types mirroring dam-api spec 009 (`Lightbox`: `id`, `catalogId`, `userId`, `title`, `description`, `shared`, `itemCount`; items as `BrowsedAsset` pages shaped like `searchAssets` results).
- Functions: `listLightboxes(catalogId)`, `getLightbox(id)`, `listLightboxItems(id, { page, pageSize })`, `createLightbox({ catalogId, title, description, shared, assets })`, `updateLightbox(id, patch)`, `deleteLightbox(id)`, `addLightboxItems(id, assets)` (skips duplicates), `removeLightboxItems(id, assetIds)`, `reorderLightboxItems(id, assetIds)` and `downloadAssets(assets, name)`. Each accepts an optional `{ signal }`, as the other services do.
- The service is always mocked for now, whether or not `REACT_APP_API_URL` is set, and stores its data in memory. Each call waits a random 300–1500 ms. A failure rate from `REACT_APP_MOCK_FAILURE_RATE` (0–1, default 0) makes calls reject with a `LightboxServiceError`, so error states can be exercised. Validation errors (blank title, title over 255 characters, reorder list that doesn't match the items) are rejected the way the API would reject them.
- Seed each catalog with two sample lightboxes from that catalog's mock assets the first time it's listed. Do this only when `REACT_APP_API_URL` is unset.
- `downloadAssets` (mock): after the delay, save a `<name>.txt` manifest listing each asset's file name and download URL, as a stand-in for the API's zip. When the assets have `downloadUrl`s, the manifest says the zip will come from `POST /assets/download`.
- The owner `userId` is the signed-in user's `username` from `AuthContext`.
- React Query hooks in `src/services/useLightboxes.ts`: `useLightboxes(catalogId)`, `useLightbox(id)`, `useLightboxItems(id, page, pageSize)`, plus mutations that invalidate the `['lightboxes', …]` keys. Mutations show pending state on their buttons and surface errors inline.

### 3. Convert a selection into a lightbox

- **Save as lightbox** opens a `Modal` with title (required), description and a "Shared" toggle, and calls `createLightbox` with the selection. **Add to lightbox…** lets the user pick one of the catalog's lightboxes and calls `addLightboxItems`.
- On success, show a confirmation with a link to the lightbox on the Lightboxes page, and offer to clear the selection (the default is to clear it). On failure, the dialog stays open and shows the error.

### 4. Lightbox manager component

- Add `src/components/Lightbox/LightboxManagerPanel` and render it on the existing `/lightboxes` page (`src/pages/Lightboxes`), replacing the "coming soon" placeholder. It uses the current workspace's catalog, the way the asset page does.
- Left: the catalog's lightboxes (title, item count, shared badge), with "Current selection" pinned at the top and a "New lightbox" action. Loading, empty and error (with retry) states.
- Right, for the chosen lightbox: an editable title, description and shared toggle (Save/Cancel); the items as a gallery (reusing `AssetThumb`) with paging, remove (single or multi-select), reorder (move earlier or later, keyboard accessible); and actions **Browse**, **Download** and **Delete lightbox** (with confirmation). "Current selection" shows the same view, backed by the selection store instead of the service, and has a **Save as lightbox** action.
- Selecting a lightbox is reflected in the URL (`/lightboxes/:lightboxId`) so it can be linked to.

### 5. Browse mode (slideshow)

- Starting **Browse** from the selection tray, the manager or a lightbox opens a full-screen overlay that shows the items one at a time, large (the image's original for images, otherwise the thumbnail or type icon), with title and position (for example "3 of 12").
- Each item shows for an interval chosen from 3, 5, 10 or 20 seconds (default 5, remembered in the browse store), then the next one appears automatically. After the last item it loops to the first. A progress bar shows the time left.
- Controls: play/pause (Space), previous/next (arrow keys), interval select, and close (Esc). Playback pauses while the tab is hidden. The next image is preloaded. Transitions are a short fade, and are off under `prefers-reduced-motion`.
- For a lightbox, the slideshow loads every item page through the service, with a loading state before it starts and an error state if that fails.

### 6. Docs

- Update `CLAUDE.md`: the selection store, the lightbox service (mocked, the failure-rate setting, and dam-api spec 009 as the future API), the manager and the slideshow.

## Acceptance criteria

- Assets can be added to and removed from the selection from gallery tiles, list rows and the preview, and the selection survives a reload.
- The selection can be downloaded (mock manifest), saved as a new lightbox, or added to an existing one.
- The Lightboxes page lists, creates, edits, reorders, removes items from and deletes lightboxes through the mock service, with loading and error states visible during random delays and injected failures.
- Browse mode cycles through the selection or a lightbox automatically at the chosen interval and can be driven by the keyboard alone.
- Everything works in every theme.
- `npm run build` and `npm run lint` pass.
