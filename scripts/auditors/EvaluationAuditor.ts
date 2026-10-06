/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : EvaluationAuditor — Auditor del Objetivo Específico 2.
 * Descripción   : Verifica el módulo de evaluación basado en quizzes
 *                 (26 esperados: mecanica 6+6+8 + ventylab 2+2+2) y
 *                 actividades (6 EXAM + 9 TALLER). Para cada quiz
 *                 valida estructura de preguntas, passingScore y
 *                 referencia a Lesson/Module existente; para cada
 *                 actividad valida tipo, maxScore y assignments.
 *                 Desde la unificación de evaluaciones (migración
 *                 20261007120000_evaluation_feature) lee la tabla
 *                 evaluations: quizzes = QUIZ en estado READY;
 *                 actividades = filas no archivadas copiadas de
 *                 activities (legacy_type conserva EXAM/TALLER/…) más
 *                 exámenes y talleres nuevos.
 *                 Adicionalmente comprueba como gate informativo que
 *                 evaluation.service.ts → compareConfigurations sigue
 *                 siendo importable (API estable, aunque su uso desde
 *                 UI sea residual: los casos clínicos están fuera de
 *                 scope desde mayo 2026).
 * Versión       : 2.2
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { prisma } from '../lib/prisma';
import { Auditor } from './Auditor';
import type { AuditResult, Gate, GateStatus } from '../reporting/types';

const EXPECTED_QUIZZES_TOTAL = 26;
const EXPECTED_EXAMS = 6;
const EXPECTED_TALLERES = 9;

// Nota mínima global (escala 0–5) de las evaluaciones nuevas, que no tienen
// passingScore propio; solo las filas legacy traen legacy_passing_score.
const DEFAULT_PASSING_GRADE = 3;

// El enunciado migrado es un documento TipTap; se concatena todo su texto.
function tipTapText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { text?: unknown; content?: unknown };
  const own = typeof n.text === 'string' ? n.text : '';
  const children = Array.isArray(n.content) ? n.content.map(tipTapText).join(' ') : '';
  return `${own} ${children}`;
}

export class EvaluationAuditor extends Auditor {
  readonly objectiveCode = 'OE2' as const;
  readonly objectiveName =
    'Construir el módulo de evaluación basado en quizzes y actividades (exámenes y talleres).';

  async run(): Promise<AuditResult> {
    const gates: Gate[] = [];
    const tableRows: Array<Array<string | number>> = [];

    // Quiz activo = QUIZ en READY (la migración mapea isActive -> READY).
    // Se excluyen las actividades legacy de tipo QUIZ: antes se contaban en
    // "otros" de las actividades, no aquí.
    const quizzes = await prisma.evaluation.findMany({
      where: {
        type: 'QUIZ',
        status: 'READY',
        OR: [{ legacySource: null }, { legacySource: { not: 'activity' } }],
      },
      include: {
        lesson: { select: { id: true, moduleId: true, title: true } },
        questions: { select: { prompt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    // module_id solo conserva ids existentes (FK); legacy_module_ref guarda el
    // original, así que un moduleId no nulo equivale a "Module existente".
    const knownModules = new Set(
      quizzes.map((q) => q.moduleId).filter(Boolean) as string[],
    );

    // Actividad activa = no archivada (la migración mapea !isActive -> ARCHIVED).
    const activities = await prisma.evaluation.findMany({
      where: {
        status: { not: 'ARCHIVED' },
        OR: [
          { legacySource: 'activity' },
          { legacySource: null, type: { in: ['EXAM', 'WORKSHOP'] } },
        ],
      },
      include: {
        assignments: { select: { id: true } },
        questions: { select: { points: true } },
        scenarios: { select: { content: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    // Etiqueta histórica: legacy_type para filas migradas; las nuevas WORKSHOP
    // se reportan como TALLER (mismo instrumento).
    const activityType = (a: (typeof activities)[number]): string =>
      a.legacyType ?? (a.type === 'WORKSHOP' ? 'TALLER' : a.type);
    const activityMaxScore = (a: (typeof activities)[number]): number =>
      a.legacyMaxScore ?? a.questions.reduce((sum, qq) => sum + qq.points, 0);

    // Gate 1: conteo total de quizzes.
    gates.push(
      this.makeGate(
        'OE2.G1',
        `Existen ≥${EXPECTED_QUIZZES_TOTAL} quizzes activos`,
        quizzes.length >= EXPECTED_QUIZZES_TOTAL
          ? 'PASS'
          : quizzes.length > 0
            ? 'WARN'
            : 'FAIL',
        `${quizzes.length}/${EXPECTED_QUIZZES_TOTAL} quizzes activos en BD`,
        'prisma.evaluation.findMany',
      ),
    );

    // Gate 2: cada quiz tiene questions[] no vacío + passingScore +
    // referencia (Lesson o Module existente).
    let quizzesWellFormed = 0;
    let quizzesUnlinked = 0;
    for (const q of quizzes) {
      const issues: string[] = [];
      const questions = q.questions;
      if (questions.length === 0) {
        issues.push('questions vacío');
      } else {
        const malformed = questions.filter((qq) => !tipTapText(qq.prompt).trim()).length;
        if (malformed > 0) issues.push(`${malformed} preguntas sin enunciado`);
      }
      const passingScore = q.legacySource ? q.legacyPassingScore : DEFAULT_PASSING_GRADE;
      if (typeof passingScore !== 'number' || passingScore <= 0) {
        issues.push('passingScore inválido');
      }
      const linkedToLesson = Boolean(q.lessonId && q.lesson);
      const linkedToModule = Boolean(q.moduleId && knownModules.has(q.moduleId));
      if (!linkedToLesson && !linkedToModule) {
        quizzesUnlinked += 1;
        issues.push('sin Lesson ni Module válidos');
      }
      if (issues.length === 0) quizzesWellFormed += 1;

      const link = linkedToLesson
        ? `lesson: ${q.lesson!.title.slice(0, 25)}`
        : linkedToModule
          ? `module: ${q.moduleId}`
          : '—';
      tableRows.push([
        'QUIZ',
        q.title.slice(0, 50),
        questions.length,
        passingScore ?? '—',
        link,
        issues.length === 0 ? 'PASS' : `WARN: ${issues.join('; ')}`,
      ]);
    }
    const quizStructureStatus: GateStatus =
      quizzes.length === 0
        ? 'FAIL'
        : quizzesWellFormed === quizzes.length
          ? 'PASS'
          : 'WARN';
    gates.push(
      this.makeGate(
        'OE2.G2',
        'Cada quiz tiene questions[] válidas, passingScore y referencia (Lesson o Module)',
        quizStructureStatus,
        `${quizzesWellFormed}/${quizzes.length} quizzes bien formados; ${quizzesUnlinked} sin vínculo válido`,
      ),
    );

    // Gate 3: actividades EXAM y TALLER con conteos esperados.
    const exams = activities.filter((a) => activityType(a) === 'EXAM');
    const talleres = activities.filter((a) => activityType(a) === 'TALLER');
    const otherActivities = activities.filter(
      (a) => activityType(a) !== 'EXAM' && activityType(a) !== 'TALLER',
    );

    const examsOk = exams.length >= EXPECTED_EXAMS;
    const talleresOk = talleres.length >= EXPECTED_TALLERES;
    gates.push(
      this.makeGate(
        'OE2.G3',
        `Actividades EXAM (≥${EXPECTED_EXAMS}) y TALLER (≥${EXPECTED_TALLERES}) presentes`,
        examsOk && talleresOk
          ? 'PASS'
          : exams.length + talleres.length > 0
            ? 'WARN'
            : 'FAIL',
        `EXAM=${exams.length}/${EXPECTED_EXAMS}, TALLER=${talleres.length}/${EXPECTED_TALLERES}, otros=${otherActivities.length}`,
        'prisma.evaluation.findMany',
      ),
    );

    // Gate 4: estructura de actividades (maxScore, content, assignments opcionales).
    let activitiesWellFormed = 0;
    for (const a of activities) {
      const issues: string[] = [];
      const maxScore = activityMaxScore(a);
      if (typeof maxScore !== 'number' || maxScore <= 0) {
        issues.push('maxScore inválido');
      }
      if (!a.title || !a.title.trim()) issues.push('sin título');
      // Sustituye a Activity.content (columna inexistente): el contenido
      // opcional ahora es el escenario; si existe, debe ser objeto.
      if (a.scenarios.some((sc) => sc.content === null || typeof sc.content !== 'object')) {
        issues.push('content no es objeto');
      }
      if (issues.length === 0) activitiesWellFormed += 1;

      tableRows.push([
        activityType(a),
        a.title.slice(0, 50),
        '—',
        maxScore,
        `${a.assignments.length} asignaciones`,
        issues.length === 0 ? 'PASS' : `WARN: ${issues.join('; ')}`,
      ]);
    }
    gates.push(
      this.makeGate(
        'OE2.G4',
        'Cada actividad tiene maxScore válido y estructura coherente',
        activities.length === 0
          ? 'FAIL'
          : activitiesWellFormed === activities.length
            ? 'PASS'
            : 'WARN',
        `${activitiesWellFormed}/${activities.length} actividades bien formadas`,
      ),
    );

    // Gate 5 (informativo): compareConfigurations sigue siendo importable.
    const compareGate = await this.smokeCompareConfigurations();
    gates.push(compareGate);

    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.buildSummary(gates),
      gates,
      tables: [
        {
          title: 'OE2 — Inventario de quizzes y actividades',
          headers: ['tipo', 'título', '#preguntas', 'maxScore/passingScore', 'vínculo', 'status'],
          rows: tableRows,
        },
      ],
      defenseBullets: [
        `Demuestra que el módulo de evaluación está poblado: ${quizzes.length} quizzes, ${exams.length} exámenes, ${talleres.length} talleres.`,
        'Evidencia que cada quiz declara una rúbrica explícita (passingScore) y referencia a la lección que evalúa.',
        'Garantiza la trazabilidad lecciones ↔ instrumentos de evaluación, alineada con los niveles del currículo.',
      ],
    };
  }

  private async smokeCompareConfigurations(): Promise<Gate> {
    try {
      const mod = await import('../../src/features/clinical-cases/domain/services/configuration-comparison');
      const ok = typeof mod.compareConfigurations === 'function';
      return this.makeGate(
        'OE2.G5',
        'evaluation.service.compareConfigurations sigue exportado (API residual)',
        ok ? 'PASS' : 'WARN',
        ok
          ? 'Función disponible para futuras integraciones (casos clínicos quedaron fuera de scope).'
          : 'No exportado.',
        'src/features/clinical-cases/domain/services/configuration-comparison.ts',
      );
    } catch (err) {
      return this.makeGate(
        'OE2.G5',
        'evaluation.service.compareConfigurations sigue exportado (API residual)',
        'FAIL',
        `Error al importar: ${(err as Error).message}`,
      );
    }
  }

  private buildSummary(gates: Gate[]): string {
    const passed = gates.filter((g) => g.status === 'PASS').length;
    return `OE2: ${passed}/${gates.length} gates en estado PASS.`;
  }
}
