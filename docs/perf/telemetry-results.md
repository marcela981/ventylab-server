<!--
  Funcionalidad: Resultados de la prueba de carga de telemetría
  Descripción: Entrega y latencias (interna del servidor, relativa al broker y extremo a extremo) del camino MQTT → backend → Socket.io con 60 mensajes por segundo durante 5 minutos y 30 clientes en la sala ventilator, y el veredicto frente al criterio p95 extremo a extremo < 100 ms
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Telemetry load results

Run of 2026-10-13 on the environment described in [`README.md`](README.md) (local Docker stack, one laptop). Raw results: [`raw/telemetry-mqttx.json`](raw/telemetry-mqttx.json), [`raw/telemetry-node.json`](raw/telemetry-node.json), publisher summaries `raw/telemetry-*-publisher.json`, mqttx output `raw/mqttx-bench-output.txt`.

## Verdict

**End-to-end p95 = 39 ms < 100 ms → PASS** (Node timestamped publisher at 60.0 msg/s for 5 min, 30 Socket.io clients in room `ventilator`, 540 006 frame samples, local network: host → Docker Desktop port forwarding → stack).

## Load

| Parameter | Phase 1 — mqttx | Phase 2 — Node timestamped publisher |
|---|---|---|
| Publisher | `emqx/mqttx-cli:v1.12.1` `bench pub`, 1 connection, `-im 17`, QoS 0, in Docker on the stack network | `scripts/load/telemetry/publish-telemetry.mjs` on the host, QoS 0, `deviceTs` + `seq` in every frame |
| Rate | 58.8 msg/s nominal (closest integer interval to 60); 56.4 msg/s observed in the window | 60.0 msg/s (18 600 messages in 310 s) |
| Window | 07:48:38–07:53:38 UTC (300 s after 5 s warm-up) | 07:54:22–07:59:22 UTC (300 s after 5 s warm-up) |
| Clients | 30 Socket.io clients (30 load students, JWT handshake, WebSocket), all joined to `ventilator` by the active group reservation, 0 join rejections | same |
| Broker | Local Mosquitto 2.0.20 of the stack (topic `/ventynet/data`), published on 127.0.0.1:11883 | same |

## Delivery

| | mqttx | Node |
|---|---:|---:|
| Messages seen by the probe subscriber in the window | 16 928 | 18 001 |
| Messages received by the backend (`totalMessages`, whole phase) | 16 929 | 18 301 |
| Frames received per client (min / mean / max) | 16 926 / 16 926.3 / 16 928 | 18 000 / 18 000.2 / 18 002 |
| Frames received by all clients | 507 790 | 540 006 |
| `invalidMessages` / `lostMessages` / `bufferDrops` | 0 / 0 / 0 | 0 / 0 / 0 |
| Batches per second (server) | 30 | 30 |

Every client received every frame (differences of ±2 frames are messages crossing the window edges). Socket.io emits are volatile; none were dropped at this load.

## Latency (ms)

| Metric | Phase | count | p50 | p90 | p95 | p99 | max |
|---|---|---:|---:|---:|---:|---:|---:|
| **End-to-end** (`deviceTs` at publish → client receive, same host clock) | Node | 540 006 | 24 | 37 | **39** | 51 | 169 |
| Broker-relative (probe subscriber receives → client receives, same host clock) | Node | 539 590 | 21 | 33 | 34 | 38 | 85 |
| Server processing (`processingMs`: MQTT message received → frame queued) | mqttx | 10 000 | 0.05 | – | 0.10 | 0.15 | 11.7 |
| Server processing | Node | 10 000 | 0.06 | – | 0.11 | 0.17 | 3.9 |
| Server ingest → emit (`totalMs`: received → batch emitted, includes the 33 ms batching wait) | mqttx | 10 000 | 20.3 | – | 32.9 | 34.3 | 44.0 |
| Server ingest → emit | Node | 10 000 | 21.2 | – | 33.6 | 35.5 | 58.6 |
| Batch emit duration (`flushMs`, 30 clients) | mqttx | 8 785 | 3.5 | – | 6.5 | 12.4 | 50.8 |
| Batch emit duration | Node | 9 170 | 3.3 | – | 6.4 | 11.7 | 32.6 |
| `serverTs` → client (container vs host clock, indicative) | mqttx | 263 525 | 3 | 6 | 8 | 23 | 122 |
| `serverTs` → client (indicative) | Node | 270 573 | 4 | 8 | 10 | 21 | 94 |
| Inter-batch gap at the client | mqttx | 263 495 | 33 | 35 | 35 | 42 | 140 |
| Inter-batch gap at the client | Node | 270 543 | 33 | 35 | 36 | 42 | 135 |
| Device latency (`deviceLatencyMs` = `serverTs - deviceTs`; host vs container clock) | Node | 10 000 | 2 | – | 6 | 12 | 63 |

Server metrics come from `GET /api/ventilator/telemetry/metrics`, reset at the start of each phase; they cover the last `VENTILATOR_METRICS_WINDOW` = 10 000 samples (about the last 170 s of each phase), and the endpoint reports p50/p95/p99/max only.

## Reading

- The internal requirement (processing p95 < 10 ms) holds by two orders of magnitude: p95 ≈ 0.1 ms. Ingest → emit p95 ≈ 33 ms is dominated by the 33 ms batching period (`VENTILATOR_FLUSH_INTERVAL_MS`), as designed; emitting one batch to 30 sockets takes 3–6 ms.
- End-to-end p95 39 ms = publisher → broker (host → Docker) + ≤ 33 ms batching + emit + Socket.io over the Windows port forwarder. The broker-relative p95 (34 ms) shows that the backend + Socket.io leg is almost all of it and that the batching wait is the main term; the remaining margin to 100 ms is ~60 ms for a real network between the VPS and the students.
- mqttx frames carry neither a timestamp nor a sequence number (`bench pub` has no payload placeholders) and mqttx runs in the Docker VM with another clock, so the mqttx phase reports delivery and the server-side latencies only; the end-to-end figure comes from the Node phase, at the same rate and with the same clients.
- The max values (85–169 ms) are isolated scheduling pauses of the laptop (Windows timers, GC, Docker Desktop) and stay well under the p99.
- One 15-second smoke run before the recorded run had the backend count only 29 messages while mqttx reported ~750 published; it did not reproduce in the three later runs (300/300 in a short check, 818/818 in a second smoke run, 16 929 in the recorded phase). Cause not identified; left as an observation.

## Not measured here

The real ventilator over Wi-Fi, the VPS network path and TLS (Traefik). Use `scripts/load/telemetry/measure-latency.mjs` (listen-only) for those, as described in [`README.md`](README.md).
