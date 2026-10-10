# Physical ventilator audit

Part 1 records the state of the code before this work (baseline commit `15d7095`, where every real-ventilator concern lived in `src/features/simulation`). Part 2 is the requirement-by-requirement status after the three new features (`reservations`, `ventilator-telemetry`, `ventilator-commands`, commits `1693093`, `35dbcc6`, `7d828aa` and the uncommitted T4 changes).

## Part 1. Before state (baseline `15d7095`)

### Reservations

- Table `ventilator_reservations` (model `VentilatorReservation`): `userId`, `userRole` snapshot, `deviceId`, optional `groupId`, optional `leaderId` ("user designated to receive the simulator frame"), `status` `ACTIVE | COMPLETED | CANCELLED | EXPIRED`, `durationMinutes`, `startTime` (default now), `endTime`, `releasedAt`, `purpose`, `cancelReason`. Timestamps were `timestamp(3)` without time zone. Indexes only on `status` and `userId`.
- Only "reserve now for N minutes" (`POST /api/simulation/reserve`) and "release" (`DELETE /api/simulation/reserve`), both with `simulation:control`, which every role holds. No scheduling ahead, no slot alignment, no per-user or per-group limits, no calendar, no preemption, no role-based projection of other people's reservations.
- Mutual exclusion: `pg_advisory_xact_lock(hashtext(deviceId))` around the overlap check (kept as is by the new feature).
- No notification other than the broadcast `ventilator:reserved` / `ventilator:released`.

### Telemetry

- One `MqttVentilatorDeviceGateway` (Nest singleton) called `mqtt.connect` once per `connect()`, with `reconnectPeriod: 0` and its own timer-based reconnection: base 5 s, cap 60 s, **gives up after 5 attempts**. `connect()` only short-circuits when the existing client is already connected, so a second call while a client is still connecting could create a second client; there was no guard for hot reload (module re-instantiated in the same process).
- Default broker `mqtt://test.mosquitto.org:1883` (public), used when no broker variable was set.
- Subscriptions with QoS 1 for telemetry and alarms, restored on every `connect`.
- No database write in the MQTT message handler. The optional InfluxDB store used the SDK's batched `WriteApi` (500 ms or 200 points) and flushed on close.
- Decoding: JSON first, then the hex frame parser (`[0xFF][TYPE][LEN][DATA][XOR]`, partial pressure/flow/volume frames merged into a rolling reading). Invalid messages were logged one warning per message (no rate limit, no counter).
- Relay: every reading emitted `ventilator:data` immediately (one emit per frame, throttled to `WS_MAX_HZ`, default 30), **to every connected socket when no reservation was active** (unauthenticated sockets included), or only to the leader of the active reservation (in-memory cache). No batching, no volatile emits, no sequence tracking, no latency metrics, no staleness detection, no recording.

### Commands

- `POST /api/simulation/command` with `simulation:control`: any role, students included, could command the physical ventilator when no reservation was active.
- The body was an unchecked `Record<string, unknown>` cast to the command type, so `NaN`, strings and out-of-range values reached the device (no server-side range or coherence validation).
- No exclusive operator, no rate limit, no correlation identifier, no acknowledgement or timeout tracking, no persistence of commands. The command topic was a fixed value. An unused `encodeHexCommand` existed.

### Searches without results

| Item | Searched | Result |
| --- | --- | --- |
| Hex protocol specification | `ventilab-web`, `ventylab-server/docs`, `ventylab-server/src`, `uppaal/` for "hex protocol", "hex spec", "hex format", "protocolo hex", "trama hex", `0xA1`, `HEX_PRESSURE` | **NOT FOUND.** Only the pre-existing parser/encoder code and the UPPAAL commands model (which names a `HexEncoder` automaton without byte layout). The thesis PDF was not text-searched. |
| Firmware acknowledgement | `ventilab-web/src` and `ventylab-server` for `commandId`, `correlationId`, "ack" | **NOT FOUND** in any firmware code (no firmware repository in the workspace). Only the design schema `docs/json-specs/ventilator-command-ack.schema.json` exists; the frontend contract has an optional `commandId` field. |

### Frame and simulation engine sample

The simulation engine works with `WaveformSample { simTimeMs, pressureCmH2O, flowLpm, volumeMl }`. The device frame is `{ pressure (cmH2O), flow (L/min), volume (mL), timestamp? }`. The mapping is now explicit in `toWaveformSample(frame, t0)` (`src/features/ventilator-telemetry/domain/value-objects/telemetry-frame.ts`): `simTimeMs = serverTs - t0`, `pressureCmH2O = pressure`, `flowLpm = flow`, `volumeMl = volume`. Units already matched; only the time base differs (server receive time relative to `t0`).

### Socket events and MQTT topics

| Name | Kind | Before | After |
| --- | --- | --- | --- |
| `ventilator:data` | socket event | every frame, to everyone when no reservation, else to the leader | once per flush (latest frame), volatile, to the `ventilator` room (holders) and teachers/administrators |
| `ventilator:alarm` | socket event | broadcast | broadcast (unchanged) |
| `ventilator:reserved`, `ventilator:released` | socket event | broadcast from the reserve routes | unchanged, still from the legacy routes |
| `ventilator:telemetry`, `ventilator:availability`, `ventilator:join-rejected`, `ventilator:connected`, `ventilator:disconnected`, `ventilator:control-changed`, `ventilator:command-status`, `reservation:preempted` | socket events | did not exist | new, see [README.md](README.md) |
| `MQTT_TELEMETRY_TOPIC` (`/ventynet/data`) | MQTT topic | QoS 1 | QoS 0 |
| `MQTT_ALARM_TOPIC` | MQTT topic | QoS 1 | QoS 1 |
| `MQTT_COMMAND_TOPIC` | MQTT topic | fixed value, flat JSON | configurable, QoS 1, flat JSON plus `correlationId` |
| `MQTT_COMMAND_ACK_TOPIC` | MQTT topic | did not exist | optional, disabled by default |

## Part 2. Requirement status after this work

Legend: **IMPLEMENTED** (code and automated test), **PARTIAL** (what is missing is stated), **NOT IMPLEMENTED**.

### Reservations

| Requirement | Status | Evidence / missing |
| --- | --- | --- |
| Data model (holder user or group, creator, window, lifecycle status, preemption fields) | IMPLEMENTED | `reservations` table, `Reservation` entity. Migration not applied yet (see [MIGRATION.md](MIGRATION.md)). |
| Roles: student for self, group leader for the group, teacher for self or supervised groups, administrator for anyone | IMPLEMENTED | `reservation-access-policy.ts`, `create-reservation.usecase.spec.ts`. |
| Calendar rules: slot alignment, maximum duration, no past slot, maximum advance | IMPLEMENTED | `reservation-scheduling-rules.ts` and spec. |
| Limits: upcoming reservations per student and per group | IMPLEMENTED | `create-reservation.usecase.spec.ts` "stops a student at the maximum of upcoming reservations". |
| No overlap under concurrency | PARTIAL | In-memory mutex test (20 concurrent → 1) and seeded property test pass; `reservations-concurrency.integration-spec.ts` against PostgreSQL exists but was not run (needs the migration applied). |
| Cancellation rules | IMPLEMENTED | Creator, holder, holder group leader, supervising teacher or administrator. |
| Preemption (teacher over students, administrator over teachers, confirmation, conflict details) | IMPLEMENTED | `create-reservation.usecase.spec.ts` "overlaps and preemption". |
| Preemption notifier | IMPLEMENTED | `ReservationNotifier` port, realtime adapter (`reservation:preempted`). No e-mail channel. |
| Audit | IMPLEMENTED | Preemption through `IAuditRecorder` in the same transaction; entity audit entries persisted on save. |
| Role-based visibility | IMPLEMENTED | `reservations.mapper.spec.ts`. |
| Endpoints | IMPLEMENTED | Six routes under `/api/reservations`. |
| Facade | IMPLEMENTED | `ReservationsFacade`. |
| Legacy reserve/release routes keep their contract | IMPLEMENTED | `legacy-reservation-adapters.usecase.spec.ts`. The `ventilator:reserved`/`released` broadcast has no dedicated spec (code inspection only). |

### Telemetry

| Requirement | Status | Evidence / missing |
| --- | --- | --- |
| Single MQTT client | IMPLEMENTED | `mqtt.connect` appears once in `src`; hot-reload guard on `globalThis`; `mqtt-ventilator.connection.spec.ts`. |
| QoS (0 telemetry, 1 alarms, 1 commands) | IMPLEMENTED | Connection spec "restores subscriptions with their qos". |
| Infinite exponential backoff with cap and jitter | IMPLEMENTED | Connection spec "reconnects forever with exponential backoff capped at the maximum". |
| Graceful shutdown on SIGTERM | IMPLEMENTED | `app.enableShutdownHooks()` + `onApplicationShutdown` ends the client and flushes. Not tested with a live signal. |
| Broker configuration without a public default | IMPLEMENTED | Connection enabled only when `MQTT_BROKER_URL` is set; no `test.mosquitto.org` in `src`. |
| Decoders (JSON, hex, auto) | PARTIAL | JSON and auto fully tested; hex decodes the pre-existing layout, which has no specification. |
| Invalid message handling (drop, count, rate-limited log) | IMPLEMENTED | Pipeline spec "malformed messages". |
| Normalized frame | IMPLEMENTED | `TelemetryFrame`, decoder specs. |
| Batching every 33 ms | IMPLEMENTED | Pipeline spec "batching", UPPAAL S7 test. |
| Bounded batch buffer | IMPLEMENTED | `VENTILATOR_MAX_BUFFERED_FRAMES`, `bufferDrops`, UPPAAL S8 test. |
| Volatile multi-room emit | IMPLEMENTED | `emitToRoomsVolatile`. |
| Room access (holders + teachers/administrators, rejection, availability) | PARTIAL | Implemented and tested; the holder set is recomputed only when the active reservation changes, not when group membership changes mid-reservation. |
| Device staleness | IMPLEMENTED | `device-staleness.service.spec.ts`. |
| Sequence gaps | IMPLEMENTED | Pipeline spec "sequence gaps". |
| Metrics and CSV | IMPLEMENTED | `telemetry-metrics.service.spec.ts`. |
| Latency target (processing p95 < 10 ms) | PARTIAL | Met in unit tests (performance spec and UPPAAL S3); the broker bench was not run (manual, see [telemetry-bench.md](telemetry-bench.md)). |
| Recording | IMPLEMENTED | `telemetry-recorder.service.spec.ts`. |
| No database write on the hot path | IMPLEMENTED | Recording and InfluxDB are asynchronous and batched. |
| Facade | IMPLEMENTED | `VentilatorTelemetryFacade`. |

### Commands

| Requirement | Status | Evidence / missing |
| --- | --- | --- |
| Exclusive operator | PARTIAL | Implemented and tested; state is in memory, so it only holds for a single server instance. |
| Presence heartbeat | PARTIAL | Socket and HTTP heartbeat implemented; the current frontend sends none, so socket presence is the signal. |
| Takeover | IMPLEMENTED | Group leader of the holder, teacher, administrator; audited. |
| Revocation on preemption, cancellation, end, presence timeout | IMPLEMENTED | `operator-control.service.spec.ts`. |
| Validation (ranges, coherence, safety limits, `NaN`/strings) | IMPLEMENTED | `ventilator-command-validator.spec.ts`, UPPAAL S2. Required parameters per mode are inferred (see [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)). |
| Authorization (403/423) | IMPLEMENTED | `send-ventilator-command.usecase.spec.ts`. |
| 503 when the device or broker is offline | IMPLEMENTED | Same spec. |
| Rate limit (429 with `Retry-After`) | IMPLEMENTED | Same spec, `token-bucket.spec.ts`. |
| Encoders | PARTIAL | JSON is the format the firmware already receives; hex wraps unspecified pre-existing code and carries no correlation identifier. |
| QoS 1 and `correlationId` | IMPLEMENTED | Same spec "publishes the flat JSON with its correlationId". |
| Lifecycle (PENDING → SENT → ACKED/APPLIED/REJECTED/TIMEOUT) | PARTIAL | Implemented and tested; with today's firmware (no ACK, no settings in frames) every command ends in `TIMEOUT`. |
| Persistence | IMPLEMENTED | `ventilator_commands`, ordered non-blocking writes. |
| Events | IMPLEMENTED | `ventilator:control-changed`, `ventilator:command-status`. |
| No automatic commands | IMPLEMENTED | Revocation paths never publish (operator control spec). |
| UPPAAL property tests | PARTIAL | Executable property tests exist for the three models ([UPPAAL-TRACEABILITY.md](UPPAAL-TRACEABILITY.md)); no `verifyta` verdict is recorded, so nothing is formally verified. |
| Firmware acknowledgement | NOT IMPLEMENTED | Firmware side, outside this repository. |

### Database, configuration and conventions

| Requirement | Status | Evidence / missing |
| --- | --- | --- |
| Indexes | IMPLEMENTED | `(starts_at, ends_at)`, `(status, starts_at)`, `group_id`, `user_id`, `(reservation_id, sent_at)`, `(reservation_id, start_ts)`. |
| Migration | PARTIAL | Written offline, reviewed in [MIGRATION.md](MIGRATION.md), not applied. |
| Environment validation | IMPLEMENTED | `env.validation.ts`. |
| `.env.example` | NOT IMPLEMENTED | File not readable in this environment; exact changes listed in [README.md](README.md). |
| Mandatory file header | IMPLEMENTED | `grep -rL "Autor: Marcela Mazo Castro" src --include=*.ts` returns nothing. |
| No `prisma.` outside repositories | IMPLEMENTED | See [VERIFICATION.md](VERIFICATION.md). |
| No dependency cycles | IMPLEMENTED | `madge --circular` reports none. |
| Multi-instance deployment | NOT IMPLEMENTED | Operator control, rate limiter, room membership and the MQTT client assume one server process. |
| Frontend use of the new events and endpoints | NOT IMPLEMENTED | Out of scope; legacy events keep the current frontend working. |

### Summary

| Status | Count |
| --- | --- |
| IMPLEMENTED | 43 |
| PARTIAL | 10 |
| NOT IMPLEMENTED | 4 |
