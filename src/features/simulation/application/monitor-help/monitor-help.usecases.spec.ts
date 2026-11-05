/*
 * Funcionalidad: Pruebas de la ayuda del monitor (alarmas del simulador y modo real)
 * Descripción: Verifica que la ayuda de alarmas del simulador emite primero las reglas deterministas según el contexto, transmite la sugerencia, registra el evento AI_HELP de tipo ALARM_HELP, respeta la política de asistencia del examen y usa el respaldo determinista sin proveedor; y que en modo real la asistencia y la ayuda de alarmas usan la telemetría enviada, no registran eventos y responden sin IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallOptions, type AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { ALARM_HELP_KIND, AlarmHelpSimulationUseCase } from "@/features/simulation/application/monitor-help/alarm-help-simulation.usecase";
import { type MonitorHelpEvent, type MonitorHelpRulesEvent } from "@/features/simulation/application/monitor-help/monitor-help-stream.result";
import { RealMonitorHelpUseCase, realDeterministicAdvice, type RealMonitorState } from "@/features/simulation/application/monitor-help/real-monitor-help.usecase";
import {
  type SimulationAiHelpRecord,
  type SimulationAssistContext,
  type SimulationAssistContextService,
} from "@/features/simulation/application/services/simulation-assist-context.service";
import { type SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { stabilizationRulesFor, type StabilizationRule } from "@/features/simulation/domain/assist/alarm-stabilization-rules";
import { buildAssistInput } from "@/features/simulation/domain/assist/assist-test-input-spec";
import { type AssistancePolicy, DEFAULT_SIMULATION_RUBRIC } from "@/features/simulation/domain/scoring";
import { SimulationAssistanceDisabledError } from "@/features/simulation/domain/simulation.errors";

const AI_CALL_ID: string = "ai-call-alarm-1";

async function* llmStream(text: string): AsyncGenerator<AiStreamChunk> {
  yield await Promise.resolve({ type: "delta", text } as AiStreamChunk);
  yield { type: "done", result: { content: text, source: "LLM", provider: "fake", model: "fake", aiCallId: AI_CALL_ID } };
}

async function* providersDown(options: AiCallOptions): AsyncGenerator<AiStreamChunk> {
  const content: string = await (options.fallback ?? ((): string => ""))();

  yield { type: "delta", text: content };
  yield { type: "done", result: { content, source: "DETERMINISTIC", aiCallId: AI_CALL_ID } };
}

async function collect(events: AsyncIterable<MonitorHelpEvent>): Promise<MonitorHelpEvent[]> {
  const collected: MonitorHelpEvent[] = [];

  for await (const event of events) {
    collected.push(event);
  }

  return collected;
}

function context(mode: "FREE" | "EXAM", assistancePolicy: AssistancePolicy): SimulationAssistContext {
  return {
    sessionId: "session-1",
    simTimeMs: 40000,
    assistancePolicy,
    rubric: { ...DEFAULT_SIMULATION_RUBRIC, assistancePolicy },
    input: { ...buildAssistInput({ cycle: { peakPressureCmH2O: 45, plateauPressureCmH2O: 24 } }), mode },
  };
}

describe("stabilizationRulesFor", () => {
  it("branches on the monitor context and always ends with DOPES", () => {
    const resistive: string[] = stabilizationRulesFor("HIGH_PRESSURE", { peakPressureCmH2O: 45, plateauPressureCmH2O: 24 }).map((rule: StabilizationRule): string => rule.id);
    const compliance: string[] = stabilizationRulesFor("HIGH_PRESSURE", { peakPressureCmH2O: 38, plateauPressureCmH2O: 34 }).map((rule: StabilizationRule): string => rule.id);

    expect(resistive).toEqual(["HIGH_PRESSURE_COMPARE", "HIGH_PRESSURE_RESISTIVE", "DOPES"]);
    expect(compliance).toEqual(["HIGH_PRESSURE_COMPARE", "HIGH_PRESSURE_PLATEAU", "DOPES"]);
  });

  it("maps the physical ventilator codes, falls back to DOPES for unknown codes and gives every rule a reference", () => {
    expect(stabilizationRulesFor("LOW_VOLUME", {}).map((rule: StabilizationRule): string => rule.id)).toContain("LOW_VT_LEAK");
    expect(stabilizationRulesFor("POWER_FAILURE", {}).map((rule: StabilizationRule): string => rule.id)).toEqual(["DOPES"]);

    for (const code of ["APNEA", "AUTO_PEEP", "LOW_SPO2", "LOW_MAP", "CARDIAC_ARREST", "TACHYCARDIA", "BRADYCARDIA", "DISCONNECTION"]) {
      for (const rule of stabilizationRulesFor(code, {}, "en")) {
        expect(rule.reference.length).toBeGreaterThan(0);
        expect(rule.text.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("AlarmHelpSimulationUseCase", () => {
  let stream: jest.Mock;
  let recordAiHelp: jest.Mock<Promise<string>, [string, string, SimulationAiHelpRecord]>;
  let useCase: AlarmHelpSimulationUseCase;
  let current: SimulationAssistContext;

  beforeEach(() => {
    current = context("FREE", "DISABLED");
    stream = jest.fn();
    recordAiHelp = jest.fn().mockResolvedValue("event-ai-help-1");
    useCase = new AlarmHelpSimulationUseCase(
      { getAssistContext: jest.fn(async () => await Promise.resolve(current)), recordAiHelp } as unknown as SimulationAssistContextService,
      { stream } as unknown as AiGateway,
    );
  });

  it("sends the rules first, then the suggestion, and records an ALARM_HELP AI_HELP event", async () => {
    stream.mockResolvedValue(llmStream("Revisa el tubo."));

    const events: MonitorHelpEvent[] = await collect(
      await useCase.execute({ sessionId: "session-1", userId: "user-1", userRole: "STUDENT", alarmCode: "HIGH_PRESSURE", language: "es" }),
    );

    expect(events[0].type).toBe("rules");
    expect((events[0] as MonitorHelpRulesEvent).rules.map((rule: StabilizationRule): string => rule.id)).toContain("HIGH_PRESSURE_RESISTIVE");
    expect(events[1]).toEqual({ type: "delta", text: "Revisa el tubo." });
    expect(events[2]).toEqual({ type: "done", aiCallId: AI_CALL_ID, source: "LLM", aiHelpEventId: "event-ai-help-1" });
    expect(stream.mock.calls[0][0]).toBe("SIM_ALARM_HELP");
    expect(recordAiHelp).toHaveBeenCalledWith("session-1", "user-1", { aiCallId: AI_CALL_ID, source: "LLM", kind: ALARM_HELP_KIND, alarmCode: "HIGH_PRESSURE" });
  });

  it("answers with the deterministic advisor when no provider answers", async () => {
    stream.mockImplementation(async (_useCase: string, _input: unknown, options: AiCallOptions) => await Promise.resolve(providersDown(options)));

    const events: MonitorHelpEvent[] = await collect(
      await useCase.execute({ sessionId: "session-1", userId: "user-1", userRole: "STUDENT", alarmCode: "HIGH_PRESSURE", language: "es" }),
    );

    expect(events[events.length - 1]).toMatchObject({ type: "done", source: "DETERMINISTIC" });
    expect((events[1] as { text: string }).text.length).toBeGreaterThan(0);
  });

  it("follows the exam assistance policy", async () => {
    current = context("EXAM", "DISABLED");

    await expect(
      useCase.execute({ sessionId: "session-1", userId: "user-1", userRole: "STUDENT", alarmCode: "HIGH_PRESSURE", language: "es" }),
    ).rejects.toBeInstanceOf(SimulationAssistanceDisabledError);

    current = context("EXAM", "ALLOWED_WITH_PENALTY");
    stream.mockResolvedValue(llmStream("ok"));

    await expect(
      useCase.execute({ sessionId: "session-1", userId: "user-1", userRole: "STUDENT", alarmCode: "HIGH_PRESSURE", language: "es" }),
    ).resolves.toBeDefined();
  });
});

describe("RealMonitorHelpUseCase", () => {
  const state: RealMonitorState = { mode: "VCV", metrics: { peakPressureCmH2O: 42, plateauPressureCmH2O: 33 }, alarms: ["HIGH_PRESSURE"], caseId: "missing-case" };

  function useCaseWith(stream: jest.Mock): RealMonitorHelpUseCase {
    const runtime: Pick<SimulationSessionRuntime, "loadCase"> = { loadCase: jest.fn().mockRejectedValue(new Error("not found")) };

    return new RealMonitorHelpUseCase({ stream } as unknown as AiGateway, runtime as SimulationSessionRuntime);
  }

  it("sends the real telemetry to SIM_ALARM_HELP after the rules, without recording any session event", async () => {
    const stream: jest.Mock = jest.fn().mockResolvedValue(llmStream("Revisa la meseta."));

    const events: MonitorHelpEvent[] = await collect(
      await useCaseWith(stream).alarmHelp({ userId: "user-1", userRole: "STUDENT", state, alarmCode: "HIGH_PRESSURE", language: "es" }),
    );
    const input: { monitorState: string } = stream.mock.calls[0][1] as { monitorState: string };

    expect(events.map((event: MonitorHelpEvent): string => event.type)).toEqual(["rules", "delta", "done"]);
    expect((events[0] as MonitorHelpRulesEvent).rules.map((rule: StabilizationRule): string => rule.id)).toContain("HIGH_PRESSURE_PLATEAU");
    expect(events[2]).toEqual({ type: "done", aiCallId: AI_CALL_ID, source: "LLM" });
    expect(JSON.parse(input.monitorState)).toMatchObject({ source: "REAL_VENTILATOR", alarms: ["HIGH_PRESSURE"] });
  });

  it("assists without AI with the first rule of each active alarm", async () => {
    const stream: jest.Mock = jest.fn(async (_useCase: string, _input: unknown, options: AiCallOptions) => await Promise.resolve(providersDown(options)));

    const events: MonitorHelpEvent[] = await collect(await useCaseWith(stream).assist({ userId: "user-1", userRole: "STUDENT", state, language: "es" }));

    expect(stream.mock.calls[0][0]).toBe("SIM_ASSIST");
    expect(events[0]).toEqual({ type: "delta", text: realDeterministicAdvice(state, "es") });
    expect(realDeterministicAdvice({}, "es")).toContain("Sin alarmas activas");
  });
});
