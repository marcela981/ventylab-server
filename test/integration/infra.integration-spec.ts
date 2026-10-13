/*
 * Funcionalidad: Prueba de humo de la infraestructura de integración
 * Descripción: Verifica contra el PostgreSQL de Testcontainers que las migraciones estén aplicadas, que existan los disparadores de superadmin y append-only de audit_logs, que resetDatabase vacíe todas las tablas (incluida audit_logs) y restaure las filas sembradas, que las fábricas creen cada entidad respetando las reglas de grupos y que el token emitido lo acepte el verificador de la aplicación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient, type User } from "@prisma/client";

import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";

import {
  assignEvaluationToGroup,
  type ContentTree,
  createAdmin,
  createClinicalCase,
  createContentTree,
  createEvaluation,
  createReservation,
  createStudent,
  createStudentGroup,
  createSuperadmin,
  createTeacher,
  createTeacherGroup,
  type EvaluationWithQuestions,
  type GroupWithMembers,
} from "../factories";
import { createTestTokenGenerator, mintAccessToken } from "../support/auth";
import { createTestPrismaClient, resetDatabase } from "../support/database";
import { TEST_SUPERADMIN_EMAIL } from "../support/test-constants";

const EXPECTED_TRIGGERS: readonly string[] = [
  "audit_logs_append_only",
  "audit_logs_append_only_truncate",
  "users_protect_superadmin_delete",
  "users_protect_superadmin_update",
];

interface CountRow {
  readonly count: bigint;
}

describe("integration test infrastructure", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createTestPrismaClient();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should run against a local container with every migration applied", async () => {
    const pending: CountRow[] = await prisma.$queryRawUnsafe<CountRow[]>("SELECT count(*) AS count FROM _prisma_migrations WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL");
    const applied: CountRow[] = await prisma.$queryRawUnsafe<CountRow[]>("SELECT count(*) AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL");

    expect(new URL(process.env.DATABASE_URL ?? "").hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
    expect(pending[0].count).toBe(0n);
    expect(applied[0].count).toBeGreaterThan(0n);
  });

  it("should keep the protection triggers installed by the migrations", async () => {
    const rows: { tgname: string }[] = await prisma.$queryRawUnsafe<{ tgname: string }[]>(
      "SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname = ANY($1::text[]) ORDER BY tgname",
      EXPECTED_TRIGGERS,
    );

    expect(rows.map((row: { tgname: string }): string => row.tgname)).toEqual(EXPECTED_TRIGGERS);
  });

  it("should still reject TRUNCATE on audit_logs outside resetDatabase", async () => {
    const truncate: Promise<number> = prisma.$executeRawUnsafe("TRUNCATE TABLE audit_logs");

    await expect(truncate).rejects.toThrow(/append-only/);
  });

  it("should empty every table including audit_logs and restore the seeded rows", async () => {
    const admin: User = await createAdmin(prisma);

    await prisma.$executeRawUnsafe(
      "INSERT INTO audit_logs (id, entity_collection, entity_type, entity_id, action, performed_by_user_id, performed_at) VALUES ('audit-test-1', 'users', 'User', $1, 'TEST', $1, now())",
      admin.id,
    );

    await resetDatabase(prisma);

    const users: number = await prisma.user.count();
    const auditLogs: CountRow[] = await prisma.$queryRawUnsafe<CountRow[]>("SELECT count(*) AS count FROM audit_logs");
    const superadminSetting: { value: string } | null = await prisma.appSetting.findUnique({ where: { key: "superadmin_email" }, select: { value: true } });
    const sections: number = await prisma.section.count();

    expect(users).toBe(0);
    expect(auditLogs[0].count).toBe(0n);
    expect(superadminSetting?.value).toBe(TEST_SUPERADMIN_EMAIL);
    expect(sections).toBeGreaterThan(0);
  });

  it("should protect the test superadmin with the database trigger", async () => {
    const superadmin: User = await createSuperadmin(prisma);

    const demotion: Promise<User> = prisma.user.update({ where: { id: superadmin.id }, data: { role: "STUDENT" } });

    await expect(demotion).rejects.toThrow();
  });

  it("should create users, groups, content, evaluations, clinical cases and reservations", async () => {
    const teacher: User = await createTeacher(prisma);
    const leader: User = await createStudent(prisma);
    const member: User = await createStudent(prisma);

    const studentGroup: GroupWithMembers = await createStudentGroup(prisma, { members: [leader, member], leader, createdBy: teacher });
    const teacherGroup: GroupWithMembers = await createTeacherGroup(prisma, { members: [teacher] });
    const tree: ContentTree = await createContentTree(prisma, { author: teacher });
    const exam: EvaluationWithQuestions = await createEvaluation(prisma, { type: "EXAM", createdBy: teacher, moduleId: tree.module.id });
    const workshop: EvaluationWithQuestions = await createEvaluation(prisma, { type: "WORKSHOP", questionTypes: ["SIMULATION"], createdBy: teacher });
    const assignment: { id: string } = await assignEvaluationToGroup(prisma, exam.evaluation, studentGroup.group, { assignedBy: teacher });
    const clinicalCase: { id: string } = await createClinicalCase(prisma, { createdBy: teacher });
    const userReservation: { holderType: string } = await createReservation(prisma, { user: leader });
    const groupReservation: { holderType: string } = await createReservation(prisma, { group: studentGroup.group }, { createdBy: leader });

    expect(studentGroup.group.simulatorLeaderId).toBe(leader.id);
    expect(studentGroup.members.map((row: { memberRole: string }): string => row.memberRole).sort()).toEqual(["LEADER", "MEMBER"]);
    expect(teacherGroup.members[0]).toMatchObject({ userId: teacher.id, role: "TEACHER" });
    expect(tree.page).toMatchObject({ moduleId: tree.module.id, lessonId: tree.lesson.id, createdBy: teacher.id });
    expect(tree.level.sectionId).toBe(tree.section.id);
    expect(exam.questions.map((question: { type: string }): string => question.type)).toEqual(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_TEXT"]);
    expect(exam.questions[0].options.filter((option: { isCorrect: boolean }): boolean => option.isCorrect)).toHaveLength(1);
    expect(workshop.questions[0].clinicalCaseId).toBe(workshop.clinicalCase?.id);
    expect(assignment.id).toEqual(expect.any(String));
    expect(clinicalCase.id).toEqual(expect.any(String));
    expect([userReservation.holderType, groupReservation.holderType]).toEqual(["USER", "GROUP"]);
  });

  it("should refuse a second active student group for the same student", async () => {
    const student: User = await createStudent(prisma);

    await createStudentGroup(prisma, { members: [student] });

    await expect(createStudentGroup(prisma, { members: [student] })).rejects.toThrow(/already belongs/);
  });

  it("should mint access tokens that the application token verifier accepts", async () => {
    const student: User = await createStudent(prisma);

    const token: string = await mintAccessToken(student);
    const claims: JwtPayload = await createTestTokenGenerator().verifyToken(token);

    expect(claims).toMatchObject({ sub: student.id, email: student.email, role: "STUDENT" });
    expect(claims.permissions.length).toBeGreaterThan(0);
  });
});
