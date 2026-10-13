/*
 * Funcionalidad: Semilla del historial de aprendizaje de la demostración
 * Descripción: Inserta o actualiza el avance de lectura de cada estudiante (páginas completadas en orden, lecciones completadas o en curso y progreso por módulo con sus contadores) y notas privadas TipTap por lección y página, con fechas repartidas en las últimas semanas; un estudiante queda sin avance para mostrar el caso vacío
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type ProgressStatus } from "@prisma/client";

import { DEMO_STUDENTS, demoStudent } from "../demo-cast";
import { type DemoContext, type DemoDb, demoId, tiptapDocument, upsertAll } from "../demo-support";

import { DEMO_MODULES, DEMO_PAGES, type DemoLesson, type DemoModule, type DemoPage, demoLesson } from "./content";

// Pages completed by each student, in curriculum order (the last student has not started).
const COMPLETED_PAGES_BY_STUDENT: readonly number[] = [6, 6, 5, 4, 3, 6, 5, 2, 1, 0];

function completedPagesOf(studentIndex: number): number {
  return COMPLETED_PAGES_BY_STUDENT[studentIndex] ?? 0;
}

async function seedProgress(db: DemoDb, context: DemoContext): Promise<void> {
  const pageRows: Prisma.PageProgressCreateManyInput[] = [];
  const lessonRows: Prisma.LessonCompletionCreateManyInput[] = [];
  const moduleRows: Prisma.UserProgressCreateManyInput[] = [];

  for (const [studentIndex, student] of DEMO_STUDENTS.entries()) {
    const completedCount: number = completedPagesOf(studentIndex);
    const completedAtOf = (pageIndex: number): Date => context.clock.at(-24 + pageIndex * 3 + (studentIndex % 3), 15 + (studentIndex % 4));

    for (const [pageIndex, page] of DEMO_PAGES.slice(0, Math.min(completedCount + 1, DEMO_PAGES.length)).entries()) {
      const completed: boolean = pageIndex < completedCount;
      const visitedAt: Date = completedAtOf(pageIndex);

      pageRows.push({
        id: demoId(`page-progress:${student.id}:${page.id}`),
        userId: student.id,
        pageId: page.id,
        completed,
        xpEarned: completed ? 10 : 0,
        lastVisitedAt: visitedAt,
        completedAt: completed ? visitedAt : undefined,
        createdAt: visitedAt,
        updatedAt: visitedAt,
      });
    }

    if (completedCount === 0) {
      continue;
    }

    for (const demoModule of DEMO_MODULES) {
      let completedLessons: number = 0;
      let lastLesson: DemoLesson | undefined;
      let lastAccessedAt: Date | undefined;

      for (const lesson of demoModule.lessons) {
        const indexes: number[] = lesson.pages.map((page: DemoPage) => DEMO_PAGES.findIndex((candidate: DemoPage) => candidate.id === page.id));
        const done: number = indexes.filter((index: number) => index < completedCount).length;
        const firstIndex: number = indexes[0] ?? 0;

        if (done === 0 && firstIndex > completedCount) {
          continue;
        }

        const isCompleted: boolean = done === lesson.pages.length;
        const accessedAt: Date = completedAtOf(Math.min(firstIndex + done, DEMO_PAGES.length - 1));

        completedLessons += isCompleted ? 1 : 0;
        lastLesson = lesson;
        lastAccessedAt = accessedAt;

        lessonRows.push({
          id: demoId(`lesson-completion:${student.id}:${lesson.id}`),
          userId: student.id,
          lessonId: lesson.id,
          currentStepIndex: Math.min(done, lesson.pages.length - 1),
          totalSteps: lesson.pages.length,
          timeSpent: 600 * Math.max(done, 1),
          lastAccessed: accessedAt,
          isCompleted,
          completedAt: isCompleted ? accessedAt : undefined,
          updatedAt: accessedAt,
        });
      }

      if (!lastLesson || !lastAccessedAt) {
        continue;
      }

      const total: number = demoModule.lessons.length;
      const status: ProgressStatus = completedLessons === total ? "COMPLETED" : "IN_PROGRESS";

      moduleRows.push(moduleProgressRow(student.id, demoModule, { completedLessons, total, status, lastLessonId: lastLesson.id, lastAccessedAt, context }));
    }
  }

  await upsertAll(pageRows, (row: Prisma.PageProgressCreateManyInput, id: string) => db.pageProgress.upsert({ where: { id }, create: row, update: row }));
  await upsertAll(lessonRows, (row: Prisma.LessonCompletionCreateManyInput, id: string) => db.lessonCompletion.upsert({ where: { id }, create: row, update: row }));
  await upsertAll(moduleRows, (row: Prisma.UserProgressCreateManyInput, id: string) => db.userProgress.upsert({ where: { id }, create: row, update: row }));
}

function moduleProgressRow(
  userId: string,
  demoModule: DemoModule,
  progress: { completedLessons: number; total: number; status: ProgressStatus; lastLessonId: string; lastAccessedAt: Date; context: DemoContext },
): Prisma.UserProgressCreateManyInput {
  return {
    id: demoId(`user-progress:${userId}:${demoModule.id}`),
    userId,
    moduleId: demoModule.id,
    status: progress.status,
    isModuleCompleted: progress.status === "COMPLETED",
    completedLessonsCount: progress.completedLessons,
    totalLessons: progress.total,
    progressPercentage: Math.round((progress.completedLessons / progress.total) * 100),
    timeSpent: 1200 * Math.max(progress.completedLessons, 1),
    lastAccessedLessonId: progress.lastLessonId,
    lastAccessedAt: progress.lastAccessedAt,
    startedAt: progress.context.clock.at(-25, 14),
    completedAt: progress.status === "COMPLETED" ? progress.lastAccessedAt : undefined,
  };
}

interface NoteSeed {
  readonly key: string;
  readonly studentIndex: number;
  readonly lessonIndex: number;
  readonly withPage: boolean;
  readonly day: number;
  readonly text: string;
}

async function seedNotes(db: DemoDb, context: DemoContext): Promise<void> {
  const notes: readonly NoteSeed[] = [
    { key: "s01-l1-a", studentIndex: 0, lessonIndex: 0, withPage: true, day: -20, text: "Paw = V/C + R·Flujo + PEEP: la meseta aísla la carga elástica." },
    { key: "s01-l1-b", studentIndex: 0, lessonIndex: 0, withPage: false, day: -12, text: "Repasar la diferencia pico-meseta antes del examen." },
    { key: "s02-l2", studentIndex: 1, lessonIndex: 1, withPage: true, day: -10, text: "Compliance estática baja = pulmón rígido; revisar con pausa inspiratoria." },
    { key: "s03-l1", studentIndex: 2, lessonIndex: 0, withPage: false, day: -8, text: "Duda: ¿por qué la PEEP se resta al calcular la compliance?" },
    { key: "s06-l3", studentIndex: 5, lessonIndex: 2, withPage: true, day: -3, text: "En PCV el volumen corriente cae si baja la compliance." },
  ];

  const rows: Prisma.NoteCreateManyInput[] = notes.map((note: NoteSeed): Prisma.NoteCreateManyInput => {
    const lesson: DemoLesson = demoLesson(note.lessonIndex);
    const createdAt: Date = context.clock.at(note.day, 19);

    return {
      id: demoId(`note:${note.key}`),
      userId: demoStudent(note.studentIndex).id,
      lessonId: lesson.id,
      pageId: note.withPage ? lesson.pages[0]?.id : undefined,
      content: tiptapDocument(note.text),
      createdAt,
      updatedAt: createdAt,
    };
  });

  await upsertAll(rows, (row: Prisma.NoteCreateManyInput, id: string) => db.note.upsert({ where: { id }, create: row, update: row }));
}

export async function seedLearningHistory(db: DemoDb, context: DemoContext): Promise<void> {
  await seedProgress(db, context);
  await seedNotes(db, context);
}
