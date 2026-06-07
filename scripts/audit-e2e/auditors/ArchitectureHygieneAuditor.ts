/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : ArchitectureHygieneAuditor — Gate G6.
 * Descripción   : Inspección estática de higiene arquitectónica sobre
 *                 ventylab-server/src y ventilab-web/src. Reporta:
 *                 (1) archivos > 500 líneas (WARN) / > 700 (FAIL),
 *                 (2) imports cross-feature prohibidos entre admin↔
 *                 simulador internals, (3) usos de sx={…}, style={…},
 *                 styled-components, (4) archivos sin header VentyLab,
 *                 (5) localStorage/sessionStorage en features/progress/.
 *                 NO arregla; solo reporta y produce tablas para defensa.
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
import { E2EAuditor, type E2EAuditResult, type Gate, type GateStatus } from '../E2EAuditor';
import { SERVER_ROOT, WEB_ROOT } from '../e2e-config';

const SIZE_WARN = 500;
const SIZE_FAIL = 700;
const HEADER_TOKENS = ['VentyLab', 'Marcela Mazo'];
const STYLE_PATTERNS = [
  { name: 'sx={', regex: /\bsx\s*=\s*\{/ },
  { name: 'style={', regex: /\bstyle\s*=\s*\{/ },
  { name: 'styled-components import', regex: /from\s+['"]styled-components['"]/ },
  { name: 'styled.<elem>', regex: /\bstyled\.[a-zA-Z]+\s*`/ },
];
const STORAGE_PATTERN = /\b(localStorage|sessionStorage)\b/;

interface Finding { file: string; line: number; note: string }

export class ArchitectureHygieneAuditor extends E2EAuditor {
  readonly objectiveCode = 'G6';
  readonly objectiveName = 'Higiene arquitectónica: tamaño, cross-feature, estilos, headers, storage.';

  async run(): Promise<E2EAuditResult> {
    const gates: Gate[] = [];
    const roots = [
      { abs: path.join(SERVER_ROOT, 'src'), label: 'server/src' },
      { abs: path.join(WEB_ROOT, 'src'), label: 'web/src' },
    ];

    const allFiles: Array<{ abs: string; rel: string; lines: number; src: string; root: string }> = [];
    for (const r of roots) {
      await this.walk(r.abs, async (abs, rel, src) => {
        allFiles.push({ abs, rel, lines: src.split('\n').length, src, root: r.label });
      });
    }

    const oversize: Finding[] = [];
    let oversizeFail = 0;
    for (const f of allFiles) {
      if (f.lines > SIZE_FAIL) { oversizeFail += 1; oversize.push({ file: `${f.root}/${f.rel}`, line: f.lines, note: 'FAIL: > 700 líneas' }); }
      else if (f.lines > SIZE_WARN) oversize.push({ file: `${f.root}/${f.rel}`, line: f.lines, note: 'WARN: > 500 líneas' });
    }
    gates.push(this.makeGate('G6.1', `Tamaño de archivos (WARN >${SIZE_WARN}, FAIL >${SIZE_FAIL})`,
      this.statusFor(oversize.length === 0, oversizeFail > 0 ? 'FAIL' : 'WARN'),
      `${oversize.length} archivo(s) excedidos (${oversizeFail} en FAIL)`));

    const crossFeature = this.crossFeatureViolations(allFiles);
    gates.push(this.makeGate('G6.2', 'Sin imports cross-feature prohibidos (admin↔simulador internals)',
      this.statusFor(crossFeature.length === 0, 'WARN'),
      `${crossFeature.length} violación(es) encontradas`));

    const styleViolations = this.styleViolations(allFiles);
    gates.push(this.makeGate('G6.3', 'Sin sx={…}, style={…} ni styled-components',
      this.statusFor(styleViolations.length === 0, 'WARN'),
      `${styleViolations.length} ocurrencia(s) en código`));

    const noHeader = allFiles.filter((f) => !this.hasHeader(f.src) && !this.isThirdPartyOrTest(f.rel));
    gates.push(this.makeGate('G6.4', 'Archivos con header VentyLab',
      this.statusFor(noHeader.length === 0, 'WARN'),
      `${noHeader.length}/${allFiles.length} archivos sin header (heurística por tokens "${HEADER_TOKENS.join('"/"')}")`));

    const storage = this.storageViolations(allFiles);
    gates.push(this.makeGate('G6.5', 'Sin localStorage/sessionStorage en features/progress/',
      this.statusFor(storage.length === 0, 'WARN'),
      `${storage.length} ocurrencia(s)`));

    const tables = [
      this.findingsTable('G6.1 — Archivos oversize', oversize),
      this.findingsTable('G6.2 — Cross-feature imports prohibidos', crossFeature),
      this.findingsTable('G6.3 — Estilos inline / styled-components', styleViolations),
      this.findingsTable('G6.4 — Archivos sin header VentyLab', noHeader.slice(0, 50).map((f) => ({ file: `${f.root}/${f.rel}`, line: 1, note: '' }))),
      this.findingsTable('G6.5 — Storage en features/progress', storage),
    ];

    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.summarize(gates),
      gates,
      tables,
      defenseBullets: [
        'Demuestra adherencia (o gap) a las reglas de modularidad por feature declaradas en la arquitectura.',
        'Cuantifica deuda técnica de estilos inline y archivos monolíticos en ambos repos.',
        'Garantiza la trazabilidad autoría (header VentyLab) y el origen de verdad de progreso (BD vs storage).',
      ],
    };
  }

  private statusFor(ok: boolean, failStatus: GateStatus): GateStatus { return ok ? 'PASS' : failStatus; }

  private hasHeader(src: string): boolean {
    const head = src.slice(0, 1200);
    return HEADER_TOKENS.some((t) => head.includes(t));
  }

  private isThirdPartyOrTest(rel: string): boolean {
    return /__tests__|\.test\.|\.spec\.|\.d\.ts$/.test(rel) || rel.includes('node_modules');
  }

  private crossFeatureViolations(files: Array<{ rel: string; src: string; root: string }>): Finding[] {
    const out: Finding[] = [];
    const importRe = /import[^;]+from\s+['"]([^'"]+)['"]/g;
    for (const f of files) {
      const isAdmin = /features[\\/]admin[\\/]/.test(f.rel);
      const isSim = /features[\\/]simulador[\\/]/.test(f.rel);
      if (!isAdmin && !isSim) continue;
      let m: RegExpExecArray | null;
      let lineIdx = 0;
      const lines = f.src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        while ((m = importRe.exec(lines[i])) !== null) {
          const target = m[1];
          if (isAdmin && /features\/simulador\/(internals|conexion|graficas|simuladorVentilador)/.test(target)) {
            out.push({ file: `${f.root}/${f.rel}`, line: i + 1, note: `admin → ${target}` });
          }
          if (isSim && /features\/admin\//.test(target)) {
            out.push({ file: `${f.root}/${f.rel}`, line: i + 1, note: `simulador → ${target}` });
          }
        }
        importRe.lastIndex = 0;
        lineIdx = i;
      }
      void lineIdx;
    }
    return out;
  }

  private styleViolations(files: Array<{ rel: string; src: string; root: string }>): Finding[] {
    const out: Finding[] = [];
    for (const f of files) {
      if (!/\.(tsx|jsx)$/.test(f.rel) && !/styled/.test(f.src)) continue;
      const lines = f.src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const pat of STYLE_PATTERNS) {
          if (pat.regex.test(lines[i])) {
            out.push({ file: `${f.root}/${f.rel}`, line: i + 1, note: pat.name });
            break;
          }
        }
      }
    }
    return out;
  }

  private storageViolations(files: Array<{ rel: string; src: string; root: string }>): Finding[] {
    const out: Finding[] = [];
    for (const f of files) {
      if (!/features[\\/]progress[\\/]/.test(f.rel)) continue;
      const lines = f.src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (STORAGE_PATTERN.test(lines[i])) out.push({ file: `${f.root}/${f.rel}`, line: i + 1, note: lines[i].trim().slice(0, 80) });
      }
    }
    return out;
  }

  private findingsTable(title: string, items: Finding[]): { title: string; headers: string[]; rows: Array<Array<string | number>> } {
    return {
      title,
      headers: ['archivo', 'línea', 'nota'],
      rows: items.slice(0, 80).map((f) => [f.file, f.line, f.note]),
    };
  }

  private async walk(root: string, visit: (abs: string, rel: string, src: string) => Promise<void>): Promise<void> {
    const stack = [root];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
      try { entries = await fs.readdir(cur, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        const full = path.join(cur, e.name);
        if (e.isDirectory()) {
          if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'dist') continue;
          stack.push(full);
        } else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
          let s = ''; try { s = await fs.readFile(full, 'utf8'); } catch { continue; }
          await visit(full, path.relative(root, full), s);
        }
      }
    }
  }
}
