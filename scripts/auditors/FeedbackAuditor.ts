/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : FeedbackAuditor — Auditor del Objetivo Específico 3.
 * Descripción   : Verifica la existencia del servicio de evaluación,
 *                 los exports requeridos (compareConfigurations,
 *                 generateFeedback), la presencia del fallback
 *                 determinístico (generateFallbackFeedback), la
 *                 disponibilidad de ≥3 proveedores en aiConfig, y la
 *                 existencia de logging estructurado con
 *                 {provider, latencyMs, parsedOK}.
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
import { Auditor } from './Auditor';
import type { AuditResult, Gate, GateStatus } from '../reporting/types';

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const EVAL_SERVICE_REL = 'src/modules/evaluation/evaluation.service.ts';
const AI_CONFIG_REL = 'src/config/aiConfig.ts';
const REQUIRED_PROVIDERS = ['openai', 'anthropic', 'gemini'];
const STRUCTURED_LOG_KEYS = ['provider', 'latencyMs', 'parsedOK'];

export class FeedbackAuditor extends Auditor {
  readonly objectiveCode = 'OE3' as const;
  readonly objectiveName =
    'Generar retroalimentación pedagógica con LLM y respaldo determinístico.';

  async run(): Promise<AuditResult> {
    const gates: Gate[] = [];
    const tableRows: Array<Array<string | number>> = [];

    // Gate 1: existencia del archivo y exports.
    const evalServiceAbs = path.join(SERVER_ROOT, EVAL_SERVICE_REL);
    const evalExists = await this.fileExists(evalServiceAbs);
    let evalSource = '';
    if (evalExists) evalSource = await fs.readFile(evalServiceAbs, 'utf8');

    const exportsCompare = /export\s+(async\s+)?function\s+compareConfigurations/.test(
      evalSource,
    );
    const exportsGenerate = /export\s+(async\s+)?function\s+generateFeedback/.test(
      evalSource,
    );

    const gateExports = this.makeGate(
      'OE3.G1',
      'evaluation.service.ts existe y exporta compareConfigurations + generateFeedback',
      evalExists && exportsCompare && exportsGenerate ? 'PASS' : 'FAIL',
      !evalExists
        ? `Archivo no encontrado en ${EVAL_SERVICE_REL}`
        : `compareConfigurations=${exportsCompare}, generateFeedback=${exportsGenerate}`,
      EVAL_SERVICE_REL,
    );
    gates.push(gateExports);
    tableRows.push([
      'evaluation.service.ts presente y exports OK',
      gateExports.status,
      EVAL_SERVICE_REL,
    ]);

    // Gate 2: smoke test del fallback determinístico.
    const fallbackGate = await this.smokeFallback(evalSource);
    gates.push(fallbackGate);
    tableRows.push([
      'Fallback determinístico produce EvaluationFeedback válido',
      fallbackGate.status,
      `${EVAL_SERVICE_REL} → generateFallbackFeedback`,
    ]);

    // Gate 3: providers strategy (≥3).
    const providerGate = await this.checkProviders();
    gates.push(providerGate);
    tableRows.push([
      'Provider strategy soporta ≥3 proveedores (OpenAI, Anthropic, Gemini)',
      providerGate.status,
      AI_CONFIG_REL,
    ]);

    // Gate 4: log estructurado {provider, latencyMs, parsedOK}.
    const logGate = await this.checkStructuredLog();
    gates.push(logGate);
    tableRows.push([
      'Log estructurado con {provider, latencyMs, parsedOK}',
      logGate.status,
      logGate.evidence ?? '—',
    ]);

    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.buildSummary(gates),
      gates,
      tables: [
        {
          title: 'OE3 — Verificación del módulo de retroalimentación',
          headers: ['check', 'status', 'evidence_path'],
          rows: tableRows,
        },
      ],
      defenseBullets: [
        'Demuestra que el servicio de evaluación expone una API estable para comparación y feedback.',
        'Garantiza un camino determinístico cuando el LLM no está disponible (resiliencia educativa).',
        'Documenta la estrategia multi-proveedor de IA y los puntos de observabilidad existentes (o reporta su ausencia como gap).',
      ],
    };
  }

  private async fileExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  private async smokeFallback(evalSource: string): Promise<Gate> {
    // El fallback es función interna (no exportada). Se invoca
    // indirectamente vía generateFeedback con un caso/config sintético,
    // forzando el catch path al desactivar el AIServiceManager.
    const hasFallbackDef = /function\s+generateFallbackFeedback/.test(
      evalSource,
    );
    if (!hasFallbackDef) {
      return this.makeGate(
        'OE3.G2',
        'Smoke test fallback determinístico ⇒ EvaluationFeedback válido',
        'FAIL',
        'No se encontró la definición de generateFallbackFeedback en el módulo.',
      );
    }

    let mod: typeof import('../../src/modules/evaluation/evaluation.service');
    try {
      mod = await import('../../src/modules/evaluation/evaluation.service');
    } catch (err) {
      return this.makeGate(
        'OE3.G2',
        'Smoke test fallback determinístico ⇒ EvaluationFeedback válido',
        'FAIL',
        `No se pudo importar evaluation.service: ${(err as Error).message}`,
      );
    }

    // Forzar el path de fallback: anulamos GEMINI_API_KEY y mockeamos
    // el aiServiceManager para que retorne success=false.
    try {
      const ai = await import('../../src/shared/ai/AIServiceManager');
      const manager = (ai as any).aiServiceManager;
      const originalGenerate = manager?.generateResponse?.bind(manager);
      if (manager && originalGenerate) {
        manager.generateResponse = async () => ({
          success: false,
          response: null,
          error: 'forced for audit smoke test',
        });
      }

      const synthClinicalCase = {
        id: 'audit',
        title: 'Audit case',
        description: 'Synthetic case for fallback smoke test',
        patientAge: 65,
        patientWeight: 70,
        mainDiagnosis: 'EPOC reagudizado',
        comorbidities: [],
        difficulty: 'BEGINNER',
        pathology: 'EPOC',
        educationalGoal: 'audit-smoke',
      };
      const synthExpert = {
        id: 'audit',
        ventilationMode: 'volume',
        tidalVolume: 450,
        respiratoryRate: 14,
        peep: 5,
        fio2: 40,
        maxPressure: 30,
        justification: 'audit',
      };
      const synthUser = { ...synthExpert };
      const synthDifferences = {
        score: 100,
        totalParameters: 5,
        correctParameters: 5,
        parameters: [],
        criticalErrors: [],
        summary: { correct: 5, minor: 0, moderate: 0, critical: 0 },
      };

      const fb = await mod.generateFeedback(
        synthClinicalCase as any,
        synthUser as any,
        synthExpert as any,
        synthDifferences as any,
      );

      // Restaurar
      if (manager && originalGenerate) manager.generateResponse = originalGenerate;

      const arraysOk =
        Array.isArray(fb.strengths) &&
        Array.isArray(fb.improvements) &&
        Array.isArray(fb.recommendations);
      const feedbackOk = typeof fb.feedback === 'string' && fb.feedback.length > 0;
      const status: GateStatus = arraysOk && feedbackOk ? 'PASS' : 'FAIL';
      return this.makeGate(
        'OE3.G2',
        'Smoke test fallback determinístico ⇒ EvaluationFeedback válido',
        status,
        `feedback.length=${fb.feedback?.length ?? 0}, arrays=[${[
          'strengths',
          'improvements',
          'recommendations',
        ]
          .map((k) => `${k}=${Array.isArray((fb as any)[k])}`)
          .join(', ')}]`,
        'evaluation.service.ts → generateFeedback (catch → generateFallbackFeedback)',
      );
    } catch (err) {
      return this.makeGate(
        'OE3.G2',
        'Smoke test fallback determinístico ⇒ EvaluationFeedback válido',
        'FAIL',
        `Excepción durante smoke test: ${(err as Error).message}`,
      );
    }
  }

  private async checkProviders(): Promise<Gate> {
    const aiConfigAbs = path.join(SERVER_ROOT, AI_CONFIG_REL);
    if (!(await this.fileExists(aiConfigAbs))) {
      return this.makeGate(
        'OE3.G3',
        'Provider strategy soporta ≥3 proveedores (OpenAI, Anthropic, Gemini)',
        'FAIL',
        `aiConfig no encontrado: ${AI_CONFIG_REL}`,
      );
    }
    const source = await fs.readFile(aiConfigAbs, 'utf8');
    // Anthropic puede aparecer como 'claude' o 'anthropic'.
    const found = REQUIRED_PROVIDERS.filter((p) => {
      if (p === 'anthropic') return /\b(anthropic|claude)\b/i.test(source);
      return new RegExp(`\\b${p}\\b`, 'i').test(source);
    });
    return this.makeGate(
      'OE3.G3',
      'Provider strategy soporta ≥3 proveedores (OpenAI, Anthropic, Gemini)',
      found.length >= 3 ? 'PASS' : 'WARN',
      `proveedores encontrados: ${found.join(', ') || 'ninguno'}`,
      AI_CONFIG_REL,
    );
  }

  private async checkStructuredLog(): Promise<Gate> {
    // Búsqueda recursiva en src/ por la conjunción de las 3 claves.
    const srcDir = path.join(SERVER_ROOT, 'src');
    const matches = await this.grepForKeys(srcDir, STRUCTURED_LOG_KEYS);
    if (matches.length === 0) {
      return this.makeGate(
        'OE3.G4',
        'Log estructurado con {provider, latencyMs, parsedOK}',
        'WARN',
        'No se encontró un sitio que loguee las tres claves simultáneamente. Reportado como gap (no se modifica código).',
      );
    }
    const first = matches[0];
    return this.makeGate(
      'OE3.G4',
      'Log estructurado con {provider, latencyMs, parsedOK}',
      'PASS',
      `Encontrado en ${matches.length} archivo(s).`,
      first,
    );
  }

  private async grepForKeys(dir: string, keys: string[]): Promise<string[]> {
    const hits: string[] = [];
    const walk = async (current: string): Promise<void> => {
      let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
      try {
        entries = await fs.readdir(current, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
          await walk(full);
        } else if (entry.isFile() && /\.(ts|tsx|js)$/.test(entry.name)) {
          let content = '';
          try {
            content = await fs.readFile(full, 'utf8');
          } catch {
            continue;
          }
          if (keys.every((k) => content.includes(k))) hits.push(path.relative(SERVER_ROOT, full));
        }
      }
    };
    await walk(dir);
    return hits;
  }

  private buildSummary(gates: Gate[]): string {
    const passed = gates.filter((g) => g.status === 'PASS').length;
    return `OE3: ${passed}/${gates.length} gates en estado PASS.`;
  }
}
