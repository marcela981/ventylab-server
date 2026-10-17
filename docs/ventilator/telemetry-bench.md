# Ventilator telemetry bench (manual)

This bench measures the MQTT → Socket.io telemetry pipeline of `src/features/ventilator-telemetry` against a real broker. It is manual because it needs a broker and network access; the automated equivalent is `telemetry-pipeline.performance.spec.ts` (3600 JSON frames, processing p95 < 10 ms, no broker).

## What is measured

| Metric | Meaning |
| --- | --- |
| `processingMs` | MQTT message received → frame decoded, stamped and enqueued. The target is p95 < 10 ms. |
| `totalMs` | MQTT message received → batch emitted on Socket.io. Includes the batching wait, so it is bounded below by up to `VENTILATOR_FLUSH_INTERVAL_MS` (33 ms by default). |
| `flushMs` | Duration of one batch emit (`ventilator:telemetry` + `ventilator:data`). |
| `deviceLatencyMs` | `serverTs - deviceTs` when the frame carries `deviceTs`. Only meaningful when the device and server clocks are synchronized (NTP); clock skew shifts every value by the same offset and can make it negative. |
| `invalidMessages` / `lostMessages` | Dropped invalid payloads / sequence gaps (`seq`). |
| `bufferDrops` | Oldest frames dropped because the batch buffer reached `VENTILATOR_MAX_BUFFERED_FRAMES`. |

## Prerequisites

- [MQTTX CLI](https://mqttx.app/cli) (`mqttx`).
- A broker you control. Never bench against the production telemetry topic: the server would relay the synthetic frames to connected students.
- An admin account: reading the metrics requires `ventilator:metrics` (TEACHER and ADMIN), and resetting them requires `ventilator:metrics_reset` (ADMIN only).

## Steps

1. Start the server pointing at the broker and at a **test topic**:

   ```bash
   MQTT_BROKER_URL=mqtt://<broker>:1883 \
   MQTT_TELEMETRY_TOPIC=/ventynet/bench \
   npm run start:dev
   ```

2. Reset the metrics (admin access token in `$TOKEN`):

   ```bash
   curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/ventilator/telemetry/metrics/reset
   ```

3. Publish one connection at 60 Hz (`-im 16` ms between messages) for 60 seconds:

   ```bash
   mqttx bench pub -c 1 -im 16 -t /ventynet/bench -h <broker> \
     -m '{"seq":%i,"pressure":18.5,"flow":32.1,"volume":420,"mode":"VCV","settings":{"peep":5,"fio2":0.4}}'
   ```

   Stop it with Ctrl+C after 60 s. `%i` is the MQTTX message index, so it doubles as the sequence number; a jump in it shows up as `lostMessages`. MQTTX payload placeholders vary between versions; if `%i` is not supported, drop `seq` from the payload.

4. Read the results:

   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/ventilator/telemetry/metrics
   curl -H "Authorization: Bearer $TOKEN" -o bench.csv http://localhost:4000/api/ventilator/telemetry/metrics.csv
   ```

   `metrics` returns the counters and p50/p95/p99 per latency kind; `metrics.csv` has one row per retained sample (`kind,valueMs,recordedAt`, at most `VENTILATOR_METRICS_WINDOW` samples per kind) for plotting.

## Expected results

- `messagesPerSecond` ≈ 60 and `batchesPerSecond` ≈ 30 (one batch every 33 ms carrying ~2 frames).
- `invalidMessages` = 0, `lostMessages` = 0 and `bufferDrops` = 0.
- `processingMs.p95` < 10 ms.
- `totalMs.p95` ≤ `VENTILATOR_FLUSH_INTERVAL_MS` + `processingMs.p95` + `flushMs.p95`.
