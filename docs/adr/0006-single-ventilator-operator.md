<!--
  Funcionalidad: ADR 0006 - Operador único del ventilador
  Descripción: Registra el control exclusivo del ventilador físico por un operador, la toma de control y el desalojo de reservas por rol
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0006: Single ventilator operator with control and preemption

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

There is one physical ventilator. A reservation can belong to a group, so several people may watch the same session; if all of them could send commands, contradictory settings would reach the device. Teachers and administrators must be able to step in, and an operator who closes the browser must not keep the device locked.

## Decision

- **One operator at a time.** `src/features/ventilator-commands/application/services/operator-control.service.ts` keeps `{ reservationId, operatorUserId, since, lastSeenAt }` in memory; the pure rules are in `src/features/ventilator-commands/domain/services/operator-control-policy.ts`. Only the operator may send commands (`POST /api/ventilator/commands`, 423 otherwise).
- **Take:** a holder of the active reservation, a teacher or an administrator takes free control. **Takeover:** only the leader of the holder group, a teacher or an administrator; audited as `ventilator_control_taken_over`. Take and takeover are compare-and-set, so two concurrent takes never both succeed.
- **Presence:** when the operator's last socket closes, control is freed after `VENTILATOR_OPERATOR_GRACE_SECONDS` unless they reconnect or send a heartbeat.
- **Preemption of reservations:** `src/features/reservations/domain/services/reservation-access-policy.ts` (`canPreempt`): a teacher preempts student reservations, an administrator any reservation; use cases `create-reservation.usecase.ts` (with `confirmPreempt`) and `preempt-reservation.usecase.ts` in `src/features/reservations/application/use-cases/`. Preemption, cancellation and reservation end revoke control immediately; the former operator's next command answers 403.
- **The server never sends a command on its own:** revocation only removes control; it never changes device settings.

Full rules: `docs/ventilator/commands.md` ("Exclusive control") and `docs/ventilator/README.md`.

## Alternatives considered

- **Any holder may send commands:** conflicting commands from group members.
- **Persisted control in the database:** survives restarts and allows several replicas, at the cost of a write per heartbeat; not needed for one instance.
- **Only ADMIN on the real ventilator** (the UPPAAL model's property S7/P2): the code deliberately allows the reservation operator; the deviation is recorded in `docs/ventilator/commands.md` ("UPPAAL traceability").

## Consequences

- A server restart frees the control; the operator must take it again.
- Single-instance assumption (see [ADR 0001](0001-modular-monolith.md)).
- `ventilator:control-changed` and `reservation:preempted` keep every client informed; the hardware session in `docs/hardware-test-protocol.md` exercises these paths manually.
