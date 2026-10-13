/*
 * Funcionalidad: Datos adicionales solo para las pruebas de carga
 * Descripción: Sobre una base local ya sembrada con demo:seed crea, de forma idempotente, un grupo de 30 estudiantes de carga supervisado por el equipo docente de la demostración, clona a cada estudiante el progreso de un estudiante de la demostración, clona al grupo las asignaciones de evaluación del grupo A y crea una reserva de grupo activa del ventilador para que los 30 estudiantes entren a la sala ventilator; se niega a correr fuera de localhost o sin la marca de base de demostración e imprime en la última línea un JSON con los identificadores que usan los scripts de carga
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "node:crypto";

import { type Prisma, PrismaClient } from "@prisma/client";

import { DEMO_STUDENT_GROUPS, DEMO_STUDENTS, DEMO_TEACHER_GROUP, DEMO_TEACHERS, type DemoPerson } from "../../prisma/demo/demo-cast";
import { DEMO_MARKER_KEY, DEMO_MARKER_VALUE, DEMO_PASSWORD, demoPasswordHash } from "../../prisma/demo/demo-support";

const LOAD_STUDENT_COUNT: number = 30;
const LOAD_EMAIL_DOMAIN: string = "ventylab.load";
const LOCAL_HOSTS: readonly string[] = ["127.0.0.1", "localhost", "::1", "[::1]"];
const RESERVATION_MINUTES: number = 90;

function loadId(name: string): string {
  const hex: string = createHash("sha256").update(`ventylab-load:${name}`).digest("hex");
  const variant: string = ((Number.parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function loadStudentEmail(index: number): string {
  return `load-student-${String(index + 1).padStart(2, "0")}@${LOAD_EMAIL_DOMAIN}`;
}

function assertLocalDatabase(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    throw new Error("Set LOAD_DATABASE_URL to the local stack Postgres (for example postgresql://ventylab:local-only-postgres@127.0.0.1:55432/ventylab)");
  }

  const host: string = new URL(databaseUrl).hostname.toLowerCase();

  if (!LOCAL_HOSTS.includes(host)) {
    throw new Error(`Refusing to seed load data on a non-local database host (${host})`);
  }

  return databaseUrl;
}

async function cloneProgress(db: Prisma.TransactionClient, sourceUserId: string, targetUserId: string): Promise<number> {
  const pages: Prisma.PageProgressCreateManyInput[] = (await db.pageProgress.findMany({ where: { userId: sourceUserId } }))
    .map((row: Prisma.PageProgressCreateManyInput) => ({ ...row, id: loadId(`page-progress:${targetUserId}:${row.pageId}`), userId: targetUserId }));
  const lessons: Prisma.LessonCompletionCreateManyInput[] = (await db.lessonCompletion.findMany({ where: { userId: sourceUserId } }))
    .map((row: Prisma.LessonCompletionCreateManyInput) => ({ ...row, id: loadId(`lesson-completion:${targetUserId}:${row.lessonId}`), userId: targetUserId }));
  const modules: Prisma.UserProgressCreateManyInput[] = (await db.userProgress.findMany({ where: { userId: sourceUserId } }))
    .map((row: Prisma.UserProgressCreateManyInput) => ({ ...row, id: loadId(`user-progress:${targetUserId}:${row.moduleId}`), userId: targetUserId }));

  const created: number[] = [
    (await db.pageProgress.createMany({ data: pages, skipDuplicates: true })).count,
    (await db.lessonCompletion.createMany({ data: lessons, skipDuplicates: true })).count,
    (await db.userProgress.createMany({ data: modules, skipDuplicates: true })).count,
  ];

  return created.reduce((sum: number, count: number) => sum + count, 0);
}

async function main(): Promise<void> {
  const databaseUrl: string = assertLocalDatabase(process.env.LOAD_DATABASE_URL);
  const prisma: PrismaClient = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  try {
    const marker: { value: string } | null = await prisma.appSetting.findUnique({ where: { key: DEMO_MARKER_KEY }, select: { value: true } });

    if (marker?.value !== DEMO_MARKER_VALUE) {
      throw new Error("Refusing to seed load data: the database is not marked as a demo database (run the demo seed first)");
    }

    const passwordHash: string = await demoPasswordHash();
    const teacher: DemoPerson = DEMO_TEACHERS[0];
    const groupId: string = loadId("group:load-30");
    const reservationId: string = loadId("reservation:load-30");
    const now: Date = new Date();
    const students: { id: string; email: string; source: DemoPerson }[] = Array.from({ length: LOAD_STUDENT_COUNT }, (_: unknown, index: number) => ({
      id: loadId(`user:student-${index + 1}`),
      email: loadStudentEmail(index),
      source: DEMO_STUDENTS[index % DEMO_STUDENTS.length] as DemoPerson,
    }));

    const cloned: number = await prisma.$transaction(async (db: Prisma.TransactionClient): Promise<number> => {
      for (const [index, student] of students.entries()) {
        const row: Prisma.UserCreateInput = {
          id: student.id,
          email: student.email,
          name: `Load student ${String(index + 1).padStart(2, "0")}`,
          role: "STUDENT",
          password: passwordHash,
          emailVerified: now,
          isActive: true,
        };

        await db.user.upsert({ where: { id: student.id }, create: row, update: { isActive: true, password: passwordHash } });
      }

      const group: Prisma.GroupUncheckedCreateInput = {
        id: groupId,
        name: "Load test group (30 students)",
        description: "Created only by scripts/load/seed-load-data.ts for load testing",
        type: "STUDENT",
        depth: 0,
        isActive: true,
        maxStudents: LOAD_STUDENT_COUNT,
        semester: "2026-2",
        academicYear: "2026",
        createdBy: teacher.id,
        simulatorLeaderId: students[0]?.id,
      };

      await db.group.upsert({ where: { id: groupId }, create: group, update: group });

      for (const student of students) {
        const member: Prisma.GroupMemberUncheckedCreateInput = {
          id: loadId(`group-member:${groupId}:${student.id}`),
          groupId,
          userId: student.id,
          role: "STUDENT",
          memberRole: student.id === students[0]?.id ? "LEADER" : "MEMBER",
          joinedAt: now,
        };

        await db.groupMember.upsert({ where: { id: member.id }, create: member, update: {} });
      }

      const supervision: Prisma.GroupSupervisionTeacherGroupIdStudentGroupIdCompoundUniqueInput = { teacherGroupId: DEMO_TEACHER_GROUP.id, studentGroupId: groupId };

      await db.groupSupervision.upsert({ where: { teacherGroupId_studentGroupId: supervision }, create: supervision, update: {} });

      const assignments: { evaluationId: string; startsAt: Date; endsAt: Date | null; assignedById: string | null }[] = await db.evaluationAssignment.findMany({
        where: { groupId: DEMO_STUDENT_GROUPS[0].id },
        select: { evaluationId: true, startsAt: true, endsAt: true, assignedById: true },
      });

      await db.evaluationAssignment.createMany({
        data: assignments.map((assignment: { evaluationId: string; startsAt: Date; endsAt: Date | null; assignedById: string | null }) => ({
          ...assignment,
          id: loadId(`assignment:${groupId}:${assignment.evaluationId}`),
          groupId,
        })),
        skipDuplicates: true,
      });

      let progressRows: number = 0;

      for (const student of students) {
        progressRows += await cloneProgress(db, student.source.id, student.id);
      }

      const reservation: Prisma.ReservationUncheckedCreateInput = {
        id: reservationId,
        holderType: "GROUP",
        groupId,
        createdById: teacher.id,
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + RESERVATION_MINUTES * 60_000),
        status: "SCHEDULED",
        purpose: "Load test (telemetry fan-out)",
        createdAt: now,
        updatedAt: now,
      };

      await db.reservation.upsert({ where: { id: reservationId }, create: reservation, update: reservation });

      return progressRows;
    }, { maxWait: 10_000, timeout: 120_000 });

    console.log(`Load data ready: ${students.length} students in group ${groupId}, ${cloned} progress rows cloned, active group reservation ${reservationId} for ${RESERVATION_MINUTES} min`);
    console.log(JSON.stringify({
      groupId,
      reservationId,
      teacherEmail: teacher.email,
      password: DEMO_PASSWORD,
      studentEmails: students.map((student: { email: string }) => student.email),
    }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
