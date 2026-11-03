/*
 * Funcionalidad: Prueba e2e del panel docente (Bloque 4)
 * Descripción: Con la aplicación completa y grupos creados por fábricas (un docente creador con un grupo activo y otro inactivo, un docente que supervisa un grupo ajeno desde su grupo TEACHER y un docente sin grupos) comprueba el directorio GET /api/admin/students: "Mis grupos" con los grupos creados o supervisados y página vacía sin grupos, canView por fila en "Todos", grupos activos, código de estudiante, búsqueda por código y orden por progreso; y el listado de grabaciones del ventilador de un estudiante (reservas propias y de su grupo con fragmentos grabados) para el docente que lo gestiona; y que un docente pueda reservar el ventilador para un grupo que creó (no solo para los que supervisa) y no para uno ajeno; y la pestaña Profesores (GET /api/admin/teachers solo ADMIN, con los grupos activos creados o supervisados y los estudiantes distintos); y la analítica de valoraciones de IA solo para ADMIN con la superficie derivada del tipo de objetivo (SIMULATOR_ASSIST, NOTES_ANALYSIS, EVALUATION_FEEDBACK) en estadísticas y CSV; las respuestas se validan contra openapi/openapi.json
 * Versión: 1.4
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "node:crypto";

import { type Reservation, type User } from "@prisma/client";
import { type Response } from "supertest";

import { createAdmin, createReservation, nextFreeSlot, createStudent, createStudentGroup, createTeacher, createTeacherGroup, type GroupWithMembers } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { callApi } from "../../support/http";

interface DirectoryRow {
  readonly id: string;
  readonly studentCode: string | null;
  readonly groupName: string | null;
  readonly groups: { id: string; name: string }[];
  readonly canView: boolean;
}

interface RecordingItem {
  readonly reservationId: string;
  readonly chunkCount: number;
  readonly sampleRateHz: number | null;
}

interface Fixture {
  readonly creator: User;
  readonly supervisor: User;
  readonly loner: User;
  readonly admin: User;
  readonly ownStudent: User;
  readonly formerStudent: User;
  readonly supervisedStudent: User;
  readonly activeGroup: GroupWithMembers;
}

describe("flow: teacher panel", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let fixture: Fixture;
  const tokens: Map<string, string> = new Map<string, string>();

  async function tokenOf(user: User): Promise<string> {
    const cached: string | undefined = tokens.get(user.id);

    if (cached) {
      return cached;
    }

    const token: string = await mintAccessToken(user, e2e.app);

    tokens.set(user.id, token);

    return token;
  }

  async function directory(user: User, query: string): Promise<DirectoryRow[]> {
    const response: Response = await api("GET", `/api/admin/students?${query}`, await tokenOf(user));

    expectStatus(response, 200);

    return (response.body as { data: DirectoryRow[] }).data;
  }

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
    await resetDatabase(e2e.prisma);

    const creator: User = await createTeacher(e2e.prisma);
    const supervisor: User = await createTeacher(e2e.prisma);
    const loner: User = await createTeacher(e2e.prisma);
    const admin: User = await createAdmin(e2e.prisma);
    const ownStudent: User = await createStudent(e2e.prisma, { name: "Ana Directorio" });
    const formerStudent: User = await createStudent(e2e.prisma, { name: "Beto Directorio" });
    const supervisedStudent: User = await createStudent(e2e.prisma, { name: "Caro Directorio" });

    await e2e.prisma.user.update({ where: { id: ownStudent.id }, data: { studentCode: "B4-0001" } });

    const activeGroup: GroupWithMembers = await createStudentGroup(e2e.prisma, { name: "Grupo activo", members: [ownStudent], createdBy: creator });
    await createStudentGroup(e2e.prisma, { name: "Grupo anterior", members: [formerStudent], createdBy: creator, isActive: false });

    const foreignGroup: GroupWithMembers = await createStudentGroup(e2e.prisma, { name: "Grupo ajeno", members: [supervisedStudent], createdBy: admin });
    const teacherGroup: GroupWithMembers = await createTeacherGroup(e2e.prisma, { members: [supervisor], createdBy: admin });

    await e2e.prisma.groupSupervision.create({ data: { teacherGroupId: teacherGroup.group.id, studentGroupId: foreignGroup.group.id } });

    fixture = { creator, supervisor, loner, admin, ownStudent, formerStudent, supervisedStudent, activeGroup };
  });

  afterAll(async () => {
    await e2e?.close();
  });

  describe("students directory", () => {
    it("lists only the groups a teacher created (inactive ones included) with myGroups", async () => {
      const rows: DirectoryRow[] = await directory(fixture.creator, "myGroups=true");

      expect(rows.map((row: DirectoryRow) => row.id).sort()).toEqual([fixture.ownStudent.id, fixture.formerStudent.id].sort());
      expect(rows.every((row: DirectoryRow) => row.canView)).toBe(true);
    });

    it("lists the supervised groups of a teacher with myGroups", async () => {
      const rows: DirectoryRow[] = await directory(fixture.supervisor, "myGroups=true");

      expect(rows.map((row: DirectoryRow) => row.id)).toEqual([fixture.supervisedStudent.id]);
    });

    it("answers an empty page to a teacher without groups instead of every student", async () => {
      const response: Response = await api("GET", "/api/admin/students?myGroups=true", await tokenOf(fixture.loner));

      expectStatus(response, 200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it("shows every student under 'all' with canView only for the teacher's own students", async () => {
      const rows: DirectoryRow[] = await directory(fixture.creator, "limit=100");
      const canView: Record<string, boolean> = Object.fromEntries(rows.map((row: DirectoryRow) => [row.id, row.canView]));

      expect(canView).toEqual({ [fixture.ownStudent.id]: true, [fixture.formerStudent.id]: true, [fixture.supervisedStudent.id]: false });
      expect((await directory(fixture.admin, "limit=100")).every((row: DirectoryRow) => row.canView)).toBe(true);
    });

    it("returns the student code and only the active groups, and searches by code", async () => {
      const [own]: DirectoryRow[] = await directory(fixture.creator, "search=b4-0001");
      const former: DirectoryRow | undefined = (await directory(fixture.creator, "myGroups=true")).find((row: DirectoryRow) => row.id === fixture.formerStudent.id);

      expect(own).toEqual(expect.objectContaining({ id: fixture.ownStudent.id, studentCode: "B4-0001", groupName: "Grupo activo", groups: [{ id: fixture.activeGroup.group.id, name: "Grupo activo" }] }));
      expect(former).toEqual(expect.objectContaining({ groupName: null, groups: [] }));
    });

    it("sorts by progress on the server and keeps the pagination total", async () => {
      const response: Response = await api("GET", "/api/admin/students?sortBy=progress&sortOrder=desc&limit=2", await tokenOf(fixture.admin));

      expectStatus(response, 200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual(expect.objectContaining({ total: 3, pages: 2 }));
    });
  });

  describe("AI ratings analytics", () => {
    it("derives the surface of ratings stored without one and keeps the analytics for administrators", async () => {
      const userId: string = fixture.ownStudent.id;

      await e2e.prisma.aiRating.createMany({
        data: [
          { userId, targetType: "SIM_ASSIST", targetId: randomUUID(), helpful: true },
          { userId, targetType: "NOTES_ANALYSIS", targetId: randomUUID(), helpful: false },
          { userId, targetType: "GRADE_FEEDBACK", targetId: randomUUID(), helpful: true, surface: "EVALUATION_FEEDBACK" },
          { userId, targetType: "MESSAGE", targetId: randomUUID(), helpful: true, surface: "POPUP", scope: "PAGE" },
        ],
      });

      const stats: Response = await api("GET", "/api/admin/ai-ratings/stats?surface=SIMULATOR_ASSIST", await tokenOf(fixture.admin));
      const all: Response = await api("GET", "/api/admin/ai-ratings/stats", await tokenOf(fixture.admin));
      const csv: Response = await callApi(e2e.baseUrl, "GET", "/api/admin/ai-ratings/export.csv", await tokenOf(fixture.admin));

      expectStatus(stats, 200);
      expect((stats.body.data.groups as { surface: string; ratings: number }[]).map((group: { surface: string; ratings: number }) => [group.surface, group.ratings])).toEqual([["SIMULATOR_ASSIST", 1]]);
      expect(new Set((all.body.data.groups as { surface: string }[]).map((group: { surface: string }) => group.surface))).toEqual(new Set(["SIMULATOR_ASSIST", "NOTES_ANALYSIS", "EVALUATION_FEEDBACK", "POPUP"]));
      expectStatus(csv, 200);
      expect(csv.text.split("\r\n")[0]).toBe("targetType,targetId,surface,scope,helpful,quality,understanding,expression,safety,trust,comment,createdAt,useCase,provider,model,promptVersion,callStatus");
      expect(csv.text).toContain("SIM_ASSIST");
      expect(csv.text).toContain(",SIMULATOR_ASSIST,");
      expect(csv.text).toContain(",POPUP,PAGE,");
      expectStatus(await api("GET", "/api/admin/ai-ratings/stats", await tokenOf(fixture.creator)), 403);
    });
  });

  describe("teachers tab", () => {
    it("lists the current groups and distinct students of each teacher to an administrator only", async () => {
      const response: Response = await api("GET", "/api/admin/teachers", await tokenOf(fixture.admin));
      const byId: Map<string, { groups: { name: string }[]; studentCount: number }> = new Map(
        (response.body.data as { id: string; groups: { name: string }[]; studentCount: number }[]).map((teacher: { id: string; groups: { name: string }[]; studentCount: number }) => [teacher.id, teacher]),
      );

      expectStatus(response, 200);
      expect(byId.get(fixture.creator.id)).toEqual(expect.objectContaining({ groups: [expect.objectContaining({ name: "Grupo activo" })], studentCount: 1 }));
      expect(byId.get(fixture.supervisor.id)).toEqual(expect.objectContaining({ groups: [expect.objectContaining({ name: "Grupo ajeno" })], studentCount: 1 }));
      expect(byId.get(fixture.loner.id)).toEqual(expect.objectContaining({ groups: [], studentCount: 0 }));
      expectStatus(await api("GET", "/api/admin/teachers", await tokenOf(fixture.creator)), 403);
    });
  });

  describe("lab reservations for a group", () => {
    it("lets a teacher reserve for a group they created and refuses a group they do not manage", async () => {
      const body = (groupId: string): object => {
        const startsAt: Date = nextFreeSlot();

        return { holderType: "GROUP", groupId, startsAt: startsAt.toISOString(), endsAt: new Date(startsAt.getTime() + 15 * 60_000).toISOString() };
      };

      expectStatus(await api("POST", "/api/reservations", await tokenOf(fixture.creator), body(fixture.activeGroup.group.id)), 201);
      expectStatus(await api("POST", "/api/reservations", await tokenOf(fixture.loner), body(fixture.activeGroup.group.id)), 403);
    });
  });

  describe("ventilator recordings of a student", () => {
    async function recordedReservation(holder: { user: User } | { group: GroupWithMembers["group"] }, minutesAgo: number): Promise<Reservation> {
      const startsAt: Date = new Date(Date.now() - minutesAgo * 60_000);
      const reservation: Reservation = await createReservation(e2e.prisma, holder, { createdBy: fixture.creator, startsAt, durationMinutes: 15, status: "COMPLETED" });

      await e2e.prisma.telemetryChunk.create({
        data: { id: randomUUID(), reservationId: reservation.id, startTs: startsAt, endTs: startsAt, sampleCount: 1, sampleRateHz: 20, encoding: "gzip-json", data: new Uint8Array([0]), createdAt: startsAt },
      });

      return reservation;
    }

    it("lists the student's own and group reservations with recorded telemetry to the managing teacher", async () => {
      const own: Reservation = await recordedReservation({ user: fixture.ownStudent }, 120);
      const group: Reservation = await recordedReservation({ group: fixture.activeGroup.group }, 60);

      await createReservation(e2e.prisma, { user: fixture.ownStudent }, { startsAt: new Date(Date.now() - 30 * 60_000), status: "COMPLETED" });

      const response: Response = await api("GET", `/api/ventilator/telemetry/recordings?userId=${fixture.ownStudent.id}`, await tokenOf(fixture.creator));

      expectStatus(response, 200);
      expect((response.body.data as RecordingItem[]).map((item: RecordingItem) => [item.reservationId, item.chunkCount, item.sampleRateHz])).toEqual([
        [group.id, 1, 20],
        [own.id, 1, 20],
      ]);
      expectStatus(await api("GET", `/api/ventilator/telemetry/recordings?userId=${fixture.ownStudent.id}`, await tokenOf(fixture.supervisor)), 403);
    });
  });
});
