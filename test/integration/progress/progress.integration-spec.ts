/*
 * Funcionalidad: Prueba de integración del progreso
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de progreso a través de UpdateStepProgressUseCase: N actualizaciones simultáneas del primer acceso de un estudiante a una lección terminan todas bien, dejan exactamente una fila de user_progress y una de lesson_completions (upsert sobre las claves únicas) y acumulan el tiempo con incrementos atómicos sin perder actualizaciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletion, type User, type UserProgress } from "@prisma/client";

import { UpdateStepProgressCommand } from "@/features/progress/application/commands/update-step-progress.command";
import { UpdateStepProgressUseCase } from "@/features/progress/application/use-cases/update-step-progress.usecase";

import { type ContentTree, createContentTree, createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 10;
const TIME_DELTA_SECONDS: number = 7;

describe("progress against PostgreSQL", () => {
  let harness: IntegrationApp;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it(`should keep one progress row per module and lesson when ${CONCURRENCY} first updates race`, async () => {
    const student: User = await createStudent(harness.prisma);
    const tree: ContentTree = await createContentTree(harness.prisma);
    const useCase: UpdateStepProgressUseCase = harness.app.get(UpdateStepProgressUseCase);

    const results: PromiseSettledResult<void>[] = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, (_value: unknown, index: number): Promise<void> =>
        useCase.execute(
          new UpdateStepProgressCommand({
            userId: student.id,
            moduleId: tree.module.id,
            lessonId: tree.lesson.id,
            currentStepIndex: index % 3,
            totalSteps: 3,
            timeSpentDelta: TIME_DELTA_SECONDS,
          }),
        ),
      ),
    );

    const rejected: unknown[] = results.flatMap((result: PromiseSettledResult<void>): unknown[] => (result.status === "rejected" ? [result.reason] : []));
    const moduleRows: UserProgress[] = await harness.prisma.userProgress.findMany({ where: { userId: student.id } });
    const lessonRows: LessonCompletion[] = await harness.prisma.lessonCompletion.findMany({ where: { userId: student.id } });

    expect(rejected).toEqual([]);
    expect(moduleRows).toHaveLength(1);
    expect(lessonRows).toHaveLength(1);
    expect(moduleRows[0].timeSpent).toBe(CONCURRENCY * TIME_DELTA_SECONDS);
    expect(lessonRows[0].timeSpent).toBe(CONCURRENCY * TIME_DELTA_SECONDS);
  });
});
