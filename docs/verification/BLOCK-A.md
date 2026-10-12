<!--
  Funcionalidad: Evidencia del bloque A de calidad
  Descripción: Comandos de verificación del bloque A (verify, deriva de migraciones, arranque desde cero) y salidas observadas, con las correcciones BUG-1 a BUG-5 y BUG-8
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block A verification

Observed on 2026-10-12, Windows 11, Node 22.23.2, Docker 29.8.0, branch `main` (uncommitted working tree).

## Commands

| Command | What it does |
|---|---|
| `npm run verify` | `tsc --noEmit` → ESLint check-only on `src/**/*.ts` → `madge --circular` → `prisma validate` (warnings fail) → migration drift + triggers on a throwaway Postgres → test suites. Stops at the first failure, prints a summary, exits non-zero. `--verbose` (or `VERIFY_VERBOSE=1`) streams every tool's output. |
| `npm run verify:drift` | Only the drift step: `postgres:17-alpine` container on a free `127.0.0.1` port, `shadow` database, `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url … --exit-code`, `prisma migrate deploy` on the empty main database, then `pg_trigger` must contain `users_protect_superadmin_update`, `users_protect_superadmin_delete`, `audit_logs_append_only`, `audit_logs_append_only_truncate`. The container is always removed. |
| `npm run verify:boot` | Throwaway Postgres → `prisma migrate deploy` → `prisma db seed` → `nest build` into `.tmp/verify-boot/dist` (gitignored, deleted afterwards) → `node main.js` with a minimal environment → polls `/health/ready` until 200 → stops the app and removes the container. |

All scripts live in `scripts/verify/` (Node only, no shell, Windows compatible). Containers are named `ventylab-verify-<purpose>-<timestamp>-<random>`.

### Safety

- Child processes get a minimal environment (operating-system variables only); database, MQTT, storage, AI and Sentry variables are never inherited from the caller.
- Prisma commands always receive an explicit `DATABASE_URL`/`DIRECT_URL`: the throwaway container, or a closed local port (`127.0.0.1:9`) for schema-only commands. Explicit variables take precedence over `.env`.
- The boot check runs the app with its working directory in `.tmp/verify-boot`, which has no `.env`, so neither `ConfigModule` nor the Sentry reader can load real credentials. MQTT, Supabase storage, AI providers and Sentry boot disabled.

### Test hooks

`verify` runs, in order, every npm script among `test:unit`, `test:integration`, `test:e2e` that exists in `package.json`; while none exists it runs the current Jest suite (`jest --ci`). Later blocks only add those scripts.

### Lint scope

ESLint covers `src/**/*.ts` (and `test/**/*.ts` once that folder exists). `scripts/**` is ignored by `eslint.config.mjs` and `prisma/**` is outside `tsconfig.json`, so the type-aware config cannot parse them without changing those files.

### Circular imports

`.madgerc` skips type-only and dynamic imports (`skipTypeImports`, `skipAsyncImports`) and resolves the `@/` alias through `tsconfig.json`. With that, `madge --circular` reports no cycle over 1,768 files: the 19 entity↔events cycles of the baseline were all type-only.

## Bug fixes

| Bug | Fix | Proof |
|---|---|---|
| BUG-1 | `GroupRoomsEventsHandlers` (groups feature) joins `group:{id}` for every membership on `realtime.client-authenticated`, joins/leaves on `GroupMemberAddedEvent`/`GroupMemberRemovedEvent` and clears the room on `GroupDeletedEvent`. `src/common/` still imports nothing from features. | `group-rooms-events.handlers.spec.ts` (6 tests, RED before the handler existed) |
| BUG-2 | `NoopFileStorageAdapter.uploadFile`/`generateUploadUrl` reject with `FileStorageUnavailableError` (`common.storage_unavailable`, 503) instead of pretending success; reads and deletes stay no-op; boot unchanged. System status already reports storage as `not_configured` (left as is: it is the documented state for an optional dependency and does not change the global rules). | `noop-file-storage.adapter.spec.ts` (2 of 4 RED before) |
| BUG-3 | The 4 `onDelete: SetNull` relations on required columns (`change_logs.changedBy`, `content_overrides.createdBy`, `activities.createdBy`, `activity_assignments.assignedBy`) become nullable via `20261012100000_fix_setnull_required_relations`. Changelog and override entries of a deleted author expose `changedBy`/`createdBy: null`. | `prisma validate` without warnings; drift check clean; `changelog.mapper.spec.ts` |
| BUG-4 | The 4 GET routes of `/api/steps` and `/api/cards` use `OptionalJwtAuthGuard` like lessons and pages; anonymous behavior unchanged. | `steps.controller.spec.ts` (RED before) |
| BUG-5 | `*.vercel.app` previews are accepted only with `CORS_ALLOW_VERCEL_PREVIEWS=true` (default `false`); explicit origins, `VERCEL_URL` and requests without `Origin` keep working. | `cors-origins.spec.ts` (2 of 7 RED before) |
| BUG-8 | The 500 ms budget of `engine-determinism.spec.ts` is skipped when coverage instrumentation is active (`globalThis.__coverage__`); the threshold is unchanged. | Passes plain; skipped under `--coverage` |

The composition-root guard is `src/composition/production-bindings.spec.ts`: it fails when a `*.module.ts` or a file under `src/composition/` names a `Noop|Stub|Fake|InMemory|Mock` class outside an explicit allowlist (only `NoopFileStorageAdapter` in `storage.module.ts`), or when production code answers 501 / throws `NotImplemented`.

## Observed results

```text
$ npx tsc --noEmit -p tsconfig.json          → 0 errors
$ npx jest <new/changed specs> (9 suites)    → 57 passed; changelog.mapper.spec.ts → 2 passed
$ npx jest --ci                              → Test Suites: 229 passed, 229 total; Tests: 1710 passed, 1710 total
$ npm run verify
[verify] summary
  PASS  typecheck (tsc --noEmit)  13.1s
  PASS  lint (eslint src/**/*.ts)  103.3s
  PASS  circular imports (madge)  22.5s
  PASS  prisma validate  4.8s
  PASS  migration drift + triggers (docker postgres:17-alpine)  33.9s
  PASS  tests (jest unit suite)  97.0s
[verify] OK
$ npm run verify:boot
[boot] migrations applied
[boot] seed finished (✅ Seed completed successfully!)
[boot] application built
[boot] /health/ready answered 200 {"status":"ready"} after 26.5s
[boot] application stopped
[boot] container ventylab-verify-boot-… removed
[boot] OK: migrate deploy + seed + boot OK; /health/ready 200 {"status":"ready"}
$ docker ps -a --filter name=ventylab-verify-  → (empty)
```

Not covered here: `.env.example` does not list `CORS_ALLOW_VERCEL_PREVIEWS` yet (`.env*` files are outside this block's edit scope); add `CORS_ALLOW_VERCEL_PREVIEWS=false` there.
