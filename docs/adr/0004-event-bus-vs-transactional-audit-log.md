<!--
  Funcionalidad: ADR 0004 - Bus de eventos frente a bitácora de auditoría transaccional
  Descripción: Registra la separación entre eventos de dominio en proceso para efectos secundarios y la auditoría escrita en la misma transacción del cambio
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0004: Event bus for side effects, transactional audit log for accountability

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

Two different needs look alike: (a) reacting to something that happened (notify users, emit Socket.io events, call a language model, refresh a room) and (b) recording who changed what in an administrative action, with a guarantee that the record exists if and only if the change was committed. An in-process event bus gives no delivery guarantee: handlers run after commit and may fail or the process may stop.

## Decision

**Side effects go through the event bus.**

- Port: `src/common/application/events/event-bus.interface.ts` (`EVENT_BUS_TOKEN`, `IEventBus.publish(events)`).
- Implementation: `src/common/infrastructure/events/nest-event-bus.ts` on EventEmitter2 (`@nestjs/event-emitter`), emitting under the class name and the catalog name, isolating each subscriber and logging its errors.
- Events are published **after persistence**; when a handler must see committed data, the use case returns the events from `transactionManager.run(...)` (`src/common/application/persistence/transaction-manager.interface.ts`) and publishes after it resolves. Slow work runs in `@OnEvent(..., { async: true })` handlers that catch every error (`.claude/skills/event-driven/SKILL.md`).

**Accountability goes through the audit recorder, inside the transaction.**

- Port: `src/common/application/ports/audit-recorder.interface.ts` (`AUDIT_RECORDER_TOKEN`, `record(actorId, action, targetType, targetId, before, after, transaction?, options?)`); implementation `src/common/infrastructure/persistence/audit-log/audit-log-recorder.ts`, which stores only changed fields, redacts secrets and hashes long text.
- Action names come from `AUDIT_ACTIONS` in `src/common/domain/audit/audit-action.ts`.
- `audit_logs` is append-only: `prisma/migrations/20261011130000_audit_log_extension/migration.sql` adds `audit_logs_block_mutation()` and triggers rejecting `UPDATE`, `DELETE` and `TRUNCATE`.
- Examples: preemption in `src/features/reservations/application/use-cases/create-reservation.usecase.ts` and settings changes in `src/features/platform-settings/application/use-cases/update-platform-setting.usecase.ts` audit in the same transaction as the change.

## Alternatives considered

- **Audit from event handlers:** simpler wiring, but an audit row could be lost after a committed change (handler failure, crash) or written for a change that rolled back if published too early.
- **Transactional outbox + external broker** for events: delivery guarantees for side effects, but a relay process and broker that a single-instance monolith does not need; side effects here are best-effort by design.
- **Database triggers for all auditing:** no actor role, request id or IP from the request context.

## Consequences

- Audit is consistent with data; side effects are at-most-once and may be lost on a crash (for example a notification). Handlers must tolerate that.
- Consumer features import only the common audit port, never the audit query feature (`/api/audit`).
- Because events are in-process, a second replica would not receive them (see [ADR 0001](0001-modular-monolith.md)).
