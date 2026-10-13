/*
 * Funcionalidad: Pruebas de integración de los paneles sobre la base de demostración
 * Descripción: Reinicia la base de demostración en el PostgreSQL de Testcontainers con la hora real y lee, con los casos de uso de la aplicación arrancada, el resumen /me/summary de un estudiante, el tablero de grupo y la analítica de una evaluación publicada de un docente supervisor y el resumen de una sesión de simulación sembrada (que debe coincidir con el calculado por el motor), y exige que todos devuelvan datos no vacíos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAnalytics, type GroupDashboard, type MySummary } from "@/features/analytics/application/results/analytics.results";
import { GetEvaluationAnalyticsUseCase } from "@/features/analytics/application/use-cases/get-evaluation-analytics.usecase";
import { GetGroupDashboardUseCase } from "@/features/analytics/application/use-cases/get-group-dashboard.usecase";
import { GetMySummaryUseCase } from "@/features/analytics/application/use-cases/get-my-summary.usecase";
import { type SimulationSessionSummaryResult } from "@/features/simulation/application/results/simulation-session.results";
import { GetSimulationSessionSummaryUseCase } from "@/features/simulation/application/use-cases/get-simulation-session-summary.usecase";

import { DEMO_STUDENT_GROUPS, DEMO_TEACHERS, demoStudent } from "../../../prisma/demo/demo-cast";
import { demoId } from "../../../prisma/demo/demo-support";
import { resetDemo } from "../../../prisma/demo/reset-demo";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

describe("analytics panels over the demo database", () => {
  let harness: IntegrationApp;

  beforeAll(async () => {
    harness = await createIntegrationApp();
    await resetDatabase(harness.prisma);
    await resetDemo(harness.prisma, { environment: { nodeEnv: "test", databaseUrl: process.env.DATABASE_URL } });
  }, 240_000);

  afterAll(async () => {
    await resetDatabase(harness.prisma);
    await harness?.close();
  });

  it("should give a demo student a non-empty /me/summary", async () => {
    const student: { id: string; role: string } = { id: demoStudent(0).id, role: "STUDENT" };

    const summary: MySummary = await harness.app.get(GetMySummaryUseCase).execute(student);

    expect(summary.grades.length).toBeGreaterThan(0);
    expect(summary.activeEvaluations.length).toBeGreaterThan(0);
    expect(summary.latestNotes.length).toBeGreaterThan(0);
    expect(summary.latestConversations.length).toBeGreaterThan(0);
    expect(summary.latestSimulationSessions.length).toBeGreaterThan(0);
    expect(summary.upcomingReservations.length).toBeGreaterThan(0);
    expect(summary.unreadNotifications).toBeGreaterThan(0);
  });

  it("should give a supervising teacher a group dashboard and the analytics of a published evaluation", async () => {
    const teacher: { id: string; role: string } = { id: DEMO_TEACHERS[1].id, role: "TEACHER" };

    const dashboard: GroupDashboard = await harness.app.get(GetGroupDashboardUseCase).execute(teacher, DEMO_STUDENT_GROUPS[0].id);
    const analytics: EvaluationAnalytics = await harness.app.get(GetEvaluationAnalyticsUseCase).execute(teacher, demoId("evaluation:QUIZ:PUBLISHED"));

    expect(dashboard.students).toHaveLength(5);
    expect(analytics.questions.length).toBeGreaterThan(0);
    expect(analytics.stats.publishedCount).toBeGreaterThan(0);
  });

  it("should serve the seeded simulation summary computed by the real engine", async () => {
    const sessionId: string = demoId("simulation-session:s01-ards-1");
    const owner: { id: string; role: string } = { id: demoStudent(0).id, role: "STUDENT" };
    const stored: { summary: unknown } | null = await harness.prisma.simulationSession.findUnique({ where: { id: sessionId }, select: { summary: true } });

    const result: SimulationSessionSummaryResult = await harness.app.get(GetSimulationSessionSummaryUseCase).execute(sessionId, owner);

    expect(result.summary.breakdown.length).toBeGreaterThan(0);
    expect(stored?.summary).toEqual(expect.objectContaining({ score: result.summary.score, engineVersion: result.summary.engineVersion }));
  });
});
