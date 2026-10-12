/*
 * Funcionalidad: Repositorio Prisma ProgressAnalyticsPrismaRepository
 * Descripción: Implementa IProgressAnalyticsRepository sobre PrismaService con lecturas por lotes sin bucles por usuario: la estructura publicada (tres lecturas), las lecciones publicadas con su conteo filtrado de páginas publicadas, las vistas completadas de páginas publicadas de todos los usuarios con IN y sus registros de lecciones completadas con IN (seis lecturas en total, independientes del número de usuarios); y las lecciones completadas por un usuario en un rango
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { publishedLessonWhere, publishedPageWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import { type ProgressStructure } from "@/features/progress/domain/read-models/learning-progress.read-model";
import {
  type IProgressAnalyticsRepository,
  type LessonCompletionActivity,
  type UsersProgressSource,
} from "@/features/progress/domain/repositories/progress-analytics.repository";
import { loadPublishedProgressStructure } from "@/features/progress/infrastructure/persistence/prisma/published-progress-structure";

interface PublishedLessonRow {
  id: string;
  moduleId: string;
  module: { levelId: string | null; level: { sectionId: string | null } | null };
  _count: { pages: number };
}

interface ViewedPageRow {
  userId: string;
  page: { lessonId: string | null };
}

interface CompletionRow {
  userId: string;
  lessonId: string;
}

interface CompletionActivityRow {
  lessonId: string;
  completedAt: Date | null;
  lesson: { title: string; moduleId: string };
}

function countKey(userId: string, lessonId: string): string {
  return `${userId}\u0000${lessonId}`;
}

@Injectable()
export class ProgressAnalyticsPrismaRepository implements IProgressAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getProgressSourceForUsers(userIds: readonly string[]): Promise<UsersProgressSource> {
    const ids: string[] = [...new Set<string>(userIds)];

    const [structure, lessons, viewedRows, completionRows]: [ProgressStructure, PublishedLessonRow[], ViewedPageRow[], CompletionRow[]] = await Promise.all([
      loadPublishedProgressStructure(this._prisma),
      this._prisma.lesson.findMany({
        where: publishedLessonWhere(),
        orderBy: [{ moduleId: "asc" }, { order: "asc" }],
        select: {
          id: true,
          moduleId: true,
          module: { select: { levelId: true, level: { select: { sectionId: true } } } },
          _count: { select: { pages: { where: publishedPageWhere() } } },
        },
      }),
      ids.length === 0
        ? Promise.resolve([])
        : this._prisma.pageProgress.findMany({
          where: { userId: { in: ids }, completed: true, page: { AND: [publishedPageWhere(), { lesson: publishedLessonWhere() }] } },
          select: { userId: true, page: { select: { lessonId: true } } },
        }),
      ids.length === 0
        ? Promise.resolve([])
        : this._prisma.lessonCompletion.findMany({
          where: { userId: { in: ids }, isCompleted: true, lesson: publishedLessonWhere() },
          select: { userId: true, lessonId: true },
        }),
    ]);

    const viewedCounts: Map<string, number> = new Map<string, number>();

    for (const row of viewedRows) {
      if (row.page.lessonId !== null) {
        const key: string = countKey(row.userId, row.page.lessonId);

        viewedCounts.set(key, (viewedCounts.get(key) ?? 0) + 1);
      }
    }

    const completed: Set<string> = new Set<string>(completionRows.map((row: CompletionRow) => countKey(row.userId, row.lessonId)));

    const factsByUser: Map<string, LessonCompletionFact[]> = new Map(
      ids.map((userId: string): [string, LessonCompletionFact[]] => [
        userId,
        lessons.map(
          (lesson: PublishedLessonRow): LessonCompletionFact => ({
            lessonId: lesson.id,
            moduleId: lesson.moduleId,
            levelId: lesson.module.levelId ?? undefined,
            sectionId: lesson.module.level?.sectionId ?? undefined,
            publishedPageCount: lesson._count.pages,
            viewedPageCount: viewedCounts.get(countKey(userId, lesson.id)) ?? 0,
            hasCompletionRecord: completed.has(countKey(userId, lesson.id)),
          }),
        ),
      ]),
    );

    return { structure, factsByUser };
  }

  public async getLessonCompletionsOfUser(userId: string, from: Date, to: Date, limit: number): Promise<LessonCompletionActivity[]> {
    const rows: CompletionActivityRow[] = await this._prisma.lessonCompletion.findMany({
      where: { userId, isCompleted: true, completedAt: { gte: from, lt: to } },
      select: { lessonId: true, completedAt: true, lesson: { select: { title: true, moduleId: true } } },
      orderBy: { completedAt: "desc" },
      take: limit,
    });

    return rows.flatMap((row: CompletionActivityRow): LessonCompletionActivity[] =>
      row.completedAt === null ? [] : [{ lessonId: row.lessonId, lessonTitle: row.lesson.title, moduleId: row.lesson.moduleId, completedAt: row.completedAt }],
    );
  }
}
