/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : Entry point — orquesta los 6 auditores E2E.
 * Descripción   : Ejecuta TelemetryInbound (G1), CommandOutbound (G2),
 *                 SimulationLoop (G3), AdminDashboard (G4),
 *                 AIContext (G5) y ArchitectureHygiene (G6) en serie y
 *                 entrega los AuditResult al E2EReportWriter, que escribe
 *                 audit-e2e-report.{json,md} en ventylab-server/audit-output/.
 *                 Exit code 0 si todos los gates están en PASS, 1 si hay
 *                 al menos un FAIL.
 *
 * Uso:
 *   $ cd ventylab-server
 *   $ AUDIT_BASE_URL=http://localhost:3001 npx tsx scripts/audit-e2e/audit-e2e.ts
 *
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import path from 'node:path';
import { prisma } from '../../src/shared/infrastructure/database';
import { E2EReportWriter } from './E2EReportWriter';
import { E2E_CONFIG, OUTPUT_DIR } from './e2e-config';
import { TelemetryInboundAuditor } from './auditors/TelemetryInboundAuditor';
import { CommandOutboundAuditor } from './auditors/CommandOutboundAuditor';
import { SimulationLoopAuditor } from './auditors/SimulationLoopAuditor';
import { AdminDashboardAuditor } from './auditors/AdminDashboardAuditor';
import { AIContextAuditor } from './auditors/AIContextAuditor';
import { ArchitectureHygieneAuditor } from './auditors/ArchitectureHygieneAuditor';
import type { E2EAuditor, E2EAuditResult } from './E2EAuditor';

async function main(): Promise<number> {
  process.stdout.write(`▶ Audit E2E — base=${E2E_CONFIG.BASE_URL} mqtt=${E2E_CONFIG.MQTT_URL}\n`);

  const auditors: E2EAuditor[] = [
    new TelemetryInboundAuditor(),
    new CommandOutboundAuditor(),
    new SimulationLoopAuditor(),
    new AdminDashboardAuditor(),
    new AIContextAuditor(),
    new ArchitectureHygieneAuditor(),
  ];

  const results: E2EAuditResult[] = [];
  for (const a of auditors) {
    process.stdout.write(`▶ Ejecutando ${a.objectiveCode} ${a.objectiveName}\n`);
    try {
      const r = await a.run();
      results.push(r);
      const passed = r.gates.filter((g) => g.status === 'PASS').length;
      process.stdout.write(`  ✓ ${a.objectiveCode}: ${passed}/${r.gates.length} gates PASS\n`);
    } catch (err) {
      process.stderr.write(`  ✗ ${a.objectiveCode} falló: ${(err as Error).message}\n`);
      results.push({
        objectiveCode: a.objectiveCode,
        objectiveName: a.objectiveName,
        summary: `Auditor abortado: ${(err as Error).message}`,
        gates: [
          {
            id: `${a.objectiveCode}.G0`,
            name: 'Auditor ejecutó sin excepciones',
            status: 'FAIL',
            detail: (err as Error).message,
          },
        ],
        tables: [],
        defenseBullets: [],
      });
    }
  }

  const writer = new E2EReportWriter(OUTPUT_DIR);
  const { jsonPath, mdPath } = await writer.write(results);
  const totals = writer.totals(results);
  process.stdout.write('\n');
  process.stdout.write(`📄 ${path.relative(process.cwd(), jsonPath)}\n`);
  process.stdout.write(`📄 ${path.relative(process.cwd(), mdPath)}\n`);
  process.stdout.write(`Resultado global: ${totals.passed}/${totals.total} gates PASS\n`);
  return writer.exitCode(results);
}

main()
  .then(async (code) => {
    await prisma.$disconnect();
    process.exit(code);
  })
  .catch(async (err) => {
    process.stderr.write(`Error fatal: ${err?.stack ?? err}\n`);
    await prisma.$disconnect();
    process.exit(2);
  });
