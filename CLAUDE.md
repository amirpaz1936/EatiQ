# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# EatiQ

Turborepo monorepo using **npm workspaces**. EatiQ is a meal tracking application with image scanning and personalized nutrition recommendations.

## Layout

```
apps/
  frontend/     @eatiq/frontend — Vite 6 + React 18 + TS    (port 5173)
  backend/      @eatiq/backend  — NestJS 10 + Express + TS  (port 3000)
packages/       (empty — shared libraries go here)
turbo.json      pipeline definitions
tsconfig.base.json   shared strict TS compiler options
```

Workspace globs are declared in the root [package.json](package.json) `workspaces` field (`apps/*`, `packages/*`). A folder counts as a workspace only if it has a `package.json`.

## Commands

Run from the repo root — Turbo fans tasks out across all workspaces.

| Command | What it does |
|---|---|
| `npm run dev` | `turbo run dev` — frontend (Vite, 5173) + backend (`nest start --watch`, 3000) |
| `npm run build` | `turbo run build` — Vite build for frontend, `nest build` for backend |
| `npm run check-types` | `turbo run check-types` — `tsc --noEmit` per workspace |
| `npm run lint` | `turbo run lint` (no linter wired up yet) |
| `npm run clean` | `turbo run clean` — removes each workspace's `dist`, `.turbo`, vite cache |

To target one workspace: `npm run dev -w @eatiq/frontend` (or `@eatiq/backend`).

## TypeScript

- All workspaces extend [tsconfig.base.json](tsconfig.base.json) (strict, `noUncheckedIndexedAccess`, ES2022, bundler resolution).
- `apps/frontend` uses TS project references: [tsconfig.json](apps/frontend/tsconfig.json) → `tsconfig.app.json` (src) + `tsconfig.node.json` (vite config).

## Adding a workspace

1. Create `packages/<name>/package.json` with `"name": "@eatiq/<name>"`.
2. Run `npm install` at the root to register it.
3. Consume it from another workspace via `"@eatiq/<name>": "*"` in that workspace's `dependencies`.

## Architecture

**Frontend** (`apps/frontend`):
- React 18 + Vite 6 + TypeScript + Tailwind CSS 4
- Client-side routing via state machine in `App.tsx` (landing ↔ dashboard)
- Auth is currently mock/local only — forms generate user from email, no backend integration yet
- Component structure:
  - `components/` — reusable UI (TextField, Logo, GoogleIcon, icons.tsx)
  - `components/dashboard/` — dashboard-specific components (StatCard, UserMenu, DashboardNav)
  - `layouts/` — AppLayout (landing), DashboardLayout (authenticated)
  - `pages/` — LandingPage (login/register forms), DashboardPage (calorie stats + meal history)
  - `types/` — shared types (User)

**Backend** (`apps/backend`):
- NestJS 10 + Express
- Currently minimal — ConfigModule (global) + sample controller/service
- No database, auth, or API endpoints wired up yet

## Development workflow

- Both dev servers run concurrently via `npm run dev` from root
- Frontend HMR on `:5173`, backend watch-reload on `:3000`
- No proxy configured — frontend doesn't call backend yet
- Type-check before committing: `npm run check-types`

## Environment

- Node ≥ 18 (developed on v22.13.1)
- npm 10.9.2 (pinned via `packageManager` field)
- Turbo 2.x
