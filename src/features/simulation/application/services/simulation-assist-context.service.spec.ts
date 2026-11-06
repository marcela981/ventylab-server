/*
 * Funcionalidad: Pruebas de SimulationAssistContextService
 * Descripción: Verifica que el contexto de asistencia de una sesión activa del dueño incluye el resumen del caso sin identificadores, los ajustes vigentes, los últimos cambios con su valor previo y la política de asistencia, y que el evento AI_HELP se registra en el servidor con el id de la llamada y su origen
 * Versión: 1.1 (tiempo simulado de la consola validado, foto comparada y AI_HELP en el tiempo analizado)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AppendSimulationEventsCommand } from "@/features/simulation/application/commands/append-simulation-events.command";
import {
  type SimulationAssistContext,
  SimulationAssistContextService,
} from "@/features/simulation/application/services/simulation-assist-context.service";
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
import {
  SimulationEventTimeAheadError,
  SimulationEventTimeNotMonotonicError,
  SimulationSessionAccessDeniedError,
} from "@/features/simulation/domain/simulation.errors";

const STARTED_AT: Date = new Date("2026-10-08T12:00:00Z");
const STUDENT_ID: string = "student-1";

describe("SimulationAssistContextService", () => {
  let context: SimulationTestContext;
  let service: SimulationAssistContextService;
  let session: SimulationSession;

  beforeEach(async () => {
    useFixedClock(STARTED_AT);
    context = createSimulationTestContext();
    service = new SimulationAssistContextService(context.repository, context.transactionManager, context.runtime, TEST_SETTINGS);
    session = await storeSession(context);
    jest.setSystemTime(new Date(STARTED_AT.getTime() + 30_000));
    await new AppendSimulationEventsUseCase(context.repository, context.transactionManager, TEST_SETTINGS, context.runtime).execute(
      new AppendSimulationEventsCommand({
        sessionId: session.id,
        userId: STUDENT_ID,
        events: [{ id: "event-1", simTimeMs: 10_000, type: "PARAM_CHANGE", payload: { changes: { peepCmH2O: 8 } } }],
      }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds the assist snapshot input from a server replay", async () => {
    const assist: SimulationAssistContext = await service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 10_000 });

    expect(assist.simTimeMs).toBe(10_000);
    expect(assist.assistancePolicy).toBe("DISABLED");
    expect(assist.input.mode).toBe("FREE");
    expect(assist.input.caseSummary.title).toBe("Normal lung");
    expect(JSON.stringify(assist.input.caseSummary)).not.toContain("case-normal");
    expect(assist.input.settings.peepCmH2O).toBe(8);
    expect(assist.input.recentChanges).toEqual([{ simTimeMs: 10_000, changes: { peepCmH2O: 8 }, previous: { peepCmH2O: 5 } }]);
  });

  it("replays up to the current simulated time of the console, not up to the last stored event", async () => {
    const assist: SimulationAssistContext = await service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 25_000 });

    expect(assist.simTimeMs).toBe(25_000);
    expect(assist.input.metrics.simTimeMs).toBe(25_000);
  });

  it("estimates the time from the wall clock when an older client sends none", async () => {
    const assist: SimulationAssistContext = await service.getAssistContext(session.id, STUDENT_ID);

    expect(assist.simTimeMs).toBe(30_000);
  });

  it("moves a console clock slightly behind the last stored event up to it, and refuses one further behind", async () => {
    await expect(service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 9_500 })).resolves.toMatchObject({ simTimeMs: 10_000 });
    await expect(service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 5_000 })).rejects.toBeInstanceOf(SimulationEventTimeNotMonotonicError);
  });

  it("refuses a simulated time ahead of the wall-clock bound (elapsed × multiplier + tolerance)", async () => {
    await expect(service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 35_000 })).resolves.toMatchObject({ simTimeMs: 35_000 });
    await expect(service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 35_001 })).rejects.toBeInstanceOf(SimulationEventTimeAheadError);
  });

  it("compares the console snapshot with the replay without trusting it", async () => {
    const matching: SimulationAssistContext = await service.getAssistContext(session.id, STUDENT_ID, { simTimeMs: 20_000 });
    const spo2: number = matching.input.metrics.gasExchange.spo2Percent;
    const diverged: SimulationAssistContext = await service.getAssistContext(session.id, STUDENT_ID, {
      simTimeMs: 20_000,
      clientSnapshot: { spo2Percent: spo2 - 20, settings: { peepCmH2O: 8 } },
    });

    expect(matching.comparison.check).toBe("NO_CLIENT_SNAPSHOT");
    expect(diverged.comparison.check).toBe("DIVERGED");
    expect(diverged.comparison.differences.map((difference: { field: string }) => difference.field)).toEqual(["spo2Percent"]);
    expect(diverged.input.metrics.gasExchange.spo2Percent).toBe(spo2);
  });

  it("records the AI_HELP event at the analyzed time without moving lastSimTimeMs", async () => {
    const eventId: string = await service.recordAiHelp(session.id, STUDENT_ID, { aiCallId: "call-2", source: "LLM", simTimeMs: 25_000 });
    const stored: SimulationEventRecord | undefined = context.repository.events.find((event: SimulationEventRecord): boolean => event.id === eventId);
    const after: SimulationSession | undefined = await context.repository.getById(session.id);

    expect(stored?.simTimeMs).toBe(25_000);
    expect(after?.lastSimTimeMs).toBe(10_000);
  });

  it("rejects the assist context of another user's session", async () => {
    await expect(service.getAssistContext(session.id, "intruder")).rejects.toBeInstanceOf(SimulationSessionAccessDeniedError);
  });

  it("records a server-side AI_HELP event with the call id and source", async () => {
    const eventId: string = await service.recordAiHelp(session.id, STUDENT_ID, { aiCallId: "call-1", source: "LLM" });

    const stored: SimulationEventRecord | undefined = context.repository.events.find((event: SimulationEventRecord): boolean => event.id === eventId);

    expect(stored?.type).toBe("AI_HELP");
    expect(stored?.simTimeMs).toBe(10_000);
    expect(stored?.payload).toEqual({ aiCallId: "call-1", source: "LLM" });
  });
});
