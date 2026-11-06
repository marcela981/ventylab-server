# Resultados medidos — Capítulo 4 (VentyLab)

Todos los valores se copiaron de los archivos crudos de `raw/`. Un dato que no se pudo obtener aparece como "no medido". Los porcentajes de degradación y de entrega están calculados a partir de esos valores, con la fórmula indicada en cada tabla.

## (a) Entorno de medición

| Elemento | Valor |
|---|---|
| Repositorio | ventylab-server |
| Commit medido | `59fc1e9` (origin/main, "Merge pull request #20 from marcela981/fix/sim-assist-current-state") |
| Rama de resultados | `results/cap4` |
| Fecha de inicio | 2026-11-05T23:54:53-05:00 |
| Sistema operativo | Microsoft Windows 11 Home Single Language 10.0.26200, 64 bits |
| CPU | Intel(R) Core(TM) i5-8300H CPU @ 2.30GHz (4 núcleos, 8 hilos) |
| RAM | 11.84 GB (memoria física total reportada por Windows); la VM de Docker reporta 11.53 GiB |
| Node (host, pruebas y scripts) | v24.19.0 (npm 12.0.2) |
| Node (contenedor del backend) | v22.23.4 |
| Docker | 29.8.0 (build 88096ef), Docker Compose v5.5.1 |
| k6 | grafana/k6:1.3.0 en Docker (`k6 v1.3.0+dirty`, go1.25.1, linux/amd64); no está instalado en el host |
| mqttx | emqx/mqttx-cli:v1.12.1 en Docker; no está instalado en el host |
| PostgreSQL | 17.11 (contenedor `postgres:17-alpine`) |
| Broker MQTT | eclipse-mosquitto:2.0.20 |
| Node-RED | nodered/node-red:4.0.9 |
| Stack | `docker-compose.yml` + `docker-compose.local.yml`, `--env-file deploy/local/compose.env`, perfil `postgres` (local, sin VPS ni ventilador real) |
| Siembra | `npm run demo:seed` → total 694 filas (`raw/demo-seed.txt`) |
| `/health/ready` | `{"status":"ready"}`, HTTP 200 (`raw/health-ready.txt`) |

## (b) Resultados

### Paso 1 — Pruebas automatizadas

Archivos: `raw/tests/test-*.txt`, `raw/tests/timings.txt`, `raw/tests/coverage-summary.json`.

| Suite | Suites (aprobadas/total) | Casos | Aprobados | Fallidos | Omitidos | Tiempo Jest | Tiempo de pared |
|---|---|---|---|---|---|---|---|
| `test:unit` (con cobertura) | 315/315 | 2493 | 2492 | 0 | 1 | 89.455 s | 92 s |
| `test:integration` | 26/26 | 97 | 95 | 0 | 2 | 179.589 s | 195 s |
| `test:e2e` | 27/27 | 539 | 538 | 0 | 1 | 250.986 s | 265 s |
| `test:perf` | 1/1 | 3 | 3 | 0 | 0 | 2.247 s | 4 s |

`test:perf`: se cumplieron los presupuestos de tiempo. Los 3 casos de `engine-determinism.spec.ts` pasaron con `RUN_PERF_ASSERTIONS=1`, incluido "replays ten simulated minutes at 50 Hz sampling in under 500 ms", que tardó 69 ms.

Cobertura de líneas por área crítica (`print-c1-coverage`, umbral 80 % por carpeta):

| Área | Cobertura de líneas | Carpeta | Cobertura de líneas |
|---|---|---|---|
| progress | 98.4 % (656/667) | features/progress/application | 97.9 % (425/434) |
| | | features/progress/domain/services | 99.1 % (231/233) |
| evaluation grading | 91.4 % (1154/1263) | features/evaluation/application/use-cases | 88.9 % (844/949) |
| | | features/evaluation/domain/services | 98.7 % (310/314) |
| simulation scoring and engine | 93.7 % (959/1024) | features/simulation/domain/scoring | 96.5 % (222/230) |
| | | features/simulation/domain/engine | 92.8 % (737/794) |
| reservations and preemption | 93.7 % (474/506) | features/reservations/application | 92.5 % (395/427) |
| | | features/reservations/domain/services | 100.0 % (79/79) |
| AI orchestrator and gateway | 94.2 % (408/433) | features/ai/application/services | 94.3 % (330/350) |
| | | features/ai/domain/services | 94.0 % (78/83) |
| platform settings hard limits | 94.6 % (368/389) | features/platform-settings/application | 97.7 % (167/171) |
| | | features/platform-settings/domain | 92.2 % (201/218) |

Cobertura global de la corrida unitaria (`coverage-summary.json`): líneas 93.85 % (4019/4282), sentencias 93.65 % (4268/4557), funciones 91.95 % (777/845), ramas 85.34 % (1980/2320).

### Paso 2 — Carga HTTP (RNF-03)

Archivos: `raw/http-30/` y `raw/http-50/` (`http-summary.json`, `docker-stats-http.txt`, `load-fixture.json`), `raw/http-30.txt`, `raw/http-50.txt`.

Configuración común: k6 `constant-vus`, duración configurada de 3 min, 1 s de pausa entre iteraciones, 2 VUs docentes. Corrida con 50 estudiantes: `LOAD_STUDENT_COUNT=50 npm run test:load:http -- --student-vus 50`, sin cambios de código.

Resumen global:

| Métrica | 30 estudiantes + 2 docentes | 50 estudiantes + 2 docentes |
|---|---|---|
| Usuarios virtuales (máx.) | 32 | 52 |
| Duración real de la prueba | 187.528 s | 185.151 s |
| Solicitudes totales | 5371 | 8393 |
| Solicitudes/s | 28.64 | 45.33 |
| Iteraciones | 1172 | 1770 |
| Checks aprobados | 5338/5338 | 8340/8340 |
| Latencia promedio | 90.84 ms | 127.90 ms |
| Latencia p50 | 75.10 ms | 87.03 ms |
| Latencia p90 | 171.12 ms | 273.21 ms |
| Latencia p95 | 209.04 ms | 344.71 ms |
| Latencia p99 | 339.02 ms | 625.21 ms |
| Latencia máxima | 957.18 ms | 1465.32 ms |
| Tasa de error (`http_req_failed`) | 0.00 % (0 de 5371) | 0.00 % (0 de 8393) |
| Errores por código HTTP | no medido (el resumen de k6 no desglosa por código; hubo 0 solicitudes fallidas) | no medido (ídem; 0 fallidas) |
| Umbrales k6 (p95 < 1000 ms y errores < 1 % por endpoint) | ninguno cruzado (salida 0) | ninguno cruzado (salida 0) |

Degradación de 30 a 50 estudiantes, calculada como (valor con 50 / valor con 30 − 1):

| Percentil | Degradación |
|---|---|
| p50 | +15.88 % |
| p90 | +59.66 % |
| p95 | +64.90 % |
| p99 | +84.42 % |
| máx. | +53.09 % |

Desglose por endpoint con 30 estudiantes (ms):

| Endpoint | n | p50 | p90 | p95 | p99 | máx. | Error |
|---|---|---|---|---|---|---|---|
| progress_overview | 998 | 131.84 | 238.17 | 301.74 | 893.58 | 957.18 | 0.00 % |
| progress_summary | 998 | 114.00 | 192.03 | 216.76 | 296.01 | 374.72 | 0.00 % |
| progress_module | 998 | 85.66 | 145.33 | 167.25 | 235.94 | 311.78 | 0.00 % |
| my_evaluations | 998 | 58.56 | 118.72 | 153.49 | 270.67 | 451.22 | 0.00 % |
| module_full | 998 | 33.51 | 77.30 | 90.91 | 135.93 | 236.77 | 0.00 % |
| analytics_group_dashboard (docente) | 174 | 29.17 | 109.02 | 161.88 | 446.21 | 767.67 | 0.00 % |
| evaluations_list (docente) | 174 | 25.92 | 58.88 | 77.40 | 192.19 | 226.22 | 0.00 % |

Desglose por endpoint con 50 estudiantes (ms):

| Endpoint | n | p50 | p90 | p95 | p99 | máx. | Error |
|---|---|---|---|---|---|---|---|
| progress_overview | 1600 | 213.48 | 499.99 | 618.30 | 1358.21 | 1465.32 | 0.00 % |
| progress_summary | 1600 | 150.34 | 305.82 | 353.99 | 451.09 | 524.46 | 0.00 % |
| progress_module | 1600 | 84.86 | 210.43 | 273.63 | 354.21 | 483.75 | 0.00 % |
| my_evaluations | 1600 | 57.50 | 150.16 | 223.56 | 501.66 | 715.66 | 0.00 % |
| module_full | 1600 | 33.90 | 86.01 | 105.05 | 135.65 | 200.72 | 0.00 % |
| analytics_group_dashboard (docente) | 170 | 44.39 | 174.80 | 203.03 | 607.21 | 1337.21 | 0.00 % |
| evaluations_list (docente) | 170 | 37.21 | 111.97 | 151.29 | 206.27 | 245.91 | 0.00 % |

### Paso 3 — Latencia de telemetría (RNF-01)

> **Medición local.** Corrió sobre el stack de Docker en una sola máquina, sin la red real ni el microcontrolador. Por eso mide solo los segmentos L2–L5 de la Tabla 11: broker → backend → Socket.io → cliente. El "dispositivo" es un publicador en el mismo host.

Archivos: `raw/telemetry/` (`telemetry-mqttx.json`, `telemetry-node.json`, `telemetry-*-publisher.json`, `mqttx-bench-output.txt`, `docker-stats-telemetry-*.txt`), `raw/telemetry.txt`.

Configuración común: 30 clientes Socket.io en la sala `ventilator` (0 rechazos de `ventilator:join`), 5 s de calentamiento, ventana de medición de 300 s por fase y métricas del servidor reiniciadas al inicio de cada fase.

Latencia (ms):

| Métrica | Fase mqttx (~60 msg/s) | Fase Node (60 msg/s, con sello de tiempo) |
|---|---|---|
| Extremo a extremo (`deviceTs` → cliente): n | no medido (0 muestras) | 540000 |
| Extremo a extremo p50 / p95 / p99 / máx. | no medido | 20 / 36 / 41 / 85 |
| Broker → cliente: n | no medido (0 muestras) | 539879 |
| Broker → cliente p50 / p95 / p99 / máx. | no medido | 18 / 34 / 38 / 71 |
| `serverTs` → cliente: n | 258360 | 270570 |
| `serverTs` → cliente p50 / p95 / p99 / máx. | 1 / 5 / 9 / 87 | 2 / 7 / 10 / 39 |
| Intervalo entre lotes p50 / p95 / p99 / máx. | 33 / 35 / 39 / 118 | 33 / 36 / 40 / 77 |
| Meta RNF-01 (p95 extremo a extremo ≤ 100 ms) | no evaluable | **cumple** (36 ms) |

En la fase mqttx no hay latencia extremo a extremo ni broker → cliente: el mensaje fijo de `mqttx bench pub` no lleva `deviceTs` ni `seq`, así que esas series quedan con 0 muestras. `serverTs` → cliente compara el reloj del contenedor con el del host y es solo indicativo (incluso hay valores mínimos negativos: −2 y −1).

Mensajes publicados frente a recibidos:

| Conteo | Fase mqttx | Fase Node |
|---|---|---|
| Publicados por el publicador (corrida completa, incluidos calentamiento y cola) | 18432 según la última línea de `mqttx-bench-output.txt`; tasa nominal 58.82 msg/s (`-im 17`), 315 s; el contenedor terminó con código 137 al ser detenido por el orquestador | 18600 en 310 s, tasa efectiva 60 msg/s |
| Vistos por el suscriptor sonda en la ventana | 16600 | 18001 |
| Recibidos por cliente (mín. = máx.) | 16599 | 18000 |
| Total de tramas recibidas (30 clientes) | 497970 | 540000 |
| Entrega por cliente = recibidos / vistos por la sonda | 99.9940 % | 99.9944 % |
| Pérdida por cliente = 100 % − entrega | 0.0060 % (1 trama) | 0.0056 % (1 trama) |

El emparejamiento entre la ventana del suscriptor sonda y la de los clientes no es exacto: la diferencia de 1 trama puede ser un efecto de borde de la ventana. Esa causa no se verificó. Según el servidor, no se perdió ningún mensaje (`lostMessages` = 0 en ambas fases).

Métricas internas del servidor (`GET /api/ventilator/telemetry/metrics`, ventana de 10000 muestras):

| Métrica | Fase mqttx | Fase Node |
|---|---|---|
| Mensajes totales | 16600 | 18300 |
| Mensajes/s | 58 | 60 |
| Lotes/s | 30 | 30 |
| Inválidos | 0 | 0 |
| Perdidos | 0 | 0 |
| Reordenados | 0 | 0 |
| Duplicados | 0 | 0 |
| Descartes de búfer | 0 | 0 |
| Emisiones volátiles | 17224 | 18338 |
| `processingMs` p50 / p95 / p99 / máx. | 0.0326 / 0.0738 / 0.1178 / 0.6597 | 0.0364 / 0.0883 / 0.1406 / 0.4977 |
| `totalMs` (recibido → lote emitido) p50 / p95 / p99 / máx. | 18.0027 / 32.5414 / 33.7239 / 39.4938 | 17.5203 / 33.1255 / 35.6918 / 45.9953 |
| `flushMs` p50 / p95 / p99 / máx. (n) | 1.5740 / 4.6313 / 6.4416 / 16.9429 (8612) | 1.4117 / 4.7212 / 6.5674 / 14.9553 (9169) |
| `deviceLatencyMs` p50 / p95 / p99 / máx. | no medido (0 muestras) | 2 / 4 / 7 / 53 |

Los valores de `processingMs`, `totalMs` y `flushMs` se truncaron a 4 decimales; los valores completos están en los JSON. El backend agrupa las tramas cada 33 ms (`VENTILATOR_FLUSH_INTERVAL_MS`), así que hasta 33 ms de la latencia extremo a extremo es espera en cola por diseño (`docs/perf/README.md`).

### Paso 4 — Evaluación de la IA (OE3)

Archivos: `raw/ai-eval/dry-run-20-escenarios.txt`, `raw/ai-eval/dry-run-12-sin-sim.txt`, `raw/ai-eval/dry-run-2026-11-06T11-59-37Z/` (`raw.jsonl`, `summary.csv`).

| Medición | Resultado |
|---|---|
| `run-eval.ts --dry-run` (20 escenarios) | **Falla.** Cargan los 20 escenarios ("20 scenarios x 1 providers x 1 repetitions"), pasan los 12 `eval-*`, `lesson-*` y `page-*`, y el primer `sim-*` aborta con `TypeError: Cannot read properties of undefined (reading 'status')`; no se escribe la carpeta de resultados |
| `run-eval.ts --dry-run --scenarios eval-,lesson-,page-` | 12/12 ok con el proveedor falso; resultados en `scripts/ai-eval/results/dry-run-2026-11-06T11-59-37Z/` (copiados en `raw/ai-eval/`) |
| Proveedores con clave en `.env` | ninguno: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` y `AI_EXTERNAL_*` están comentadas o vacías |
| Estimación de costo con `--repeat 1` | no medido (no hay proveedores configurados) |
| Corrida real (TTFT, latencia total, % de JSON válido en GRADE_FEEDBACK, tokens, costo, puntaje auxiliar) | no medido |
| `rubric.csv` | sin cambios (lo califica el experto) |

## (c) Observaciones

1. **Primera corrida del Paso 1 inválida (error de preparación, no del sistema).** Cambié la rama de trabajo de `test/configuration-comparison` a `origin/main` sin regenerar el cliente Prisma. En `main`, `AiCallLog` tiene 4 columnas nuevas (`contextHash`, `simTimeMs`, `contextCheck`, `rejectionReason`; migración `20261105160000_ai_call_context_trace`) que el cliente generado no conocía. Por eso la escritura del registro de llamadas de IA fallaba con `PrismaClientValidationError`, y e2e dio 4 suites y 7 casos fallidos (531 aprobados, 1 omitido, de 539). Después de `npx prisma generate` (que solo escribe en `node_modules`) se repitió el Paso 1 completo, y esas cifras son las de la tabla. La corrida inválida se conserva en `raw/tests-invalida-cliente-prisma-viejo/`.
2. **RNF-03, degradación de latencia ≤ 10 %: no se cumple al pasar de 30 a 50 estudiantes.** La condición "sin errores" sí se cumple (0 solicitudes fallidas en ambas corridas). La latencia, en cambio, se degrada +15.88 % en p50 y +64.90 % en p95. El endpoint más afectado es `progress_overview`: p95 de 301.74 a 618.30 ms y p99 de 893.58 a 1358.21 ms. Todos los endpoints siguen por debajo del umbral de k6 de p95 < 1000 ms. La corrida de 50 se hizo después de la de 30, sobre la misma base, que ya tenía sembrados los 30 estudiantes anteriores.
3. **RNF-03, errores por código HTTP: no medido.** El resumen de k6 no trae el desglose por código. Como no hubo ninguna solicitud fallida (`http_req_failed` = 0), no hay errores que desglosar.
4. **RNF-01: cumple en la fase Node** (p95 extremo a extremo de 36 ms, frente a la meta de ≤ 100 ms). En la fase mqttx la latencia extremo a extremo y la broker → cliente no se pueden medir porque el mensaje de mqttx no lleva sello de tiempo ni `seq`. Es una medición local de los segmentos L2–L5: no incluye la red real ni el microcontrolador.
5. **Fase mqttx, código de salida 137.** El contenedor `mqttx bench pub` lo detiene `run-load.mjs` (`docker stop`) al cumplirse su tiempo máximo; es el comportamiento del orquestador, no un fallo de la medición.
6. **`docker-stats-*.txt` es una sola instantánea** tomada al terminar cada fase, no el promedio durante la carga.
7. **Paso 4, dry-run: falla en los 8 escenarios `sim-*`.** `buildAssistSnapshot` (`src/features/simulation/domain/assist/assist-snapshot.ts`, SIM_ASSIST 1.2.0, commit fc43bc9) lee `metrics.patient.status` y solo contempla `patient === null`. Los 8 archivos `scripts/ai-eval/scenarios/sim-*.json` no traen la clave `metrics.patient`, así que llega `undefined` y lanza `TypeError`. No se modificó el código; corregirlo requiere actualizar los escenarios o el adaptador de evaluación.
8. **Paso 4, corrida real: no medida.** No hay ninguna clave de proveedor de IA activa en `.env`. Por eso quedan sin medir la meta de JSON válido ≥ 98 % en GRADE_FEEDBACK y la de mediana de respuesta de IA ≤ 5 s.
9. **Preparación del entorno.** Para levantar el stack se liberaron, con autorización, los puertos 4000 y 55432: se detuvo el contenedor `ventylab-server-postgres` (proyecto `ventylab-dev`, sin borrar volúmenes). El backend `node dist/main` que ocupaba el puerto 4000 ya había terminado cuando se fue a detener.
10. **Datos sensibles en los archivos crudos.** En los resúmenes de k6 se reemplazaron los JWT de `setup_data` por `<jwt-redactado>`. En los logs se reemplazaron la contraseña de demostración por `<demo-password>` y el nombre de usuario de Windows en las rutas por `<usuario>`. Los logs se guardaron con extensión `.txt` porque `.gitignore` excluye `*.log`. Los correos que quedan son ficticios (`@ventylab.load` y `@ventylab.demo`).
