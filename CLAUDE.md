# EatiQ

Turborepo monorepo using **npm workspaces**.

## Layout

```
apps/
  frontend/           @eatiq/frontend          — Vite 6 + React 18 + TS              (port 5173, host)
  backend/            @eatiq/backend           — NestJS 10 + Express + TS            (port 3000, internal)
  auth-service/       @eatiq/auth-service      — NestJS 10 + Mongoose + MongoDB      (port 4000, internal)
  image-recognition/  @eatiq/image-recognition — NestJS 10 + OpenAI Vision           (port 3001)
packages/
  db/            @eatiq/db           — shared Mongoose schemas (User, …)
infra/
  nginx/         nginx gateway config (dev)                                (port 8080, exposed)
docker-compose.dev.yml                hot-reload dev stack
turbo.json                            pipeline definitions
tsconfig.base.json                    shared strict TS compiler options
```

Workspace globs are declared in the root [package.json](package.json) `workspaces` field (`apps/*`, `packages/*`). A folder counts as a workspace only if it has a `package.json`.

## Architecture

```
                   ┌──────────────────────┐
   Browser ──────► │ nginx :8080 (gateway)│
                   │                      │
                   │  /auth/*  ──────────►│──► auth-service :4000  ──► MongoDB :27017
                   │                      │
                   │  /api/*   auth_req ─►│──► auth-service /auth/verify
                   │      ▲ 204 / 401     │       (verifies JWT, returns X-User-Id, X-User-Email)
                   │      └──► backend :3000  with X-User-Id / X-User-Email injected
                   └──────────────────────┘

   Vite dev server runs on the host at :5173 and calls the gateway at :8080.
```

| Service        | Internal port | Host-exposed (dev) |
| -------------- | ------------- | ------------------ |
| nginx gateway  | 80            | **8080**           |
| auth-service   | 4000          | —                  |
| backend        | 3000          | —                  |
| mongodb        | 27017         | 27017              |
| frontend (Vite, host) | 5173   | 5173               |

## Auth flow

- Auth is **JWT-based** (HS256, `expiresIn: 7d`). Clients send `Authorization: Bearer <token>` on every protected request.
- **Public** auth routes (no token required): `POST /auth/register`, `POST /auth/login`, `GET /auth/google`, `GET /auth/google/callback`. These pass straight through nginx to `auth-service`.
- **Protected** routes (`/api/*`) trigger nginx's `auth_request /_verify` subrequest. nginx calls `auth-service` at `/auth/verify`; if the JWT is valid auth-service returns `204` with `X-User-Id` and `X-User-Email` response headers. nginx pulls those into variables and re-injects them into the upstream request to `backend`. If the JWT is missing/invalid auth-service returns `401` and nginx rejects the original request.
- **Backend never sees the raw token.** nginx strips `Authorization` before proxying. Backend trusts `X-User-Id` / `X-User-Email` because backend's port is not published in dev — only nginx can reach it on the docker network. **Invariant:** do not publish backend's port without first adding a shared `X-Gateway-Secret` header check.
- **Google OAuth**: `GET /auth/google` redirects to Google. On callback, auth-service upserts (or links) the user by `googleId`, issues our JWT, and redirects to `${FRONTEND_URL}/auth/callback?token=<jwt>`.
- **Shared schemas**: the `User` document lives in [@eatiq/db](packages/db/src/schemas/user.schema.ts) (`packages/db`). Both `auth-service` and `backend` import `User`, `UserSchema`, and `UserDocument` from `@eatiq/db`.

## Commands

Run from the repo root — Turbo fans tasks out across all workspaces.

| Command | What it does |
|---|---|
| `npm run dev` | `turbo run dev` — frontend (Vite, 5173) + backend (`nest start --watch`, 3000) + auth-service (`nest start --watch`, 4000) + `@eatiq/db` (`tsc --watch`) |
| `npm run build` | `turbo run build` — Vite build for frontend, `nest build` for backend / auth-service, `tsc` for `@eatiq/db` (built first via `dependsOn: ^build`) |
| `npm run check-types` | `turbo run check-types` — `tsc --noEmit` per workspace |
| `npm run lint` | `turbo run lint` (no linter wired up yet) |
| `npm run clean` | `turbo run clean` — removes each workspace's `dist`, `.turbo`, vite cache |
| `npm run docker:dev` | Bring up the full dev stack: mongo + db-watch + auth-service + backend + nginx with hot reload |
| `npm run docker:dev:down` | Stop and remove containers (add `-v` manually to drop the mongo volume) |
| `npm run docker:dev:logs` | Tail logs from all containers |

To target one workspace: `npm run dev -w @eatiq/frontend` (or `@eatiq/backend`, `@eatiq/auth-service`, `@eatiq/db`).

**Recommended dev workflow** (two terminals):
1. `npm run docker:dev` — boots mongo + the API stack behind the gateway with hot reload.
2. `npm run dev -w @eatiq/frontend` — Vite on the host at :5173; configure API calls against `http://localhost:8080`.

## TypeScript

- All workspaces extend [tsconfig.base.json](tsconfig.base.json) (strict, `noUncheckedIndexedAccess`, ES2022, bundler resolution).
- `apps/frontend` uses TS project references: [tsconfig.json](apps/frontend/tsconfig.json) → `tsconfig.app.json` (src) + `tsconfig.node.json` (vite config).
- `apps/backend`, `apps/auth-service`, and `packages/db` override `module`/`moduleResolution` to `node16` with `experimentalDecorators` + `emitDecoratorMetadata` so Nest decorators and Mongoose `@Schema` decorators behave correctly.

## Adding a workspace

1. Create `apps/<name>/package.json` or `packages/<name>/package.json` with `"name": "@eatiq/<name>"`.
2. Run `npm install` at the root to register it.
3. Consume it from another workspace via `"@eatiq/<name>": "*"` in that workspace's `dependencies`.

## Shared packages

Mongoose schemas live in [@eatiq/db](packages/db). Consumers import like:

```ts
import { User, UserSchema, UserDocument } from "@eatiq/db";

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
})
export class UsersModule {}
```

The package builds to `dist/` via `tsc`. In dev the `db-watch` compose service runs `tsc --watch` so edits to `packages/db/src/**` rebuild within a second. The running NestJS apps do **not** watch `node_modules`, so after a schema change run `docker compose -f docker-compose.dev.yml restart auth-service backend` to pick up the new types.

## Docker (development)

[docker-compose.dev.yml](docker-compose.dev.yml) wires up:

- **mongodb** (`mongo:7`) — exposed at `localhost:27017` for Compass / mongosh. Persistent volume `mongo_data`.
- **db-watch** — runs `tsc --watch` in `packages/db`, keeping `dist/` fresh.
- **auth-service** — `nest start --watch` on port 4000 (internal). Reads [apps/auth-service/.env](apps/auth-service/.env).
- **backend** — `nest start --watch` on port 3000 (internal).
- **nginx** (`nginx:1.27-alpine`) — `localhost:8080` → gateway with the `auth_request` flow described above. Config at [infra/nginx/nginx.dev.conf](infra/nginx/nginx.dev.conf).

All three Node services (`db-watch`, `auth-service`, `backend`) share a single image built from [Dockerfile.dev](Dockerfile.dev) at the repo root — they differ only by `working_dir` + `command` (deduped via a YAML anchor in the compose file).

Hot reload uses bind-mounted source (`.:/workspace`) plus anonymous `node_modules` volumes so Linux-built native modules (e.g. `bcrypt`) aren't shadowed by the host's copy.

If file-watcher events don't propagate on a Windows / WSL2 host, uncomment `CHOKIDAR_USEPOLLING: "true"` under the `auth-service` / `backend` `environment:` blocks.

## Environment

- Node ≥ 18 (developed on v22.13.1)
- npm 10.9.2 (pinned via `packageManager` field)
- Turbo 2.x
- Docker Desktop / Engine with Compose v2

### auth-service env vars

`apps/auth-service/.env` (copy from [apps/auth-service/.env.example](apps/auth-service/.env.example)):

| Var | Purpose |
|---|---|
| `PORT` | auth-service HTTP port (defaults to 4000; overridden by compose) |
| `MONGODB_URI` | Mongo connection string. Compose injects `mongodb://mongodb:27017/eatiq` (the single shared db for the whole platform) |
| `JWT_SECRET` | HS256 signing key — generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `7d` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 client |
| `GOOGLE_CALLBACK_URL` | Must match what's registered with Google. Defaults to `http://localhost:8080/auth/google/callback` |
| `FRONTEND_URL` | Where to redirect after a successful Google callback (token appended as `?token=…`) |

## Commit messages

- Keep commit messages to **at most two sentences**.
- Do **not** add a Claude / Co-Authored-By signature at the bottom.
