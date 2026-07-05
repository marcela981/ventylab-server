# `audit-thesis-objectives.ts`

Script de **auditoría arquitectónica** para los Objetivos Específicos
1, 2 y 3 del anteproyecto de tesis VentyLab (Marcela Mazo Castro,
Universidad del Valle). **No es un test funcional** — verifica que la
implementación cumple las propiedades estructurales declaradas en el
anteproyecto y produce evidencia citable en la defensa.

## Uso

```bash
cd ventylab-server
npx tsx scripts/audit-thesis-objectives.ts
```

Variables de entorno requeridas:

- `DATABASE_URL` — usada por el cliente Prisma compartido
  (`src/shared/infrastructure/database.ts`).

## Salidas

Los artefactos se escriben en `ventylab-server/audit-output/`:

| Archivo            | Propósito                                                     |
|--------------------|---------------------------------------------------------------|
| `audit-report.json`| Schema versionado (`v1.0`) — consumible por CI/dashboards.    |
| `audit-report.md`  | Anexo formateado para incluir en el documento de tesis.       |

## Exit codes

| Code | Significado                                              |
|------|----------------------------------------------------------|
| `0`  | Todos los gates en `PASS` (ningún `FAIL`).               |
| `1`  | Al menos un gate en `FAIL`.                              |
| `2`  | Excepción no controlada antes de escribir el reporte.    |

`WARN` no falla el script (se usa para discrepancias informativas).

## Arquitectura (Strategy Pattern)

```
scripts/
  audit-thesis-objectives.ts    ← entry point (orquesta auditores)
  auditors/
    Auditor.ts                  ← clase base abstracta
    TeachingAuditor.ts          ← OE1: Level → Module → Lesson → Page
    EvaluationAuditor.ts        ← OE2: Quizzes (≥26) + Activities (EXAM ≥6, TALLER ≥9)
    FeedbackAuditor.ts          ← OE3: evaluation.service + AI providers
  reporting/
    ReportWriter.ts             ← genera JSON + MD
    types.ts                    ← AuditResult, Gate, AuditTable
```

Cada `Auditor.run()` retorna un `AuditResult` uniforme. El
`ReportWriter` no conoce los detalles internos: consume la lista y
emite los dos artefactos.

## Cómo interpretar el reporte

1. Abrir `audit-output/audit-report.md` en cualquier visor Markdown.
2. **Resumen ejecutivo** muestra `gates aprobados / total` global y por
   objetivo.
3. Cada sección de OE incluye:
   - **Tabla de gates**: ID, nombre, estado (`PASS`/`WARN`/`FAIL`),
     detalle y evidencia (ruta o consulta Prisma).
   - **Tabla de datos**: enumeración fila a fila de lo auditado.
4. La sección **"Conclusión para defensa de tesis"** lista los puntos
   exactos que el script demuestra para cada objetivo del anteproyecto.

## Filosofía: encontrar gaps, no arreglarlos

Si la auditoría encuentra un gap (p. ej. ausencia de log estructurado
con `{provider, latencyMs, parsedOK}`), lo reporta como `WARN` o
`FAIL` con la evidencia correspondiente. **El script nunca modifica
código fuera de `scripts/` ni `audit-output/`**.
