/*
 * Funcionalidad: Carga de hechos de completitud de lecciones
 * Descripción: Obtiene con agregaciones Prisma (groupBy por lección) las páginas publicadas, las páginas vistas por el usuario y los registros históricos de LessonCompletion de las lecciones publicadas con ancestros publicados de un alcance; lo comparten los repositorios de currículo, niveles y progreso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { type PrismaExecutor } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { publishedLessonWhere, publishedPageWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";

interface FactLessonRow {
  id: string;
  moduleId: string;
  module: { levelId: string | null; level: { sectionId: string | null } | null };
}

interface PageCountRow {
  lessonId: string | null;
  _count: { _all: number };
}

function toCountMap(rows: PageCountRow[]): Map<string, number> {
  return new Map(
    rows
      .filter((row: PageCountRow) => row.lessonId !== null)
      .map((row: PageCountRow): [string, number] => [row.lessonId ?? "", row._count._all]),
  );
}

async function countPagesByLesson(client: PrismaExecutor, where: Prisma.PageWhereInput): Promise<Map<string, number>> {
  return await client.page.groupBy({ by: ["lessonId"], where, _count: { _all: true } }).then((rows: PageCountRow[]) => toCountMap(rows));
}

export async function loadLessonCompletionFacts(client: PrismaExecutor, userId: string | undefined, scope: Prisma.LessonWhereInput): Promise<LessonCompletionFact[]> {
  const lessons: FactLessonRow[] = await client.lesson.findMany({
    where: { AND: [publishedLessonWhere(), scope] },
    orderBy: [{ moduleId: "asc" }, { order: "asc" }],
    select: { id: true, moduleId: true, module: { select: { levelId: true, level: { select: { sectionId: true } } } } },
  });

  if (lessons.length === 0) {
    return [];
  }

  const lessonIds: string[] = lessons.map((lesson: FactLessonRow) => lesson.id);
  const pageScope: Prisma.PageWhereInput = { AND: [publishedPageWhere(), { lessonId: { in: lessonIds } }] };

  const [publishedCounts, viewedCounts, completionRows] = await Promise.all([
    countPagesByLesson(client, pageScope),
    userId ? countPagesByLesson(client, { AND: [pageScope, { progress: { some: { userId, completed: true } } }] }) : Promise.resolve(new Map<string, number>()),
    userId
      ? client.lessonCompletion.findMany({ where: { userId, isCompleted: true, lessonId: { in: lessonIds } }, select: { lessonId: true } })
      : Promise.resolve([]),
  ]);

  const completedLessonIds: Set<string> = new Set(completionRows.map((row: { lessonId: string }) => row.lessonId));

  return lessons.map(
    (lesson: FactLessonRow): LessonCompletionFact => ({
      lessonId: lesson.id,
      moduleId: lesson.moduleId,
      levelId: lesson.module.levelId ?? undefined,
      sectionId: lesson.module.level?.sectionId ?? undefined,
      publishedPageCount: publishedCounts.get(lesson.id) ?? 0,
      viewedPageCount: viewedCounts.get(lesson.id) ?? 0,
      hasCompletionRecord: completedLessonIds.has(lesson.id),
    }),
  );
}
