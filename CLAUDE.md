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

## Specs workflow

Work is tracked as specs in `specs/NNN-lower_case_name.md` with a `**Status:** ready|completed|cancelled`
line under the title. Skills in `.claude/skills/` (copied from `../dam-api`): `create-spec`,
`create-specs` (batch, main only), `commit-spec-changes` (commit + merge into main), `list-specs`,
`cancel-spec`, `run-spec`. They share `.claude/scripts/specs.sh` (bash 3.2 compatible, since it runs
on macOS). Each spec gets its own git branch named after the file without `.md`. Numbers come from
the spec files on the current branch, so create specs on `main` (`create-specs` enforces this) to
keep numbers unique. Only set a spec to `completed` after its work is done and the tests pass.

The branch-based skills need this directory to be a git repository with a `main` branch.
