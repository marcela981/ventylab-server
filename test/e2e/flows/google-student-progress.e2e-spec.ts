/*
 * Funcionalidad: Flujo e2e de estudiante nuevo con Google hasta desbloquear un nivel
 * Descripción: Un usuario inicia sesión con un token de Google verificado por un doble de prueba (nunca se contacta a Google), queda creado como STUDENT, recorre las páginas de un nivel y verifica el progreso de módulo, nivel y sección y el desbloqueo del nivel siguiente por prerrequisito, validando cada respuesta contra el contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TestingModuleBuilder } from "@nestjs/testing";
import { type Lesson, type Level, type Module, type Page, type Section, type User } from "@prisma/client";
import { type Response } from "supertest";

import { FakeGoogleIdTokenVerifier, withFakeGoogleVerifier } from "@/features/auth/application/testing/google-auth-test-doubles-spec";

import { createLesson, createLevel, createModule, createPage, createSection, createTeacher } from "../../factories";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

const GOOGLE_ID_TOKEN: string = "fake-google-id-token-for-a-new-student";
const GOOGLE_EMAIL: string = "new.student@ventylab.test";

interface Curriculum {
  readonly section: Section;
  readonly firstLevel: Level;
  readonly firstModule: Module;
  readonly firstPages: Page[];
  readonly secondLevel: Level;
}

describe("flow: a Google student walks a level and unlocks the next one", () => {
  const verifier: FakeGoogleIdTokenVerifier = new FakeGoogleIdTokenVerifier();
  let e2e: E2eApp;
  let api: ContractCaller;
  let curriculum: Curriculum;

  beforeAll(async () => {
    e2e = await createE2eApp({ configure: (builder: TestingModuleBuilder): TestingModuleBuilder => withFakeGoogleVerifier(builder, verifier) });
    api = contractCaller(e2e.baseUrl);
    verifier.register(GOOGLE_ID_TOKEN, { sub: "google-sub-123", email: GOOGLE_EMAIL, emailVerified: true, name: "Nueva Estudiante" });
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);

    const author: User = await createTeacher(e2e.prisma);
    const section: Section = await createSection(e2e.prisma);
    const firstLevel: Level = await createLevel(e2e.prisma, section, { order: 1 });
    const firstModule: Module = await createModule(e2e.prisma, firstLevel);
    const firstLesson: Lesson = await createLesson(e2e.prisma, firstModule);
    const firstPages: Page[] = [await createPage(e2e.prisma, firstLesson, author, { order: 1 }), await createPage(e2e.prisma, firstLesson, author, { order: 2 })];
    const secondLevel: Level = await createLevel(e2e.prisma, section, { order: 2 });
    const secondLesson: Lesson = await createLesson(e2e.prisma, await createModule(e2e.prisma, secondLevel));

    await createPage(e2e.prisma, secondLesson, author);
    await e2e.prisma.levelPrerequisite.create({ data: { levelId: secondLevel.id, prerequisiteLevelId: firstLevel.id } });
    curriculum = { section, firstLevel, firstModule, firstPages, secondLevel };
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should create a STUDENT, track module, level and section progress and unlock the next level", async () => {
    const login: Response = await api("POST", "/api/auth/google", undefined, { idToken: GOOGLE_ID_TOKEN });

    expectStatus(login, 200);

    const token: string = login.body.data.accessToken as string;

    expect(login.body.data.user).toMatchObject({ email: GOOGLE_EMAIL, role: "STUDENT" });
    expect(await e2e.prisma.user.findUniqueOrThrow({ where: { email: GOOGLE_EMAIL } })).toMatchObject({ role: "STUDENT", password: null });
    expect(verifier.verifiedTokens).toEqual([GOOGLE_ID_TOKEN]);

    const lockedBefore: Response = await api("GET", `/api/levels/${curriculum.secondLevel.id}/unlock-status`, token);

    expectStatus(lockedBefore, 200);
    expect(lockedBefore.body.data.isLocked).toBe(true);

    const firstView: Response = await api("POST", `/api/progress/pages/${curriculum.firstPages[0].id}/view`, token);
    const secondView: Response = await api("POST", `/api/progress/pages/${curriculum.firstPages[1].id}/view`, token);

    expectStatus(firstView, 200);
    expectStatus(secondView, 200);
    expect(firstView.body.data).toMatchObject({ lessonCompleted: false, viewedPages: 1, totalPages: 2 });
    expect(secondView.body.data).toMatchObject({ lessonCompleted: true, lessonJustCompleted: true, viewedPages: 2, totalPages: 2 });

    const moduleProgress: Response = await api("GET", `/api/progress/modules/${curriculum.firstModule.id}`, token);
    const levelProgress: Response = await api("GET", `/api/progress/levels/${curriculum.firstLevel.id}`, token);
    const sectionProgress: Response = await api("GET", `/api/progress/sections/${curriculum.section.id}`, token);

    expect(moduleProgress.body.data).toMatchObject({ completedLessons: 1, totalLessons: 1, percentage: 100, completed: true });
    expect(levelProgress.body.data).toMatchObject({ completedModules: 1, totalModules: 1, completed: true });
    expect(sectionProgress.body.data).toMatchObject({ completedLevels: 1, totalLevels: 2 });

    const unlockedAfter: Response = await api("GET", `/api/levels/${curriculum.secondLevel.id}/unlock-status`, token);

    expect(unlockedAfter.body.data.isLocked).toBe(false);
    expect(unlockedAfter.body.data.prerequisites).toEqual([expect.objectContaining({ levelId: curriculum.firstLevel.id, isCompleted: true, completionPercentage: 100 })]);
  });
});
