/*
 * Funcionalidad: Pruebas del caso de uso de asistencia de IA en simulación
 * Descripción: Verifica con AiGateway simulado el stream de una sesión libre con registro AI_HELP de origen LLM, el respaldo determinista cuando fallan los proveedores, la política de asistencia en examen (403 con DISABLED, permitido con ALLOWED_WITH_PENALTY), que la entrada enviada al modelo no lleve id, correo ni nombre del estudiante, la propagación del error de cuota (429) y que una respuesta cancelada no registre AI_HELP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HttpStatus } from "@nestjs/common";

import { DOMAIN_ERROR_STATUS_MAP } from "@/common/presentation/errors-map";
import { type AiCallOptions, type AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiQuotaExceededError } from "@/features/ai/domain/ai.errors";
import { type SimAssistPromptInput } from "@/features/ai/domain/prompts/prompt-registry";
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { AssistSimulationCommand } from "@/features/simulation/application/assist/assist-simulation.command";
import { AssistSimulationUseCase, SIMULATION_ASSIST_REF_TYPE } from "@/features/simulation/application/assist/assist-simulation.usecase";
import { type SimulationAssistEvent, type SimulationAssistStreamResult } from "@/features/simulation/application/assist/simulation-assist-stream.result";
import {
  type SimulationAiHelpRecord,
  type SimulationAssistContext,
  type SimulationAssistContextService,
} from "@/features/simulation/application/services/simulation-assist-context.service";
import { type AssistSnapshotInput } from "@/features/simulation/domain/assist/assist-snapshot";
import { buildAssistInput } from "@/features/simulation/domain/assist/assist-test-input-spec";
import { adviseDeterministically } from "@/features/simulation/domain/assist/deterministic-assist-advisor";
import { type AssistancePolicy, DEFAULT_SIMULATION_RUBRIC } from "@/features/simulation/domain/scoring";
import { SimulationAssistanceDisabledError } from "@/features/simulation/domain/simulation.errors";
import { type UsersFacade } from "@/features/users/application/services/users.facade";

const SESSION_ID: string = "session-assist-1";
const USER_ID: string = "user-student-1";
const USER_EMAIL: string = "laura.gomez@correounivalle.edu.co";
const AI_CALL_ID: string = "ai-call-1";
const AI_HELP_EVENT_ID: string = "event-ai-help-1";

type StreamCall = [string, SimAssistPromptInput, AiCallOptions];

async function* chunksOf(chunks: readonly AiStreamChunk[]): AsyncGenerator<AiStreamChunk> {
  for (const chunk of chunks) {
    yield await Promise.resolve(chunk);
  }
}

function llmStream(texts: readonly string[]): AsyncIterable<AiStreamChunk> {
  const content: string = texts.join("");

  return chunksOf([
    ...texts.map((text: string): AiStreamChunk => ({ type: "delta", text })),
    { type: "done", result: { content, source: "LLM", provider: "fake", model: "fake-model", aiCallId: AI_CALL_ID } },
  ]);
}

// Mirrors the orchestrator: when every provider fails it streams the consumer fallback as one fragment with source DETERMINISTIC.
async function* providersDownStream(options: AiCallOptions): AsyncGenerator<AiStreamChunk> {
  const fallback: () => string | Promise<string> = options.fallback ?? ((): string => "");
  const content: string = await fallback();

  yield { type: "delta", text: content };
  yield { type: "done", result: { content, source: "DETERMINISTIC", aiCallId: AI_CALL_ID } };
}

async function collect(result: SimulationAssistStreamResult): Promise<SimulationAssistEvent[]> {
  const events: SimulationAssistEvent[] = [];

  for await (const event of result.events) {
    events.push(event);
  }

  return events;
}

function assistContext(mode: "FREE" | "EXAM", assistancePolicy: AssistancePolicy, input?: AssistSnapshotInput): SimulationAssistContext {
  return {
    sessionId: SESSION_ID,
    simTimeMs: 40000,
    assistancePolicy,
    rubric: { ...DEFAULT_SIMULATION_RUBRIC, assistancePolicy },
    input: { ...(input ?? buildAssistInput()), mode },
  };
}

function command(overrides: Partial<{ question: string; signal: AbortSignal }> = {}): AssistSimulationCommand {
  return new AssistSimulationCommand({ sessionId: SESSION_ID, userId: USER_ID, userRole: "STUDENT", language: "es", ...overrides });
}

describe("AssistSimulationUseCase", () => {
  let getAssistContext: jest.Mock<Promise<SimulationAssistContext>, [string, string]>;
  let recordAiHelp: jest.Mock<Promise<string>, [string, string, SimulationAiHelpRecord]>;
  let stream: jest.Mock<Promise<AsyncIterable<AiStreamChunk>>, StreamCall>;
  let getUserById: jest.Mock;
  let useCase: AssistSimulationUseCase;

  beforeEach(() => {
    getAssistContext = jest.fn().mockResolvedValue(assistContext("FREE", "DISABLED"));
    recordAiHelp = jest.fn().mockResolvedValue(AI_HELP_EVENT_ID);
    stream = jest.fn().mockResolvedValue(llmStream(["La presión meseta ", "está en rango."]));
    getUserById = jest.fn().mockResolvedValue({ id: USER_ID, email: USER_EMAIL, name: "Laura Gómez" });
    useCase = new AssistSimulationUseCase(
      { getAssistContext, recordAiHelp } as unknown as SimulationAssistContextService,
      { stream } as unknown as AiGateway,
      { getUserById } as unknown as UsersFacade,
    );
  });

  it("streams the LLM answer of a free session and records AI_HELP with source LLM and the aiCallId", async () => {
    const result: SimulationAssistStreamResult = await useCase.execute(command({ question: "¿Cómo va la ventilación?" }));

    const events: SimulationAssistEvent[] = await collect(result);

    expect(events).toEqual([
      { type: "delta", text: "La presión meseta " },
      { type: "delta", text: "está en rango." },
      { type: "done", aiHelpEventId: AI_HELP_EVENT_ID, aiCallId: AI_CALL_ID, source: "LLM" },
    ]);
    expect(recordAiHelp).toHaveBeenCalledWith(SESSION_ID, USER_ID, { aiCallId: AI_CALL_ID, source: "LLM" });
    expect(stream).toHaveBeenCalledWith(
      "SIM_ASSIST",
      expect.objectContaining({ question: "¿Cómo va la ventilación?", language: "es" }),
      expect.objectContaining({ userId: USER_ID, userRole: "STUDENT", refType: SIMULATION_ASSIST_REF_TYPE, refId: SESSION_ID }),
    );
  });

  it("answers with the deterministic advisor and records AI_HELP with source DETERMINISTIC when every provider fails", async () => {
    stream.mockImplementation((_useCase: string, _input: SimAssistPromptInput, options: AiCallOptions) => Promise.resolve(providersDownStream(options)));

    const events: SimulationAssistEvent[] = await collect(await useCase.execute(command()));

    expect(events[0]).toEqual({ type: "delta", text: adviseDeterministically(assistContext("FREE", "DISABLED").input, "es") });
    expect(events[1]).toEqual({ type: "done", aiHelpEventId: AI_HELP_EVENT_ID, aiCallId: AI_CALL_ID, source: "DETERMINISTIC" });
    expect(recordAiHelp).toHaveBeenCalledWith(SESSION_ID, USER_ID, { aiCallId: AI_CALL_ID, source: "DETERMINISTIC" });
  });

  it("rejects an exam session whose rubric disables assistance with a 403 error before calling the model", async () => {
    getAssistContext.mockResolvedValue(assistContext("EXAM", "DISABLED"));

    const execution: Promise<SimulationAssistStreamResult> = useCase.execute(command());

    await expect(execution).rejects.toThrow(SimulationAssistanceDisabledError);
    expect(DOMAIN_ERROR_STATUS_MAP.get(SimulationAssistanceDisabledError)).toBe(HttpStatus.FORBIDDEN);
    expect(stream).not.toHaveBeenCalled();
  });

  it("allows an exam session whose rubric allows assistance with penalty and records AI_HELP", async () => {
    getAssistContext.mockResolvedValue(assistContext("EXAM", "ALLOWED_WITH_PENALTY"));

    const events: SimulationAssistEvent[] = await collect(await useCase.execute(command()));

    expect(events.at(-1)).toEqual({ type: "done", aiHelpEventId: AI_HELP_EVENT_ID, aiCallId: AI_CALL_ID, source: "LLM" });
    expect(recordAiHelp).toHaveBeenCalledTimes(1);
  });

  it("sends the model no user id, email or name, neither from the question nor from the case text", async () => {
    const base: AssistSnapshotInput = buildAssistInput({ summary: `Caso preparado por Laura Gómez (${USER_EMAIL}).` });

    getAssistContext.mockResolvedValue(assistContext("FREE", "DISABLED", { ...base, caseSummary: { ...base.caseSummary, title: "Caso de Laura" } }));

    await useCase.execute(command({ question: `Soy Laura Gómez, mi correo es ${USER_EMAIL}. ¿Subo la PEEP?` }));

    const [, input]: StreamCall = stream.mock.calls[0];
    const sent: string = JSON.stringify(input);

    expect(sent).not.toContain(USER_ID);
    expect(sent).not.toContain(SESSION_ID);
    expect(sent).not.toContain(USER_EMAIL);
    expect(sent).not.toContain("Laura");
    expect(sent).not.toContain("Gómez");
    expect(sent).toContain("¿Subo la PEEP?");
  });

  it("propagates the quota error so it answers 429 before the stream starts", async () => {
    stream.mockRejectedValue(new AiQuotaExceededError(new Date("2026-10-09T00:00:00.000Z")));

    const execution: Promise<SimulationAssistStreamResult> = useCase.execute(command());

    await expect(execution).rejects.toThrow(AiQuotaExceededError);
    expect(DOMAIN_ERROR_STATUS_MAP.get(AiQuotaExceededError)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(recordAiHelp).not.toHaveBeenCalled();
  });

  it("does not record AI_HELP when the answer ends without a final chunk (client aborted)", async () => {
    stream.mockResolvedValue(chunksOf([{ type: "delta", text: "Parcial" }]));

    const events: SimulationAssistEvent[] = await collect(await useCase.execute(command()));

    expect(events).toEqual([{ type: "delta", text: "Parcial" }]);
    expect(recordAiHelp).not.toHaveBeenCalled();
  });
});
