<!--
  Funcionalidad: ADR 0001 - Monolito modular
  Descripción: Registra la decisión de desplegar el backend como un único proceso NestJS dividido en módulos por funcionalidad
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0001: Modular monolith

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

VentyLab serves a single university course: content, evaluations, simulation, AI feedback, groups, notifications and one physical ventilator. It is developed and operated by one person on limited hardware, with one PostgreSQL database (`prisma/schema.prisma`). Several capabilities need shared transactions (for example a reservation preemption and its audit entry) and low-latency in-process communication (MQTT telemetry relayed to Socket.io).

## Decision

The backend is **one NestJS application, one process and one database**, split internally into feature modules.

- `src/main.ts` creates a single app with `NestFactory.create(AppModule, ...)` and listens on one port.
- `src/app.module.ts` imports the global common modules (database, logging, events, realtime, security), the `CompositionModule` (see [ADR 0003](0003-ports-and-composition-root.md)), every feature module and the `AnalyticsPortsModule`.
- `src/features/` holds 37 feature folders. Features talk only through the `<Feature>Facade` each module exports (`CLAUDE.md`, "Cross-feature API") or through in-process domain events (see [ADR 0004](0004-event-bus-vs-transactional-audit-log.md)).
- The MQTT client for the ventilator runs inside the same process (`src/features/ventilator-telemetry`); there is no `@nestjs/microservices` transport and no second service.
- `packages/` only holds the generated TypeScript API client (`packages/api-client`), not a deployable service.

## Alternatives considered

- **Microservices** (separate services for content, simulation, ventilator, AI): independent deployment and scaling, but network calls, distributed transactions and several deployments for a one-person project with one device.
- **Unstructured monolith** (layers by technical type across the whole app): simpler at first, but couples unrelated domains; rejected in favour of per-feature modules ([ADR 0002](0002-per-feature-hexagonal-structure.md)).

## Consequences

- One deploy, one log stream, one health endpoint, and real database transactions across features.
- In-memory state is per process: the ventilator operator control (`OperatorControlService`) and the platform-settings cache assume a **single instance**. Running more than one replica would need shared state; nothing in the code provides it today.
- Feature boundaries are enforced by convention and review, plus `madge --circular` in `scripts/verify/verify.mjs`; there is no ESLint boundary rule. A feature could be extracted later because it only exposes a facade, but no extraction has been prepared.
