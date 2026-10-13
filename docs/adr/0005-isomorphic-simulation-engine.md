<!--
  Funcionalidad: ADR 0005 - Motor de simulación isomórfico con re-simulación en el servidor
  Descripción: Registra el motor de simulación determinista en TypeScript puro y la regla de que el servidor recalcula los resultados a partir de los eventos del cliente
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0005: Isomorphic simulation engine with server-side re-simulation

- **Status:** Accepted (server side implemented; frontend consumption pending)
- **Date:** 2026-10-12 (documented after the fact)

## Context

Students practise ventilation on a simulated patient and the practice is graded. If the browser computed the curves and the score and sent them, any student could forge a score. The browser still needs to run the simulation locally for a smooth, low-latency experience.

## Decision

- The engine is **pure, deterministic TypeScript** with no Node, framework or I/O dependency, so the same code can run in the browser and on the server: `src/features/simulation/domain/engine/` (`simulation.ts`, `respiratory-mechanics.ts`, `gas-exchange.ts`, `prng.ts`, ...). Randomness comes from a seeded PRNG (`prng.ts`); math goes through `engine-math.ts`; the version is `engine-version.ts`. `index.ts` exposes the public API.
- The server **accepts only events, never results**: `src/features/simulation/application/use-cases/append-simulation-events.usecase.ts` stores client events after idempotency, monotonic-time and engine-limit checks.
- The server **re-simulates** with the session's seed and time multiplier and computes the graded summary itself: `src/features/simulation/application/services/simulation-session-runtime.service.ts` and the deterministic rubric `src/features/simulation/domain/scoring/compute-simulation-score.ts`. The engine version is stored with each session.
- Determinism is tested in `src/features/simulation/domain/engine/engine-determinism.spec.ts` (same case + seed + events → same hash).

## What is not done

"Isomorphic" describes the design, not the current deployment: the engine is **not yet consumed by the frontend** and is not published as a package (`packages/` only holds the API client). `odd/tasks/simulation-features.md` (decision 2) keeps it under `src/features/simulation/domain/engine/`, no monorepo, with frontend consumption as a separate future task.

## Alternatives considered

- **Client-computed scores:** trivial to forge; rejected ("No client-computed scores or metrics accepted", `odd/tasks/simulation-features.md`).
- **Server-only simulation streamed to the browser:** no forgery, but latency and server load per student for every sample.
- **Separate engine package in a monorepo:** cleaner sharing, postponed to avoid restructuring both repositories during the thesis.

## Consequences

- Scores are reproducible: a session can be replayed from seed, events and engine version.
- Any non-determinism (wall clock, `Math.random`, iteration over unordered data) breaks grading; the engine must stay pure.
- Changing the physics changes past replays unless the engine version is respected.
- The performance budget in `engine-determinism.spec.ts` is timing-sensitive under parallel load (BUG-8 in `odd/tasks/quality-deploy.md`).
