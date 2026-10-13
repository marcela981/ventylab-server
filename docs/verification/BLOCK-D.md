<!--
  Funcionalidad: Evidencia del bloque D de calidad (contrato de la API)
  Descripción: Contrato OpenAPI 3.1 generado desde los decoradores y versionado, chequeo de deriva en verify, completitud por operación, contrato AsyncAPI de Socket.io y SSE, validación de respuestas en las pruebas e2e, cliente TypeScript generado, regla de acceso a /api/docs y deprecación de rutas heredadas: cómo ejecutarlo, decisiones, conteos, resultados observados y defectos encontrados
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block D verification — API contract

Observed on 2026-10-12, Windows 11, Node 22, Docker Desktop, branch `main` (uncommitted working tree on top of commit `aceac62`). Full `npm run verify` was not run (left to the author); the targeted checks below were.

## How to run

```text
npm run openapi:generate   # openapi/openapi.json from the decorators (no database, broker, AI or .env)
npm run openapi:check      # exit 1 when openapi/openapi.json is stale (also a npm run verify step, before the tests)
npm run openapi:client     # packages/api-client/src/schema.d.ts (openapi-typescript)
npm run test:contract      # test/openapi: completeness of openapi.json + AsyncAPI coverage (first test step of verify)
npm run test:e2e           # e2e suites, now validating 2xx JSON responses against openapi.json
```

## What was built

| Item | Where |
|---|---|
| Generator (Nest preview mode, dummy local env from `test/support/test-env.ts`, empty working directory so `.env` is never read, child process with a minimal environment) | `scripts/openapi/generate.mjs`, `scripts/openapi/emit-document.cjs` |
| Document builder shared by the generator and `/api/docs-json` | `src/common/infrastructure/docs/openapi-document.ts` |
| Route metadata and access classification | `src/common/infrastructure/docs/openapi-routes.ts` |
| Post-processor (envelope, errors, access, deprecation, operationIds) | `src/common/infrastructure/docs/openapi-enricher.ts` |
| OpenAPI 3.0 → 3.1 schema conversion | `src/common/infrastructure/docs/openapi-31.ts` |
| `/api/docs` access rule | `src/common/infrastructure/docs/docs-access.ts`, `setup-docs.ts`, `src/main.ts` |
| Contract artifacts | `openapi/openapi.json`, `openapi/asyncapi.yaml`, `packages/api-client/` |
| Legacy deprecation | `@DeprecatedRoute` / `@DeprecatedAlias`, `DeprecationHeadersInterceptor`, `docs/api/legacy-endpoints.md` |
| Response validation helper | `test/support/openapi-validator.ts` (Ajv 2020 + ajv-formats) |

New dev dependencies: `openapi-typescript` 7.13.0 (generates the client types), `ajv` 8.20.0 (JSON Schema 2020-12 validator, the dialect of OpenAPI 3.1, for e2e response validation) and `ajv-formats` 3.0.1 (`date-time`, `email`, `uuid` formats for that validator).

## Decisions

- **OpenAPI 3.1**: `@nestjs/swagger` 11.4.7 has `setOpenAPIVersion`, but it only changes the version string; schemas keep 3.0 syntax. The document is therefore post-processed: version `3.1.0`, `nullable` → `"null"` in the type (and in `enum`) or `anyOf` with `{ type: "null" }` for references, boolean `exclusiveMinimum/Maximum` → numeric. `npx openapi-typescript` (Redocly parser) and Ajv 2020 accept the result.
- **Determinism**: keys sorted recursively, version fixed (`1.0`), no timestamps; error examples live once in `components.examples`. Two consecutive generations are byte-identical, and an e2e test asserts the document built by the running app equals the committed file.
- **Envelope**: every enveloped 2xx response is `allOf[APIResponseEnvelope, {data: <documented type>}]`; commands without a documented type have `data: null`. Health probes use `@RawResponse()`; streaming and CSV routes get their `@ApiProduces` media type with a string schema.
- **Access**: `x-min-role` is `ANONYMOUS` (no guard or `OptionalJwtAuthGuard`), `SERVER` (bridge secret) or the lowest role holding the `@RequirePermissions` set (from `ROLE_PERMISSIONS`, passed in by `main.ts` so `src/common` does not import features). The completeness test cross-checks it against the e2e authorization matrix: 349/349 routes, with 3 explained divergences (use-case or self-or checks stricter than the guards).
- **`/api/docs` rule**: open when `NODE_ENV !== "production"`; in production only for an `Authorization: Bearer` access token verified with role `ADMIN` (`IAccessTokenVerifier`); `SWAGGER_ALLOWED_IPS` is kept as an extra IP restriction in every environment (`*` or empty = none); every rejection answers 404. A browser cannot send the bearer header on navigation, so in production administrators read `/api/docs-json` with the header or use a non-production build.
- **Legacy routes** (28 operations): aliases `/api/cases/*` (11), `/api/cards/*` (8), `/api/evaluation/quizzes/*` (5), `PATCH /api/admin/users/:id/role`, `GET /api/pages/by-legacy-json/:legacyJsonId`, `GET` and `PUT /api/progress/lesson/:lessonId`. Header `Deprecation: @1791763200` (RFC 9745, 2026-10-12) plus `Link: <successor>; rel="successor-version"` when the successor URL can be filled from the request (all but the `PUT` progress route). Responses unchanged.
- **BUG-6**: `contracts/websocket-events.contracts.ts` (imported by nothing) was rewritten to the emitted events and payloads instead of being deprecated, and the AsyncAPI test now checks it too.

## Counts

- OpenAPI: 349 operations on 279 paths, 28 deprecated, 0 duplicate operationIds, every operation with 2xx content (except 204), `x-min-role`, `x-required-permissions` and `ErrorResponse` errors.
- AsyncAPI 3.0: 10 channels, 27 messages: 20 server → client Socket.io events, 3 client → server messages (`authenticate`, `ventilator:join`, `ventilator:heartbeat`), 4 SSE routes with `delta`, `done` (tutor and assist shapes) and `error`.
- Client: `packages/api-client/src/schema.d.ts` (30 `@deprecated` markers), type-checks with `tsc --strict`.

## Verification (observed)

| Command | Result |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | 0 errors |
| `npx eslint <39 changed/new .ts files>` | 0 problems |
| `npx madge --circular --extensions ts src` | no circular dependency (1808 files) |
| `npm run openapi:generate` ×2 + `cmp` | identical bytes (sha256 `5a43766b…a54ecd9`) |
| `npm run openapi:check` | exit 0 "up to date"; exit 1 with the regenerate hint after appending one byte (file restored) |
| `npm run openapi:client` | wrote `packages/api-client/src/schema.d.ts` |
| `npx jest --config test/jest/jest.contract.config.js --runInBand` | 2 suites, 11/11 |
| `npx jest --ci --maxWorkers=2` (whole unit suite, no coverage) | 243 suites, 1835 passed, 1 skipped |
| new unit specs (`docs-access`, `openapi-31`, `deprecation-headers.interceptor`) | 3 suites, 27/27 |
| `npx jest --config test/jest/jest.e2e.config.js --runInBand test/e2e` | 5 suites, 405/405 (authorization matrix with the new 2xx contract check, IDOR, role visibility, API contract 9, health) |

No `ventylab-*` containers were left running.

## Contract defects found (RED in the first e2e run, fixed in presentation decorators)

The first e2e run with response validation failed 3 suites; every response was correct and the documentation was wrong:

- **Schema name collisions**: five pairs of DTO classes shared a name, and `@nestjs/swagger` kept one shape for both (`GET /api/system/status` documented the simulation `VentilatorStatusDTO`; the analytics dashboard documented the users `StudentProgressDTO`). Fixed with `@ApiSchema` (`SystemVentilatorStatusDTO`, `AnalyticsStudentProgressDTO`, `AnalyticsEvaluationDTO`, `AdminChangeUserRoleDTO`, `EvaluationReorderItemsDTO`); the completeness test now fails on any new collision.
- **Nullable data**: 7 routes answer `data: null` when nothing exists (quiz my-attempt, activity submission for-activity, AI rating mine, lesson and step next/previous); documented with `@ApiNullableResponse`.
- **Mixed items**: the reservations calendar returns full or summarized reservations; documented as `anyOf`.
- **`unknown` values**: platform setting `value`/`defaultValue` were documented as `object`; now `oneOf` number, boolean, string, array or object.
- **Duplicate operationIds**: `getStudents`, `changeUserRole`, `getCurriculumTree`, `getAttempt`, plus `name[n]` IDs of aliased paths; normalized by the post-processor.

## Findings outside this block's surface

- Frontend (`ventilab-web`, master) calls routes the backend does not register: `PUT /api/admin/users/:id/role` (`adminService.js:86`), `PATCH /api/admin/users/:id` (`useUserManagement.js:280`), `PATCH /api/cards/:id` (`teachingContentService.js:111`), `POST /api/progress/lesson/:lessonId/complete-unified` (`progress.api.ts:108`). Not changed (frontend out of scope).
- The exception filter maps HTTP 429 from the throttler to code `unknown_error` (its status map has no 429); documented as observed, not changed.
- `.claude/` is gitignored: the updated `swagger` and `configuration` skills need `git add -f`.
- `.env.example` should describe the new `SWAGGER_ALLOWED_IPS` meaning (extra IP restriction; docs open outside production, ADMIN-only in production).
