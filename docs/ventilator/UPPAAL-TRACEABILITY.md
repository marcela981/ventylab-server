# UPPAAL traceability

> **Warning.** No `verifyta` verdict is recorded for any of the three models. The `*_verifyta.log` files in `uppaal/corrected-v2/` are empty or contain only progress lines for `A[] not deadlock`, and `VERIFYTA_RESULTS.md`, referenced by `AUDIT_V2.md`, does not exist. The properties below are therefore **traced** to code and to executable tests, not **formally verified**. A passing test is evidence that the implementation behaves like the property on the explored inputs (seeded random exploration for safety properties); it is not a proof. `uppaal/audit/MAPPING.md` maps properties to requirements only and predates the `corrected-v2` renumbering.

Models (paths relative to the workspace root `C:/Marcela/TESIS`):

- Telemetry: `uppaal/corrected-v2/ventilab-uppaal.xml`
- Commands: `uppaal/corrected-v2/ventilab-commands-uppaal.xml`
- Authentication and ventilator access: `uppaal/corrected-v2/ventilab-auth-uppaal.xml` (template `VentilatorAccess`, instances `ventA` and `ventB`)

Spec files (under `src/features/`):

- `TEL` = `ventilator-telemetry/application/uppaal-telemetry-properties.spec.ts`
- `CMD` = `ventilator-commands/application/uppaal-commands-properties.spec.ts`
- `RES` = `reservations/application/uppaal-reservations-properties.spec.ts`

Status: **covered** (a test checks the property), **deviation** (covered, but the code intentionally differs from the model), **not testable** (timing of a component the backend does not own, or a model-only property), **out of scope** (authentication flow, not part of the ventilator features).

## Telemetry model (`ventilab-uppaal.xml`)

| Id | Model line | Formula | Meaning | Code | Spec and test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | 354 | `A[] not deadlock` | No global deadlock. | — | — | not testable (model property) |
| S2 | 358 | `A[] frontendGUI.RENDERING imply t_e2e <= 100` | End-to-end latency ≤ 100 ms. | Device, network and frontend involved. | — (manual bench: `telemetry-bench.md`, `totalMs`) | not testable in backend unit tests |
| S3 | 362 | `A[] mqttClient.PARSING imply mqttClient.t_process <= 10` | Parsing ≤ 10 ms. | `TelemetryPipelineService.handleMessage` (`processingMs`) | TEL "keeps the processing p95 and p99 below 10 ms for 2000 json and hex frames through the real pipeline and system clock"; "measures processing from MQTT receive to enqueue and records no sample for a discarded message"; `telemetry-pipeline.performance.spec.ts` | covered (p95/p99, not a hard maximum) |
| S4 | 366 | `A[] apiGateway.CHECKING_SESSION imply apiGateway.t_gate <= 5` | Session check ≤ 5 ms. | Socket handshake JWT check in `RealtimeGateway`. | — | not testable in backend unit tests |
| S5 | 370 | `A[] webSocketGateway.BROADCASTING imply webSocketGateway.t_ws <= 5` | Broadcast ≤ 5 ms. | `TelemetryPipelineService.flush` (`flushMs`) | TEL "keeps every batch emit below 5 ms with the real clock (server side only; network delivery is not measured)" | covered (server-side emit only) |
| S6 | 377 | `A[] frontendGUI.BUFFERING imply frontendGUI.t_render <= 5` | Frontend buffering ≤ 5 ms. | Frontend. | — | not testable in backend unit tests |
| S7 | 381 | `A[] localServer.IDLE imply localServer.t_sample <= 33` | Device samples at least every 33 ms. | Device side; the server counterpart is the flush period `VENTILATOR_FLUSH_INTERVAL_MS`. | TEL "emits one batch every VENTILATOR_FLUSH_INTERVAL_MS and no frame waits longer than one interval in the buffer"; pipeline spec "emits one volatile batch per flush interval…" | covered (server cadence counterpart) |
| S8 | 385 | `A[] data_queue <= MAX_QUEUE` | Telemetry queue never exceeds `MAX_QUEUE` (100). | `TelemetryPipelineService._acceptFrame`, `VENTILATOR_MAX_BUFFERED_FRAMES` (default 256) | TEL "never emits more than VENTILATOR_MAX_BUFFERED_FRAMES frames in a batch and accounts every dropped frame across 2000 seeded random steps"; pipeline spec "drops the oldest frames beyond VENTILATOR_MAX_BUFFERED_FRAMES and counts them as buffer drops" | covered (cap set to 100 in the test; default 256) |
| L1 | 396 | `E<> (localServer.SENDING and session_valid and frontendGUI.RENDERING)` | A frame sent with a valid session can be rendered. | Room access + pipeline. | TEL R1/R3 test (backend side) | covered up to the socket room |
| L2 | 403 | `A[] (apiGateway.ROUTING imply (frontendGUI.RENDERING or webSocketGateway.BROADCASTING))` | Routed messages reach the frontend. | Frontend involved. | — | not testable in backend unit tests |
| R1 | 409 | `E<> frontendGUI.RENDERING` | The pipeline can complete. | `VentilatorRoomAccessService`, `TelemetryPipelineService.flush` | TEL "joins the holder of the active reservation and delivers at least five frames to the ventilator room" | covered up to the socket room |
| R2 | 413 | `E<> apiGateway.REJECTED` | Rejection of an invalid session is reachable. | `VentilatorRoomAccessService.handleJoinRequest` | TEL "rejects a socket that is not a holder of the active reservation and never joins it to the room"; room access spec | covered |
| R3 | 417 | `E<> telemetry_count >= 5` | At least five messages can be processed. | Pipeline metrics `totalMessages`. | TEL R1/R3 test | covered |

## Commands model (`ventilab-commands-uppaal.xml`)

| Id | Model line | Formula | Meaning | Code | Spec and test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | 847 | `A[] not deadlock` | No deadlock. | — | — | not testable (model property) |
| S2 / SM1 | 857 | `A[] (mqttClient.PUBLISHING imply params_in_safe_range)` | Only safe parameters are published. | `validateVentilatorCommand`, `SendVentilatorCommandUseCase` | CMD "A[] (mqttClient.PUBLISHING imply params_in_safe_range): only commands passing validation are ever published (seeded random NaN, strings, booleans and out-of-range values)" | covered |
| S3 | 862 | `A[] mqttClient.AWAITING_ACK imply mqttClient.t_ack <= 1000` | ACK wait ≤ 1000 ms. | `CommandLifecycleService` timeout (`VENTILATOR_COMMAND_TIMEOUT_MS`, default 3000) | CMD "A[] mqttClient.AWAITING_ACK imply mqttClient.t_ack <= ACK_TIMEOUT: the acknowledgement wait is bounded by VENTILATOR_COMMAND_TIMEOUT_MS (configured as the model's 1000 ms)" | deviation (default 3000 ms) |
| S4 | 867 | `A[] mqttClient.PUBLISHING imply mqttClient.t_pub <= 5` | Publish ≤ 5 ms. | Broker round trip (PUBACK). | — | not testable in backend unit tests |
| S5 | 872 | `A[] apiGateway.VALIDATING_REQUEST imply apiGateway.t_gate <= 5` | Request validation ≤ 5 ms. | HTTP pipeline. | — | not testable in backend unit tests |
| S6 / P1 | 882 | `A[] (apiGateway.EXECUTING imply hasPermission())` | Commands execute only with permission. | `SendVentilatorCommandUseCase`, `OperatorControlService` | CMD "A[] (apiGateway.EXECUTING imply hasPermission()) and A[] not (user_role == 1 and is_real_ventilator and apiGateway.EXECUTING): …" | deviation (operator instead of ADMIN) |
| S7 / P2 | 890 | `A[] not (user_role == 1 and is_real_ventilator and apiGateway.EXECUTING)` | A student never executes on the real ventilator. | Same | Same test | deviation (a student who is the operator of their reservation may command) |
| L1 | 899 | `commandValidator.APPROVED --> mqttClient.PUBLISHING` | Approved commands are published. | Same | CMD "commandValidator.APPROVED --> mqttClient.PUBLISHING: an approved command from the operator with the device online is published" | covered |
| L2 | 904 | `mqttClient.AWAITING_ACK --> (mqttClient.SUCCESS or mqttClient.ERROR)` | Every published command terminates. | `CommandLifecycleService` | CMD "mqttClient.AWAITING_ACK --> (mqttClient.SUCCESS or mqttClient.ERROR): every SENT command reaches ACKED, APPLIED, REJECTED or TIMEOUT within the timeout and none stays SENT" | covered |
| R1 | 913 | `E<> mqttClient.SUCCESS` | ACK success reachable. | ACK topic handling | CMD "E<> mqttClient.SUCCESS: ACKED is reachable when the acknowledgement topic is enabled" | covered (ACK topic disabled by default) |
| R2 | 920 | `E<> commandValidator.REJECTED` | Validator rejection reachable. | Validator, device rejection | CMD "E<> commandValidator.REJECTED: an out-of-range command is rejected (422) and a device rejection is reachable" | covered |
| R3 | 925 | `E<> apiGateway.FORBIDDEN` | Permission rejection reachable. | `SendVentilatorCommandUseCase` | CMD "E<> apiGateway.FORBIDDEN: 403 is reachable without a reservation and for non-holders" | covered |

## Authentication and ventilator access model (`ventilab-auth-uppaal.xml`)

| Id | Model line | Formula | Meaning | Code | Spec and test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | 533 | `A[] not deadlock` | No deadlock. | — | — | not testable (model property) |
| S2 | 537 | `A[] not (ventA.RESERVED and ventB.RESERVED)` | Mutual exclusion of the ventilator. | `CreateReservationUseCase`, `ReserveNowUseCase`, `lockDevice` (`pg_advisory_xact_lock(hashtext(deviceId))`) | RES "never leaves two overlapping SCHEDULED reservations after 40 waves of 12 seeded concurrent creates and reserve-now calls"; "lets exactly one of two concurrent reserve-now calls from different users hold the ventilator, 50 times"; `create-reservation.usecase.spec.ts` "creates exactly one of 20 concurrent reservations for the same slot" | covered (in-memory mutex double; the PostgreSQL integration spec was not run) |
| S3 | 541 | `A[] ventilator_reserved imply (authenticated and is_group_leader)` | Only an authenticated group leader holds the ventilator. | `reservation-access-policy.ts`, `JwtAuthGuard` on every route | RES "forbids a plain member from reserving for their group"; "turns a plain member's legacy reserve-now for their group into a reservation for themself"; "only creates group reservations by the group leader, a supervising teacher or an administrator across 40 seeded concurrent waves"; "lets a student reserve for themself, which the model does not allow" | deviation (students reserve for themselves; teachers and administrators also reserve) |
| S4 | 545 | `A[] authFlow.AUTHENTICATING imply authFlow.t_auth <= 5000` | Login ≤ 5 s. | Auth feature. | — | out of scope |
| S5 | 549 | `A[] (authFlow.SESSION_EXPIRED imply !authenticated)` | Expired JWT is not authenticated. | Auth feature. | — | out of scope |
| S6 | 553 | `A[] (authFlow.ROLE_ADMIN imply authFlow.jwt_expiry <= JWT_EXPIRY_TIME)` | JWT lifetime bounded. | Auth feature. | — | out of scope |
| S7 (N1) | 557 | `A[] (ventA.RESERVED imply ventilator_reserved)` | The instance state and the global flag agree. | There is no separate flag: `getActiveReservation(now)` is derived from the same `reservations` row. | RES "derives the active reservation from the same row, so reserving and releasing are always coherent" | covered |
| BL1 | 563 | `A[] (ventA.RESERVED imply ventA.t_reservation <= 1800)` | A reservation lasts at most 1800 time units (30 min). | `assertWithinMaxDuration`, `RESERVATION_MAX_DURATION_MINUTES` (default 120) | RES "rejects a scheduled reservation and a reserve-now longer than the configured maximum"; "keeps every reservation produced by 40 seeded concurrent waves within the configured maximum duration" | deviation (120 min instead of 30 min) |
| L1 | 569 | `authFlow.AUTHENTICATING --> (authFlow.AUTHENTICATED or authFlow.AUTH_FAILED)` | Login terminates. | Auth feature. | — | out of scope |
| L2 | 573 | `authFlow.ROLE_STUDENT --> (authFlow.SESSION_EXPIRED or authFlow.ANONYMOUS)` | Student sessions end. | Auth feature. | — | out of scope |
| R1 | 579 | `E<> authFlow.ROLE_ADMIN` | Admin role reachable. | Auth feature. | — | out of scope |
| R2 | 583 | `E<> authFlow.SESSION_EXPIRED` | Expiry reachable. | Auth feature. | — | out of scope |
| R3 | 587 | `E<> ventA.RESERVED` | A reservation is reachable. | `ReserveNowUseCase` | RES S7/N1 test (reserves first) | covered |
| R4 | 591 | `E<> authFlow.AUTH_FAILED` | Failed login reachable. | Auth feature. | — | out of scope |

## Model-versus-code deviations

| Topic | Model | Code | Where |
| --- | --- | --- | --- |
| Who may command the real ventilator | Only ADMIN (`user_role`, `hasPermission()`), S6/S7 of the commands model. | The exclusive operator of the active reservation (a holder, teacher or administrator who took the control). A student who holds the reservation may command. | `operator-control-policy.ts`, `send-ventilator-command.usecase.ts` |
| Who may reserve | Authenticated group leader (S3 of the auth model). | Student for self, group leader for the group, teacher for self or supervised groups, administrator for anyone. | `reservation-access-policy.ts` |
| Reservation length | `MAX_RESERVATION_TIME = 1800` (30 min). | `RESERVATION_MAX_DURATION_MINUTES`, default 120 min. | `env.validation.ts`, `reservation-scheduling-rules.ts` |
| ACK timeout | `ACK_TIMEOUT = 1000` ms. | `VENTILATOR_COMMAND_TIMEOUT_MS`, default 3000 ms (the S3 test sets 1000). | `command-lifecycle.service.ts` |
| Retries | `MAX_RETRIES = 3`. | No retries: QoS 1 already redelivers to the broker, and a retried setting could be stale. | `send-ventilator-command.usecase.ts` |
| Architecture names | The model comments reference an Express backend ("APIGateway (Express backend)", "Express middleware") and `hex-encoder.ts` (`HexEncoder.encode`, `getValidationErrors`) on the command path. | NestJS controllers, guards and use cases; the default encoder is JSON, the hex encoder is optional and unspecified, and validation lives in `ventilator-command-validator.ts`. | `ventilator-commands` feature |
| Telemetry queue | `MAX_QUEUE = 100`. | `VENTILATOR_MAX_BUFFERED_FRAMES`, default 256 (≈ 8 flush periods at 1 kHz); the test uses 100. | `telemetry-pipeline.service.ts` |
| Sampling period | Device `t_sample <= 33`. | The server does not sample; its counterpart is the 33 ms flush period. | `telemetry-pipeline.service.ts` |
| Session gate | `apiGateway.CHECKING_SESSION` on every telemetry message. | The JWT is checked once at socket authentication; telemetry goes to server-managed rooms. | `realtime.gateway.ts`, `ventilator-room-access.service.ts` |
