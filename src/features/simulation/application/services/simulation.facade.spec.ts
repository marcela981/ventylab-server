/*
 * Funcionalidad: Pruebas de SimulationFacade
 * Descripción: Verifica que la calificación de una sesión se recalcula con la repetición del servidor y devuelve su desglose por criterio (con rúbrica por defecto, de caso o explícita), los motivos de no disponibilidad (sesión inexistente, rúbrica inválida, caso no disponible), el resumen guardado y las estadísticas de sesiones de un grupo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EndSimulationSessionCommand } from "@/features/simulation/application/commands/end-simulation-session.command";
import {
  type SimulationGroupSessionStats,
  type SimulationSessionScoreResult,
} from "@/features/simulation/application/results/simulation-session.results";
import {
  SIMULATION_CASE_UNAVAILABLE_REASON,
  SIMULATION_INVALID_RUBRIC_REASON,
  SIMULATION_SESSION_NOT_FOUND_REASON,
  SimulationFacade,
} from "@/features/simulation/application/services/simulation.facade";
import {
  createSimulationTestContext,
  type SimulationTestContext,
  storeSession,
  TEST_SETTINGS,
  useFixedClock,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { EndSimulationSessionUseCase } from "@/features/simulation/application/use-cases/end-simulation-session.usecase";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulationSessionSummary } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { DEFAULT_SIMULATION_RUBRIC } from "@/features/simulation/domain/scoring";

const STARTED_AT: Date = new Date("2026-10-08T12:00:00Z");

describe("SimulationFacade", () => {
  let context: SimulationTestContext;
  let facade: SimulationFacade;
  let session: SimulationSession;

  beforeEach(async () => {
    useFixedClock(STARTED_AT);
    context = createSimulationTestContext();
    facade = new SimulationFacade(context.repository, context.runtime, context.groups.asFacade());
    session = await storeSession(context);
    session.recordActivity(30_000, STARTED_AT);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("scores a session through a server replay with a justified breakdown per default criterion", async () => {
    const result: SimulationSessionScoreResult = await facade.getSessionScore(session.id);

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.breakdown.map((item: { criterion: string }): string => item.criterion)).toEqual(
        DEFAULT_SIMULATION_RUBRIC.criteria.map((criterion: { type: string }): string => criterion.type),
      );
      expect(result.breakdown.every((item: { justification: string }): boolean => item.justification.length > 0)).toBe(true);
    }
  });

  it("scores with an explicit rubric and converts a clinical case rubric", async () => {
    const caseRubric: Record<string, unknown> = {
      assistancePolicy: "DISABLED",
      passingScore: 70,
      criteria: [
        { type: "TARGETS_REACHED", weight: 60, threshold: 1 },
        { type: "TIME_IN_RANGE", weight: 40, threshold: 80, windowMinutes: 5 },
        { type: "PLATEAU_PRESSURE_LIMIT", weight: 0, threshold: 30, penaltyPoints: 5 },
      ],
    };

    const result: SimulationSessionScoreResult = await facade.getSessionScore(session.id, caseRubric);

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.breakdown.map((item: { criterion: string }): string => item.criterion)).toEqual(["TARGETS_REACHED", "TIME_IN_RANGE", "SAFETY_VIOLATIONS"]);
    }
  });

  it("reports unavailable scores with a reason", async () => {
    const missingSession: SimulationSessionScoreResult = await facade.getSessionScore("missing");
    const invalidRubric: SimulationSessionScoreResult = await facade.getSessionScore(session.id, { criteria: [] });
    context.clinicalCases.cases.delete("case-normal");
    const missingCase: SimulationSessionScoreResult = await facade.getSessionScore(session.id);

    expect(missingSession).toEqual({ available: false, reason: SIMULATION_SESSION_NOT_FOUND_REASON });
    expect(invalidRubric).toEqual({ available: false, reason: SIMULATION_INVALID_RUBRIC_REASON });
    expect(missingCase).toEqual({ available: false, reason: SIMULATION_CASE_UNAVAILABLE_REASON });
  });

  it("returns the stored summary of an ended session", async () => {
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 60_000));
    await new EndSimulationSessionUseCase(context.transactionManager, TEST_SETTINGS, context.runtime).execute(
      new EndSimulationSessionCommand({ sessionId: session.id, userId: session.userId }),
    );

    const summary: SimulationSessionSummary | undefined = await facade.getSessionSummary(session.id);

    expect(summary).toBe(session.summary);
    expect(summary?.simTimeMs).toBe(60_000);
  });

  it("aggregates the sessions of a group's members", async () => {
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 60_000));
    await new EndSimulationSessionUseCase(context.transactionManager, TEST_SETTINGS, context.runtime).execute(
      new EndSimulationSessionCommand({ sessionId: session.id, userId: session.userId }),
    );
    const other: SimulationSession = await storeSession(context, { userId: "student-2" });
    other.abandon(STARTED_AT);
    await storeSession(context, { userId: "outsider" });
    context.groups.members.set("group-1", ["student-1", "student-2"]);

    const stats: SimulationGroupSessionStats = await facade.getGroupSessionStats("group-1");

    expect(stats).toEqual({
      groupId: "group-1",
      memberCount: 2,
      totalSessions: 2,
      activeSessions: 0,
      endedSessions: 1,
      abandonedSessions: 1,
      averageScore: session.summary?.score,
    });
  });
});
