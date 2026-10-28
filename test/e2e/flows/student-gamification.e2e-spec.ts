/*
 * Funcionalidad: Flujo e2e de gamificación del estudiante
 * Descripción: Un estudiante completa la única lección de un módulo; el registro de actividad recibe la primera vista de la página, la lección, el módulo y los logros desbloqueados por los manejadores de eventos, y las rutas de gamificación, calendario de actividad, actividad reciente y resumen general devuelven la misma XP, nivel y racha (una sola fórmula), validando cada respuesta contra el contrato OpenAPI; un rango inválido del calendario responde 400
 * Versión: 0.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import { type Response } from "supertest";

import { toBogotaLocalDate } from "@/features/progress/domain/services/activity-calendar";

import { type ContentTree, createContentTree, createStudent } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { waitUntil } from "../../support/polling";

// First page view 5 + lesson 50 + module 200 + "Primer Paso" 50 + "Módulo Completado" 300.
const EXPECTED_XP: number = 605;

describe("flow: a student earns XP, level and streak from the activity ledger", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let token: string;
  let tree: ContentTree;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);

    const student: User = await createStudent(e2e.prisma);

    tree = await createContentTree(e2e.prisma);
    token = await mintAccessToken(student, e2e.app);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should report the same XP, level and streak in gamification, activity and overview", async () => {
    expectStatus(await api("POST", `/api/progress/pages/${tree.page.id}/view`, token), 200);

    const gamification: Response = await waitUntil(
      () => api("GET", "/api/progress/gamification", token),
      (response: Response) => response.status === 200 && response.body.data.xpTotal === EXPECTED_XP,
    );
    const today: string = toBogotaLocalDate(new Date());

    expect(gamification.body.data).toEqual({ xpTotal: EXPECTED_XP, level: 2, xpIntoLevel: 105, nextLevelXp: 1000, streakDays: 1, longestStreak: 1, xpToday: EXPECTED_XP });

    const activity: Response = await api("GET", `/api/progress/activity?from=${today}&to=${today}`, token);

    expectStatus(activity, 200);
    expect(activity.body.data.days).toEqual([{ date: today, count: 5, xp: EXPECTED_XP }]);

    const recent: Response = await api("GET", "/api/progress/activity/recent?limit=10", token);

    expectStatus(recent, 200);
    expect(recent.body.data.map((item: { kind: string }) => item.kind).sort()).toEqual(["ACHIEVEMENT_UNLOCKED", "ACHIEVEMENT_UNLOCKED", "LESSON_COMPLETED", "MODULE_COMPLETED"]);
    expect(recent.body.data.find((item: { kind: string }) => item.kind === "LESSON_COMPLETED").title).toBe(tree.lesson.title);

    const overview: Response = await api("GET", "/api/progress/overview", token);

    expectStatus(overview, 200);
    expect(overview.body.data.overview).toMatchObject({ xpTotal: EXPECTED_XP, level: 2, nextLevelXp: 1000, streakDays: 1 });

    // A repeated view of the same page does not add XP again.
    expectStatus(await api("POST", `/api/progress/pages/${tree.page.id}/view`, token), 200);
    expect((await api("GET", "/api/progress/gamification", token)).body.data.xpTotal).toBe(EXPECTED_XP);
  });

  it("should reject an inverted or oversized activity range with 400", async () => {
    expectStatus(await api("GET", "/api/progress/activity?from=2026-10-28&to=2026-10-01", token), 400);
    expectStatus(await api("GET", "/api/progress/activity?from=2024-01-01&to=2026-01-01", token), 400);
    expectStatus(await api("GET", "/api/progress/activity?from=28-10-2026", token), 400);
  });
});
