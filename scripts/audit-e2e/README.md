<!--
  Funcionalidad: Guía de la auditoría E2E del sistema ciberfísico
  Descripción: Uso, variables, pre-requisitos, salidas y limitaciones de scripts/audit-e2e. v1.1: apunta al stack local de docker-compose.local.yml (backend http://127.0.0.1:4000, broker local con la guarda de broker, sin broker público por defecto), variables AUDIT_* y contrato vigente (lotes ventilator:telemetry, POST /api/ventilator/commands, ventilator:command-status, tópico ventilab/device/001/command). v1.2: sin dotenv ni DATABASE_URL (G4 exige AUDIT_DATABASE_URL); G2 solo con --allow-command-audit y solo contra un backend con NODE_ENV=test o el stack local
  Versión: 1.2
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# `audit-e2e/audit-e2e.ts`

Auditoría **E2E del sistema ciberfísico** VentyLab. Complementa
`scripts/audit-thesis-objectives.ts` (OE1–OE3 estructurales) con 6 gates
que ejercitan los caminos reales MQTT ↔ backend ↔ WebSocket ↔ Prisma.

## Uso

Contra el stack local (`docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file deploy/local/compose.env --profile postgres up -d --build --wait`):

```bash
cd ventylab-server
MQTT_PUBLIC_PORT=11883 \
AUDIT_JWT_TOKEN=<jwt-de-cuenta-TEACHER-o-ADMIN> \
npx tsx scripts/audit-e2e/audit-e2e.ts
```

`MQTT_PUBLIC_PORT` solo hace falta si el broker local no publica en 1883.

Por defecto G2 y G4 quedan **omitidos** (`WARN`): se habilitan solo de forma
explícita (ver «Opt-in de G2 y G4»):

```bash
AUDIT_DATABASE_URL=<postgres-local-o-de-test> AUDIT_JWT_TOKEN=<jwt> npx tsx scripts/audit-e2e/audit-e2e.ts --allow-command-audit
```

## Opt-in de G2 y G4

- La auditoría **no carga `.env`** (no importa `dotenv` ni
  `scripts/lib/prisma.ts`) y **nunca lee `DATABASE_URL`**. G4 escribe y
  borra filas: solo corre con `AUDIT_DATABASE_URL` explícita (cliente propio
  `audit-prisma.ts`); sin ella se omite. Úsala solo con una base local o de
  pruebas. Nota: el `PrismaClient` generado carga por su cuenta el `.env` en
  `process.env` al crearse (sin pisar variables ya definidas); la conexión usa
  siempre `AUDIT_DATABASE_URL`.
- G2 envía un **comando VCV real** por `POST /api/ventilator/commands`, que el
  backend publica en **su** broker: la guarda de broker de la auditoría solo
  controla el broker de la propia auditoría. Por eso G2 solo corre con
  `--allow-command-audit`, y **solo** debe apuntar a un backend con
  `NODE_ENV=test` o al stack local (broker local). Nunca contra un backend
  conectado al broker del laboratorio: el comando llegaría a
  `ventilab/device/001/command` del ventilador físico.
- Pruebas de las guardas: `node --test scripts/audit-e2e/audit-guards.test.ts`.

## Guarda de broker

El script **no** lee `MQTT_BROKER_URL`: solo variables `AUDIT_*`. Por defecto
usa el broker local `mqtt://127.0.0.1:<MQTT_PUBLIC_PORT o 1883>` con el
usuario del dispositivo (`ventylab-device`, contraseña
`MQTT_DEVICE_PASSWORD` de `deploy/local/compose.env`, nunca impresa).
Rechaza (código 2) un broker fuera de esta máquina salvo
`--allow-remote-test-broker`, y **siempre** los brokers públicos
(`broker.hivemq.com`, `test.mosquitto.org`, `broker.emqx.io`,
`mqtt.eclipseprojects.io`). Pruebas de la guarda:
`node --test scripts/audit-e2e/local-broker.test.ts`.

## Variables de entorno

| Variable                | Default                                          | Usado por                       |
|-------------------------|--------------------------------------------------|---------------------------------|
| `AUDIT_BASE_URL`        | `http://127.0.0.1:4000`                          | G1, G2, G3                      |
| `AUDIT_JWT_TOKEN`       | (vacío → G1/G2.4 sin Socket.io, WARN en G3)      | G1, G2, G3                      |
| `AUDIT_BROKER_URL`      | `mqtt://127.0.0.1:<MQTT_PUBLIC_PORT o 1883>`     | G1, G2                          |
| `AUDIT_MQTT_USERNAME` / `AUDIT_MQTT_PASSWORD` | usuario del dispositivo de `deploy/local/compose.env` (solo broker local) | G1, G2 |
| `AUDIT_TELEMETRY_TOPIC` | `/ventynet/data`                                 | G1                              |
| `AUDIT_COMMAND_TOPIC`   | `ventilab/device/001/command`                    | G2                              |
| `AUDIT_DATABASE_URL`    | (vacío → G4 omitido; nunca `DATABASE_URL` ni `.env`) | G4 (Prisma)                 |
| `--allow-command-audit` | (ausente → G2 omitido)                           | G2                              |

## Pre-requisitos

| Auditor                      | Requiere                                    |
|------------------------------|---------------------------------------------|
| G1 TelemetryInbound          | Broker MQTT + backend + JWT TEACHER/ADMIN (recibe los lotes `ventilator:telemetry`) |
| G2 CommandOutbound           | Broker MQTT + backend + JWT con reserva activa y control de operador (`POST /api/ventilator/commands` → 202; estados por `ventilator:command-status`) |
| G3 SimulationLoop            | Backend + JWT TEACHER + DB con seed básico  |
| G4 AdminDashboard            | DB Postgres con migrations al día           |
| G5 AIContext                 | Solo lectura de archivos (sin red)          |
| G6 ArchitectureHygiene       | Acceso al fs (`ventylab-server/src` + `ventilab-web/src`) |

Sin JWT, G3 reporta `WARN` y sigue. Sin broker, G1/G2 reportan `FAIL` y
siguen. G5–G6 funcionan offline; G4, con `AUDIT_DATABASE_URL`, solo necesita la DB.

## Salidas

`ventylab-server/audit-output/`:

| Archivo                  | Propósito                                  |
|--------------------------|--------------------------------------------|
| `audit-e2e-report.json`  | Schema versionado (`v1.0`) — para CI/CD.   |
| `audit-e2e-report.md`    | Anexo de tesis con tablas y closing.       |

## Exit codes

| Code | Significado                                              |
|------|----------------------------------------------------------|
| `0`  | Todos los gates en `PASS` o `WARN` (ningún `FAIL`).      |
| `1`  | Al menos un gate en `FAIL`.                              |
| `2`  | Excepción no controlada antes de escribir el reporte.    |

## Arquitectura

```
scripts/audit-e2e/
  audit-e2e.ts                  ← entry point
  e2e-config.ts                 ← env + constantes
  audit-guards.ts               ← opt-in de G2 / G4 (puro, con pruebas)
  audit-prisma.ts               ← cliente Prisma de G4 (AUDIT_DATABASE_URL)
  local-broker.ts               ← guarda de broker (pura, con pruebas)
  E2EAuditor.ts                 ← clase base (Strategy)
  E2EReportWriter.ts            ← JSON + MD
  auditors/
    TelemetryInboundAuditor.ts  ← G1
    CommandOutboundAuditor.ts   ← G2
    SimulationLoopAuditor.ts    ← G3
    AdminDashboardAuditor.ts    ← G4
    AIContextAuditor.ts         ← G5
    ArchitectureHygieneAuditor.ts ← G6
```

Cada auditor extiende `E2EAuditor` y devuelve un `E2EAuditResult`. El
`E2EReportWriter` consume la lista y emite ambos artefactos.

## Limitaciones documentadas

- **G3.5 (PEEP delta)**: el modelo fisiológico expone `pressure/flow/volume`
  por WS pero no `C` y `R` instantáneos. La verificación de la ecuación
  del movimiento se aproxima detectando un Δ-presión observado vs el
  Δ-PEEP comandado (≥80% del esperado). Para validación analítica
  estricta, exponer `getMechanics()` en el frontend o instrumentar el
  loop interno.
- **G5.4 / G5.5 (invocaciones AI)**: cuenta ocurrencias léxicas de
  `AIServiceManager|aiServiceManager|analyzeVentilatorConfiguration`. Un
  helper que wrappee al manager con otro nombre no será contado.
- **G6.4 (header VentyLab)**: heurística por presencia de tokens
  `VentyLab` o `Marcela Mazo` en los primeros 1.2 KB. Archivos
  generados (`.d.ts`, tests, third-party) se excluyen.

## Filosofía

**Encontrar gaps, no arreglarlos.** Cualquier hallazgo se reporta como
`WARN`/`FAIL` con la evidencia (path, línea o métrica). El script nunca
modifica código fuera de `scripts/audit-e2e/` ni `audit-output/`.
