/*
 * Funcionalidad: Pruebas de AppendSimulationEventsUseCase
 * Descripción: Verifica el registro de lotes de eventos: payload saneado sin puntajes del cliente, idempotencia por id, conflicto de id con otra sesión, tiempo simulado no decreciente, anti-manipulación por tiempo real transcurrido, ajustes fuera de rango (422), dueño, tamaño de lote, sesión de examen vencida terminada automáticamente y sesión abandonada por inactividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AppendSimulationEventsCommand } from "@/features/simulation/application/commands/append-simulation-events.command";
import { type AppendSimulationEventsResult } from "@/features/simulation/application/results/simulation-session.results";
import {
  createSimulationTestContext,
  type SimulationTestContext,
  storeSession,
  TEST_SETTINGS,
  useFixedClock,
} from "@/features/simulation/application/testing/simulation-sessions-test-doubles-spec";
import { AppendSimulationEventsUseCase } from "@/features/simulation/application/use-cases/append-simulation-events.usecase";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulationEventRecord } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { type ClientSimulationEvent } from "@/features/simulation/domain/sessions/simulation-session-events";
import {
  InvalidSimulationEventPayloadError,
  SimulationEventBatchTooLargeError,
  SimulationEventIdConflictError,
  SimulationEventTimeAheadError,
  SimulationEventTimeNotMonotonicError,
  SimulationParameterOutOfRangeError,
  SimulationSessionAccessDeniedError,
  SimulationSessionNotActiveError,
} from "@/features/simulation/domain/simulation.errors";

const STARTED_AT: Date = new Date("2026-10-08T12:00:00Z");
const STUDENT_ID: string = "student-1";

function paramChange(id: string, simTimeMs: number, payload: unknown = { changes: { peepCmH2O: 8 } }): ClientSimulationEvent {
  return { id, simTimeMs, type: "PARAM_CHANGE", payload };
}

describe("AppendSimulationEventsUseCase", () => {
  let context: SimulationTestContext;
  let useCase: AppendSimulationEventsUseCase;
  let session: SimulationSession;

  beforeEach(async () => {
    useFixedClock(STARTED_AT);
    context = createSimulationTestContext();
    useCase = new AppendSimulationEventsUseCase(context.repository, context.transactionManager, TEST_SETTINGS, context.runtime);
    session = await storeSession(context);
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 60_000));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function append(events: ClientSimulationEvent[], userId: string = STUDENT_ID): Promise<AppendSimulationEventsResult> {
    return useCase.execute(new AppendSimulationEventsCommand({ sessionId: session.id, userId, events }));
  }

  it("stores only the known payload fields and ignores client score or metrics fields", async () => {
    const result: AppendSimulationEventsResult = await append([
      paramChange("event-1", 10_000, { changes: { peepCmH2O: 8, fio2: 0.5, score: 100 }, score: 1, metrics: { spo2Percent: 99 } }),
      { id: "event-2", simTimeMs: 12_000, type: "ALARM_ACK", payload: { alarmCode: "HIGH_PRESSURE", score: 1 } },
    ]);

    const stored: SimulationEventRecord[] = context.repository.eventsOf(session.id);

    expect(result).toEqual({ accepted: 2, duplicates: 0, lastSimTimeMs: 12_000 });
    expect(stored.map((event: SimulationEventRecord): Record<string, unknown> => event.payload)).toEqual([
      { changes: { peepCmH2O: 8, fio2: 0.5 } },
      { alarmCode: "HIGH_PRESSURE" },
    ]);
    expect(session.lastSimTimeMs).toBe(12_000);
    expect(session.lastEventAt).toEqual(new Date(STARTED_AT.getTime() + 60_000));
    expect(context.repository.lockedIds).toEqual([session.id]);
  });

  it("is idempotent for an event id already stored for the session", async () => {
    await append([paramChange("event-1", 10_000)]);

    const result: AppendSimulationEventsResult = await append([paramChange("event-1", 10_000), paramChange("event-2", 11_000)]);

    expect(result).toEqual({ accepted: 1, duplicates: 1, lastSimTimeMs: 11_000 });
    expect(context.repository.eventsOf(session.id)).toHaveLength(2);
  });

  it("counts a repeated id inside the same batch as a duplicate", async () => {
    const result: AppendSimulationEventsResult = await append([paramChange("event-1", 10_000), paramChange("event-1", 10_000)]);

    expect(result).toEqual({ accepted: 1, duplicates: 1, lastSimTimeMs: 10_000 });
  });

  it("rejects an event id stored for another session with 409", async () => {
    context.repository.events.push({ id: "event-1", sessionId: "other-session", simTimeMs: 0, type: "PARAM_CHANGE", payload: {}, receivedAt: STARTED_AT });

    await expect(append([paramChange("event-1", 10_000)])).rejects.toBeInstanceOf(SimulationEventIdConflictError);
  });

  it("rejects simulated times that decrease within the batch", async () => {
    await expect(append([paramChange("event-1", 20_000), paramChange("event-2", 10_000)])).rejects.toBeInstanceOf(
      SimulationEventTimeNotMonotonicError,
    );
  });

  it("rejects simulated times before the last accepted event", async () => {
    await append([paramChange("event-1", 30_000)]);

    await expect(append([paramChange("event-2", 29_999)])).rejects.toBeInstanceOf(SimulationEventTimeNotMonotonicError);
  });

  it("rejects a simulated time beyond the elapsed real time times the multiplier plus the tolerance", async () => {
    await expect(append([paramChange("event-1", 65_001)])).rejects.toBeInstanceOf(SimulationEventTimeAheadError);
    await expect(append([paramChange("event-2", 65_000)])).resolves.toEqual({ accepted: 1, duplicates: 0, lastSimTimeMs: 65_000 });
  });

  it("allows simulated time to run faster with a time multiplier", async () => {
    jest.setSystemTime(STARTED_AT);
    session = await storeSession(context, { timeMultiplier: 4 });
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 60_000));

    await expect(append([paramChange("event-1", 245_000)])).resolves.toEqual({ accepted: 1, duplicates: 0, lastSimTimeMs: 245_000 });
  });

  it("rejects a PARAM_CHANGE outside the ventilator limits with a range error", async () => {
    await expect(append([paramChange("event-1", 10_000, { changes: { peepCmH2O: 35 } })])).rejects.toBeInstanceOf(
      SimulationParameterOutOfRangeError,
    );
    expect(context.repository.eventsOf(session.id)).toHaveLength(0);
  });

  it("validates settings cumulatively across stored and new changes", async () => {
    await append([paramChange("event-1", 10_000, { changes: { peepCmH2O: 15 } })]);

    await expect(append([paramChange("event-2", 11_000, { changes: { inspiratoryPressureCmH2O: 40, mode: "PCV" } })])).rejects.toBeInstanceOf(
      SimulationParameterOutOfRangeError,
    );
  });

  it("rejects a malformed payload", async () => {
    await expect(append([paramChange("event-1", 10_000, { changes: { peepCmH2O: "eight" } })])).rejects.toBeInstanceOf(
      InvalidSimulationEventPayloadError,
    );
  });

  it("rejects events from a user who does not own the session", async () => {
    await expect(append([paramChange("event-1", 10_000)], "intruder")).rejects.toBeInstanceOf(SimulationSessionAccessDeniedError);
  });

  it("rejects a batch larger than the configured maximum", async () => {
    useCase = new AppendSimulationEventsUseCase(context.repository, context.transactionManager, { ...TEST_SETTINGS, maxEventBatchSize: 1 }, context.runtime);

    await expect(append([paramChange("event-1", 1_000), paramChange("event-2", 2_000)])).rejects.toBeInstanceOf(SimulationEventBatchTooLargeError);
  });

  it("ends an exam session past its attempt deadline with a server summary and rejects the events", async () => {
    jest.setSystemTime(STARTED_AT);
    session = await storeSession(context, { mode: "EXAM", attemptId: "attempt-1", questionId: "question-1" });
    context.examReader.attempts.set("attempt-1", {
      id: "attempt-1",
      userId: STUDENT_ID,
      evaluationId: "evaluation-1",
      status: "IN_PROGRESS",
      deadlineAt: new Date(STARTED_AT.getTime() + 30_000),
    });
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 60_000));

    await expect(append([paramChange("event-1", 10_000)])).rejects.toBeInstanceOf(SimulationSessionNotActiveError);
    expect(session.status).toBe("ENDED");
    expect(session.summary?.score).toEqual(expect.any(Number));
    expect(context.repository.eventsOf(session.id).map((event: SimulationEventRecord): string => event.type)).toEqual(["END"]);
  });

  it("marks an idle session as abandoned and rejects the events", async () => {
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 31 * 60_000));

    await expect(append([paramChange("event-1", 10_000)])).rejects.toBeInstanceOf(SimulationSessionNotActiveError);
    expect(session.status).toBe("ABANDONED");
  });
});
