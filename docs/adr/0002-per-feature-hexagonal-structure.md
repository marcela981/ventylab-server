<!--
  Funcionalidad: ADR 0002 - Estructura por funcionalidad
  Descripción: Registra la organización de cada funcionalidad en carpetas propias con capas hexagonales (dominio, aplicación, infraestructura, presentación)
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0002: Per-feature (screaming, hexagonal) structure

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

Inside the monolith ([ADR 0001](0001-modular-monolith.md)) the code must show what the system does (reservations, evaluation, simulation...) rather than which framework it uses, and business rules must be testable without a database, HTTP or MQTT.

## Decision

Each feature is a folder under `src/features/<feature-name>/` that replicates four layers, with dependencies pointing inward only (`Presentation → Application → Domain`, `Infrastructure → Domain`, see `CLAUDE.md`):

- `domain/`: entities, value objects, domain services, domain events, repository interfaces, errors. No framework or Prisma imports.
- `application/`: use cases, ports (interfaces plus DI tokens), facades, test doubles.
- `infrastructure/`: Prisma repositories, config readers, event handlers, external adapters.
- `presentation/`: controllers, DTOs (class-validator), mappers.
- `<feature>.module.ts`: wires the layers and exports one `<Feature>Facade`.

Example: `src/features/reservations/` (`application/use-cases`, `domain/services`, `infrastructure/persistence`, `presentation/controllers`). The skeleton and layer rules live in `.claude/skills/adding-feature/SKILL.md`. Shared, feature-agnostic building blocks live in `src/common/`, which never imports from `src/features/`.

## Alternatives considered

- **Express-style layout per feature** (`<name>.routes.ts`, controller, service, repository, `index.ts`): requested in one brief and rejected because it breaks the repository's conventions and skills (`docs/ventilator/OPEN-QUESTIONS.md` §1, `odd/tasks/simulation-features.md` decision 1).
- **Global layers** (`src/controllers`, `src/services`, ...): hides the domain and couples features.

## Consequences

- Domain and use cases are unit-tested with in-memory doubles; the C1 coverage thresholds of block C are measured per feature folder (`docs/verification/BLOCK-C.md`).
- More files per feature and some boilerplate (mappers, tokens, facades).
- Layer direction is a convention: `madge --circular` (configured in `.madgerc`, run by `scripts/verify/verify.mjs`) only detects cycles; no lint rule forbids an inward-to-outward import.
