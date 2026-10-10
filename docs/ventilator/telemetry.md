# Ventilator telemetry

`src/features/ventilator-telemetry` owns the single MQTT connection to the physical ventilator and the low-latency telemetry relay to Socket.io. Other features use it only through `VentilatorTelemetryFacade`.

## Frame contract

`TelemetryFrame` is the normalized frame emitted in `ventilator:telemetry` batches.

| Field | Unit / type | Notes |
| --- | --- | --- |
| `pressure` | cmH2O | Required, finite number. |
| `flow` | L/min | Required, finite number (negative during expiration). |
| `volume` | mL | Required, finite number. |
| `seq` | non-negative integer | Optional. Gaps add `gap - 1` to `lostMessages`; see [Sequence gaps](#sequence-gaps) for late frames, restarts and wraparound. |
| `deviceTs` | epoch ms | Optional. A legacy `timestamp` is used when it is an epoch value (> 10^12 ms). |
| `serverTs` | epoch ms | Stamped by the server when the message is received. |
| `mode` | string | Optional ventilation mode reported by the device. |
| `settings` | `Record<string, number>` | Optional current device settings; the latest ones are exposed by `getLatestSettings()`. |
| `alarms` | `string[]` | Optional alarm codes reported inside the frame. |
| `pco2` | mmHg | Optional. |
| `spo2` | % | Optional. |
| `deviceId` | string | Defaults to `VENTILATOR_DEVICE_ID`. |

Decoders (`VENTILATOR_TELEMETRY_DECODER`): `json` (strict validation above), `hex` (the existing `[0xFF][TYPE][LEN][DATA][XOR]` parser: pressure in tenths of cmH2O, signed flow in tenths of L/min, volume in mL, alarm type and severity; partial frames are merged into a rolling reading) and `auto` (JSON, then hex when the payload is not JSON). No firmware specification of the hex format exists; the layout is the one the previous parser implemented. Invalid messages are dropped and counted; a warning is logged at most once per `VENTILATOR_INVALID_LOG_INTERVAL_MS`.

JSON objects with a `type` field on the alarm topic are parsed as alarms (`VentilatorAlarm`: known `type`, `severity` default `MEDIUM`, default message, `timestamp` default server time, `active` default `true`, `acknowledged` default `false`).

## Socket.io events

| Event | Audience | Payload | Status |
| --- | --- | --- | --- |
| `ventilator:telemetry` | rooms `ventilator`, `role:TEACHER`, `role:ADMIN` (one volatile emit, sockets deduplicated) | `{ frames: TelemetryFrame[], serverTs }` every `VENTILATOR_FLUSH_INTERVAL_MS` when frames arrived | new |
| `ventilator:data` | same as above, volatile | `VentilatorReading` of the latest frame (`timestamp` = `deviceTs` or `serverTs`) | legacy |
| `ventilator:alarm` | broadcast | `VentilatorAlarm` | legacy |
| `ventilator:availability` | broadcast on reservation change; to the user on authentication and on `ventilator:join` | `{ occupied, startsAt?, endsAt? }` (ISO 8601, no personal data) | new |
| `ventilator:join-rejected` | the requesting user | `{ reason: "no_active_reservation" \| "not_reservation_holder" }` | new |
| `ventilator:connected` | broadcast, first message after silence | `{ at }` | new |
| `ventilator:disconnected` | broadcast, once, after `VENTILATOR_STALE_AFTER_MS` without messages or a broker disconnect | `{ at, reason: "device_stale" \| "broker_disconnected" }` | new |

The `ventilator` room is managed by the server: every `VENTILATOR_ROOM_REFRESH_MS` (and immediately on reservation created/cancelled/preempted/completed events) the active reservation is read; when it changes the room is cleared and the holders are joined. A holder is also joined when their socket authenticates. Clients may send `ventilator:join` to ask for access.

## Latency

The flush every 33 ms adds up to 33 ms of queue wait, so the "receive → emit p95 < 10 ms" target applies to the processing latency (`processingMs`), reported separately from the total latency (`totalMs`). `deviceLatencyMs` depends on the device and server clocks being synchronized. See `telemetry-bench.md`.

## Sequence gaps

`lostMessages` adds `gap - 1` for every forward jump of `seq`. A frame whose `seq` is at most `VENTILATOR_SEQ_REORDER_WINDOW` (default 16) behind the newest one is late or repeated: it is counted in `reorderedMessages`, adds no loss and does not move the baseline (`10, 8, 11` → 0 lost, 1 reordered). A larger backward jump is a device restart and resets the baseline. A frame that was counted as lost and arrives later stays counted as lost. With `VENTILATOR_SEQ_WRAP_BITS` set to 16 or 32, a jump from the last sixteenth of the range to the first one is a wraparound (`65535, 0` is consecutive); with 0 (default) it is a restart.

## Recording

Off by default. `POST /api/ventilator/telemetry/recordings/start|stop` (holders of the active reservation, teachers, administrators) subsamples frames to `VENTILATOR_RECORDING_HZ` and writes one `telemetry_chunks` row (`gzip-json`) every `VENTILATOR_RECORDING_FLUSH_SECONDS`, asynchronously and never on the hot path. The recording stops when the active reservation changes (ends, is cancelled or preempted). On shutdown the module's `onModuleDestroy` writes the last chunk and waits up to 2 s (`RECORDING_SHUTDOWN_FLUSH_TIMEOUT_MS`) for the pending chunk writes, before the global database module disconnects Prisma. `GET /api/ventilator/telemetry/recordings/:reservationId` returns the decompressed frames ordered by time.

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `MQTT_BROKER_URL` (alias `MQTT_URL`) | unset | The MQTT connection is enabled only when set. There is no public default broker. |
| `MQTT_USERNAME`, `MQTT_PASSWORD` | unset | |
| `MQTT_CLIENT_ID` | `ventylab-server-<pid>-<random>` | Unique per process. |
| `MQTT_TELEMETRY_TOPIC` | `/ventynet/data` | Subscribed with QoS 0. |
| `MQTT_ALARM_TOPIC` | `ventilab/device/001/alarm` | Subscribed with QoS 1 (rare messages that must not be lost). |
| `MQTT_COMMAND_TOPIC` | `ventilab/device/001/command` | Commands are published with QoS 1. |
| `MQTT_RECONNECT_BASE_MS` / `MQTT_RECONNECT_MAX_MS` | 1000 / 30000 | Infinite exponential backoff with jitter, capped at the maximum. |
| `VENTILATOR_TELEMETRY_DECODER` | `auto` | `auto`, `json` or `hex`. |
| `VENTILATOR_FLUSH_INTERVAL_MS` | 33 | Batch emit period. |
| `VENTILATOR_MAX_BUFFERED_FRAMES` | 256 | Batch buffer cap. When a frame arrives with the buffer full, the oldest frames are dropped and counted in the `bufferDrops` metric. |
| `VENTILATOR_STALE_AFTER_MS` | 2000 | Device silence before `ventilator:disconnected`. |
| `VENTILATOR_ROOM_REFRESH_MS` | 1000 | Active reservation polling period. |
| `VENTILATOR_METRICS_WINDOW` | 10000 | Retained samples per latency kind. |
| `VENTILATOR_INVALID_LOG_INTERVAL_MS` | 5000 | Minimum time between invalid-message warnings. |
| `VENTILATOR_RECORDING_HZ` | 20 | Recording sample rate. |
| `VENTILATOR_RECORDING_FLUSH_SECONDS` | 5 | Chunk period. |
| `VENTILATOR_SEQ_REORDER_WINDOW` | 16 | 0–1024. Late frames within this distance of the newest `seq` count as reordered, not lost. |
| `VENTILATOR_SEQ_WRAP_BITS` | 0 | `0`, `16` or `32`. Width of the device sequence counter for wraparound; 0 disables it. |
| `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET` | unset | Optional InfluxDB sink fed with every frame when all four are set. |
