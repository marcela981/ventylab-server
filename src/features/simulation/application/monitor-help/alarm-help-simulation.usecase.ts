/*
 * Funcionalidad: Ayuda "¿Cómo estabilizar?" de una alarma del simulador
 * Descripción: Lee el contexto de una sesión activa del actor al tiempo simulado actual de la consola (repetición del servidor validada), aplica la política de asistencia de la evaluación (en examen solo con ALLOWED_WITH_PENALTY), emite primero las reglas deterministas de la alarma según ese estado y luego la sugerencia de SIM_ALARM_HELP por AiGateway (cuota, enlace a la sesión, hash y tiempo simulado del estado en la telemetría y respaldo con el asesor determinista sobre ese mismo estado), validada contra el estado actual antes de entregarla (una regeneración y luego la sugerencia determinista con aviso); al terminar registra el evento AI_HELP de tipo ALARM_HELP con el aiCallId, el origen y el tiempo analizado, y el evento final informa el estado analizado
 * Versión: 1.1 (estado actual, validador de coherencia y estado analizado en la respuesta)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type LanguageValue } from "@/common/domain/value-objects/language";
import { type AiCallOptions, AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { analysisOf, isAssistanceAllowed, SIMULATION_ASSIST_REF_TYPE } from "@/features/simulation/application/assist/assist-simulation.usecase";
import {
  assistCoherenceValidator,
  type CoherentAssistAnswer,
  coherentAssistAnswer,
  contextHashOf,
} from "@/features/simulation/application/assist/coherent-assist-answer";
import { type MonitorHelpEvent } from "@/features/simulation/application/monitor-help/monitor-help-stream.result";
import { type SimulationAssistContext, SimulationAssistContextService } from "@/features/simulation/application/services/simulation-assist-context.service";
import {
  type AlarmRuleContext,
  type StabilizationRule,
  stabilizationRulesFor,
  stabilizationRulesText,
} from "@/features/simulation/domain/assist/alarm-stabilization-rules";
import { type AssistCoherenceState } from "@/features/simulation/domain/assist/assist-coherence";
import { type ClientAssistSnapshot } from "@/features/simulation/domain/assist/assist-context-check";
import { type AssistSnapshotInput } from "@/features/simulation/domain/assist/assist-snapshot";
import { type AssistStateInput, buildAssistState } from "@/features/simulation/domain/assist/assist-state-snapshot";
import { adviseDeterministically } from "@/features/simulation/domain/assist/deterministic-assist-advisor";
import { SimulationAssistanceDisabledError } from "@/features/simulation/domain/simulation.errors";

export const ALARM_HELP_KIND: string = "ALARM_HELP";

export interface AlarmHelpSimulationCommand {
  readonly sessionId: string;
  readonly userId: string;
  readonly userRole: string;
  readonly alarmCode: string;
  readonly language: LanguageValue;
  readonly signal?: AbortSignal;
  /** Current simulated time of the console and what it shows */
  readonly simTimeMs?: number;
  readonly clientSnapshot?: ClientAssistSnapshot;
  readonly unsentChanges?: boolean;
}

export function ruleContextOf(input: AssistSnapshotInput): AlarmRuleContext {
  const cycle: AssistSnapshotInput["metrics"]["lastCycle"] = input.metrics.lastCycle;

  return {
    ...(cycle === null
      ? {}
      : { peakPressureCmH2O: cycle.peakPressureCmH2O, plateauPressureCmH2O: cycle.plateauPressureCmH2O, autoPeepCmH2O: cycle.autoPeepCmH2O }),
    spo2Percent: input.metrics.gasExchange.spo2Percent,
    meanArterialPressureMmHg: input.metrics.hemodynamics.meanArterialPressureMmHg,
    fio2: input.settings.fio2,
    peepCmH2O: input.settings.peepCmH2O,
    mode: input.settings.mode,
  };
}

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the session belongs to another user
 * @throws {SimulationSessionNotActiveError} If the session is not active
 * @throws {SimulationAssistanceDisabledError} If the session is an exam whose rubric disables assistance
 * @throws {SimulationEventTimeNotMonotonicError} If the simulated time of the request is behind the last stored event
 * @throws {SimulationEventTimeAheadError} If the simulated time of the request is ahead of the wall-clock bound
 * @throws {AiQuotaExceededError} If the user reached the daily SIM_ALARM_HELP quota
 */
@Injectable()
export class AlarmHelpSimulationUseCase {
  public constructor(
    private readonly _assistContext: SimulationAssistContextService,
    private readonly _aiGateway: AiGateway,
  ) {}

  public async execute(command: AlarmHelpSimulationCommand): Promise<AsyncIterable<MonitorHelpEvent>> {
    const context: SimulationAssistContext = await this._assistContext.getAssistContext(command.sessionId, command.userId, {
      simTimeMs: command.simTimeMs,
      clientSnapshot: command.clientSnapshot,
      unsentChanges: command.unsentChanges,
    });

    if (!isAssistanceAllowed(context)) {
      throw new SimulationAssistanceDisabledError();
    }

    // The case summary is not needed to answer an alarm: only the monitor state goes to the provider.
    const input: AssistStateInput = { ...context.input, caseSummary: { ...context.input.caseSummary, summary: undefined }, language: command.language };
    const rules: StabilizationRule[] = stabilizationRulesFor(command.alarmCode, ruleContextOf(input), command.language);
    const monitorState: string = buildAssistState(input);
    const rulesText: string = stabilizationRulesText(rules);
    const state: AssistCoherenceState = { metrics: input.metrics, trends: input.trends, targets: input.targets };
    const options: AiCallOptions = {
      userId: command.userId,
      userRole: command.userRole,
      refType: SIMULATION_ASSIST_REF_TYPE,
      refId: context.sessionId,
      fallback: (): string => adviseDeterministically(input, command.language),
      signal: command.signal,
      trace: { contextHash: contextHashOf(monitorState), simTimeMs: context.simTimeMs, contextCheck: context.comparison.check },
      validate: assistCoherenceValidator(state),
    };
    const first: AsyncIterable<AiStreamChunk> = await this._aiGateway.stream(
      "SIM_ALARM_HELP",
      { alarm: command.alarmCode, monitorState, rules: rulesText, language: command.language },
      options,
    );
    const answer = (): Promise<CoherentAssistAnswer | null> =>
      coherentAssistAnswer({
        first,
        regenerate: (correction: string | undefined): Promise<AsyncIterable<AiStreamChunk>> =>
          this._aiGateway.stream("SIM_ALARM_HELP", { alarm: command.alarmCode, monitorState, rules: rulesText, language: command.language, correction }, options),
        state,
        deterministic: (): string => adviseDeterministically(input, command.language),
        language: command.language,
        signal: command.signal,
      });

    return this._relay(answer, command, rules, context);
  }

  private async *_relay(
    answer: () => Promise<CoherentAssistAnswer | null>,
    command: AlarmHelpSimulationCommand,
    rules: readonly StabilizationRule[],
    context: SimulationAssistContext,
  ): AsyncGenerator<MonitorHelpEvent> {
    yield { type: "rules", alarmCode: command.alarmCode, rules };

    const answered: CoherentAssistAnswer | null = await answer();

    if (answered === null) {
      return;
    }

    const { text, source, aiCallId, notice } = answered;

    yield { type: "delta", text };

    const aiHelpEventId: string = await this._assistContext.recordAiHelp(command.sessionId, command.userId, {
      aiCallId: aiCallId.length > 0 ? aiCallId : undefined,
      source,
      kind: ALARM_HELP_KIND,
      alarmCode: command.alarmCode,
      simTimeMs: context.simTimeMs,
    });

    yield { type: "done", aiCallId, source, aiHelpEventId, analysis: analysisOf(context), ...(notice === undefined ? {} : { notice }) };
  }
}
