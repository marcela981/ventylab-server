<!--
  Funcionalidad: ADR 0008 - OpenAPI como contrato
  Descripción: Registra el documento OpenAPI generado y versionado como contrato HTTP, su verificación de deriva y la deprecación de rutas heredadas
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0008: OpenAPI as the contract

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

The frontend (`ventilab-web`) and the backend live in separate repositories. Hand-written contracts drifted from the real routes (BUG-6 in `odd/tasks/quality-deploy.md`) and the frontend calls routes that do not exist (listed in the T4 entry of the same document). Legacy routes must keep working while their successors are adopted.

## Decision

- The HTTP contract is the **OpenAPI 3.1 document generated from the code** (controllers, DTOs and `@nestjs/swagger` decorators) and committed at `openapi/openapi.json`.
- `scripts/openapi/generate.mjs` generates it in a child process with a minimal environment (no credentials, no `.env`); `--check` compares byte for byte. `package.json` exposes `openapi:generate`, `openapi:check` and `openapi:client`.
- `scripts/verify/verify.mjs` runs the drift check ("OpenAPI contract drift"), so an endpoint change without a regenerated document fails verification.
- `openapi:client` generates TypeScript types into `packages/api-client/src/schema.d.ts`.
- Socket.io events are documented in `openapi/asyncapi.yaml` (AsyncAPI 3.0); `test/openapi/asyncapi-events.spec.ts` fails when an emitted event is missing. `test/openapi/openapi-completeness.spec.ts` checks the document's completeness, and the e2e authorization matrix validates 2xx responses against it (`docs/verification/BLOCK-D.md`).
- **Legacy deprecation:** `@DeprecatedRoute`/`@DeprecatedAlias` (`src/common/presentation/decorators/deprecated-route.decorator.ts`) and `src/common/presentation/interceptors/deprecation-headers.interceptor.ts` add `Deprecation` and `Link: <successor>; rel="successor-version"` headers and mark the operation `deprecated` with `x-successor` in the document. The list is in `docs/api/legacy-endpoints.md`. Legacy routes are not deleted.

## Alternatives considered

- **Contract-first (hand-written spec, generated server stubs):** a second source of truth to keep in sync with NestJS decorators.
- **Shared TypeScript types only:** no runtime validation, no documentation for non-TypeScript consumers, and the repositories are separate.
- **Runtime `/api/docs-json` only, not committed:** no reviewable diff and no drift check in verification.

## Consequences

- Contract changes show up as diffs to `openapi/openapi.json` in review.
- Decorators must stay accurate; T4 fixed several documentation-only defects (schema name collisions, nullable data, duplicate operation ids).
- The frontend does not consume `packages/api-client` yet; adopting it is outside this repository.
- `401`/`403` responses of deprecated routes carry no deprecation headers, because guards run before interceptors (`docs/api/legacy-endpoints.md`).
