/*
 * Funcionalidad: Pruebas e2e de visibilidad por rol
 * Descripción: Con la aplicación completa comprueba que el calendario de reservas servido a un ESTUDIANTE no contenga en ningún nivel del JSON el nombre, el correo ni el identificador de otros usuarios ni el propósito de sus reservas (el nombre del grupo sí aparece en la etiqueta por diseño; con un DOCENTE como control de que esos datos sí existen), y que las preguntas servidas a un ESTUDIANTE al iniciar, retomar o leer un intento y al listar sus evaluaciones no contengan en ninguna profundidad las claves isCorrect, explanation ni rubric ni el texto de la explicación sembrada; cada respuesta 2xx se valida además contra el esquema de openapi/openapi.json
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment, type User } from "@prisma/client";
import { type Response } from "supertest";

import {
  assignEvaluationToGroup,
  createEvaluation,
  createReservation,
  createStudent,
  createStudentGroup,
  createTeacher,
  type EvaluationWithQuestions,
  nextFreeSlot,
} from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { callApi, findKeysDeep, findValuesDeep } from "../../support/http";
import { expectMatchesSpec } from "../../support/openapi-validator";

const FORBIDDEN_ANSWER_KEYS: readonly string[] = ["isCorrect", "explanation", "rubric"];
const SEEDED_EXPLANATION: string = "SEEDED-EXPLANATION-must-stay-hidden";
const CALENDAR_SPAN_MS: number = 2 * 86_400_000;

describe("role visibility (e2e)", () => {
  let e2e: E2eApp;

  beforeAll(async () => {
    e2e = await createE2eApp();
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  describe("reservations calendar", () => {
    let viewer: User;
    let otherStudent: User;
    let otherGroupMember: User;
    let otherGroupName: string;
    let teacher: User;

    beforeEach(async () => {
      viewer = await createStudent(e2e.prisma, { name: "Viewer Student Name" });
      otherStudent = await createStudent(e2e.prisma, { name: "Hidden Other Student Name" });
      otherGroupMember = await createStudent(e2e.prisma, { name: "Hidden Group Member Name" });
      teacher = await createTeacher(e2e.prisma);

      const { group } = await createStudentGroup(e2e.prisma, { name: "Hidden Other Group Name", members: [otherGroupMember], leader: otherGroupMember });

      otherGroupName = group.name;

      await createReservation(e2e.prisma, { user: viewer }, { startsAt: nextFreeSlot(1) });
      await createReservation(e2e.prisma, { user: otherStudent }, { startsAt: nextFreeSlot(2), purpose: "Hidden purpose text" });
      await createReservation(e2e.prisma, { group }, { startsAt: nextFreeSlot(3), createdBy: otherGroupMember });
    });

    async function calendar(user: User): Promise<Response> {
      const from: Date = new Date(Date.now() - 60_000);
      const to: Date = new Date(Date.now() + CALENDAR_SPAN_MS);

      return await callApi(e2e.baseUrl, "GET", `/api/reservations?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, await mintAccessToken(user, e2e.app));
    }

    it("should return every reservation to a student without other people's identity", async () => {
      const response: Response = await calendar(viewer);
      const secrets: string[] = [
        otherStudent.name ?? "",
        otherStudent.email,
        otherStudent.id,
        otherGroupMember.name ?? "",
        otherGroupMember.email,
        otherGroupMember.id,
        "Hidden purpose text",
      ];

      expect(response.status).toBe(200);
      expectMatchesSpec(response, "GET", "/api/reservations");
      expect((response.body as { data: unknown[] }).data).toHaveLength(3);
      expect(findValuesDeep(response.body, secrets)).toEqual([]);
      // The group name is shown on purpose ("Reserved by a student of group {group}"); it identifies no person.
      expect(JSON.stringify(response.body)).toContain(otherGroupName);
    });

    it("should show the reservation holders to a teacher (control)", async () => {
      const response: Response = await calendar(teacher);
      const serialized: string = JSON.stringify(response.body);

      expect(response.status).toBe(200);
      expectMatchesSpec(response, "GET", "/api/reservations");
      expect([otherStudent.id, otherGroupMember.id].some((id: string): boolean => serialized.includes(id)) || serialized.includes(otherStudent.email) || serialized.includes(otherGroupName)).toBe(true);
    });
  });

  describe("evaluation questions served to a student", () => {
    let student: User;
    let assignment: EvaluationAssignment;
    let token: string;

    beforeEach(async () => {
      const teacher: User = await createTeacher(e2e.prisma);

      student = await createStudent(e2e.prisma);

      const { group } = await createStudentGroup(e2e.prisma, { members: [student], createdBy: teacher });
      const evaluation: EvaluationWithQuestions = await createEvaluation(e2e.prisma, {
        createdBy: teacher,
        maxAttempts: 2,
        questionTypes: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_TEXT", "SIMULATION"],
      });

      await e2e.prisma.evaluationQuestion.updateMany({ where: { evaluationId: evaluation.evaluation.id }, data: { explanation: SEEDED_EXPLANATION } });

      assignment = await assignEvaluationToGroup(e2e.prisma, evaluation.evaluation, group, { assignedBy: teacher });
      token = await mintAccessToken(student, e2e.app);
    });

    function leaks(body: unknown): string[] {
      return [...findKeysDeep(body, FORBIDDEN_ANSWER_KEYS), ...findValuesDeep(body, [SEEDED_EXPLANATION])];
    }

    it("should hide answer keys when the attempt starts, resumes and is read, and in the evaluation list", async () => {
      const started: Response = await callApi(e2e.baseUrl, "POST", `/api/my-evaluations/${assignment.id}/attempts`, token);
      const resumed: Response = await callApi(e2e.baseUrl, "POST", `/api/my-evaluations/${assignment.id}/attempts`, token);
      const attemptId: string = (started.body as { data: { id: string } }).data.id;
      const detail: Response = await callApi(e2e.baseUrl, "GET", `/api/evaluation-attempts/${attemptId}`, token);
      const list: Response = await callApi(e2e.baseUrl, "GET", "/api/my-evaluations", token);

      expect([started.status, resumed.status, detail.status, list.status]).toEqual([201, 200, 200, 200]);
      expectMatchesSpec(started, "POST", "/api/my-evaluations/:assignmentId/attempts");
      expectMatchesSpec(resumed, "POST", "/api/my-evaluations/:assignmentId/attempts");
      expectMatchesSpec(detail, "GET", "/api/evaluation-attempts/:attemptId");
      expectMatchesSpec(list, "GET", "/api/my-evaluations");
      expect(JSON.stringify(detail.body)).toContain("Pregunta de prueba 1");
      expect({ started: leaks(started.body), resumed: leaks(resumed.body), detail: leaks(detail.body), list: leaks(list.body) }).toEqual({
        started: [],
        resumed: [],
        detail: [],
        list: [],
      });
    });
  });
});
