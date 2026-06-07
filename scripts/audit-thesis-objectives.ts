/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : Entry point — orquesta los tres auditores.
 * Descripción   : Ejecuta TeachingAuditor (OE1), EvaluationAuditor
 *                 (OE2) y FeedbackAuditor (OE3) en serie, recoge sus
 *                 AuditResult y los entrega al ReportWriter, que
 *                 escribe audit-report.json y audit-report.md en
 *                 ventylab-server/audit-output/. El proceso termina
 *                 con exit code 0 si todos los gates están en PASS,
 *                 1 si hay al menos un FAIL.
 *
 * Uso:
 *   $ cd ventylab-server
 *   $ npx tsx scripts/audit-thesis-objectives.ts
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
import { prisma } from '../src/shared/infrastructure/database';
import { TeachingAuditor } from './auditors/TeachingAuditor';
import { EvaluationAuditor } from './auditors/EvaluationAuditor';
import { FeedbackAuditor } from './auditors/FeedbackAuditor';
import { ReportWriter } from './reporting/ReportWriter';
import type { Auditor } from './auditors/Auditor';
import type { AuditResult } from './reporting/types';

async function main(): Promise<number> {
  const outputDir = path.resolve(__dirname, '..', 'audit-output');

  const auditors: Auditor[] = [
    new TeachingAuditor(),
    new EvaluationAuditor(),
    new FeedbackAuditor(),
  ];

  const results: AuditResult[] = [];
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

  const writer = new ReportWriter(outputDir);
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
