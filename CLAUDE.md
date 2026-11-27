# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Front end for the Digital Asset Management system. The REST API it talks to lives in the sibling
project `../dam-api` (Java 21 / Spring Boot); see `../dam-api/CLAUDE.md` and
`../dam-api/APPLICATION.md` for its endpoints and conventions. The API's `GET /heartbeat` returns
200 when every dependency is up and 503 otherwise; errors come back as `ErrorResponseVO`.

No application code or tooling exists here yet. Once the stack is chosen, add its build, lint and
test commands below (including how to run a single test). `run-spec` runs whatever test command is
listed here.

## Commands

<!-- TODO: build / dev server / lint / test / single test -->

## API connection

`REACT_APP_API_URL` (e.g. in `.env.development`) is the API's root; `vite.config.ts` adds the
`REACT_APP_` env prefix. Unset, every service in `src/services/` uses its in-memory mock. Under
`vite` (dev) requests go through the `/dam-api` proxy to that URL, so the API needs no CORS; a
production build calls the URL directly. `src/services/apiClient.ts` holds the shared client.
Workspaces, catalogs, categories (workspace → catalog → category, `POST /categories/changes` for
the editor's bulk save), asset uploads (`POST /assets`, one per file), the asset page's browse panel
(`GET /assets/search`, `/assets/{id}/thumbnail`, `/assets/{id}/file`, and `PUT /assets/{id}` for
editing an asset's tags in the preview), its recent uploads panel (`GET /assets/activity/summary`),
tag suggestions (`GET /tags`) and the heartbeat use the API; login, users, installation and the
dashboard's activity panels are still mocked, and lightboxes are always mocked (see below).

Tags (spec 026): `services/tagService.ts` (`listTags`, `normalizeTags`) and `services/useCatalogTags.ts`
(debounced React Query hook, key `['tags', catalogId, q]`). `FormControls/TagInput` is the generic chip
input (ARIA combobox; its suggestion list is `position: fixed` so `overflow: hidden` panels don't clip it).
`CatalogTagInput` wires it to a catalog's tags. It's used in `AssetEntryPanel` (single and bulk: the
same tags go on every file and show in the review step), `AssetUploadPanel`, the Search tab, and the
preview modal's `AssetTagEditor`. Saving there patches the cached `['assetSearch']` pages, then
refetches them. In mock mode, edited and uploaded tags live in memory in `tagService`.

Client-only state: the browse panel keeps its view, page size, Recents history and slideshow interval
in a zustand store persisted to localStorage (`src/components/AssetExplorerPanel/browseStore.ts`). Pages
can collapse the left menu through `useLayout()` (`src/layout/LayoutContext.ts`).

Selection and lightboxes (spec 027, in `src/components/Lightbox/`):
- `selectionStore.ts` is the selection set (the "cart"): `BrowsedAsset` snapshots per catalog, in the order
  added, persisted to localStorage (`dam-ui.selection`, dates revived on load). It also holds the current
  catalog, which the browse panel and the Lightboxes page share; that catalog's selection is the one shown.
  Gallery tiles, list rows and the preview get a `SelectionToggle`; the panel header's `SelectionButton`
  opens `SelectionTray` (Download, Save as lightbox, Add to lightbox…, Browse, Clear).
- `services/lightboxService.ts` mirrors dam-api spec 009 (lightbox items, create from a selection,
  `POST /assets/download`). It is **always mocked** for now, even with `REACT_APP_API_URL` set: data lives in
  memory (a page reload loses it), each call waits 300–1500 ms, and `REACT_APP_MOCK_FAILURE_RATE` (0–1,
  default 0) makes that share of calls fail with `LightboxServiceError`, to try the error states. Without an
  API each catalog gets two sample lightboxes. `downloadAssets` saves a `.txt` manifest instead of a zip.
  React Query hooks are in `services/useLightboxes.ts` (keys under `['lightboxes', …]`; mutations invalidate them).
- `LightboxManagerPanel` is the `/lightboxes` page (`/lightboxes/:lightboxId` opens one; no id shows the
  current selection): list, create, edit, remove and reorder items (arrow buttons), Browse, Download, Delete.
- `Slideshow` is browse mode: a full-screen `<dialog>` that shows each item for 3/5/10/20 s and loops;
  Space plays/pauses, arrows move, Esc closes; it pauses while the tab is hidden. For a lightbox it loads
  every item page first.

## Specs workflow

Work is tracked as specs in `specs/NNN-lower_case_name.md` with a `**Status:** ready|completed|cancelled`
line under the title. Skills in `.claude/skills/` (copied from `../dam-api`): `create-spec`,
`create-specs` (batch, main only), `commit-spec-changes` (commit + merge into main), `list-specs`,
`cancel-spec`, `run-spec`. They share `.claude/scripts/specs.sh` (bash 3.2 compatible, since it runs
on macOS). Each spec gets its own git branch named after the file without `.md`. Numbers come from
the spec files on the current branch, so create specs on `main` (`create-specs` enforces this) to
keep numbers unique. Only set a spec to `completed` after its work is done and the tests pass.

The branch-based skills need this directory to be a git repository with a `main` branch.
