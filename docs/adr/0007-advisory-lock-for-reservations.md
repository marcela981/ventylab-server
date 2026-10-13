<!--
  Funcionalidad: ADR 0007 - Bloqueo consultivo para reservas
  Descripción: Registra el uso de pg_advisory_xact_lock por dispositivo para impedir reservas solapadas del ventilador
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0007: Advisory lock for reservations

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

Two scheduled reservations of the ventilator must never overlap, and preemption must turn the overlapping reservations into `PREEMPTED` and create the new one atomically. "No overlap" is a rule across rows. Under `READ COMMITTED`, two concurrent requests that each check "no overlap" and then insert can both succeed. Reservation rules also depend on role, holder type, per-user and per-group limits and preemption, which do not fit a plain constraint.

## Decision

Every path that creates, cancels, preempts or releases a reservation takes a **transaction-scoped advisory lock keyed by the device** before reading and writing:

- `src/features/reservations/infrastructure/persistence/prisma/repositories/reservations-prisma.repository.ts`, `lockDevice`: `SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${deviceId}))` on the transaction client.
- The key is `VENTILATOR_DEVICE_ID` (default `ventilab-device-001`), the same key the legacy reserve flow used, so legacy (`POST /api/simulation/reserve`) and new paths serialize on one lock (`docs/ventilator/OPEN-QUESTIONS.md` §2).
- The lock is released automatically at commit or rollback.

This applies the general rule in `CLAUDE.md` ("Persistence"): invariants across rows that cannot be expressed as constraints are enforced in the use case under `pg_advisory_xact_lock`.

## Alternatives considered

- **PostgreSQL exclusion constraint** (`EXCLUDE USING gist (tstzrange(...) WITH &&)`): enforces non-overlap in the database, but needs the `btree_gist` extension, migrations Prisma cannot express in the schema, and cannot express preemption by role. `docs/ventilator/MIGRATION.md` states there is no exclusion constraint.
- **`SERIALIZABLE` transactions:** correct but needs retry loops on every serialization failure.
- **`SELECT ... FOR UPDATE`:** locks existing rows only; it cannot lock the empty slot two requests compete for.
- **In-memory mutex:** breaks with more than one process and does not cover direct SQL.

## Consequences

- All reservation writes for one device are serialized: fine for one ventilator and a classroom's load.
- Correctness depends on every writing path calling `lockDevice`; a new path that forgets it reintroduces the race.
- Concurrency evidence: `src/features/reservations/infrastructure/persistence/prisma/reservations-concurrency.integration-spec.ts` (20 concurrent creates against Testcontainers PostgreSQL, exactly one wins). `docs/ventilator/AUDIT.md` marks it as written but not run at that time; block B reports the reservations concurrency integration test as passing (`docs/verification/BLOCK-B.md`).
