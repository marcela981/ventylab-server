/*
 * Funcionalidad: Pruebas de SimulationAssistContextService
 * Descripción: Verifica que el contexto de asistencia de una sesión activa del dueño incluye el resumen del caso sin identificadores, los ajustes vigentes, los últimos cambios con su valor previo y la política de asistencia, y que el evento AI_HELP se registra en el servidor con el id de la llamada y su origen
 * Versión: 1.0
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
import { SimulationSessionAccessDeniedError } from "@/features/simulation/domain/simulation.errors";

const STARTED_AT: Date = new Date("2026-10-08T12:00:00Z");
const STUDENT_ID: string = "student-1";

describe("SimulationAssistContextService", () => {
  let context: SimulationTestContext;
  let service: SimulationAssistContextService;
  let session: SimulationSession;

  beforeEach(async () => {
    useFixedClock(STARTED_AT);
    context = createSimulationTestContext();
    service = new SimulationAssistContextService(context.repository, context.transactionManager, context.runtime);
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
    const assist: SimulationAssistContext = await service.getAssistContext(session.id, STUDENT_ID);

    expect(assist.simTimeMs).toBe(10_000);
    expect(assist.assistancePolicy).toBe("DISABLED");
    expect(assist.input.mode).toBe("FREE");
    expect(assist.input.caseSummary.title).toBe("Normal lung");
    expect(JSON.stringify(assist.input.caseSummary)).not.toContain("case-normal");
    expect(assist.input.settings.peepCmH2O).toBe(8);
    expect(assist.input.recentChanges).toEqual([{ simTimeMs: 10_000, changes: { peepCmH2O: 8 }, previous: { peepCmH2O: 5 } }]);
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
