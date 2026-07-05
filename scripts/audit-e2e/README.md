# `audit-e2e/audit-e2e.ts`

Auditoría **E2E del sistema ciberfísico** VentyLab. Complementa
`scripts/audit-thesis-objectives.ts` (OE1–OE3 estructurales) con 6 gates
que ejercitan los caminos reales MQTT ↔ backend ↔ WebSocket ↔ Prisma.

## Uso

```bash
cd ventylab-server
AUDIT_BASE_URL=http://localhost:3001 \
AUDIT_JWT_TOKEN=<jwt-de-cuenta-TEACHER> \
npx tsx scripts/audit-e2e/audit-e2e.ts
```

## Variables de entorno

| Variable                | Default                              | Usado por                       |
|-------------------------|--------------------------------------|---------------------------------|
| `AUDIT_BASE_URL`        | `http://localhost:3001`              | G1, G2, G3                      |
| `AUDIT_JWT_TOKEN`       | (vacío → WARN en G3)                 | G3 (endpoints autenticados)     |
| `MQTT_BROKER_URL`       | `mqtt://test.mosquitto.org:1883`     | G1, G2                          |
| `MQTT_TELEMETRY_TOPIC`  | `/ventynet/data`                     | G1                              |
| `MQTT_COMMAND_TOPIC`    | `/ventynet/commands`                 | G2                              |
| `DATABASE_URL`          | (de `.env`)                          | G4 (Prisma)                     |

## Pre-requisitos

| Auditor                      | Requiere                                    |
|------------------------------|---------------------------------------------|
| G1 TelemetryInbound          | Broker MQTT + backend + WS reachable        |
| G2 CommandOutbound           | Broker MQTT + backend + JWT válido          |
| G3 SimulationLoop            | Backend + JWT TEACHER + DB con seed básico  |
| G4 AdminDashboard            | DB Postgres con migrations al día           |
| G5 AIContext                 | Solo lectura de archivos (sin red)          |
| G6 ArchitectureHygiene       | Acceso al fs (`ventylab-server/src` + `ventilab-web/src`) |

Sin JWT, G3 reporta `WARN` y sigue. Sin broker, G1/G2 reportan `FAIL` y
siguen. G4–G6 funcionan offline si Prisma puede leer la DB.

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
