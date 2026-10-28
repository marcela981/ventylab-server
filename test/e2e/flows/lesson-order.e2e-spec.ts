/*
 * Funcionalidad: Flujo e2e del orden obligatorio de lecciones
 * Descripción: Con la aplicación real contra PostgreSQL verifica GET /api/lessons/:id/access y el mismo bloqueo en GET /api/pages/:id y POST /api/progress/pages/:pageId/view: la primera lección está permitida, una lección posterior responde allowed=false con las lecciones faltantes (403 progress.lesson_locked con data.missing al leer o registrar sus páginas), una lección publicada sin páginas no bloquea, un módulo bloqueado responde module_locked, el docente (staff) siempre pasa y al completar la lección anterior se desbloquea la siguiente; cada respuesta se valida contra el contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Lesson, type Level, type Module, type Page, type Section, type User } from "@prisma/client";
import { type Response } from "supertest";

import { createLesson, createLevel, createModule, createPage, createSection, createStudent, createTeacher } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

interface Course {
  readonly first: Lesson;
  readonly firstPages: Page[];
  readonly empty: Lesson;
  readonly third: Lesson;
  readonly thirdPage: Page;
  readonly lockedLesson: Lesson;
}

describe("flow: lessons must be studied in order", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let course: Course;
  let studentToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);

    const teacher: User = await createTeacher(e2e.prisma);
    const student: User = await createStudent(e2e.prisma);
    const section: Section = await createSection(e2e.prisma);
    const firstLevel: Level = await createLevel(e2e.prisma, section, { order: 1 });
    const courseModule: Module = await createModule(e2e.prisma, firstLevel);
    const first: Lesson = await createLesson(e2e.prisma, courseModule, { order: 1, title: "Primera lección" });
    const empty: Lesson = await createLesson(e2e.prisma, courseModule, { order: 2, title: "Lección vacía" });
    const third: Lesson = await createLesson(e2e.prisma, courseModule, { order: 3, title: "Tercera lección" });
    const firstPages: Page[] = [await createPage(e2e.prisma, first, teacher, { order: 1 }), await createPage(e2e.prisma, first, teacher, { order: 2 })];
    const thirdPage: Page = await createPage(e2e.prisma, third, teacher, { order: 3 });
    const secondLevel: Level = await createLevel(e2e.prisma, section, { order: 2 });
    const lockedLesson: Lesson = await createLesson(e2e.prisma, await createModule(e2e.prisma, secondLevel));

    await createPage(e2e.prisma, lockedLesson, teacher);
    await e2e.prisma.levelPrerequisite.create({ data: { levelId: secondLevel.id, prerequisiteLevelId: firstLevel.id } });

    course = { first, firstPages, empty, third, thirdPage, lockedLesson };
    studentToken = await mintAccessToken(student, e2e.app);
    teacherToken = await mintAccessToken(teacher, e2e.app);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should allow the first lesson and block a later one listing only the incomplete lessons with pages", async () => {
    const firstAccess: Response = await api("GET", `/api/lessons/${course.first.id}/access`, studentToken);
    const thirdAccess: Response = await api("GET", `/api/lessons/${course.third.id}/access`, studentToken);

    expectStatus(firstAccess, 200);
    expectStatus(thirdAccess, 200);
    expect(firstAccess.body.data).toEqual({ allowed: true, reason: null, missing: [] });
    expect(thirdAccess.body.data).toEqual({ allowed: false, reason: "previous_lesson_incomplete", missing: [{ lessonId: course.first.id, title: "Primera lección" }] });
  });

  it("should answer 403 progress.lesson_locked with the missing lessons when a student reads or views a page of a locked lesson", async () => {
    const read: Response = await api("GET", `/api/pages/${course.thirdPage.id}`, studentToken);
    const view: Response = await api("POST", `/api/progress/pages/${course.thirdPage.id}/view`, studentToken);

    for (const response of [read, view]) {
      expectStatus(response, 403);
      expect(response.body.code).toBe("progress.lesson_locked");
      expect(response.body.data).toMatchObject({ reason: "previous_lesson_incomplete", missing: [{ lessonId: course.first.id, title: "Primera lección" }] });
    }

    expect(await e2e.prisma.pageProgress.count({ where: { pageId: course.thirdPage.id } })).toBe(0);
  });

  it("should not let a published lesson without pages block the next one", async () => {
    for (const page of course.firstPages) {
      expectStatus(await api("POST", `/api/progress/pages/${page.id}/view`, studentToken), 200);
    }

    const emptyAccess: Response = await api("GET", `/api/lessons/${course.empty.id}/access`, studentToken);
    const thirdAccess: Response = await api("GET", `/api/lessons/${course.third.id}/access`, studentToken);

    expect(emptyAccess.body.data.allowed).toBe(true);
    expect(thirdAccess.body.data).toEqual({ allowed: true, reason: null, missing: [] });
    expectStatus(await api("GET", `/api/pages/${course.thirdPage.id}`, studentToken), 200);
    expectStatus(await api("POST", `/api/progress/pages/${course.thirdPage.id}/view`, studentToken), 200);
  });

  it("should report module_locked for a lesson whose module is still locked", async () => {
    const access: Response = await api("GET", `/api/lessons/${course.lockedLesson.id}/access`, studentToken);

    expectStatus(access, 200);
    expect(access.body.data).toEqual({ allowed: false, reason: "module_locked", missing: [] });
  });

  it("should always allow staff", async () => {
    const access: Response = await api("GET", `/api/lessons/${course.third.id}/access`, teacherToken);

    expect(access.body.data).toEqual({ allowed: true, reason: null, missing: [] });
    expectStatus(await api("GET", `/api/pages/${course.thirdPage.id}`, teacherToken), 200);
    expectStatus(await api("POST", `/api/progress/pages/${course.thirdPage.id}/view`, teacherToken), 200);
  });

  it("should answer 404 for an unknown lesson", async () => {
    expectStatus(await api("GET", "/api/lessons/missing-lesson/access", studentToken), 404);
  });
});
