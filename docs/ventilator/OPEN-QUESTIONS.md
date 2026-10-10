# Open questions

Decisions taken without the author while building `reservations`, `ventilator-telemetry` and `ventilator-commands`. Each entry gives the question, the decision, where it lives in the code and how to change it. Paths are relative to `src/features/` unless stated otherwise.

## Architecture and process

### 1. Express layout requested, NestJS layout used

- **Question.** The brief asked for `<name>.routes.ts | controller | service | repository | schemas | types | index.ts` per feature (an Express layout). The repository is NestJS 11 with four hexagonal layers.
- **Decision.** The continuity rule wins: `application/`, `domain/`, `infrastructure/`, `presentation/` and `<feature>.module.ts`, with a `<Feature>Facade` exported by the module instead of `index.ts`.
- **Where.** The three feature folders; `CLAUDE.md` and the `adding-feature` skill.
- **How to change.** Not recommended; it would break every convention and skill of the repository.

### 2. Label "C3a" not found

- **Question.** The brief refers to a "C3a" lock requirement that does not appear in any document of the workspace.
- **Decision.** The existing mutual exclusion was kept exactly: `pg_advisory_xact_lock(hashtext(deviceId))`, the same key the legacy flow used, so legacy and new paths serialize on one lock.
- **Where.** `reservations/infrastructure/persistence/prisma/repositories/reservations-prisma.repository.ts` (`lockDevice`).
- **How to change.** Change the key in `lockDevice`; every path that creates, cancels, preempts or releases goes through it.

### 3. Native review blocked

- **Question.** The receipt-driven review of the work could not start: START stopped with `lens_context_budget_exceeded` on the 21.6k-line range `6b9d737..1693093` (it included the pre-existing baseline commit).
- **Decision.** No review authority was created; the work was verified with tests and the commands in [VERIFICATION.md](VERIFICATION.md).
- **How to change.** Request a review per feature commit (`1693093`, `35dbcc6`, `7d828aa`, plus the T4 commit) so each slice fits the budget; each slice needs its own consent.

### 4. Engram mirror of the feature document pending

- **Question.** The recovery copy of `odd/tasks/ventilator-features.md` in Engram failed with `ambiguous_project` (the working directory spans several repositories).
- **Decision.** The local file is the source of truth; the mirror is marked pending.
- **How to change.** Re-save the document once the Engram project is selected.

### 5. Flaky simulation test

- **Question.** `src/features/simulation/domain/engine/engine-determinism.spec.ts` ("replays ten simulated minutes at 50 Hz sampling in under 500 ms") fails sometimes under the full parallel `npx jest` run.
- **Decision.** Left untouched (outside these features). It passes alone (3/3 in this run); the failure is a wall-clock budget under CPU contention.
- **How to change.** Raise the budget, run it with `--runInBand`, or move it to a performance suite.

## Reservations

### 6. Legacy `leaderId` ignored

- **Question.** `POST /api/simulation/reserve` accepts `leaderId` ("user who receives the simulator frame"). The new model has no leader per reservation: exclusive control is the operator concept.
- **Decision.** Accepted and ignored; the legacy `ventilator:reserved` payload keeps `leaderId: null`. The migration does not copy it.
- **Where.** `simulation/presentation/dtos/simulation-request.dto.ts`, `simulation/application/use-cases/reserve-ventilator.usecase.ts`, `simulation/infrastructure/events/simulation-realtime.handlers.ts`.
- **How to change.** Map `leaderId` to an initial operator through `VentilatorCommandsFacade` after reserving, or reject the field.

### 7. Legacy reserve with `groupId` falls back to the caller

- **Question.** What happens when someone who may not reserve for the group sends `groupId` on the legacy route?
- **Decision.** The reservation is created for the caller (user holder) instead of failing, to keep the legacy contract working for plain members.
- **Where.** `reservations/application/use-cases/reserve-now.usecase.ts` (`_resolveHolder`).
- **How to change.** Throw `ReservationForbiddenError` there instead of returning `ReservationHolder.forUser(...)`.

### 8. Duration above the maximum on the legacy route

- **Question.** The legacy DTO only requires `durationMinutes >= 1`.
- **Decision.** Longer than `RESERVATION_MAX_DURATION_MINUTES` (120) answers 400 `ReservationTooLongError`; no silent clamping.
- **Where.** `reserve-now.usecase.ts` (`assertWithinMaxDuration`), `src/common/presentation/errors-map.ts`.
- **How to change.** Clamp `durationMinutes` in the use case, or raise the variable.

### 9. Booking the current slot

- **Question.** May a scheduled reservation start in the slot that already began?
- **Decision.** Yes: the start may be the current slot (`startsAt >= floorToSlot(now)`), so "from 10:00" is still bookable at 10:05. Starts in earlier slots are rejected.
- **Where.** `reservations/domain/services/reservation-scheduling-rules.ts` (`assertScheduledWindowRules`).
- **How to change.** Compare `startsAt` with `now` instead of `floorToSlot(now, ...)`.

### 10. `/current` without a reservation

- **Question.** What should `GET /api/reservations/current` answer when nothing is active?
- **Decision.** No reservation and `canControl: false`, even for teachers and administrators.
- **Where.** `reservations/application/use-cases/get-current-reservation.usecase.ts`.
- **How to change.** Return `canControl: true` for privileged roles in the empty branch (note that commands still require an active reservation).

### 11. No student "code" field

- **Question.** The brief asks teachers to see the holder's student code; users have no such field.
- **Decision.** `holderIdentifier` is the e-mail address.
- **Where.** `reservations/application/services/reservation-views.service.ts`, `reservations/presentation/mappers/reservations.mapper.ts`.
- **How to change.** Add the field to the users feature and map it in the views service.

### 12. Create, cancel and preempt return no data

- **Question.** Should `POST /api/reservations` return the created reservation?
- **Decision.** It follows the repository convention for mutations: `data: null` and a message. Clients re-read the calendar.
- **Where.** `reservations/presentation/controllers/reservations.controller.ts`.
- **How to change.** Return the `ReservationDTO` from the controller (the use case already returns the entity).

### 13. "My reservations" covers only the student group

- **Question.** Which groups count for `GET /api/reservations/mine`?
- **Decision.** Reservations the caller holds or created, plus those of the caller's student group. A teacher does not see the reservations of the groups they supervise there (they use the calendar).
- **Where.** `reservations/application/use-cases/get-my-reservations.usecase.ts`, `ReservationAccessService.resolveViewer`.
- **How to change.** Add `getSupervisedStudentGroupIds` to the viewer's `groupIds` for teachers.

## Telemetry

### 14. Teachers receive physical ventilator data at all times

- **Question.** Teachers and administrators are in the telemetry audience (`role:TEACHER`, `role:ADMIN`) even when they are not holders, including while they run a simulated patient in the browser.
- **Decision.** Kept, so teachers can supervise any reservation. The frontend receives both streams through `ventilator:data` and must not mix them (it can ignore physical data while a simulation is running).
- **Where.** `ventilator-telemetry/application/realtime/ventilator-telemetry-events.ts` (`TELEMETRY_PRIVILEGED_ROLES`), `telemetry-pipeline.service.ts`.
- **How to change.** Remove the role rooms from the audience and join teachers to the `ventilator` room on request (`ventilator:join`).

### 15. Holder set not refreshed on membership changes

- **Question.** If a student joins or leaves the holder group during an active reservation, does their access change?
- **Decision.** No: holders are recomputed only when the active reservation changes (polling every `VENTILATOR_ROOM_REFRESH_MS` and reservation events). A removed member keeps receiving telemetry until the reservation ends.
- **Where.** `ventilator-telemetry/application/services/ventilator-room-access.service.ts`.
- **How to change.** Listen to the group membership events and call `refresh` with a forced re-join, or compare the holder list on every refresh.

### 16. Hex decoder and encoder without a specification

- **Question.** No document defines the hex frame format of the firmware.
- **Decision.** The decoder and encoder reuse the pre-existing code unchanged; nothing was invented. JSON is the default for both directions; `auto` decoding keeps the previous behaviour (JSON, then hex). The hex command frame has no room for the correlation identifier.
- **Where.** `ventilator-telemetry/domain/decoders/hex-frame-parser.ts`, `ventilator-commands/domain/encoders/hex-command.encoder.ts`.
- **How to change.** Once the firmware format is documented, add reference vectors to the specs and adjust the layout.

### 17. Latency target contradiction

- **Question.** "Receive → emit p95 < 10 ms" cannot hold with a 33 ms batch period: the queue wait alone can reach 33 ms.
- **Decision.** Processing latency (`processingMs`, receive → enqueued) carries the < 10 ms target; total latency (`totalMs`) is reported separately and is bounded by the flush period plus processing and emit time.
- **Where.** `ventilator-telemetry/application/services/telemetry-pipeline.service.ts`, `telemetry-metrics.service.ts`.
- **How to change.** Lower `VENTILATOR_FLUSH_INTERVAL_MS` (more emits) if the total latency must be lower.

### 18. Bounded batch buffer

- **Question.** The UPPAAL property S8 bounds the telemetry queue at `MAX_QUEUE = 100`; the batch buffer was unbounded.
- **Decision.** Added `VENTILATOR_MAX_BUFFERED_FRAMES` (default 256, roughly 7 flush periods at 1 kHz). When full, the oldest frames are dropped (the latest values matter most) and counted in `bufferDrops`.
- **Where.** `telemetry-pipeline.service.ts` (`_acceptFrame`), `telemetry-metrics.service.ts`.
- **How to change.** Set the variable to 100 to match the model exactly.

## Commands

### 19. No firmware acknowledgement

- **Question.** There is no evidence that the firmware acknowledges commands.
- **Decision.** The ACK topic is configurable and disabled by default. Without it, `APPLIED` is detected from telemetry `settings`; today's firmware sends no settings, so every command ends in `TIMEOUT` after `VENTILATOR_COMMAND_TIMEOUT_MS`. The settings key names expected in frames (the command parameter names such as `peep`, `fio2`, `tidalVolume`) are not verified against the firmware.
- **Where.** `ventilator-commands/application/services/command-lifecycle.service.ts`, `ventilator-commands/domain/services/command-ack.ts`, `ventilator-commands/domain/services/applied-settings-match.ts`, `docs/json-specs/ventilator-command-ack.schema.json`.
- **How to change.** Implement the ACK in the firmware (schema above) and set `MQTT_COMMAND_ACK_TOPIC`, or report settings with the parameter names in telemetry frames.

### 20. Required parameters per mode

- **Question.** No document lists which parameters each ventilation mode requires.
- **Decision.** Inferred from clinical practice: VCV and SIMV need tidal volume, rate, PEEP, FiO2; PCV needs pressure limit, rate, PEEP, FiO2, inspiratory time; PSV needs pressure limit, PEEP, FiO2.
- **Where.** `ventilator-commands/domain/validation/ventilator-command-validator.ts`.
- **How to change.** Edit the per-mode table there; the specs list the expectations.

### 21. `ieRatio` as string and number

- **Question.** The legacy body and wire format use `"1:2"`; arithmetic needs a number.
- **Decision.** The API takes a number (inspiratory over expiratory time, 0.5 = 1:2); the legacy route also accepts `"a:b"`. The JSON encoder writes the legacy string form on the wire.
- **Where.** `ventilator-command-validator.ts`, `ventilator-commands/domain/encoders/`.
- **How to change.** Change the encoder if the firmware accepts a number.

### 22. `POST /api/ventilator/commands` returns 202 with data

- **Question.** Mutations normally return `data: null`.
- **Decision.** `202 Accepted` with `{ commandId, reservationId, status, sentAt }`, because the client needs the correlation identifier to follow `ventilator:command-status`. `status` is normally `SENT`; it is already terminal (`ACKED`, `APPLIED` or `REJECTED`) when the device answered before the broker confirmed the publish.
- **Where.** `ventilator-commands/presentation/controllers/ventilator-commands.controller.ts`.
- **How to change.** Return `null` and let the client match the first `ventilator:command-status` of its own user.

### 23. Control state in memory

- **Question.** Where is the exclusive operator state kept?
- **Decision.** In memory in `OperatorControlService` (single server instance; a restart frees the control). The rate limiter and the room membership are in memory as well.
- **Where.** `ventilator-commands/application/services/operator-control.service.ts`.
- **How to change.** Move the state to a table or to Redis before running more than one instance.

## Verification not run here

### 24. Items that need infrastructure

- **Question.** Several checks need a database, a broker or the device.
- **Decision.** Documented as manual in [VERIFICATION.md](VERIFICATION.md): live PostgreSQL concurrency (`RUN_DB_INTEGRATION=1`), the MQTTX bench ([telemetry-bench.md](telemetry-bench.md)), broker down/up with a live broker (stop the broker, watch `ventilator:disconnected` and the reconnection backoff in the logs, start it again, watch `ventilator:connected`), and physical ventilator tests (commands and telemetry against the real device, first on test topics set through `MQTT_COMMAND_TOPIC` and `MQTT_TELEMETRY_TOPIC`; `MQTT_TEST_TOPIC_PREFIX` only applies when `NODE_ENV=test`).
- **How to change.** Run them after applying the migration, with a broker you control.

## Follow-ups outside this change (pre-existing)

Found during the T5 verification review. They predate the ventilator features or belong to code these features do not own, so they are listed here and not fixed.

### 25. Public simulation health exposes user identifiers

- **Finding.** `GET api/simulation/health` is public and returns the user identifiers of the connected sockets and the identifier of the reservation holder.
- **Where.** `simulation` feature (health controller and its use case).
- **How to change.** Return counts only, or require `simulation:control` / a teacher role for the detailed view.

### 26. Simulation status shows the holder name to any student

- **Finding.** `GET api/simulation/status` returns `currentUserName` to any authenticated student, which conflicts with the rule that students who are not holders see only whether the ventilator is occupied.
- **Where.** `simulation` feature (status use case and DTO).
- **How to change.** Apply the same role-based view as `GET api/reservations/current`.

### 27. Legacy `ventilator:reserved` broadcast carries personal data

- **Finding.** The legacy `ventilator:reserved` event is broadcast to every socket, including unauthenticated ones, with `userId` and `userName`. It was kept unchanged for frontend compatibility, which conflicts with the privacy rule.
- **Where.** `simulation/infrastructure/events/simulation-realtime.handlers.ts`.
- **How to change.** Needs a frontend change: switch the client to `ventilator:availability` (no personal data) and then drop the identifiers from `ventilator:reserved`, or emit it only to holders, teachers and administrators.

### 28. `ventilator:alarm` is broadcast to everyone

- **Finding.** Device alarms go to every socket, including unauthenticated ones.
- **Where.** `ventilator-telemetry` alarm handling (legacy contract kept).
- **How to change.** Emit to the `ventilator` room plus `role:TEACHER` and `role:ADMIN`, like the telemetry batches, once the frontend no longer relies on the broadcast.

### 29. Re-authenticated sockets keep their previous rooms

- **Finding.** A socket that authenticates again as another user keeps the `user:` and `role:` rooms (and the `ventilator` room) joined for the first identity.
- **Where.** `src/common/infrastructure/realtime/realtime.gateway.ts`.
- **How to change.** Leave every server-managed room before joining the rooms of the new identity, or reject re-authentication on a live socket.

### 30. Demoted teachers keep `role:TEACHER` until they reconnect

- **Finding.** A teacher demoted to student keeps the `role:TEACHER` room until the socket reconnects, so they keep receiving teacher events and, since the telemetry features, physical ventilator telemetry.
- **Where.** `realtime.gateway.ts` (rooms joined on authentication only).
- **How to change.** Publish a role-changed event from the users feature and move the user's sockets to the new role room, or disconnect them.

### 31. Integration specs are not matched by the default Jest run

- **Finding.** `*.integration-spec.ts` files are outside the default `testRegex`, so `npx jest` never runs them.
- **How to run.** `RUN_DB_INTEGRATION=1 npx jest --testRegex 'integration-spec\.ts$'` against a database with the migration applied.
- **How to change.** Add a dedicated npm script or a Jest project for integration specs.

### 32. `applied` and `pending` acknowledgements are both terminal

- **Finding.** By design both resolve the command as `ACKED` (terminal); a later `applied` after `pending` is not tracked (see item 19 and [commands.md](commands.md)).
- **How to change.** Add a non-terminal `ACKNOWLEDGED_PENDING` state if the firmware ever sends `pending` followed by `applied`.

### 33. Migration without explicit transaction

- **Finding.** `prisma/migrations/20261010120000_ventilator_features/migration.sql` has no explicit `BEGIN`/`COMMIT`. Prisma Migrate runs each migration in a transaction on PostgreSQL, but a manual `psql -f` run would not.
- **How to change.** Run it only through `prisma migrate deploy`, or wrap it in `BEGIN; ... COMMIT;` before applying it by hand (see [MIGRATION.md](MIGRATION.md)).
