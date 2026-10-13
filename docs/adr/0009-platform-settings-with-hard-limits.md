<!--
  Funcionalidad: ADR 0009 - Configuración de plataforma con límites duros
  Descripción: Registra los valores de ejecución editables por administradores, validados contra un registro en código con límites que no se pueden superar
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0009: Platform settings with hard limits

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

Operational values (AI timeouts, quotas and prices, reservation durations, ventilator intervals and safety caps, grading weights) need tuning during the course without a redeploy. Some of them protect a physical device and students' quotas, so an administrator typo must not be able to set a dangerous or absurd value.

## Decision

- A **code registry** defines every editable key with its type, validation and **hard limits that not even an administrator can exceed**: `src/features/platform-settings/domain/registry/platform-settings.registry.ts` (`PLATFORM_SETTINGS_REGISTRY`). Ventilator command limits stay inside the shared `VENTILATOR_PARAMETER_LIMITS`.
- **Database overrides** live in `platform_settings` (`prisma/migrations/20261011120000_platform_settings`) with an optimistic `version`. `src/features/platform-settings/application/use-cases/update-platform-setting.usecase.ts` checks the expected version under an advisory lock keyed `platform-settings:key:<key>`, writes the next version and audits `SETTINGS_CHANGED` in the same transaction.
- An **in-memory cache** (`src/features/platform-settings/application/services/platform-settings.store.ts`) applies only rows with a higher version after commit and falls back to defaults if the table is missing; `src/features/platform-settings/application/services/platform-settings.facade.ts` exposes `get`/`subscribe`.
- **Defaults** come from each feature's config reader (environment variables), wired in `src/composition/platform-setting-defaults.ts` ([ADR 0003](0003-ports-and-composition-root.md)).
- ADMIN-only routes under `/api/platform-settings` (`settings:manage`): list, `PATCH /:key`, `POST /:key/reset`.
- **Secrets never become settings** (`CLAUDE.md`).

## Alternatives considered

- **Environment variables only:** safe but every change needs a redeploy.
- **Free-form key/value table:** flexible, but no validation, no hard limits and no type safety.
- **Feature flag / config service (external):** another dependency and another place to secure for a single-instance app.

## Consequences

- Values change at runtime and are audited; concurrent edits fail with a version conflict instead of overwriting each other.
- The registry is the single list of editable keys: adding one is a code change, reviewed and tested.
- The cache is per process (single-instance assumption, [ADR 0001](0001-modular-monolith.md)).
- `test/integration/platform-settings/platform-settings.integration-spec.ts` covers the version race (`docs/verification/BLOCK-C.md`).
