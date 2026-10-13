/*
 * Funcionalidad: Pruebas e2e de acceso a recursos ajenos (IDOR)
 * Descripción: Con la aplicación completa y recursos creados por fábricas o por la API para un dueño, comprueba que otro usuario con el mismo rol que cambia el identificador en la ruta no pueda leer ni modificar notas, conversaciones del tutor de IA, intentos de evaluación, sesiones de simulación, notificaciones, grupos de los que no es miembro ni paneles de analítica de grupos que no gestiona; espera 403 o 404 según el comportamiento documentado de cada ruta, verifica con el dueño que los identificadores son válidos y que los recursos quedan intactos; las lecturas del dueño, los listados y las respuestas de preparación se validan además contra el esquema de openapi/openapi.json
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "node:crypto";

import { type ClinicalCase, type EvaluationAssignment, type Prisma, type User } from "@prisma/client";
import { type Response } from "supertest";

import {
  assignEvaluationToGroup,
  type ContentTree,
  createClinicalCase,
  createContentTree,
  createEvaluation,
  createStudent,
  createStudentGroup,
  createTeacher,
  type EvaluationWithQuestions,
} from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { callApi, type HttpMethod } from "../../support/http";
import { expectMatchesSpec } from "../../support/openapi-validator";

const NOTE_CONTENT: object = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Nota privada del dueño" }] }] };

// The simulation engine only starts sessions on cases with mechanics, initial settings, initial state, sex and height.
const SIMULATION_READY_PROFILE: Prisma.ClinicalCaseUpdateInput = {
  patientSex: "MALE",
  patientHeightCm: 175,
  mechanics: {
    complianceMlPerCmH2O: 60,
    resistanceCmH2OPerLps: 8,
    deadSpaceMl: 150,
    vco2MlPerMin: 200,
    bicarbonateMmolPerL: 24,
    hemoglobinGPerDl: 14,
    arteriovenousO2DifferenceMlPerDl: 5,
    basalShuntFraction: 0.05,
    recruitmentCurve: [],
    patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
    hemodynamics: { baselineMapMmHg: 85, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1 },
    gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 120 },
    deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
  },
  initialVentilatorSettings: { mode: "VCV", tidalVolumeMl: 500, respiratoryRateBpm: 12, peepCmH2O: 5, fio2: 0.4, inspiratoryTimeS: 1 },
  initialState: { paco2MmHg: 40, pao2MmHg: 95 },
};

interface Party {
  readonly user: User;
  readonly token: string;
}

interface Fixture {
  readonly ownerStudent: Party;
  readonly intruderStudent: Party;
  readonly ownerTeacher: Party;
  readonly intruderTeacher: Party;
  readonly groupId: string;
  readonly noteId: string;
  readonly conversationId: string;
  readonly sessionId: string;
  readonly notificationId: string;
  readonly attemptId: string;
  readonly questionId: string;
  readonly evaluationId: string;
}

type IdorCase = readonly [label: string, actor: "intruderStudent" | "intruderTeacher", method: HttpMethod, path: (fixture: Fixture) => string, body: object | undefined, expected: number];

const IDOR_CASES: readonly IdorCase[] = [
  // Notes: another user's note answers 404 (NoteNotFoundError covers "belongs to another user").
  ["note read", "intruderStudent", "GET", (f: Fixture): string => `/api/notes/${f.noteId}`, undefined, 404],
  ["note update", "intruderStudent", "PATCH", (f: Fixture): string => `/api/notes/${f.noteId}`, { content: NOTE_CONTENT }, 404],
  ["note delete", "intruderStudent", "DELETE", (f: Fixture): string => `/api/notes/${f.noteId}`, undefined, 404],
  // AI tutor conversations: AiConversationNotFoundError (404).
  ["tutor conversation read", "intruderStudent", "GET", (f: Fixture): string => `/api/tutor/conversations/${f.conversationId}`, undefined, 404],
  ["tutor conversation rename", "intruderStudent", "PATCH", (f: Fixture): string => `/api/tutor/conversations/${f.conversationId}`, { title: "Robada" }, 404],
  ["tutor conversation delete", "intruderStudent", "DELETE", (f: Fixture): string => `/api/tutor/conversations/${f.conversationId}`, undefined, 404],
  // Evaluation attempts: EvaluationAttemptNotFoundError covers "belongs to another user" (404).
  ["evaluation attempt read", "intruderStudent", "GET", (f: Fixture): string => `/api/evaluation-attempts/${f.attemptId}`, undefined, 404],
  ["evaluation answer save", "intruderStudent", "PUT", (f: Fixture): string => `/api/evaluation-attempts/${f.attemptId}/answers/${f.questionId}`, { textAnswer: "intruso" }, 404],
  ["evaluation attempt submit", "intruderStudent", "POST", (f: Fixture): string => `/api/evaluation-attempts/${f.attemptId}/submit`, {}, 404],
  ["evaluation attempt feedback", "intruderStudent", "GET", (f: Fixture): string => `/api/evaluation-attempts/${f.attemptId}/feedback`, undefined, 404],
  // Simulation sessions: SimulationSessionAccessDeniedError (403).
  ["simulation session state", "intruderStudent", "GET", (f: Fixture): string => `/api/simulation/sessions/${f.sessionId}/state`, undefined, 403],
  ["simulation session summary", "intruderStudent", "GET", (f: Fixture): string => `/api/simulation/sessions/${f.sessionId}/summary`, undefined, 403],
  ["simulation session replay", "intruderStudent", "GET", (f: Fixture): string => `/api/simulation/sessions/${f.sessionId}/replay`, undefined, 403],
  ["simulation session end", "intruderStudent", "POST", (f: Fixture): string => `/api/simulation/sessions/${f.sessionId}/end`, {}, 403],
  ["simulation history of another user", "intruderStudent", "GET", (f: Fixture): string => `/api/simulation/sessions/history?userId=${f.ownerStudent.user.id}`, undefined, 403],
  // Notifications: another user's ID responds 404 (documented in CLAUDE.md).
  ["notification mark read", "intruderStudent", "PATCH", (f: Fixture): string => `/api/notifications/${f.notificationId}/read`, undefined, 404],
  ["notification delete", "intruderStudent", "DELETE", (f: Fixture): string => `/api/notifications/${f.notificationId}`, undefined, 404],
  // Groups: GroupNotFoundError covers "the caller cannot read it" (404); management without scope is GroupManagementForbiddenError (403).
  ["group read by a non-member student", "intruderStudent", "GET", (f: Fixture): string => `/api/groups/${f.groupId}`, undefined, 404],
  ["group members read by a non-member student", "intruderStudent", "GET", (f: Fixture): string => `/api/groups/${f.groupId}/members`, undefined, 404],
  ["group read by a teacher who does not manage it", "intruderTeacher", "GET", (f: Fixture): string => `/api/groups/${f.groupId}`, undefined, 404],
  ["group update by a teacher who does not manage it", "intruderTeacher", "PATCH", (f: Fixture): string => `/api/groups/${f.groupId}`, { name: "Grupo ajeno" }, 403],
  // Analytics: a teacher outside the group scope gets AnalyticsScopeForbiddenError (403).
  ["analytics group dashboard", "intruderTeacher", "GET", (f: Fixture): string => `/api/analytics/groups/${f.groupId}/dashboard`, undefined, 403],
  ["analytics group export", "intruderTeacher", "GET", (f: Fixture): string => `/api/analytics/groups/${f.groupId}/export.csv`, undefined, 403],
  ["analytics student timeline", "intruderTeacher", "GET", (f: Fixture): string => `/api/analytics/students/${f.ownerStudent.user.id}/timeline`, undefined, 403],
  ["analytics evaluation stats", "intruderTeacher", "GET", (f: Fixture): string => `/api/analytics/evaluations/${f.evaluationId}/stats`, undefined, 403],
];

type OwnerCase = readonly [label: string, actor: "ownerStudent" | "ownerTeacher", path: (fixture: Fixture) => string];

const OWNER_CONTROLS: readonly OwnerCase[] = [
  ["note", "ownerStudent", (f: Fixture): string => `/api/notes/${f.noteId}`],
  ["tutor conversation", "ownerStudent", (f: Fixture): string => `/api/tutor/conversations/${f.conversationId}`],
  ["evaluation attempt", "ownerStudent", (f: Fixture): string => `/api/evaluation-attempts/${f.attemptId}`],
  ["simulation session state", "ownerStudent", (f: Fixture): string => `/api/simulation/sessions/${f.sessionId}/state`],
  ["group", "ownerStudent", (f: Fixture): string => `/api/groups/${f.groupId}`],
  ["analytics group dashboard", "ownerTeacher", (f: Fixture): string => `/api/analytics/groups/${f.groupId}/dashboard`],
  ["analytics student timeline", "ownerTeacher", (f: Fixture): string => `/api/analytics/students/${f.ownerStudent.user.id}/timeline`],
  ["analytics evaluation stats", "ownerTeacher", (f: Fixture): string => `/api/analytics/evaluations/${f.evaluationId}/stats`],
];

describe("IDOR protection (e2e)", () => {
  let e2e: E2eApp;
  let fixture: Fixture;

  async function party(user: User): Promise<Party> {
    return { user, token: await mintAccessToken(user, e2e.app) };
  }

  async function buildFixture(): Promise<Fixture> {
    const ownerTeacher: Party = await party(await createTeacher(e2e.prisma));
    const intruderTeacher: Party = await party(await createTeacher(e2e.prisma));
    const ownerStudent: Party = await party(await createStudent(e2e.prisma));
    const intruderStudent: Party = await party(await createStudent(e2e.prisma));
    const { group } = await createStudentGroup(e2e.prisma, { members: [ownerStudent.user], createdBy: ownerTeacher.user });

    await createStudentGroup(e2e.prisma, { members: [intruderStudent.user], createdBy: intruderTeacher.user });

    const tree: ContentTree = await createContentTree(e2e.prisma, { author: ownerTeacher.user });
    const clinicalCase: ClinicalCase = await e2e.prisma.clinicalCase.update({
      where: { id: (await createClinicalCase(e2e.prisma, { createdBy: ownerTeacher.user })).id },
      data: SIMULATION_READY_PROFILE,
    });
    const evaluation: EvaluationWithQuestions = await createEvaluation(e2e.prisma, { createdBy: ownerTeacher.user, maxAttempts: 2 });
    const assignment: EvaluationAssignment = await assignEvaluationToGroup(e2e.prisma, evaluation.evaluation, group, { assignedBy: ownerTeacher.user });

    const note: { id: string } = await e2e.prisma.note.create({ data: { userId: ownerStudent.user.id, lessonId: tree.lesson.id, content: NOTE_CONTENT } });
    const conversation: { id: string } = await e2e.prisma.aiConversation.create({ data: { userId: ownerStudent.user.id, scope: "FREE", title: "Conversación privada" } });
    const notification: { id: string } = await e2e.prisma.notification.create({
      data: { id: randomUUID(), userId: ownerStudent.user.id, type: "GRADE_PUBLISHED", title: "Privada", body: "Solo para el dueño", createdAt: new Date() },
    });

    const session: Response = await callApi(e2e.baseUrl, "POST", "/api/simulation/sessions", ownerStudent.token, { mode: "FREE", caseId: clinicalCase.id });
    const attempt: Response = await callApi(e2e.baseUrl, "POST", `/api/my-evaluations/${assignment.id}/attempts`, ownerStudent.token);

    if (session.status !== 201 || attempt.status !== 201) {
      throw new Error(`IDOR fixture setup failed: session ${session.status} ${JSON.stringify(session.body)}; attempt ${attempt.status} ${JSON.stringify(attempt.body)}`);
    }

    expectMatchesSpec(session, "POST", "/api/simulation/sessions");
    expectMatchesSpec(attempt, "POST", "/api/my-evaluations/:assignmentId/attempts");

    return {
      ownerStudent,
      intruderStudent,
      ownerTeacher,
      intruderTeacher,
      groupId: group.id,
      noteId: note.id,
      conversationId: conversation.id,
      sessionId: (session.body as { data: { id: string } }).data.id,
      notificationId: notification.id,
      attemptId: (attempt.body as { data: { id: string } }).data.id,
      questionId: evaluation.questions[0].id,
      evaluationId: evaluation.evaluation.id,
    };
  }

  beforeAll(async () => {
    e2e = await createE2eApp();
    await resetDatabase(e2e.prisma);
    fixture = await buildFixture();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it.each(OWNER_CONTROLS)("should let the owner read the %s (control)", async (_label: string, actor: OwnerCase[1], path: OwnerCase[2]) => {
    const response: Response = await callApi(e2e.baseUrl, "GET", path(fixture), fixture[actor].token);

    expect(response.status).toBe(200);
    expectMatchesSpec(response, "GET", path(fixture));
  });

  it.each(IDOR_CASES)("should refuse the %s by another user", async (_label: string, actor: IdorCase[1], method: HttpMethod, path: IdorCase[3], body: object | undefined, expected: number) => {
    const response: Response = await callApi(e2e.baseUrl, method, path(fixture), fixture[actor].token, body);

    expect(response.status).toBe(expected);
  });

  it("should not list the owner's notes or conversations for another user", async () => {
    const notes: Response = await callApi(e2e.baseUrl, "GET", "/api/notes?page=1&limit=20", fixture.intruderStudent.token);
    const conversations: Response = await callApi(e2e.baseUrl, "GET", "/api/tutor/conversations?page=1&limit=20", fixture.intruderStudent.token);

    expect(notes.status).toBe(200);
    expect(conversations.status).toBe(200);
    expectMatchesSpec(notes, "GET", "/api/notes");
    expectMatchesSpec(conversations, "GET", "/api/tutor/conversations");
    expect(JSON.stringify(notes.body)).not.toContain(fixture.noteId);
    expect(JSON.stringify(conversations.body)).not.toContain(fixture.conversationId);
  });

  // Regression guard for BUG-9: the ListQueryDTO defaults (page 1, limit 10) only apply when the global validation pipe transforms.
  it.each(["/api/notes", "/api/tutor/conversations"])("should list %s without pagination parameters", async (path: string) => {
    const response: Response = await callApi(e2e.baseUrl, "GET", path, fixture.intruderStudent.token);

    expect(response.status).toBe(200);
    expectMatchesSpec(response, "GET", path);
  });

  it("should leave every owner resource intact after the intrusion attempts", async () => {
    const attempt: { status: string } | null = await e2e.prisma.studentEvaluationAttempt.findUnique({ where: { id: fixture.attemptId }, select: { status: true } });

    expect(await e2e.prisma.note.count({ where: { id: fixture.noteId } })).toBe(1);
    expect(await e2e.prisma.aiConversation.findUnique({ where: { id: fixture.conversationId }, select: { title: true } })).toEqual({ title: "Conversación privada" });
    expect(await e2e.prisma.notification.findUnique({ where: { id: fixture.notificationId }, select: { readAt: true } })).toEqual({ readAt: null });
    expect(await e2e.prisma.simulationSession.findUnique({ where: { id: fixture.sessionId }, select: { status: true } })).toEqual({ status: "ACTIVE" });
    expect(attempt).toEqual({ status: "IN_PROGRESS" });
    expect(await e2e.prisma.group.findUnique({ where: { id: fixture.groupId }, select: { name: true } })).not.toEqual({ name: "Grupo ajeno" });
  });
});
