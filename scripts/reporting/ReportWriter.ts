/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : ReportWriter — Emisor de artefactos de auditoría.
 * Descripción   : Consume AuditResult[] y produce dos archivos:
 *                   - audit-report.json (parseable, schema v1.0)
 *                   - audit-report.md   (anexo de tesis con tablas)
 *                 Calcula también el número total de gates pasados
 *                 vs gates totales y expone exitCode() para que el
 *                 entry-point devuelva 0 si todo pasa, o 1 si algún
 *                 gate está en FAIL.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AuditReport, AuditResult, AuditTable, Gate } from './types';

export class ReportWriter {
  constructor(private readonly outputDir: string) {}

  async write(results: AuditResult[]): Promise<{ jsonPath: string; mdPath: string }> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const report: AuditReport = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      results,
    };
    const jsonPath = path.join(this.outputDir, 'audit-report.json');
    const mdPath = path.join(this.outputDir, 'audit-report.md');

    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    await fs.writeFile(mdPath, this.renderMarkdown(report), 'utf8');
    return { jsonPath, mdPath };
  }

  exitCode(results: AuditResult[]): number {
    const anyFail = results.some((r) => r.gates.some((g) => g.status === 'FAIL'));
    return anyFail ? 1 : 0;
  }

  totals(results: AuditResult[]): { passed: number; total: number } {
    let passed = 0;
    let total = 0;
    for (const r of results) {
      for (const g of r.gates) {
        total += 1;
        if (g.status === 'PASS') passed += 1;
      }
    }
    return { passed, total };
  }

  private renderMarkdown(report: AuditReport): string {
    const { passed, total } = this.totals(report.results);
    const lines: string[] = [];

    lines.push('# Auditoría de Objetivos Específicos — VentyLab');
    lines.push('');
    lines.push('**Tesis:** Plataforma educativa interactiva para entrenamiento en ventilación mecánica.');
    lines.push('**Autora:** Marcela Mazo Castro — Universidad del Valle');
    lines.push(`**Generado:** ${report.generatedAt}`);
    lines.push('');
    lines.push('## Resumen ejecutivo');
    lines.push('');
    lines.push(`- **Gates aprobados:** ${passed} / ${total}`);
    for (const r of report.results) {
      const p = r.gates.filter((g) => g.status === 'PASS').length;
      lines.push(`- **${r.objectiveCode}** — ${r.objectiveName} → ${p}/${r.gates.length} PASS`);
    }
    lines.push('');

    for (const r of report.results) {
      lines.push(`## ${r.objectiveCode} — ${r.objectiveName}`);
      lines.push('');
      lines.push(`> ${r.summary}`);
      lines.push('');
      lines.push('### Gates');
      lines.push('');
      lines.push(this.gatesTable(r.gates));
      lines.push('');
      for (const t of r.tables) {
        lines.push(`### ${t.title}`);
        lines.push('');
        lines.push(this.dataTable(t));
        lines.push('');
      }
    }

    lines.push('## Conclusión para defensa de tesis');
    lines.push('');
    for (const r of report.results) {
      lines.push(`### ${r.objectiveCode}`);
      for (const b of r.defenseBullets) lines.push(`- ${b}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private gatesTable(gates: Gate[]): string {
    const header = '| ID | Gate | Estado | Detalle | Evidencia |';
    const sep = '|---|---|---|---|---|';
    const rows = gates.map(
      (g) =>
        `| ${g.id} | ${this.escape(g.name)} | ${g.status} | ${this.escape(g.detail ?? '')} | ${this.escape(g.evidence ?? '')} |`,
    );
    return [header, sep, ...rows].join('\n');
  }

  private dataTable(t: AuditTable): string {
    if (t.rows.length === 0) {
      return '_(sin filas)_';
    }
    const header = `| ${t.headers.join(' | ')} |`;
    const sep = `| ${t.headers.map(() => '---').join(' | ')} |`;
    const rows = t.rows.map(
      (r) => `| ${r.map((cell) => this.escape(String(cell))).join(' | ')} |`,
    );
    return [header, sep, ...rows].join('\n');
  }

  private escape(s: string): string {
    return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  }
}
