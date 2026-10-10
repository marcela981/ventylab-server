/*
 * Funcionalidad: Pruebas de EndSimulationSessionUseCase
 * Descripción: Verifica que terminar una sesión repite la simulación en el servidor y recalcula la calificación con la rúbrica de la sesión (los puntajes enviados por el cliente en los eventos se descartan), registra END, deja la sesión en ENDED, sin tiempo del cliente usa el tiempo real transcurrido por el multiplicador (nunca menor que el último evento) y rechaza tiempos finales adelantados, sesiones ajenas o ya terminadas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AppendSimulationEventsCommand } from "@/features/simulation/application/commands/append-simulation-events.command";
import { EndSimulationSessionCommand } from "@/features/simulation/application/commands/end-simulation-session.command";
import { type SimulationSessionSummaryResult } from "@/features/simulation/application/results/simulation-session.results";
import { SimulationCaseMapper } from "@/features/simulation/application/services/simulation-case.mapper";
import {
  createSimulationTestContext,
  normalLungSnapshot,
  type SimulationTestContext,
  storeSession,
  TEST_SEED,
  TEST_SETTINGS,
  useFixedClock,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { AppendSimulationEventsUseCase } from "@/features/simulation/application/use-cases/append-simulation-events.usecase";
import { EndSimulationSessionUseCase } from "@/features/simulation/application/use-cases/end-simulation-session.usecase";
import { type EngineCase, replay, type ReplayResult } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulationEventRecord } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { computeSimulationScore, DEFAULT_SIMULATION_RUBRIC, type SimulationScore } from "@/features/simulation/domain/scoring";
import {
  SimulationEventTimeAheadError,
  SimulationSessionAccessDeniedError,
  SimulationSessionNotActiveError,
} from "@/features/simulation/domain/simulation.errors";

const STARTED_AT: Date = new Date("2026-10-08T12:00:00Z");
const STUDENT_ID: string = "student-1";

describe("EndSimulationSessionUseCase", () => {
  let context: SimulationTestContext;
  let useCase: EndSimulationSessionUseCase;
  let session: SimulationSession;

  beforeEach(async () => {
    useFixedClock(STARTED_AT);
    context = createSimulationTestContext();
    useCase = new EndSimulationSessionUseCase(context.transactionManager, TEST_SETTINGS, context.runtime);
    session = await storeSession(context);
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 90_000));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("recomputes the score on the server, ignoring client score fields, and ends the session", async () => {
    await new AppendSimulationEventsUseCase(context.repository, context.transactionManager, TEST_SETTINGS, context.runtime).execute(
      new AppendSimulationEventsCommand({
        sessionId: session.id,
        userId: STUDENT_ID,
        events: [{ id: "event-1", simTimeMs: 20_000, type: "PARAM_CHANGE", payload: { changes: { peepCmH2O: 8 }, score: 1, breakdown: [] } }],
      }),
    );
    const engineCase: EngineCase | undefined = SimulationCaseMapper.toDefinition(normalLungSnapshot())?.engineCase;
    const expected: ReplayResult = replay(
      engineCase as EngineCase,
      TEST_SEED,
      [{ type: "PARAM_CHANGE", simTimeMs: 20_000, changes: { peepCmH2O: 8 } }],
      60_000,
      { timeMultiplier: 1 },
    );
    const expectedScore: SimulationScore = computeSimulationScore(expected, DEFAULT_SIMULATION_RUBRIC, { aiHelpCount: 0 });

    const result: SimulationSessionSummaryResult = await useCase.execute(
      new EndSimulationSessionCommand({ sessionId: session.id, userId: STUDENT_ID, simTimeMs: 60_000 }),
    );

    expect(result.summary.score).toBe(expectedScore.score);
    expect(result.summary.breakdown).toEqual(expectedScore.breakdown);
    expect(result.summary.simTimeMs).toBe(60_000);
    expect(result.summary.durationMs).toBe(90_000);
    expect(result.summary.aiHelpCount).toBe(0);
    expect(session.status).toBe("ENDED");
    expect(session.endedAt).toEqual(new Date(STARTED_AT.getTime() + 90_000));
    expect(session.summary).toBe(result.summary);
    expect(context.repository.eventsOf(session.id).map((event: SimulationEventRecord): string => event.type)).toEqual(["PARAM_CHANGE", "END"]);
  });

  it("defaults the final simulated time to the elapsed real time times the multiplier", async () => {
    const fastSession: SimulationSession = await storeSession(context, { timeMultiplier: 2, now: STARTED_AT });

    const result: SimulationSessionSummaryResult = await useCase.execute(new EndSimulationSessionCommand({ sessionId: session.id, userId: STUDENT_ID }));
    const fastResult: SimulationSessionSummaryResult = await useCase.execute(
      new EndSimulationSessionCommand({ sessionId: fastSession.id, userId: STUDENT_ID }),
    );

    expect(result.summary.simTimeMs).toBe(90_000);
    expect(fastResult.summary.simTimeMs).toBe(180_000);
  });

  it("never defaults the final simulated time below the last accepted event", async () => {
    await new AppendSimulationEventsUseCase(context.repository, context.transactionManager, TEST_SETTINGS, context.runtime).execute(
      new AppendSimulationEventsCommand({
        sessionId: session.id,
        userId: STUDENT_ID,
        events: [{ id: "event-ahead", simTimeMs: 93_000, type: "PARAM_CHANGE", payload: { changes: { peepCmH2O: 8 } } }],
      }),
    );

    const result: SimulationSessionSummaryResult = await useCase.execute(new EndSimulationSessionCommand({ sessionId: session.id, userId: STUDENT_ID }));

    expect(result.summary.simTimeMs).toBe(93_000);
  });

  it("defaults the final simulated time of an exam session to the elapsed time up to the attempt deadline", async () => {
    const deadlineAt: Date = new Date(STARTED_AT.getTime() + 90_000);
    context.examReader.attempts.set("attempt-1", { id: "attempt-1", userId: STUDENT_ID, evaluationId: "evaluation-1", status: "IN_PROGRESS", deadlineAt });
    const examSession: SimulationSession = await storeSession(context, { mode: "EXAM", attemptId: "attempt-1", questionId: "question-1", timeMultiplier: 4, now: STARTED_AT });

    const result: SimulationSessionSummaryResult = await useCase.execute(new EndSimulationSessionCommand({ sessionId: examSession.id, userId: STUDENT_ID }));

    expect(result.summary.simTimeMs).toBe(360_000);
  });

  it("rejects a final simulated time ahead of the elapsed real time", async () => {
    const command: EndSimulationSessionCommand = new EndSimulationSessionCommand({ sessionId: session.id, userId: STUDENT_ID, simTimeMs: 96_000 });

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(SimulationEventTimeAheadError);
    expect(session.status).toBe("ACTIVE");
  });

  it("rejects ending another user's session", async () => {
    await expect(useCase.execute(new EndSimulationSessionCommand({ sessionId: session.id, userId: "intruder" }))).rejects.toBeInstanceOf(
      SimulationSessionAccessDeniedError,
    );
  });

  it("rejects ending a session twice", async () => {
    await useCase.execute(new EndSimulationSessionCommand({ sessionId: session.id, userId: STUDENT_ID }));

    await expect(useCase.execute(new EndSimulationSessionCommand({ sessionId: session.id, userId: STUDENT_ID }))).rejects.toBeInstanceOf(
      SimulationSessionNotActiveError,
    );
  });
});
