/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : E2EReportWriter — emisor de artefactos E2E.
 * Descripción   : Análogo a scripts/reporting/ReportWriter pero produce
 *                 audit-e2e-report.{json,md} con título y closing
 *                 específicos del audit ciberfísico. Se mantiene local a
 *                 audit-e2e/ porque la restricción del spec prohíbe
 *                 modificar archivos fuera de scripts/audit-e2e/ y
 *                 audit-output/, y el writer original hardcodea los
 *                 nombres de archivo.
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
import type { AuditTable, Gate } from '../reporting/types';
import type { E2EAuditResult } from './E2EAuditor';

interface E2EReport {
  version: '1.0';
  generatedAt: string;
  scope: 'e2e-cyberphysical';
  results: E2EAuditResult[];
}

export class E2EReportWriter {
  constructor(private readonly outputDir: string) {}

  async write(results: E2EAuditResult[]): Promise<{ jsonPath: string; mdPath: string }> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const report: E2EReport = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      scope: 'e2e-cyberphysical',
      results,
    };
    const jsonPath = path.join(this.outputDir, 'audit-e2e-report.json');
    const mdPath = path.join(this.outputDir, 'audit-e2e-report.md');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    await fs.writeFile(mdPath, this.renderMarkdown(report), 'utf8');
    return { jsonPath, mdPath };
  }

  exitCode(results: E2EAuditResult[]): number {
    return results.some((r) => r.gates.some((g) => g.status === 'FAIL')) ? 1 : 0;
  }

  totals(results: E2EAuditResult[]): { passed: number; total: number } {
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

  private renderMarkdown(report: E2EReport): string {
    const { passed, total } = this.totals(report.results);
    const lines: string[] = [];

    lines.push('# Auditoría E2E del Sistema Ciberfísico — VentyLab');
    lines.push('');
    lines.push('**Tesis:** Plataforma educativa interactiva para entrenamiento en ventilación mecánica.');
    lines.push('**Autora:** Marcela Mazo Castro — Universidad del Valle');
    lines.push(`**Generado:** ${report.generatedAt}`);
    lines.push('**Alcance:** Telemetría MQTT, comandos, loop de simulación, dashboard admin, contexto IA, higiene arquitectónica.');
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

    lines.push('## Implicaciones para defensa');
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
    if (t.rows.length === 0) return '_(sin filas)_';
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
