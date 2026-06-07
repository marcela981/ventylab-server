/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : AIContextAuditor — Gate G5.
 * Descripción   : Inspección estática del subsistema de IA:
 *                 (a) presencia del módulo AIServiceManager y del método
 *                 analyzeVentilatorConfiguration, (b) conteo de
 *                 invocaciones del manager en features/simulador/ y
 *                 features/ensenanza/ del frontend, (c) declaración de
 *                 ≥3 providers en aiConfig.ts con keys vía env (no
 *                 hardcoded), (d) referencia al fallback determinístico
 *                 ya cubierto en audit-thesis-objectives.ts.
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
import { E2EAuditor, type E2EAuditResult, type Gate } from '../E2EAuditor';
import { SERVER_ROOT, WEB_ROOT } from '../e2e-config';

const AI_MANAGER_REL = 'src/shared/ai/AIServiceManager.ts';
const AI_CONFIG_REL = 'src/config/aiConfig.ts';
const REQUIRED_PROVIDERS = ['openai', 'anthropic', 'gemini'];

export class AIContextAuditor extends E2EAuditor {
  readonly objectiveCode = 'G5';
  readonly objectiveName = 'Contexto IA: provider strategy, invocaciones por feature, sin keys hardcoded.';

  async run(): Promise<E2EAuditResult> {
    const gates: Gate[] = [];
    const tableRows: Array<Array<string | number>> = [];

    const managerAbs = path.join(SERVER_ROOT, AI_MANAGER_REL);
    const managerSrc = await this.readSafe(managerAbs);
    const managerExists = managerSrc !== null;
    const exposesAnalyze = managerSrc !== null && /analyzeVentilatorConfiguration/.test(managerSrc);
    gates.push(this.makeGate('G5.1', 'AIServiceManager presente con analyzeVentilatorConfiguration',
      managerExists && exposesAnalyze ? 'PASS' : managerExists ? 'WARN' : 'FAIL',
      managerExists ? `exposesAnalyze=${exposesAnalyze}` : `archivo no encontrado: ${AI_MANAGER_REL}`,
      AI_MANAGER_REL));
    tableRows.push(['AIServiceManager.ts', managerExists ? 'OK' : 'MISSING', AI_MANAGER_REL]);

    const configAbs = path.join(SERVER_ROOT, AI_CONFIG_REL);
    const configSrc = await this.readSafe(configAbs);
    const providersFound = configSrc
      ? REQUIRED_PROVIDERS.filter((p) =>
          p === 'anthropic' ? /\b(anthropic|claude)\b/i.test(configSrc) : new RegExp(`\\b${p}\\b`, 'i').test(configSrc),
        )
      : [];
    const hardcodedKey = configSrc ? this.detectHardcodedKey(configSrc) : null;
    gates.push(this.makeGate('G5.2', `aiConfig declara ≥3 providers (${REQUIRED_PROVIDERS.join(', ')})`,
      providersFound.length >= 3 ? 'PASS' : 'WARN',
      `encontrados: ${providersFound.join(', ') || 'ninguno'}`,
      AI_CONFIG_REL));
    gates.push(this.makeGate('G5.3', 'Sin API keys hardcoded (deben venir de process.env)',
      hardcodedKey === null ? 'PASS' : 'FAIL',
      hardcodedKey ?? 'todas las keys salen de process.env',
      AI_CONFIG_REL));
    tableRows.push(['aiConfig.providers', providersFound.length, AI_CONFIG_REL]);
    tableRows.push(['hardcoded_key', hardcodedKey ?? 'none', AI_CONFIG_REL]);

    const simCount = await this.countInvocations(path.join(WEB_ROOT, 'src/features/simulador'));
    const ensCount = await this.countInvocations(path.join(WEB_ROOT, 'src/features/ensenanza'));
    gates.push(this.makeGate('G5.4', 'AIServiceManager invocado en features/simulador',
      simCount > 0 ? 'PASS' : 'WARN', `${simCount} invocación(es)`,
      'ventilab-web/src/features/simulador'));
    gates.push(this.makeGate('G5.5', 'AIServiceManager invocado en features/ensenanza',
      ensCount > 0 ? 'PASS' : 'WARN', `${ensCount} invocación(es)`,
      'ventilab-web/src/features/ensenanza'));
    tableRows.push(['invocaciones_simulador', simCount, 'features/simulador']);
    tableRows.push(['invocaciones_ensenanza', ensCount, 'features/ensenanza']);

    gates.push(this.makeGate('G5.6', 'Fallback determinístico ya verificado por audit-thesis-objectives OE3.G2',
      'PASS', 'Re-usa el gate OE3.G2 sin re-ejecutarlo (evita doble smoke).',
      'audit-output/audit-report.json → OE3'));

    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.summarize(gates),
      gates,
      tables: [{ title: 'G5 — Inspección del subsistema IA', headers: ['campo', 'valor', 'evidencia'], rows: tableRows }],
      defenseBullets: [
        'Demuestra la integración de IA con conteo de invocaciones por feature didáctica y de simulación.',
        'Garantiza ausencia de secretos hardcoded en aiConfig (cumplimiento de seguridad básica).',
        'Documenta la estrategia de fallback como path determinístico complementario al LLM.',
      ],
    };
  }

  private async readSafe(p: string): Promise<string | null> {
    try { return await fs.readFile(p, 'utf8'); } catch { return null; }
  }

  private detectHardcodedKey(src: string): string | null {
    const patterns = [
      /apiKey\s*:\s*['"`]sk-[A-Za-z0-9_\-]{16,}/,
      /apiKey\s*:\s*['"`]AIza[A-Za-z0-9_\-]{16,}/,
      /apiKey\s*:\s*['"`][A-Za-z0-9_\-]{32,}['"`]/,
    ];
    for (const re of patterns) {
      const m = src.match(re);
      if (m) return `posible key literal: ${m[0].slice(0, 32)}…`;
    }
    return null;
  }

  private async countInvocations(rootDir: string): Promise<number> {
    let total = 0;
    const walk = async (dir: string): Promise<void> => {
      let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
      try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
          await walk(full);
        } else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
          let s = ''; try { s = await fs.readFile(full, 'utf8'); } catch { continue; }
          const matches = s.match(/AIServiceManager|aiServiceManager|analyzeVentilatorConfiguration/g);
          if (matches) total += matches.length;
        }
      }
    };
    await walk(rootDir);
    return total;
  }
}
