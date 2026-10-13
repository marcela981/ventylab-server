/*
 * Funcionalidad: Pruebas de integración de la semilla y el reinicio de demostración
 * Descripción: Contra el PostgreSQL de Testcontainers ejecuta semilla → conteos → reinicio → conteos → reinicio → conteos y exige conteos idénticos por tabla de negocio (también tras usar la demo y repetir la semilla), comprueba que audit_logs se conserva, que los paneles tienen datos y la guarda de producción: NODE_ENV=production sin marcador rechaza, con marcador procede, un host de Supabase sin marcador rechaza y --init-empty solo inicializa una base vacía
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Prisma, type PrismaClient } from "@prisma/client";

import { countBusinessTables, type TableCounts } from "../../../prisma/demo/demo-counts";
import { DemoGuardError, demoGuardRefusal } from "../../../prisma/demo/demo-guard";
import { DEMO_MARKER_KEY, demoId } from "../../../prisma/demo/demo-support";
import { resetDemo } from "../../../prisma/demo/reset-demo";
import { type DemoRunOptions, seedDemo } from "../../../prisma/demo/seed-demo";
import { createTestPrismaClient, resetDatabase } from "../../support/database";

const DEMO_TIMEOUT_MS: number = 240_000;

const FIXED_NOW: Date = new Date("2026-10-13T15:00:00.000Z");

const SUPABASE_URL: string = "postgresql://postgres:secret@db.abcdefghijkl.supabase.co:5432/postgres";

describe("demo seed and reset against PostgreSQL", () => {
  let prisma: PrismaClient;

  function options(nodeEnv: string, overrides: Partial<DemoRunOptions> = {}): DemoRunOptions {
    return { environment: { nodeEnv, databaseUrl: process.env.DATABASE_URL }, now: FIXED_NOW, ...overrides };
  }

  async function insertAuditRow(key: string): Promise<void> {
    await prisma.auditLog.create({
      data: { id: demoId(`test-audit:${key}`), entityCollection: "users", entityType: "user", entityId: key, action: "demo_test_action", performedAt: FIXED_NOW },
    });
  }

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
  });

  it(
    "should restore identical business-table counts on two consecutive resets, also after the demo was used",
    async () => {
      const seeded: TableCounts = await seedDemo(prisma, options("test"));
      const reseeded: TableCounts = await seedDemo(prisma, options("test"));

      await prisma.note.create({
        data: { userId: demoId("user:student-03"), lessonId: demoId("lesson:ecuacion-del-movimiento"), content: { type: "doc", content: [] } },
      });
      await prisma.notification.updateMany({ data: { readAt: FIXED_NOW } });

      const firstReset: TableCounts = await resetDemo(prisma, options("test"));
      const afterFirstReset: TableCounts = await countBusinessTables(prisma);
      const secondReset: TableCounts = await resetDemo(prisma, options("test"));

      expect(reseeded).toEqual(seeded);
      expect(firstReset).toEqual(seeded);
      expect(afterFirstReset).toEqual(firstReset);
      expect(secondReset).toEqual(firstReset);
      expect(await prisma.notification.count({ where: { readAt: null } })).toBeGreaterThan(0);
    },
    DEMO_TIMEOUT_MS,
  );

  it(
    "should seed the accounts, groups, evaluations, reservations and history the panels read",
    async () => {
      const counts: TableCounts = await resetDemo(prisma, options("test"));

      const futureReservations: number = await prisma.reservation.count({ where: { status: "SCHEDULED", startsAt: { gt: FIXED_NOW } } });
      const evaluationTypes: { type: string }[] = await prisma.evaluation.findMany({ distinct: ["type"], select: { type: true } });
      const publishedGrades: number = await prisma.studentEvaluationAttempt.count({ where: { gradePublishedAt: { not: null }, grade: { not: null } } });
      const pendingReview: number = await prisma.studentEvaluationAttempt.count({ where: { status: "PENDING_REVIEW" } });
      const scoredSessions: number = await prisma.simulationSession.count({ where: { status: "ENDED", summary: { not: Prisma.DbNull } } });

      expect(counts.users).toBe(13);
      expect(counts.groups).toBe(3);
      expect(counts.group_supervisions).toBe(2);
      expect(counts.evaluations).toBe(9);
      expect(evaluationTypes).toHaveLength(3);
      expect(publishedGrades).toBeGreaterThan(0);
      expect(pendingReview).toBeGreaterThan(0);
      expect(futureReservations).toBeGreaterThan(0);
      expect(scoredSessions).toBeGreaterThan(0);
      expect(counts.page_progress).toBeGreaterThan(0);
      expect(counts.notes).toBeGreaterThan(0);
      expect(counts.ai_call_logs).toBeGreaterThan(0);
      expect(counts.notifications).toBeGreaterThan(0);
    },
    DEMO_TIMEOUT_MS,
  );

  it(
    "should leave audit_logs untouched when resetting",
    async () => {
      await resetDemo(prisma, options("test"));
      await insertAuditRow("kept");
      const before: number = await prisma.auditLog.count();

      await resetDemo(prisma, options("test"));

      expect(await prisma.auditLog.count()).toBe(before);
    },
    DEMO_TIMEOUT_MS,
  );

  describe("production guard", () => {
    it(
      "should refuse to reset with NODE_ENV=production when the database is not marked as demo",
      async () => {
        await resetDemo(prisma, options("test"));
        await prisma.appSetting.delete({ where: { key: DEMO_MARKER_KEY } });
        await prisma.note.deleteMany({ where: { userId: demoId("user:student-01") } });
        const before: TableCounts = await countBusinessTables(prisma);

        const error: unknown = await resetDemo(prisma, options("production")).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(DemoGuardError);
        expect((error as Error).message).toContain("NODE_ENV=production");
        expect(await countBusinessTables(prisma)).toEqual(before);
      },
      DEMO_TIMEOUT_MS,
    );

    it(
      "should reset with NODE_ENV=production when the database carries the demo marker",
      async () => {
        const expected: TableCounts = await resetDemo(prisma, options("test"));
        await prisma.note.deleteMany({ where: { userId: demoId("user:student-01") } });

        const counts: TableCounts = await resetDemo(prisma, options("production"));

        expect(counts).toEqual(expected);
      },
      DEMO_TIMEOUT_MS,
    );

    it(
      "should refuse to seed a non-empty unmarked database in production even with --init-empty, and initialize an empty one",
      async () => {
        await resetDemo(prisma, options("test"));
        await prisma.appSetting.delete({ where: { key: DEMO_MARKER_KEY } });

        const refused: unknown = await seedDemo(prisma, options("production", { initializeEmptyDatabase: true })).catch((caught: unknown) => caught);
        await resetDatabase(prisma);
        const counts: TableCounts = await seedDemo(prisma, options("production", { initializeEmptyDatabase: true }));

        expect(refused).toBeInstanceOf(DemoGuardError);
        expect(counts.users).toBe(13);
        expect(await prisma.appSetting.findUnique({ where: { key: DEMO_MARKER_KEY } })).not.toBeNull();
      },
      DEMO_TIMEOUT_MS,
    );

    it("should refuse a Supabase host without the marker even outside production, and accept it with the marker", () => {
      const unmarked: string | undefined = demoGuardRefusal({ operation: "reset", environment: { nodeEnv: "development", databaseUrl: SUPABASE_URL }, database: { markerPresent: false, userCount: 0 } });
      const pooler: string | undefined = demoGuardRefusal({
        operation: "seed",
        environment: { nodeEnv: "development", databaseUrl: "postgresql://user:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres" },
        database: { markerPresent: false, userCount: 0 },
        initializeEmptyDatabase: true,
      });
      const marked: string | undefined = demoGuardRefusal({ operation: "reset", environment: { nodeEnv: "production", databaseUrl: SUPABASE_URL }, database: { markerPresent: true, userCount: 13 } });

      expect(unmarked).toContain("Supabase");
      expect(pooler).toContain("Supabase");
      expect(marked).toBeUndefined();
    });
  });
});
