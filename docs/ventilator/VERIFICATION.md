# Verification

Evidence for the 18 verification items of the ventilator brief, collected on 2026-10-10 on branch `main` at `7d828aa` plus the uncommitted T4 changes (UPPAAL property specs, bounded telemetry buffer, docs). Outputs are trimmed; `npm notice` lines are removed. Items marked **manual — not run** need a database, a broker or the device; their procedure is given.

Feature test run used by several items:

```text
$ npx jest src/features/reservations src/features/ventilator-telemetry src/features/ventilator-commands --verbose
Test Suites: 28 passed, 28 total
Tests:       243 passed, 243 total
```

## 1. Type check

```text
$ npx tsc --noEmit
(no output, exit 0)
```

## 2. No dependency cycles

```text
$ npx madge --circular --extensions ts --ts-config tsconfig.json src
Processed 1576 files (27.2s)
✔ No circular dependency found!

$ npx madge --circular --extensions ts src
Processed 1576 files (36.9s) (1324 warnings)
✔ No circular dependency found!
```

The plain form cannot resolve the `@/` path alias (the 1324 warnings are unresolved imports), so only the `--ts-config` form is meaningful; both report no cycle.

## 3. Prisma schema

```text
$ npx prisma validate
Prisma schema warnings:
- The `onDelete` referential action of a relation should not be set to `SetNull` when a referenced field is required. … (4 times)
The schema at prisma\schema.prisma is valid 🚀
```

The four warnings are pre-existing (`ChangeLog.user`, `ContentOverride.creator`, `Activity.creator`, `ActivityAssignment.assigner`); the new `Reservation.preemptedBy` relation is optional.

## 4. No Prisma access outside repositories

```text
$ grep -rn "prisma\." src/features/{reservations,ventilator-telemetry,ventilator-commands} --include=*.ts | grep -v repository
src/features/reservations/infrastructure/persistence/prisma/reservations-concurrency.integration-spec.ts:17:import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
```

The only match is the import path `prisma.service` in the PostgreSQL integration spec, not a client access.

## 5. File headers

```text
$ grep -rL "Autor: Marcela Mazo Castro" src/features/{reservations,ventilator-telemetry,ventilator-commands}
(no output)
$ grep -rL "Autor: Marcela Mazo Castro" src --include=*.ts
(no output)
```

## 6. Single MQTT connection

```text
$ grep -rnE "mqtt\.connect|connectAsync" src --include=*.ts
src/features/ventilator-telemetry/infrastructure/mqtt/mqtt-js-client.factory.ts:59:  const client: mqtt.MqttClient = mqtt.connect(brokerUrl, {
$ grep -rn "test.mosquitto.org" src
(no output)
```

`mqtt-ventilator.connection.spec.ts`: "creates a single client and reuses it when started twice", "ends the previous client before a second instance creates its own (hot reload)", "stays disabled without a broker url".

## 7. Concurrent reservations of one slot

- `create-reservation.usecase.spec.ts` › "creates exactly one of 20 concurrent reservations for the same slot" — passed.
- `uppaal-reservations-properties.spec.ts` › "never leaves two overlapping SCHEDULED reservations after 40 waves of 12 seeded concurrent creates and reserve-now calls" and "lets exactly one of two concurrent reserve-now calls from different users hold the ventilator, 50 times" — passed. With `lockDevice` replaced by a no-op the first test fails (checked once during T4 and reverted), so it detects a missing lock.
- **Live PostgreSQL: manual — not run.** After applying the migration:

  ```bash
  RUN_DB_INTEGRATION=1 npx jest --testRegex 'reservations-concurrency\.integration-spec\.ts$'
  ```

  Without the flag the suite is skipped (`Tests: 1 skipped, 1 total`, observed).

## 8. Preemption

`create-reservation.usecase.spec.ts` › "tells a teacher who holds the slot when preemption is not confirmed", "preempts a student reservation in one transaction when the teacher confirms", "never lets a teacher preempt another teacher", "lets an admin preempt a teacher"; `realtime-reservation.notifier.spec.ts` › "notifies the group room and every member room" — passed.

## 9. Role-based visibility

`reservations.mapper.spec.ts` › "hides other people's data from a student outside the group", "shows the student's own group reservation in full", "shows holder, identifier, group and creator to a teacher"; `create-reservation.usecase.spec.ts` › "rejects a student overlap without exposing who holds the slot" — passed.

## 10. Malformed telemetry

`telemetry-pipeline.service.spec.ts` › "drops them, counts them and never throws", "logs at most one warning per VENTILATOR_INVALID_LOG_INTERVAL_MS"; `telemetry-decoders.spec.ts` › "rejects not json", "rejects string pressure", "rejects non finite value", "rejects a frame with a bad checksum", "reports an invalid payload that is neither json nor hex" (and the other `rejects …` cases) — passed.

## 11. Broker backoff and device disconnection

`mqtt-ventilator.connection.spec.ts` › "grows exponentially, stays within the jitter band and is capped at the maximum", "reconnects forever with exponential backoff capped at the maximum", "resets the backoff after a successful connection", "does not crash when the client cannot be created"; `device-staleness.service.spec.ts` › "emits disconnected once after the stale timeout and connected again on the next message", "marks the device offline when the broker disconnects" — passed.

**Live broker down/up: manual — not run.** Start the server with `MQTT_BROKER_URL` pointing at a broker you control, stop the broker, check the log shows growing reconnect delays capped at `MQTT_RECONNECT_MAX_MS` and clients receive `ventilator:disconnected { reason: "broker_disconnected" }`; start the broker, check the subscriptions are restored and `ventilator:connected` arrives with the next frame.

## 12. Room access rejection

`ventilator-room-access.service.spec.ts` › "rejects ventilator:join from a student when there is no active reservation and sends availability without curves", "rejects a student who is not a holder of the active reservation", "joins a holder to the ventilator room", "lets teachers and administrators receive telemetry through their role room", "clears the room, joins the new holders and broadcasts availability when the active reservation changes"; `uppaal-telemetry-properties.spec.ts` › "rejects a socket that is not a holder of the active reservation and never joins it to the room" — passed.

## 13. Command error codes 403 / 423 / 503 / 422 / 429

`send-ventilator-command.usecase.spec.ts` › "rejects with 403 when no reservation is active", "rejects with 403 a student who is not a holder", "rejects with 423 a holder who is not the operator", "rejects with 429 and a retry time once the burst is used", "rejects with 422 and the violations when the command is invalid", "rejects with 503 without publishing when the device is offline", "rejects with 503 without publishing when the broker is disconnected", "records a failed publish as REJECTED and answers 503" — passed.

## 14. Command lifecycle

`command-lifecycle.service.spec.ts` › "resolves an acknowledgement with status applied as ACKED with its latency", "resolves a rejected acknowledgement as REJECTED with the device reason", "resolves APPLIED when a frame reports the same settings within the tolerance and no acknowledgement topic is configured", "times out after VENTILATOR_COMMAND_TIMEOUT_MS and never leaves a command SENT", "resolves every SENT command as TIMEOUT on shutdown", "keeps the writes of each command in transition order"; `ventilator-command.entity.spec.ts` (13 transition tests) — passed.

## 15. Preempted operator

`send-ventilator-command.usecase.spec.ts` › "revokes control when the active reservation is preempted and answers 403 to the next command"; `operator-control.service.spec.ts` › "revokes control immediately when the reservation is preempted, without sending any command" (and the cancelled/completed variants) — passed.

## 16. Legacy events and routes

- `ventilator:data` shape: `telemetry-pipeline.service.spec.ts` › "keeps the legacy ventilator:data shape with the latest frame" — passed.
- `ventilator:alarm`: "broadcasts a json alarm received on the alarm topic" — passed.
- Legacy reserve/release: `legacy-reservation-adapters.usecase.spec.ts` (6 tests) — passed.
- Legacy command: `src/features/simulation/application/use-cases/send-ventilator-command.usecase.spec.ts` › "keeps the synthetic paths away from the physical ventilator", "delegates the physical path to the ventilator commands facade with the legacy result shape", "propagates the facade errors" — passed in the full run.
- `ventilator:reserved` / `ventilator:released` payloads: no dedicated spec; verified by reading `simulation/infrastructure/events/simulation-realtime.handlers.ts` (same payload, `leaderId: null`).

## 17. UPPAAL properties

```text
uppaal-reservations-properties.spec.ts  9 passed
uppaal-telemetry-properties.spec.ts     7 passed
uppaal-commands-properties.spec.ts      8 passed
```

Test names and the property each one traces are in [UPPAAL-TRACEABILITY.md](UPPAAL-TRACEABILITY.md). These are executable tests, not `verifyta` verdicts.

## 18. Full test suite

```text
$ npx jest
Test Suites: 1 failed, 175 passed, 176 total
Tests:       1 failed, 1308 passed, 1309 total
  ● engine determinism › replays ten simulated minutes at 50 Hz sampling in under 500 ms

$ npx jest src/features/simulation/domain/engine/engine-determinism.spec.ts
Tests:       3 passed, 3 total
```

The only failure is the wall-clock budget of the simulation engine test under full parallel load (outside these features, untouched); it passes alone. See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) item 5.

## 19. T5 verification fixes

Fixes for the independently verified findings F1–F9 (2026-10-10, on `7853683` plus uncommitted changes). Specs that existed before the fix and failed against the previous code are marked RED.

| Finding | Fix | Proof (spec › test) |
| --- | --- | --- |
| F1 control take race | `OperatorControlService.assign` takes the snapshot read by the use case and refuses (423) when the operator, its `since` or the active reservation changed (compare-and-set) | `operator-control.service.spec.ts` › "concurrent take requests (compare-and-set)": "refuses a student take with 423 when a teacher takes over while the holder check is pending", "lets only one of two concurrent takes by holders succeed", "refuses a leader takeover with 423 when the operator changed while the leadership check was pending" — RED (all three) before the fix |
| F2 control state leaks identifiers | Callers who are not holders, group leaders of the holder, teachers or administrators get `{ isOperator, canTake, canTakeover, occupied }` only | `operator-control.service.spec.ts` › "control state visibility" (5 tests, JSON without other user or reservation identifiers) — RED before the fix |
| F3 late events reach the next reservation | `ventilatorCommandsAudience`: when the `ventilator` room belongs to another reservation, `ventilator:command-status` / `ventilator:control-changed` go to `user:{id}`, `role:TEACHER`, `role:ADMIN` | `operator-control.service.spec.ts` › "announces the revocation only to the previous operator, teachers and administrators once the room belongs to the next reservation"; `send-ventilator-command.usecase.spec.ts` › "announces late statuses of a previous reservation only to the sender, teachers and administrators" — RED before the fix |
| F4 early ACK ignored | `CommandLifecycleService.track` before publish; early ACK/APPLIED buffered and applied right after SENT; failed publish drops the tracking; shutdown rejects unsent commands (`server_shutdown`) | `send-ventilator-command.usecase.spec.ts` › "resolves ACKED when the device acknowledges before the broker confirms the publish", "resolves APPLIED when a matching frame arrives before the broker confirms the publish" (RED before the fix), "keeps exactly one terminal state when the early acknowledgement is followed by a failed publish"; `command-lifecycle.service.spec.ts` › "rejects a command still waiting for the broker on shutdown and ignores its late publish confirmation" |
| F5 shutdown ordering | Flush moved to `onModuleDestroy` (bounded to 2 s): Nest runs `onModuleDestroy` before `beforeApplicationShutdown`, and the global `DatabaseModule` (distance `MAX_VALUE`) is destroyed last, so this is the hook that still runs before `PrismaService.$disconnect()`; `beforeApplicationShutdown` would run after it (`node_modules/@nestjs/core/nest-application-context.js` `close()`, `injector/container.js`) | `telemetry-recorder.service.spec.ts` › "waits on shutdown until the last chunk is saved", "gives up waiting for a stuck chunk write after the shutdown timeout"; `command-lifecycle.service.spec.ts` › "stops waiting for pending writes after the shutdown timeout"; `ventilator-commands-lifecycle.service.spec.ts` › "persists the shutdown transitions of sent commands before the module is destroyed" |
| F6 legacy reserve-now skips limits | Shared `assertWithinUpcomingReservationLimits` used by create and reserve-now (students only) | `legacy-reservation-adapters.usecase.spec.ts` › "upcoming reservation limits" (5 tests) — the student and group limit tests were RED before the fix |
| F7 false sequence losses | Reorder window (`VENTILATOR_SEQ_REORDER_WINDOW`, default 16), restart on larger backward jumps, optional 16/32-bit wrap (`VENTILATOR_SEQ_WRAP_BITS`), new `reorderedMessages` metric | `sequence-gap-tracker.spec.ts` (12 tests); `telemetry-pipeline.service.spec.ts` › "does not report losses for reordered frames (10, 8, 11)" — RED before the fix (the new specs failed against the previous tracker) |
| F8 self-referential S2/SM1 oracle | Independent oracle with literal shared ranges and safety caps | `uppaal-commands-properties.spec.ts` › S2/SM1 (3 tests). Mutation check: with `VENTILATOR_SAFETY_MAX_PEEP` raised to 20 in the test doubles the S2/SM1 random test fails (`1 failed`); it passes with 15 |
| F9 unsafe test topic prefix | `@Matches(^[A-Za-z0-9][A-Za-z0-9_\-/]*$)` in `env.validation.ts` and the same check in `readVentilatorCommandsSettings` | `ventilator-commands-config.spec.ts` › "rejects the test topic prefix %p, which could map test topics onto real ones" (9 cases, RED before the fix), "validates MQTT_TEST_TOPIC_PREFIX=%p at startup with %i errors" (4 cases) |

```text
$ npx tsc --noEmit
(no output)

$ npx jest src/features/reservations src/features/ventilator-telemetry src/features/ventilator-commands src/features/simulation
Test Suites: 48 passed, 48 total
Tests:       441 passed, 441 total

$ npx jest
Test Suites: 1 failed, 177 passed, 178 total
Tests:       1 failed, 1359 passed, 1360 total
  ● engine determinism › replays ten simulated minutes at 50 Hz sampling in under 500 ms

$ npx jest src/features/simulation/domain/engine/engine-determinism.spec.ts
Tests:       3 passed, 3 total

$ npx eslint src/features/ventilator-commands src/features/ventilator-telemetry src/features/reservations src/common/infrastructure/config/env.validation.ts
(no output)

$ npx madge --circular --extensions ts --ts-config tsconfig.json src
✔ No circular dependency found!

$ grep -rnE "mqtt\.connect|connectAsync" src --include=*.ts | wc -l
1

$ grep -rL "Autor: Marcela Mazo Castro" src --include=*.ts
(no output)
```

Pre-existing issues found in the same review are listed, not fixed, in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) items 25–33.

## Manual items not run here

| Item | Procedure |
| --- | --- |
| Live PostgreSQL concurrency | Item 7. |
| MQTTX bench (60 Hz, p95) | [telemetry-bench.md](telemetry-bench.md). |
| Broker down/up | Item 11. |
| Physical ventilator | Apply the migration, start with the device broker on test topics (`MQTT_TELEMETRY_TOPIC`, `MQTT_COMMAND_TOPIC`), reserve now, take the control, send one VCV command within the safety limits and check `ventilator:command-status` (expected `TIMEOUT` with today's firmware) and the `ventilator_commands` row; confirm telemetry reaches only holders and teachers. |
| Migration data copy | Verification queries in [MIGRATION.md](MIGRATION.md). |
