<!--
  Funcionalidad: Resultados de la prueba de carga HTTP
  Descripción: Latencias p50/p90/p95/p99 y tasa de error por endpoint medidas con k6 (30 estudiantes y 2 docentes durante 3 minutos) contra el stack local, con su lectura e interpretación
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# HTTP load results

Run of 2026-10-13 (07:44–07:47 UTC) on the environment described in [`README.md`](README.md). Raw k6 summary: [`raw/http-summary.json`](raw/http-summary.json).

## Load

| Parameter | Value |
|---|---|
| Tool | `grafana/k6:1.3.0` in Docker, on the stack network (`http://backend:4000`) |
| Virtual users | 30 students + 2 teachers (32 VUs), constant |
| Duration | 3 minutes |
| Think time | 1 s after every request |
| Auth | Real JWTs from `POST /api/auth/login` (load students and the two demo teachers, demo password) |
| Throughput | 4699 requests (incl. 33 setup logins and 1 module lookup), 25.3 req/s, 21.5 MB received |
| Checks | 4666/4666 responses 2xx |

## Results per endpoint

Latency in milliseconds (`http_req_duration`: request sent → last byte received).

| Endpoint | Caller | Requests | avg | p50 | p90 | p95 | p99 | max | Error rate |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `GET /api/progress/overview` | student | 870 | 401.8 | 308.3 | 875.0 | **1127.4** | 1519.1 | 1637.0 | 0.00 % |
| `GET /api/progress/summary` | student | 870 | 353.0 | 299.7 | 738.2 | 829.5 | 939.0 | 1022.9 | 0.00 % |
| `GET /api/progress/modules/:moduleId` | student | 870 | 236.9 | 187.6 | 505.1 | 623.2 | 797.7 | 948.6 | 0.00 % |
| `GET /api/my-evaluations` | student | 870 | 170.7 | 81.8 | 454.2 | 589.9 | 977.6 | 1205.3 | 0.00 % |
| `GET /api/modules/:id/full` | student | 870 | 85.5 | 42.2 | 220.2 | 276.3 | 463.3 | 703.8 | 0.00 % |
| `GET /api/analytics/groups/:groupId/dashboard` (30 students) | teacher | 158 | 181.7 | 86.8 | 398.2 | 573.1 | 1095.3 | 1461.9 | 0.00 % |
| `GET /api/evaluations` | teacher | 158 | 101.6 | 66.9 | 218.9 | 355.3 | 450.7 | 459.3 | 0.00 % |
| **All requests** | | 4699 | 241.2 | 157.2 | 586.8 | 770.4 | 1129.4 | 1637.0 | 0.00 % |

Per-endpoint thresholds (`p(95) < 1000 ms`, errors `< 1 %`): every endpoint passed except `GET /api/progress/overview` (p95 1127 ms).

## Reading

- **No errors**: 0 failed requests and no 429 (each VU has its own client IP, see the method), 0 5xx.
- **Slowest endpoint**: `GET /api/progress/overview` (p50 308 ms, p95 1127 ms) followed by `/api/progress/summary`. Both aggregate the student's progress over the curriculum on every call and are the first requests of each iteration, so they also absorb the queueing of the 30 students starting together. This is a performance observation, not a functional bug; a candidate for caching or a lighter query if the VPS shows the same profile.
- **Analytics panel of a 30-student group**: p50 87 ms, p95 573 ms. The panel is cached 60 s per resource and requester scope (two teachers → about 6 cold computations in 3 minutes); the cold computations are the tail (p99 1095 ms, max 1462 ms).
- `GET /api/modules/:id/full` (module, lessons and pages) stays under 300 ms p95.
- The whole stack (backend, Postgres, Mosquitto, Node-RED) and the load generator ran on one 4-core laptop with 5.9 GB RAM; on the VPS the same load should be at or below these figures.
