/*
 * Funcionalidad: Repositorio Prisma CurriculumSubtreePrismaRepository
 * Descripción: Implementa ICurriculumSubtreeRepository sobre PrismaService: recolecta el subárbol de un nodo (con CTE recursiva para subniveles), cuenta datos de estudiantes (progreso, lecciones completadas, progreso de páginas, intentos de evaluaciones vinculadas al subárbol por lesson_id, module_id, level_id o legacy_module_ref, ya que esas llaves son SET NULL y quiz_attempts queda congelada, y notas) y elimina el subárbol de hijos a padres
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type CurriculumNodeKind,
  type CurriculumSubtree,
  LESSON_NODE_KIND,
  LEVEL_NODE_KIND,
  MODULE_NODE_KIND,
  SECTION_NODE_KIND,
} from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { type ICurriculumSubtreeRepository } from "@/features/curriculum/domain/repositories/curriculum-subtree.repository";
import { type StudentDataCounts } from "@/features/curriculum/domain/services/delete-guard";

interface RootIds {
  sectionIds: string[];
  levelIds: string[];
  moduleIds: string[];
  lessonIds: string[];
  pageIds: string[];
}

export function subtreeEvaluationLinks(subtree: CurriculumSubtree): Prisma.EvaluationWhereInput[] {
  const links: Prisma.EvaluationWhereInput[] = [];

  if (subtree.lessonIds.length > 0) {
    links.push({ lessonId: { in: subtree.lessonIds } });
  }

  if (subtree.moduleIds.length > 0) {
    links.push({ moduleId: { in: subtree.moduleIds } }, { legacyModuleRef: { in: subtree.moduleIds } });
  }

  if (subtree.levelIds.length > 0) {
    links.push({ levelId: { in: subtree.levelIds } });
  }

  return links;
}

@Injectable()
export class CurriculumSubtreePrismaRepository implements ICurriculumSubtreeRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async collect(kind: CurriculumNodeKind, id: string, transaction?: unknown): Promise<CurriculumSubtree | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const roots: RootIds | undefined = await this._resolveRoots(client, kind, id);

    if (!roots) {
      return undefined;
    }

    const levelIds: string[] = await this._withDescendantLevels(client, roots.levelIds);

    const modules: { id: string }[] =
      levelIds.length > 0 ? await client.module.findMany({ where: { levelId: { in: levelIds } }, select: { id: true } }) : [];
    const moduleIds: string[] = this._unique([...roots.moduleIds, ...modules.map((module: { id: string }) => module.id)]);

    const lessons: { id: string }[] =
      moduleIds.length > 0 ? await client.lesson.findMany({ where: { moduleId: { in: moduleIds } }, select: { id: true } }) : [];
    const lessonIds: string[] = this._unique([...roots.lessonIds, ...lessons.map((lesson: { id: string }) => lesson.id)]);

    const pages: { id: string }[] =
      moduleIds.length > 0 || lessonIds.length > 0
        ? await client.page.findMany({
          where: { OR: [{ moduleId: { in: moduleIds } }, { lessonId: { in: lessonIds } }] },
          select: { id: true },
        })
        : [];
    const pageIds: string[] = this._unique([...roots.pageIds, ...pages.map((page: { id: string }) => page.id)]);

    return { sectionIds: roots.sectionIds, levelIds, moduleIds, lessonIds, pageIds };
  }

  public async countStudentData(subtree: CurriculumSubtree, transaction?: unknown): Promise<StudentDataCounts> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const userProgress: number = subtree.moduleIds.length > 0 ? await client.userProgress.count({ where: { moduleId: { in: subtree.moduleIds } } }) : 0;
    const lessonCompletions: number =
      subtree.lessonIds.length > 0 ? await client.lessonCompletion.count({ where: { lessonId: { in: subtree.lessonIds } } }) : 0;
    const pageProgress: number = subtree.pageIds.length > 0 ? await client.pageProgress.count({ where: { pageId: { in: subtree.pageIds } } }) : 0;
    const evaluationLinks: Prisma.EvaluationWhereInput[] = subtreeEvaluationLinks(subtree);
    // Evaluation foreign keys to curriculum are SET NULL, so without this count a delete would silently detach graded attempts
    const quizAttempts: number =
      evaluationLinks.length > 0 ? await client.studentEvaluationAttempt.count({ where: { evaluation: { OR: evaluationLinks } } }) : 0;
    // Notes belong to the notes feature; this narrow count is the only read of that table from curriculum code.
    const notes: number =
      subtree.lessonIds.length > 0 || subtree.pageIds.length > 0
        ? await client.note.count({ where: { OR: [{ lessonId: { in: subtree.lessonIds } }, { pageId: { in: subtree.pageIds } }] } })
        : 0;

    return { userProgress, lessonCompletions, pageProgress, quizAttempts, notes };
  }

  public async deleteSubtree(subtree: CurriculumSubtree, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    if (subtree.pageIds.length > 0) {
      await client.pageSection.deleteMany({ where: { pageId: { in: subtree.pageIds } } });
      await client.page.deleteMany({ where: { id: { in: subtree.pageIds } } });
    }

    if (subtree.lessonIds.length > 0) {
      await client.lesson.deleteMany({ where: { id: { in: subtree.lessonIds } } });
    }

    if (subtree.moduleIds.length > 0) {
      await client.module.deleteMany({ where: { id: { in: subtree.moduleIds } } });
    }

    if (subtree.levelIds.length > 0) {
      await client.level.deleteMany({ where: { id: { in: subtree.levelIds } } });
    }

    if (subtree.sectionIds.length > 0) {
      await client.section.deleteMany({ where: { id: { in: subtree.sectionIds } } });
    }
  }

  private async _resolveRoots(client: PrismaExecutor, kind: CurriculumNodeKind, id: string): Promise<RootIds | undefined> {
    const empty: RootIds = { sectionIds: [], levelIds: [], moduleIds: [], lessonIds: [], pageIds: [] };

    if (kind === SECTION_NODE_KIND) {
      const section: { levels: { id: string }[] } | null = await client.section.findUnique({
        where: { id },
        select: { levels: { select: { id: true } } },
      });

      return section ? { ...empty, sectionIds: [id], levelIds: section.levels.map((level: { id: string }) => level.id) } : undefined;
    }

    if (kind === LEVEL_NODE_KIND) {
      return (await client.level.count({ where: { id } })) > 0 ? { ...empty, levelIds: [id] } : undefined;
    }

    if (kind === MODULE_NODE_KIND) {
      return (await client.module.count({ where: { id } })) > 0 ? { ...empty, moduleIds: [id] } : undefined;
    }

    if (kind === LESSON_NODE_KIND) {
      return (await client.lesson.count({ where: { id } })) > 0 ? { ...empty, lessonIds: [id] } : undefined;
    }

    return (await client.page.count({ where: { id } })) > 0 ? { ...empty, pageIds: [id] } : undefined;
  }

  private async _withDescendantLevels(client: PrismaExecutor, rootLevelIds: string[]): Promise<string[]> {
    if (rootLevelIds.length === 0) {
      return [];
    }

    const rows: { id: string }[] = await client.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM "levels" WHERE id = ANY(${rootLevelIds})
        UNION
        SELECT child.id FROM "levels" AS child JOIN tree ON child."parentId" = tree.id
      )
      SELECT id FROM tree
    `;

    return this._unique(rows.map((row: { id: string }) => row.id));
  }

  private _unique(ids: string[]): string[] {
    return [...new Set(ids)];
  }
}
