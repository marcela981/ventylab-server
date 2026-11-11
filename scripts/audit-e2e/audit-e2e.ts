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
 *                 al menos un FAIL. v1.2: antes de auditar aplica la
 *                 guarda de broker (solo el broker local salvo
 *                 --allow-remote-test-broker; nunca un broker público)
 *                 y termina con código 2 si la rechaza. v1.3: no carga
 *                 dotenv ni lee DATABASE_URL (G4 usa AUDIT_DATABASE_URL
 *                 explícita con su propio cliente, audit-prisma) y G2,
 *                 que envía un comando real que el backend publica en
 *                 SU broker, solo corre con --allow-command-audit (solo
 *                 contra un backend con NODE_ENV=test o el broker
 *                 local); sin opt-in se reportan como WARN (omitidos).
 *
 * Uso (stack local de docker-compose.local.yml):
 *   $ cd ventylab-server
 *   $ AUDIT_JWT_TOKEN=<jwt> npx tsx scripts/audit-e2e/audit-e2e.ts
 *   (+ AUDIT_DATABASE_URL=<db local> para G4, --allow-command-audit para G2)
 *
 * Versión       : 1.3
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import path from 'node:path';
import { commandAuditRefusal, databaseAuditRefusal } from './audit-guards';
import { disconnectAuditPrisma } from './audit-prisma';
import { E2EReportWriter } from './E2EReportWriter';
import { E2E_CONFIG, OUTPUT_DIR } from './e2e-config';
import { brokerRefusal } from './local-broker';
import { TelemetryInboundAuditor } from './auditors/TelemetryInboundAuditor';
import { CommandOutboundAuditor } from './auditors/CommandOutboundAuditor';
import { SimulationLoopAuditor } from './auditors/SimulationLoopAuditor';
import { AdminDashboardAuditor } from './auditors/AdminDashboardAuditor';
import { AIContextAuditor } from './auditors/AIContextAuditor';
import { ArchitectureHygieneAuditor } from './auditors/ArchitectureHygieneAuditor';
import type { E2EAuditor, E2EAuditResult } from './E2EAuditor';

async function main(): Promise<number> {
  const refusal = brokerRefusal(E2E_CONFIG.MQTT_URL, E2E_CONFIG.ALLOW_REMOTE_TEST_BROKER);
  if (refusal) {
    process.stderr.write(`Broker rechazado: ${refusal}\n`);
    return 2;
  }
  process.stdout.write(`▶ Audit E2E — base=${E2E_CONFIG.BASE_URL} mqtt=${new URL(E2E_CONFIG.MQTT_URL).host}\n`);

  const auditors: E2EAuditor[] = [
    new TelemetryInboundAuditor(),
    new CommandOutboundAuditor(),
    new SimulationLoopAuditor(),
    new AdminDashboardAuditor(),
    new AIContextAuditor(),
    new ArchitectureHygieneAuditor(),
  ];

  // v1.3: auditors with effects outside this process run only on explicit opt-in (reported as WARN otherwise).
  const refusals: Readonly<Record<string, string | null>> = {
    G2: commandAuditRefusal(process.argv),
    G4: databaseAuditRefusal(process.env),
  };

  const results: E2EAuditResult[] = [];
  for (const a of auditors) {
    const refusal = refusals[a.objectiveCode] ?? null;
    if (refusal) {
      process.stdout.write(`▶ Omitido ${a.objectiveCode}: ${refusal}\n`);
      results.push({
        objectiveCode: a.objectiveCode,
        objectiveName: a.objectiveName,
        summary: `Auditor omitido: ${refusal}`,
        gates: [{ id: `${a.objectiveCode}.G0`, name: 'Auditor habilitado explícitamente', status: 'WARN', detail: refusal }],
        tables: [],
        defenseBullets: [],
      });
      continue;
    }
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
    await disconnectAuditPrisma();
    process.exit(code);
  })
  .catch(async (err) => {
    process.stderr.write(`Error fatal: ${err?.stack ?? err}\n`);
    await disconnectAuditPrisma();
    process.exit(2);
  });
