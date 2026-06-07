/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : TeachingAuditor — Auditor del Objetivo Específico 1.
 * Descripción   : Verifica la existencia y completitud del modelo
 *                 jerárquico Level → Module → Lesson → Page →
 *                 PageSection que soporta el currículo VentyLab.
 *                 Comprueba conteos esperados por track, lecciones
 *                 huérfanas y ausencia de ciclos en los prerequisitos
 *                 de módulos (DFS) y de niveles.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import { prisma } from '../../src/shared/infrastructure/database';
import { Auditor } from './Auditor';
import type { AuditResult, Gate } from '../reporting/types';

interface ExpectedCounts {
  [levelTitlePattern: string]: number;
}

const EXPECTED_BY_TRACK: Record<string, ExpectedCounts> = {
  mecanica: {
    prereq: 2,
    principiante: 6,
    intermedio: 6,
    avanzado: 8,
  },
  ventylab: {
    principiante: 2,
    intermedio: 2,
    avanzado: 2,
  },
};

export class TeachingAuditor extends Auditor {
  readonly objectiveCode = 'OE1' as const;
  readonly objectiveName =
    'Diseñar e implementar el modelo de contenido didáctico estructurado y trazable.';

  async run(): Promise<AuditResult> {
    const gates: Gate[] = [];
    const tableRows: Array<Array<string | number>> = [];

    const levels = await prisma.level.findMany({
      where: { isActive: true },
      include: {
        modules: {
          where: { isActive: true },
          include: {
            lessons: {
              where: { isActive: true },
              include: {
                module: { select: { id: true, title: true } },
              },
            },
            pages: {
              where: { isActive: true },
              include: { sections: true },
            },
            prerequisites: true,
          },
        },
      },
      orderBy: [{ track: 'asc' }, { order: 'asc' }],
    });

    // Gate 1: Conteo de módulos por nivel vs esperado
    const countMismatches: string[] = [];
    for (const lvl of levels) {
      const trackExpectations = EXPECTED_BY_TRACK[lvl.track];
      if (!trackExpectations) continue;
      const matchedKey = Object.keys(trackExpectations).find((k) =>
        lvl.title.toLowerCase().includes(k),
      );
      if (!matchedKey) continue;
      const expected = trackExpectations[matchedKey];
      const actual = lvl.modules.length;
      if (actual !== expected) {
        countMismatches.push(
          `[${lvl.track}/${lvl.title}] esperados=${expected}, encontrados=${actual}`,
        );
      }
    }
    gates.push(
      this.makeGate(
        'OE1.G1',
        'Conteo de módulos por nivel coincide con el currículo esperado',
        countMismatches.length === 0 ? 'PASS' : 'WARN',
        countMismatches.length === 0
          ? `${levels.length} niveles auditados sin discrepancias.`
          : `Discrepancias: ${countMismatches.join(' | ')}`,
        'prisma.level.findMany + EXPECTED_BY_TRACK',
      ),
    );

    // Gates 2 & 3: lecciones por módulo, páginas y secciones por lección
    let lessonsWithoutPages = 0;
    let lessonsWithoutSections = 0;
    let modulesWithoutLessons = 0;

    for (const lvl of levels) {
      for (const mod of lvl.modules) {
        if (mod.lessons.length === 0) {
          modulesWithoutLessons += 1;
          tableRows.push([
            `${lvl.track}/${lvl.title}`,
            mod.title,
            '—',
            0,
            0,
            'FAIL: módulo sin lecciones',
          ]);
          continue;
        }

        // Phase 1 architecture: Page belongs to Module (not Lesson).
        // Una lección queda "cubierta" si su Module tiene ≥1 Page con
        // ≥1 PageSection no vacía. Preferimos match por legacyLessonId
        // o por slug cuando exista, pero como fallback aceptamos
        // cualquier Page del mismo módulo.
        const moduleSectionCount = mod.pages.reduce(
          (acc, p) =>
            acc +
            p.sections.filter((s) => {
              const c = s.content as unknown;
              if (typeof c === 'string') return c.length > 0;
              if (c && typeof c === 'object') return Object.keys(c).length > 0;
              return false;
            }).length,
          0,
        );

        for (const lesson of mod.lessons) {
          const directMatches = mod.pages.filter(
            (p) => p.legacyLessonId === lesson.id || p.slug === lesson.slug,
          );
          const pagesForLesson =
            directMatches.length > 0 ? directMatches : mod.pages;
          const totalSections =
            directMatches.length > 0
              ? directMatches.reduce(
                  (acc, p) =>
                    acc +
                    p.sections.filter((s) => {
                      const c = s.content as unknown;
                      if (typeof c === 'string') return c.length > 0;
                      if (c && typeof c === 'object')
                        return Object.keys(c).length > 0;
                      return false;
                    }).length,
                  0,
                )
              : moduleSectionCount;

          if (pagesForLesson.length === 0) lessonsWithoutPages += 1;
          if (totalSections === 0) lessonsWithoutSections += 1;

          const status =
            pagesForLesson.length === 0
              ? 'FAIL: módulo sin Page'
              : totalSections === 0
                ? 'FAIL: Page sin secciones útiles'
                : directMatches.length > 0
                  ? 'PASS'
                  : 'PASS (cobertura a nivel de Module)';

          tableRows.push([
            `${lvl.track}/${lvl.title}`,
            mod.title,
            lesson.title,
            pagesForLesson.length,
            totalSections,
            status,
          ]);
        }
      }
    }

    gates.push(
      this.makeGate(
        'OE1.G2',
        'Cada módulo tiene al menos una lección',
        modulesWithoutLessons === 0 ? 'PASS' : 'FAIL',
        `${modulesWithoutLessons} módulo(s) sin lecciones`,
      ),
    );
    gates.push(
      this.makeGate(
        'OE1.G3',
        'Cada lección tiene ≥1 Page con ≥1 PageSection no vacía',
        lessonsWithoutPages === 0 && lessonsWithoutSections === 0
          ? 'PASS'
          : 'WARN',
        `Lecciones sin Page: ${lessonsWithoutPages}; Lecciones sin secciones útiles: ${lessonsWithoutSections}`,
      ),
    );

    // Gate 4: lecciones huérfanas (moduleId apuntando a Module inexistente).
    // Lesson.moduleId es obligatorio en el schema, así que la integridad
    // referencial debería garantizarse a nivel de FK. Usamos una consulta
    // cruda para auditar la realidad efectiva en la BD.
    const orphanRows = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*)::bigint AS count FROM lessons l LEFT JOIN modules m ON l."moduleId" = m.id WHERE m.id IS NULL`;
    const orphanLessons = Number(orphanRows[0]?.count ?? 0);
    gates.push(
      this.makeGate(
        'OE1.G4',
        'No existen lecciones huérfanas (sin Module)',
        orphanLessons === 0 ? 'PASS' : 'FAIL',
        `${orphanLessons} lección(es) huérfana(s)`,
        'SELECT COUNT(*) FROM lessons LEFT JOIN modules ...',
      ),
    );

    // Gate 5: prerequisitos sin ciclos (DFS sobre módulos y niveles).
    const moduleCycle = await this.detectModulePrereqCycles();
    const levelCycle = await this.detectLevelPrereqCycles();
    const cycles = [...moduleCycle, ...levelCycle];
    gates.push(
      this.makeGate(
        'OE1.G5',
        'Grafo de prerequisitos sin ciclos',
        cycles.length === 0 ? 'PASS' : 'FAIL',
        cycles.length === 0
          ? 'DFS no detectó ciclos en módulos ni niveles.'
          : `Ciclos: ${cycles.join(' ; ')}`,
        'DFS sobre ModulePrerequisite y LevelPrerequisite',
      ),
    );

    return {
      objectiveCode: this.objectiveCode,
      objectiveName: this.objectiveName,
      summary: this.buildSummary(gates),
      gates,
      tables: [
        {
          title: 'OE1 — Cobertura del modelo didáctico',
          headers: [
            'Level',
            'Module',
            'Lesson',
            '#Pages',
            '#Sections',
            'Status',
          ],
          rows: tableRows,
        },
      ],
      defenseBullets: [
        'Demuestra que existe un esquema relacional (Level → Module → Lesson → Page → PageSection) instanciado en Postgres.',
        'Cuantifica cobertura de contenido por track del currículo (mecánica y ventylab).',
        'Garantiza la integridad referencial: ausencia de lecciones huérfanas y de ciclos en prerequisitos.',
      ],
    };
  }

  private buildSummary(gates: Gate[]): string {
    const passed = gates.filter((g) => g.status === 'PASS').length;
    return `OE1: ${passed}/${gates.length} gates en estado PASS.`;
  }

  private async detectModulePrereqCycles(): Promise<string[]> {
    const edges = await prisma.modulePrerequisite.findMany({
      select: { moduleId: true, prerequisiteId: true },
    });
    return this.dfsCycles(edges.map((e) => [e.moduleId, e.prerequisiteId]));
  }

  private async detectLevelPrereqCycles(): Promise<string[]> {
    const edges = await prisma.levelPrerequisite.findMany({
      select: { levelId: true, prerequisiteLevelId: true },
    });
    return this.dfsCycles(edges.map((e) => [e.levelId, e.prerequisiteLevelId]));
  }

  private dfsCycles(edges: Array<[string, string]>): string[] {
    const adj = new Map<string, string[]>();
    for (const [from, to] of edges) {
      if (!adj.has(from)) adj.set(from, []);
      adj.get(from)!.push(to);
    }
    const cycles: string[] = [];
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<string, number>();

    const visit = (node: string, stack: string[]): void => {
      color.set(node, GRAY);
      stack.push(node);
      for (const next of adj.get(node) ?? []) {
        const c = color.get(next) ?? WHITE;
        if (c === GRAY) {
          const idx = stack.indexOf(next);
          cycles.push(stack.slice(idx).concat(next).join(' → '));
        } else if (c === WHITE) {
          visit(next, stack);
        }
      }
      stack.pop();
      color.set(node, BLACK);
    };

    for (const node of adj.keys()) {
      if ((color.get(node) ?? WHITE) === WHITE) visit(node, []);
    }
    return cycles;
  }
}
