<!--
  Funcionalidad: Protocolo de prueba con el ventilador físico
  Descripción: Lista de verificación para la sesión manual con el ventilador real (precondiciones, seguridad, conectividad, reserva y control, comandos, latencia de telemetría, desalojo, desconexión y cierre) y plantilla de resultados
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Hardware test protocol (real ventilator)

This is a **manual session run by people** with the physical ventilator. It is not an automated test and must never be turned into one.

- No automated suite sends commands to the physical ventilator. Unit and integration tests use in-memory fakes or a throwaway Mosquitto container, and whenever `NODE_ENV=test` the command and ACK topics are prefixed with `MQTT_TEST_TOPIC_PREFIX` (default `test/ventylab`, see `src/features/ventilator-commands/infrastructure/config/`), so they never reach the real topic. The quality-deploy constraints (`odd/tasks/quality-deploy.md`) forbid using the physical ventilator or real MQTT topics from tests.
- The backend never sends a command on its own: reservation end, cancellation, preemption, presence timeouts and errors only revoke the operator control ([docs/ventilator/commands.md](ventilator/commands.md)). Every command in this protocol is sent by a person, on purpose.

Reference documents: [docs/ventilator/README.md](ventilator/README.md), [docs/ventilator/commands.md](ventilator/commands.md), [docs/ventilator/telemetry.md](ventilator/telemetry.md), [docs/ventilator/telemetry-bench.md](ventilator/telemetry-bench.md), [docs/ventilator/OPEN-QUESTIONS.md](ventilator/OPEN-QUESTIONS.md).

## Roles in the session

| Role | Who | Responsibility |
| --- | --- | --- |
| Session lead | the author | Runs the checklist, records results, decides to abort. |
| Device custodian | person responsible for the ventilator | Physical setup, test lung, manual stop at the device. Has the final word on safety. |
| Accounts | one `STUDENT`, one `TEACHER`, one `ADMIN` (and optionally a group with a leader) | Exercise reservation, control and preemption. |

## 1. Preconditions

- [ ] The ventilator is connected to a **test lung / lung simulator, never to a person or animal**.
- [ ] The device custodian knows how to stop ventilation at the device itself; the software has no emergency-stop command.
- [ ] Broker reachable from the server and the device (Node-RED/ESP bridge running if used).
- [ ] Server configuration reviewed (names only, values live in the environment, never in this document):
  - `MQTT_BROKER_URL` (alias `MQTT_URL`), `MQTT_USERNAME`, `MQTT_PASSWORD`: the MQTT connection is only enabled when the URL is set.
  - `MQTT_TELEMETRY_TOPIC` (default `/ventynet/data`), `MQTT_ALARM_TOPIC`, `MQTT_COMMAND_TOPIC` (default `ventilab/device/001/command`), `MQTT_COMMAND_ACK_TOPIC` (empty disables ACK tracking).
  - `NODE_ENV` is **not** `test` (otherwise commands go to the `test/ventylab` prefix and never reach the device).
  - `VENTILATOR_COMMAND_ENCODING` (`json` default; `hex` was never validated against the firmware, see commands.md "Encoders").
  - `VENTILATOR_SAFETY_MAX_*` reviewed with the device custodian (defaults: PEEP 15, pressure limit 40, tidal volume 700, rate 35, I:E 1).
- [ ] Server and device clocks synchronized with NTP (needed only for `deviceLatencyMs`).
- [ ] Server healthy: `GET /health` 200 and `GET /health/ready` 200.
- [ ] `GET /api/system/status` (TEACHER or ADMIN) reviewed: `mqttBroker` and `ventilator` components.
- [ ] Database migrations for `reservations`, `ventilator_commands` and `telemetry_chunks` applied (see [docs/ventilator/MIGRATION.md](ventilator/MIGRATION.md)).
- [ ] No other reservation active for the session window (`GET /api/reservations/current`).

## 2. Safety rules during the session

- [ ] Every command parameter is agreed with the device custodian before it is sent.
- [ ] Start from the device's current settings and change one parameter at a time, inside the safety caps.
- [ ] Abort the session (stop at the device, release control, record the reason) on any unexpected device behaviour, an alarm the custodian does not expect, or a command whose terminal status does not match what the device shows.
- [ ] Never use `hex` encoding on the real device without a firmware specification.
- [ ] Do not run the telemetry bench ([telemetry-bench.md](ventilator/telemetry-bench.md)) against the production telemetry topic while students are connected.

## 3. Connectivity

| Step | Action | Expected |
| --- | --- | --- |
| C1 | Start the server with the broker configured. | Log shows the MQTT connection; no repeated reconnect warnings. |
| C2 | Power on / start publishing from the device. | Broadcast `ventilator:connected { at }`; `GET /api/ventilator/telemetry/metrics` (ADMIN) shows `messagesPerSecond` > 0. |
| C3 | `GET /api/system/status` | `mqttBroker` is `up`; `ventilator` is `up` (online) or `idle` (no active reservation yet). See [docs/operation/SYSTEM-STATUS.md](operation/SYSTEM-STATUS.md). |
| C4 | Publish one invalid payload on the telemetry topic from a test client. | `invalidMessages` increases by 1; frame dropped; at most one warning per `VENTILATOR_INVALID_LOG_INTERVAL_MS`. |
| C5 | Alarm path: trigger an alarm on the device (if it can) or publish one alarm JSON on `MQTT_ALARM_TOPIC`. | Broadcast `ventilator:alarm`. |

## 4. Reservation and control

| Step | Action | Expected |
| --- | --- | --- |
| R1 | STUDENT creates a reservation covering now (`POST /api/reservations`). | 201; `ventilator:availability { occupied: true, ... }` broadcast. |
| R2 | STUDENT socket connects (or sends `ventilator:join`). | Socket joined to the `ventilator` room; `ventilator:telemetry` batches arrive about every 33 ms. |
| R3 | A user who is not a holder sends `ventilator:join`. | `ventilator:join-rejected { reason: "not_reservation_holder" }`. |
| R4 | STUDENT `POST /api/ventilator/control`. | 2xx `taken`; `ventilator:control-changed { reason: "taken" }`. |
| R5 | Another holder (non-leader) `POST /api/ventilator/control`. | 423 `ventilator-commands.control_locked`. |
| R6 | STUDENT sends a command without control (after `DELETE /api/ventilator/control`). | 423 `ventilator-commands.not_operator`; nothing published. |
| R7 | Retake control (R4) before continuing. | `taken`. |

## 5. Commands (one row per mode)

For each mode send one command agreed with the custodian through `POST /api/ventilator/commands` and follow `ventilator:command-status`.

| Step | Mode | Required parameters | Expected |
| --- | --- | --- | --- |
| K1 | `VCV` | `tidalVolume`, `respiratoryRate`, `peep`, `fio2` | 202 `{ commandId, status }`; device applies the setting. |
| K2 | `PCV` | `pressureLimit`, `respiratoryRate`, `peep`, `fio2`, `inspiratoryTime` | as K1 |
| K3 | `SIMV` | `tidalVolume`, `respiratoryRate`, `peep`, `fio2` | as K1 |
| K4 | `PSV` | `pressureLimit`, `peep`, `fio2` | as K1 |
| K5 | invalid: out of range (e.g. `peep` above `VENTILATOR_SAFETY_MAX_PEEP`) | — | 422 `invalid_command` with `data.violations`; **nothing published** (check the broker with a subscriber on the command topic). |
| K6 | invalid: incoherent timing (`60 / RR - Ti < 0.3 s`) | — | 422; nothing published. |
| K7 | rate limit: more than `VENTILATOR_COMMAND_RATE_PER_SECOND` commands in one second (repeat a harmless, identical setting) | — | 429 with `Retry-After`. |

Terminal status to record per command (see commands.md "Lifecycle"):

- `ACKED` / `REJECTED` when `MQTT_COMMAND_ACK_TOPIC` is set and the device answers on it.
- `APPLIED` when there is no ACK topic and a telemetry frame reports matching `settings`.
- `TIMEOUT` after `VENTILATOR_COMMAND_TIMEOUT_MS` (3000 by default). commands.md states that with today's firmware (no `settings` in frames, no ACK) commands end in `TIMEOUT` even when the device applied them, so record what the device shows next to the API status.

`GET /api/ventilator/commands?reservationId=<id>` lists the history with `latencyMs = resolvedAt - sentAt`.

## 6. Telemetry latency measurement

1. `POST /api/ventilator/telemetry/metrics/reset` (ADMIN) at the start of the measurement window.
2. Let the device stream for at least 60 s with a holder connected.
3. `GET /api/ventilator/telemetry/metrics` and `GET /api/ventilator/telemetry/metrics.csv` (ADMIN).
4. Record `messagesPerSecond`, `processingMs` p50/p95/p99 (target p95 < 10 ms), `totalMs` p95 (bounded below by `VENTILATOR_FLUSH_INTERVAL_MS`), `flushMs` p95, `deviceLatencyMs` p95 (only with NTP-synced clocks), `lostMessages`, `invalidMessages`, `bufferDrops`.
5. Optional end-to-end check in the browser: compare a visible device change with the moment the chart reflects it (subjective; record as a note, not a metric).

## 7. Preemption

| Step | Action | Expected |
| --- | --- | --- |
| P1 | With the STUDENT operating, TEACHER `POST /api/reservations/:id/preempt` (or `POST /api/reservations` with `confirmPreempt`). | 201; student reservation `PREEMPTED`; `reservation:preempted` to the holders; `ventilator:control-changed { reason: "reservation_preempted" }`; a `RESERVATION_PREEMPTED` notification. |
| P2 | Former operator sends a command. | 403; nothing published. |
| P3 | TEACHER takes control and sends one agreed command. | `taken`; command lifecycle as in section 5. |
| P4 | (group reservation) Group leader `POST /api/ventilator/control/takeover` while a member operates. | `takeover`; audited as `ventilator_control_taken_over`. |
| P5 | TEACHER tries to create a reservation over another TEACHER's reservation. | 409 `reservations.conflict` (`ReservationConflictError` with `preemptable: false`); an ADMIN may preempt it. |

## 8. Disconnect and recovery

| Step | Action | Expected |
| --- | --- | --- |
| D1 | Stop the device publishing (unplug network or pause the bridge). | After `VENTILATOR_STALE_AFTER_MS` (2000) one `ventilator:disconnected { reason: "device_stale" }`; next command answers 503 `device_offline` and is recorded `REJECTED`. |
| D2 | Restore the device. | `ventilator:connected`; telemetry resumes; record any `lostMessages` jump. |
| D3 | Stop the broker. | `ventilator:disconnected { reason: "broker_disconnected" }`; server retries with exponential backoff (`MQTT_RECONNECT_BASE_MS` to `MQTT_RECONNECT_MAX_MS`). |
| D4 | Restart the broker. | Server reconnects without a restart; telemetry resumes. |
| D5 | Operator closes every browser tab. | After `VENTILATOR_OPERATOR_GRACE_SECONDS` (15) control freed with `presence_timeout`; reconnecting earlier keeps it. |
| D6 | Restart the server during an active reservation. | Control is held in memory (`OperatorControlService`), so the restart frees it; in-flight commands end `TIMEOUT` (`server_shutdown_unconfirmed` if the publish was not confirmed). Operator must retake control. |

## 9. Teardown

- [ ] Return the device to the settings agreed with the custodian (manually at the device if needed).
- [ ] `DELETE /api/ventilator/control` and cancel or let end the session reservation.
- [ ] Stop any recording (`POST /api/ventilator/telemetry/recordings/stop`) and export what is needed.
- [ ] Export `metrics.csv` and the command history for the thesis evidence.
- [ ] Restore any configuration changed for the session (topics, encoding, safety caps).
- [ ] Note open issues in [docs/ventilator/OPEN-QUESTIONS.md](ventilator/OPEN-QUESTIONS.md) or the feature document.

## Results template

Session: date, place, server commit, firmware version, broker, encoding, ACK topic set (yes/no), people present.

| Step | Date/time | Executed by | Expected | Observed | Device observation | Result (pass/fail/blocked) | Evidence (screenshot, CSV, log line) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | | | | | | | |
| C2 | | | | | | | |
| R4 | | | | | | | |
| K1 | | | | | | | |
| … | | | | | | | |

Latency summary:

| Metric | p50 | p95 | p99 | Target | Pass |
| --- | --- | --- | --- | --- | --- |
| `processingMs` | | | | p95 < 10 ms | |
| `totalMs` | | | | ≤ flush + processing + flushMs p95 | |
| `flushMs` | | | | — | |
| `deviceLatencyMs` | | | | informative (NTP) | |

Counters at the end: `messagesPerSecond`, `lostMessages`, `invalidMessages`, `bufferDrops`, commands by terminal status.
