<!--
  Funcionalidad: Índice de registros de decisiones de arquitectura
  Descripción: Lista los ADR del backend de VentyLab, su estado y el formato que siguen
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Architecture decision records

Each record documents a decision that is **already implemented** in this repository and cites the code that implements it. They were written on 2026-10-12, after the fact, from the code and the existing documents; the date in each record is the date it was written, not the date the decision was first taken (that history lives in git).

Format: Status, Date, Context, Decision, Alternatives considered, Consequences. A record is never rewritten when the decision changes: a new record supersedes it and the old one gets the status `Superseded by ADR-NNNN`.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-modular-monolith.md) | Modular monolith | Accepted |
| [0002](0002-per-feature-hexagonal-structure.md) | Per-feature (screaming, hexagonal) structure | Accepted |
| [0003](0003-ports-and-composition-root.md) | Ports and a composition root | Accepted |
| [0004](0004-event-bus-vs-transactional-audit-log.md) | Event bus for side effects, transactional audit log for accountability | Accepted |
| [0005](0005-isomorphic-simulation-engine.md) | Isomorphic simulation engine with server-side re-simulation | Accepted |
| [0006](0006-single-ventilator-operator.md) | Single ventilator operator with control and preemption | Accepted |
| [0007](0007-advisory-lock-for-reservations.md) | Advisory lock for reservations | Accepted |
| [0008](0008-openapi-as-the-contract.md) | OpenAPI as the contract | Accepted |
| [0009](0009-platform-settings-with-hard-limits.md) | Platform settings with hard limits | Accepted |

Related: [ERD](../erd/erd.md), [runbook](../runbook.md), [hardware test protocol](../hardware-test-protocol.md).
