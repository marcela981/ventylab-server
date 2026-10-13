<!--
 * Funcionalidad: Reporte de knip
 * Descripción: Resumen del análisis de código, exportaciones y dependencias sin uso hecho con knip, con las eliminaciones aplicadas y lo que se conservó a propósito
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
-->

# Knip report

Run on 2026-10-13 with `npm run knip` (`npx --yes knip@6.38.0`, pinned and not installed as a dependency) and the root `knip.json`.

## Configuration

`knip.json` declares the entry points knip cannot infer on its own:

- `src/main.ts` and `src/instrument.ts` (Nest bootstrap and the Sentry preload).
- Every test: `src/**/*.spec.ts`, shared test doubles `src/**/*-spec.ts`, everything under `test/` (integration, e2e, contract, Jest configs and setup files).
- Prisma seeds: `prisma/seed-*.ts` and `prisma/migrations/migrate-progress-data.ts`. `prisma/seed.ts` and `prisma/demo/run-demo-command.ts` are found through `package.json` (`prisma.seed` and the `demo:*` scripts).
- Scripts: `scripts/*.ts`, `scripts/audit-e2e/audit-e2e.ts` and every `scripts/**/*.{mjs,cjs}`.
- `contracts/*.ts` (shared contract definitions consumed outside this repository).

`__deferred_tests__/` is ignored. The built-in Nest, Jest, ESLint and Prisma plugins are enabled automatically from `package.json`.

## Results

| Category | Before | After | Notes |
|---|---:|---:|---|
| Unused files | 4 | 2 | 2 deleted, 2 kept (see below) |
| Unused devDependencies | 4 | 4 | kept, report only |
| Unlisted dependencies | 5 | 5 | kept, report only |
| Unused exports | 289 | 285 | the 4 fixed ones were in the new demo seed |
| Unused exported types | 94 | 94 | report only |
| Duplicate exports | 3 | 3 | report only |

### Deleted

| File | Why it is dead |
|---|---|
| `src/common/domain/value-objects/numeric-value.ts` | `NumericValue` value object from the original template; no file in `src/`, `test/`, `scripts/`, `prisma/`, docs or skills imports or mentions it. |
| `src/common/domain/value-objects/numeric-constraints.ts` | Only imported `numeric-value.ts` (cents and decimal constraints from the template); nothing imports it. |

Checks after the deletion: `npx tsc --noEmit -p tsconfig.json` 0 errors, `npx madge --circular --extensions ts src` no cycles. No spec covered either file and no presentation code changed, so the OpenAPI document is unaffected.

### Kept on purpose

| Item | Reason |
|---|---|
| `src/common/presentation/guards/admin-api-key.guard.ts` | No route uses it, but `ADMIN_API_KEY` is still a required environment variable and the guard is referenced by `docs/runbook.md`, `docs/operations/environment-variables.md` and finding F2 of `docs/verification/BLOCK-E.md`. Removing it also means making the variable optional: a configuration decision for the author. |
| `src/common/infrastructure/email/mock-email.service.ts` | Not imported, but it is an alternative `IEmailService` implementation (a stand-in for SMTP); treated as a test double. |
| `readDbIntegrationSettings` (`env.validation.ts`) | Unused since block B; documented in the tracker and part of the config module's public surface. |
| Unused exports in `src/` (285) | Knip flags the `export` keyword, not the symbol: these are facade, port, mapper and domain constants and helpers (largest groups: simulation engine ~65, AI gateway ~21, common infrastructure ~20, for example the OpenAPI enricher schemas and the legacy quiz mapper helpers behind legacy routes). They were not audited one by one; removing `export` keywords changes no behavior, so they stay listed here as a follow-up. |
| Unused exported types (94) | Read-model and DTO interfaces that document public shapes. |
| `prisma/seed-helpers/*` exports | Helpers of the legacy evaluation seed scripts. |
| `DemoBlock`, `DemoEvaluationState` | Types of exported demo interfaces. |
| Duplicate exports | `scripts/lib/prisma.ts` (`prisma` and `default`), `DEFAULT_LANGUAGE_VALUE` / `EN_LANGUAGE_VALUE`, `DEFAULT_LEVEL_TRACK_VALUE` / `MECANICA_LEVEL_TRACK_VALUE`: intentional aliases. |

### Dependencies (report only, `package.json` unchanged)

| Dependency | Finding | Assessment |
|---|---|---|
| `madge` | unused devDependency | Spawned as a command by `scripts/verify/verify.mjs` (circular imports step), which knip cannot see. Keep. |
| `@eslint/eslintrc`, `source-map-support`, `ts-loader` | unused devDependencies | Leftovers of the Nest starter. Candidates for removal after the author checks `eslint.config.mjs` and `nest build` without them. |
| `express` | unlisted dependency (types and middleware imports) | Provided by `@nestjs/platform-express`; listing it explicitly would pin a second copy. Keep as is. |
| `@prisma/internals` | unlisted dependency (`scripts/erd/generate-erd.mjs`) | Comes with `prisma`; only the ERD generator uses it. Add it to `devDependencies` if the transitive version ever breaks the generator. |
