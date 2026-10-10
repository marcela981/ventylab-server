# Ventilator commands

`src/features/ventilator-commands` is the only path from the API to the physical ventilator. It owns the exclusive operator control, command validation, rate limiting, encoding, publishing over the single MQTT connection of `ventilator-telemetry`, the command lifecycle and its history. Other features use it only through `VentilatorCommandsFacade` (`send`, `getControlOverview`). It depends only on `common`, `ReservationsFacade` and `VentilatorTelemetryFacade`.

The backend never sends a command on its own: reservation end, cancellation, preemption, presence timeouts and errors only revoke the control.

## Endpoints

All routes are under `/api/ventilator`, need a JWT and the `ventilator:control` permission (granted to every role; the real authorization is the reservation and operator logic below). Swagger tag: "Ventilator commands".

| Method and path | Who | Result |
| --- | --- | --- |
| `GET control` | any authenticated user | Active reservation, operator, `since`, `lastSeenAt`, `presenceExpiresAt`, and whether the caller `isOperator`, `canTake`, `canTakeover`. |
| `POST control` | holder of the active reservation, teacher, administrator | Takes the free control (`taken`). The current operator calling it again only refreshes presence. |
| `POST control/takeover` | leader of the holder group, teacher, administrator | Takes the control from the current operator (`takeover`), audited as `ventilator_control_taken_over` on target `VentilatorControl`. When the control is free it behaves as `POST control`. |
| `DELETE control` | the operator, teacher, administrator | Releases the control (`released`). Idempotent when nobody holds it. |
| `POST control/heartbeat` | the operator | Refreshes `lastSeenAt` and cancels a pending presence timeout. |
| `POST commands` | the operator | `202 Accepted` with `{ commandId, reservationId, status: "SENT", sentAt }`. |
| `GET commands?reservationId=&page=&limit=&sortOrder=` | holders of that reservation, teacher, administrator | Paginated history, newest `sentAt` first by default. |

`POST commands` returns data although mutations normally return `null`: the client needs the correlation identifier to follow `ventilator:command-status`.

The legacy `POST /api/simulation/command` keeps its request and response shape. Its synthetic paths (adjusting or starting the simulated patient) are unchanged; its physical path delegates to `VentilatorCommandsFacade.send`, so it now answers with the error codes below and `commandId` is the correlation identifier.

## Error codes

Checked in this order by `POST commands`; nothing is published unless every check passes.

| Status | Error | Code | When |
| --- | --- | --- | --- |
| 403 | `NoActiveVentilatorReservationError` | `ventilator-commands.no_active_reservation` | No reservation is active now. |
| 403 | `NotReservationHolderError` | `ventilator-commands.not_reservation_holder` | Caller is neither a holder nor a teacher or administrator. |
| 423 | `NotVentilatorOperatorError` | `ventilator-commands.not_operator` | Caller does not hold the control. |
| 429 | `VentilatorCommandRateLimitedError` | `ventilator-commands.rate_limited` | Per-user token bucket empty; `Retry-After` is set. |
| 422 | `InvalidVentilatorCommandError` | `ventilator-commands.invalid_command` | Validation failed; `data.violations` lists `{ field, rule, message, limit? }`. |
| 503 | `VentilatorDeviceOfflineError` | `ventilator-commands.device_offline` | Device stale, broker disconnected, or the publish failed (the command is recorded as `REJECTED`). |

Other errors: `VentilatorControlLockedError` (423, `control_locked`) when the control belongs to someone else on take, takeover or release; `VentilatorCommandReservationNotFoundError` (404) on the history; `IllegalVentilatorCommandTransitionError` (409) guards the lifecycle. Malformed bodies on `POST commands` fail earlier with 400 (`mode` must be one of the modes, every parameter a finite number: strings, `NaN` and infinities are rejected).

## Validation

Pure domain validation (`domain/validation/ventilator-command-validator.ts`) runs on every command, including the legacy route whose body is untyped.

Required parameters per mode:

| Mode | Required | Optional |
| --- | --- | --- |
| `VCV` | `tidalVolume`, `respiratoryRate`, `peep`, `fio2` | `inspiratoryTime`, `ieRatio`, `flowRate`, `sensitivity`, `pressureLimit` |
| `PCV` | `pressureLimit`, `respiratoryRate`, `peep`, `fio2`, `inspiratoryTime` | `ieRatio`, `flowRate`, `sensitivity`, `tidalVolume` |
| `SIMV` | `tidalVolume`, `respiratoryRate`, `peep`, `fio2` | as `VCV` |
| `PSV` | `pressureLimit`, `peep`, `fio2` | `respiratoryRate` (backup), `sensitivity`, others |

Rules, all reported together:

1. Ranges from the shared limits (`src/common/domain/ventilator/ventilator-limits.ts`): tidal volume 200–800 mL, rate 5–40/min, PEEP 0–20 cmH2O, FiO2 0.21–1, pressure limit 10–50 cmH2O, inspiratory time 0.5–3 s, flow 20–100 L/min, sensitivity uses the flow trigger range 0.5–10 L/min, `ieRatio` > 0.
2. Coherence: expiratory time `60 / RR - Ti >= 0.3 s`; a given `ieRatio` must match `Ti / (60 / RR - Ti)` within 5 %; the given or derived I:E must not exceed `VENTILATOR_SAFETY_MAX_IE_RATIO` (1 by default, so inverse ratios are rejected); `pressureLimit > peep`.
3. Stricter safety limits (`VENTILATOR_SAFETY_MAX_*`), each clamped so it can never be looser than the shared limit.

`ieRatio` is inspiratory over expiratory time (0.5 = 1:2). The legacy route also accepts the `"1:2"` string form.

## Exclusive control

One operator at a time, kept in memory by `OperatorControlService` (single instance; a restart frees the control). State: `{ reservationId, operatorUserId, since, lastSeenAt }`.

- Take: needs an active reservation; a holder, teacher or administrator takes free control. When someone else operates, a plain take answers 423.
- Takeover: only the leader of the holder group (`ReservationsFacade.isGroupLeaderOfHolder`, false for user reservations), a teacher or an administrator. Audited.
- Release: the operator, a teacher or an administrator.
- Presence: when the operator's last socket disconnects (`realtime.client-disconnected` with `remainingSockets = 0`), a timer of `VENTILATOR_OPERATOR_GRACE_SECONDS` starts; a reconnection (`realtime.client-authenticated`), a `ventilator:heartbeat` socket message or `POST control/heartbeat` cancels it; on expiry the control is freed (`presence_timeout`). The current frontend sends no heartbeat, so the socket connection is the default presence signal.
- Revocation: immediately on `ReservationPreemptedEvent` (`reservation_preempted`), `ReservationCancelledEvent` or `ReservationCompletedEvent` (`reservation_ended`) for the operator's reservation, and on the periodic refresh (`VENTILATOR_CONTROL_REFRESH_MS`) or any request that reads a different active reservation. After a preemption the next command of the former operator answers 403.

`ventilator:control-changed` `{ reservationId, operatorUserId | null, reason }` with reason `taken`, `takeover`, `released`, `presence_timeout`, `reservation_ended` or `reservation_preempted` goes to rooms `ventilator`, `role:TEACHER` and `role:ADMIN` (one emit per room, so a user in several of them receives it more than once).

## Lifecycle

```text
                 publish resolved (PUBACK)
   PENDING ─────────────────────────────────► SENT
      │                                         │
      │ publish failed                          ├─ ACK applied|pending ──► ACKED     (terminal)
      ▼                                         ├─ ACK rejected ─────────► REJECTED  (terminal, reason)
   REJECTED (terminal, reason)                  ├─ settings match ───────► APPLIED   (terminal, no ACK topic)
                                                └─ VENTILATOR_COMMAND_TIMEOUT_MS ─► TIMEOUT (terminal)
```

- Illegal transitions throw. A timer is armed for every SENT command and cleared on resolution; shutdown resolves pending commands as `TIMEOUT`, so no command stays SENT. `latencyMs = resolvedAt - sentAt`.
- ACK: when `MQTT_COMMAND_ACK_TOPIC` is set, it is subscribed with QoS 1 and JSON messages `{ commandId | correlationId, status: "applied" | "rejected" | "pending", reason? }` (design schema `docs/json-specs/ventilator-command-ack.schema.json`) resolve the command. `pending` counts as ACKED. ACKED is terminal for the API: a later "applied" is not tracked.
- APPLIED: without an ACK topic, a telemetry frame whose `settings` report every numeric parameter of the command under the same name within `VENTILATOR_APPLY_TOLERANCE_RATIO` (and the same `mode` when reported) resolves it.
- With today's firmware (no settings in frames, no ACK evidence) commands end in `TIMEOUT`.
- `ventilator:command-status` `{ commandId, reservationId, userId, status, sentAt?, resolvedAt?, latencyMs?, reason? }` is emitted on each transition to the same three rooms.
- Persistence (`ventilator_commands`, upsert by correlation identifier) never blocks the publish: the publish happens first, then each state is written through a per-command ordered promise chain whose errors are logged. PENDING is never written; the first row already holds SENT or REJECTED.

## Encoders

`VENTILATOR_COMMAND_ENCODING` selects the strategy.

- `json` (default): the flat JSON the ventilator already receives (`mode`, `tidalVolume`, `respiratoryRate`, `peep`, `fio2` and the optional parameters, `ieRatio` as `"1:2"`) plus the additive `correlationId`. `docs/json-specs/ventilator-command.schema.json` describes a nested design that is not used on the wire.
- `hex`: `[0xFF][0xB1][LEN][MODE][TV_HI][TV_LO][RR][PEEP][FIO2*100][PLIM?][IT*10 u16?][XOR]`, modes VCV=1, PCV=2, SIMV=3, PSV=4. The layout comes from pre-existing code; no protocol specification exists and it was not validated against the firmware. The frame has no room for the correlation identifier, so ACKs cannot be matched in this encoding, and parameters a mode does not use are written as 0. Its tests only check self-consistency (length, checksum, bytes), because there are no reference vectors.

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `MQTT_COMMAND_TOPIC` | `ventilab/device/001/command` | Published with QoS 1. |
| `MQTT_COMMAND_ACK_TOPIC` | empty | Empty disables ACK tracking. |
| `MQTT_TEST_TOPIC_PREFIX` | `test/ventylab` | Prepended to the command and ACK topics whenever `NODE_ENV=test`, so automated tests never reach the real topic. |
| `VENTILATOR_COMMAND_ENCODING` | `json` | `json` or `hex`. |
| `VENTILATOR_COMMAND_TIMEOUT_MS` | 3000 | SENT → TIMEOUT. The UPPAAL model uses `ACK_TIMEOUT = 1000`. |
| `VENTILATOR_COMMAND_RATE_PER_SECOND` | 5 | Per-user token bucket (burst = rate). |
| `VENTILATOR_OPERATOR_GRACE_SECONDS` | 15 | Presence grace after the operator's last socket closes. |
| `VENTILATOR_CONTROL_REFRESH_MS` | 1000 | Active reservation polling period. |
| `VENTILATOR_APPLY_TOLERANCE_RATIO` | 0.05 | Relative tolerance for APPLIED. |
| `VENTILATOR_SAFETY_MAX_PEEP` | 15 | cmH2O, clamped to 20. |
| `VENTILATOR_SAFETY_MAX_PRESSURE_LIMIT` | 40 | cmH2O, clamped to 50. |
| `VENTILATOR_SAFETY_MAX_TIDAL_VOLUME` | 700 | mL, clamped to 800. |
| `VENTILATOR_SAFETY_MAX_RESPIRATORY_RATE` | 35 | /min, clamped to 40. |
| `VENTILATOR_SAFETY_MAX_IE_RATIO` | 1 | 0.1–4; 1 rejects inverse ratios. |

## UPPAAL traceability

`application/uppaal-commands-properties.spec.ts` checks the queries of `ventilab-commands-uppaal.xml` as executable tests (seeded random exploration for the safety properties). It is test evidence, not a model-checking verdict; no `verifyta` result is recorded.

| Query | Test |
| --- | --- |
| S2/SM1 `A[] (mqttClient.PUBLISHING imply params_in_safe_range)` | 3000 seeded random commands (NaN, infinities, strings, booleans, out of range): only commands passing validation are published, and every published payload re-validates. |
| S6/P1 `A[] (apiGateway.EXECUTING imply hasPermission())`, S7/P2 `A[] not (user_role == 1 and is_real_ventilator and apiGateway.EXECUTING)` | 2000 seeded random actions: a publish happens only with an active reservation and the caller as operator; a student without a reservation never publishes. Deviation: the model allows only ADMIN on the real ventilator, the code allows the reservation operator. |
| L1 `commandValidator.APPROVED --> mqttClient.PUBLISHING` | Approved command from the operator with the device online is published. |
| L2 `mqttClient.AWAITING_ACK --> (SUCCESS or ERROR)` | 200 commands with random ACKs, fake timers: all terminal after the timeout, none SENT. |
| S3 `A[] mqttClient.AWAITING_ACK imply t_ack <= ACK_TIMEOUT` | With the timeout set to 1000 ms the command is SENT at 999 ms and TIMEOUT at 1000 ms. |
| R1 `E<> mqttClient.SUCCESS` | ACKED reached with the ACK topic enabled. |
| R2 `E<> commandValidator.REJECTED` | 422 on an out-of-range command, and a device rejection reaches REJECTED. |
| R3 `E<> apiGateway.FORBIDDEN` | 403 without reservation and for a non-holder. |

The model's `MAX_RETRIES = 3` has no counterpart: the server does not retry commands (QoS 1 already redelivers to the broker), and a retry could apply a stale setting.
