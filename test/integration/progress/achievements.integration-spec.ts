/*
 * Funcionalidad: Prueba de integración de logros
 * Descripción: Contra el PostgreSQL de Testcontainers verifica que N evaluaciones simultáneas de los logros de un estudiante con una lección completada dejen un solo logro "first_lesson" (índice único por usuario y código e inserción que omite en conflicto), que la base rechace un duplicado insertado directamente y que el logro de nivel 10 se desbloquee con el XP del registro de actividad
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Achievement, type User } from "@prisma/client";

import { UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import { UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";

import { type ContentTree, createContentTree, createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 10;

describe("achievements against PostgreSQL", () => {
  let harness: IntegrationApp;
  let useCase: UnlockAchievementsUseCase;

  beforeAll(async () => {
    harness = await createIntegrationApp();
    useCase = harness.app.get(UnlockAchievementsUseCase);
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  it(`keeps one unlock per code when ${CONCURRENCY} evaluations race`, async () => {
    const student: User = await createStudent(harness.prisma);
    const tree: ContentTree = await createContentTree(harness.prisma);

    await harness.prisma.lessonCompletion.create({ data: { userId: student.id, lessonId: tree.lesson.id, isCompleted: true, completedAt: new Date() } });

    const results: PromiseSettledResult<void>[] = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, (): Promise<void> => useCase.execute(new UnlockAchievementsCommand({ userId: student.id, triggers: ["lessons_completed"] }))),
    );

    const rows: Achievement[] = await harness.prisma.achievement.findMany({ where: { userId: student.id } });

    expect(results.filter((result: PromiseSettledResult<void>) => result.status === "rejected")).toEqual([]);
    expect(rows.map((row: Achievement) => [row.code, row.xpReward])).toEqual([["first_lesson", 50]]);
  });

  it("rejects a duplicate (userId, code) at the database", async () => {
    const student: User = await createStudent(harness.prisma);
    const data: { userId: string; code: string; title: string } = { userId: student.id, code: "first_lesson", title: "Primer Paso" };

    await harness.prisma.achievement.create({ data });

    await expect(harness.prisma.achievement.create({ data })).rejects.toMatchObject({ code: "P2002" });
  });

  it("unlocks level 10 from the ledger XP with the single level formula", async () => {
    const student: User = await createStudent(harness.prisma);

    await harness.prisma.learningActivityEvent.create({
      data: { userId: student.id, kind: "MODULE_COMPLETED", refId: "m", xp: 4500, occurredAt: new Date(), localDate: new Date("2026-10-28T00:00:00.000Z") },
    });

    await useCase.execute(new UnlockAchievementsCommand({ userId: student.id, triggers: ["level_reached"] }));

    expect((await harness.prisma.achievement.findMany({ where: { userId: student.id } })).map((row: Achievement) => row.code)).toEqual(["level_10"]);
  });
});
