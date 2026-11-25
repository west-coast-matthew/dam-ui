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
(`GET /assets/search`, `/assets/{id}/thumbnail`, `/assets/{id}/file`), its recent uploads panel
(`GET /assets/activity/summary`) and the heartbeat use the API; login, users, installation and the
dashboard's activity panels are still mocked.

Client-only state: the browse panel keeps its view, page size and Recents history in a zustand store
persisted to localStorage (`src/components/AssetExplorerPanel/browseStore.ts`). Pages can collapse the
left menu through `useLayout()` (`src/layout/LayoutContext.ts`).

## Specs workflow

Work is tracked as specs in `specs/NNN-lower_case_name.md` with a `**Status:** ready|completed|cancelled`
line under the title. Skills in `.claude/skills/` (copied from `../dam-api`): `create-spec`,
`create-specs` (batch, main only), `commit-spec-changes` (commit + merge into main), `list-specs`,
`cancel-spec`, `run-spec`. They share `.claude/scripts/specs.sh` (bash 3.2 compatible, since it runs
on macOS). Each spec gets its own git branch named after the file without `.md`. Numbers come from
the spec files on the current branch, so create specs on `main` (`create-specs` enforces this) to
keep numbers unique. Only set a spec to `completed` after its work is done and the tests pass.

The branch-based skills need this directory to be a git repository with a `main` branch.
