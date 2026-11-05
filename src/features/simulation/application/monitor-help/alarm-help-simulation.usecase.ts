/*
 * Funcionalidad: Ayuda "¿Cómo estabilizar?" de una alarma del simulador
 * Descripción: Lee el contexto de una sesión activa del actor (repetición del servidor), aplica la política de asistencia de la evaluación (en examen solo con ALLOWED_WITH_PENALTY), emite primero las reglas deterministas de la alarma según el contexto del monitor y luego transmite la sugerencia de SIM_ALARM_HELP por AiGateway (cuota, enlace a la sesión y respaldo con el asesor determinista); al terminar registra el evento AI_HELP de tipo ALARM_HELP con el aiCallId y el origen
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type LanguageValue } from "@/common/domain/value-objects/language";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { isAssistanceAllowed, SIMULATION_ASSIST_REF_TYPE } from "@/features/simulation/application/assist/assist-simulation.usecase";
import { type MonitorHelpEvent } from "@/features/simulation/application/monitor-help/monitor-help-stream.result";
import { type SimulationAssistContext, SimulationAssistContextService } from "@/features/simulation/application/services/simulation-assist-context.service";
import {
  type AlarmRuleContext,
  type StabilizationRule,
  stabilizationRulesFor,
  stabilizationRulesText,
} from "@/features/simulation/domain/assist/alarm-stabilization-rules";
import { type AssistSnapshotInput, buildAssistSnapshot } from "@/features/simulation/domain/assist/assist-snapshot";
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
 * @throws {AiQuotaExceededError} If the user reached the daily SIM_ALARM_HELP quota
 */
@Injectable()
export class AlarmHelpSimulationUseCase {
  public constructor(
    private readonly _assistContext: SimulationAssistContextService,
    private readonly _aiGateway: AiGateway,
  ) {}

  public async execute(command: AlarmHelpSimulationCommand): Promise<AsyncIterable<MonitorHelpEvent>> {
    const context: SimulationAssistContext = await this._assistContext.getAssistContext(command.sessionId, command.userId);

    if (!isAssistanceAllowed(context)) {
      throw new SimulationAssistanceDisabledError();
    }

    // The case summary is not needed to answer an alarm: only the monitor state goes to the provider.
    const input: AssistSnapshotInput = { ...context.input, caseSummary: { ...context.input.caseSummary, summary: undefined } };
    const rules: StabilizationRule[] = stabilizationRulesFor(command.alarmCode, ruleContextOf(input), command.language);
    const chunks: AsyncIterable<AiStreamChunk> = await this._aiGateway.stream(
      "SIM_ALARM_HELP",
      { alarm: command.alarmCode, monitorState: buildAssistSnapshot(input), rules: stabilizationRulesText(rules), language: command.language },
      {
        userId: command.userId,
        userRole: command.userRole,
        refType: SIMULATION_ASSIST_REF_TYPE,
        refId: context.sessionId,
        fallback: (): string => adviseDeterministically(input, command.language),
        signal: command.signal,
      },
    );

    return this._relay(chunks, command, rules);
  }

  private async *_relay(chunks: AsyncIterable<AiStreamChunk>, command: AlarmHelpSimulationCommand, rules: readonly StabilizationRule[]): AsyncGenerator<MonitorHelpEvent> {
    yield { type: "rules", alarmCode: command.alarmCode, rules };

    for await (const chunk of chunks) {
      if (chunk.type === "delta") {
        yield { type: "delta", text: chunk.text };

        continue;
      }

      const { aiCallId, source } = chunk.result;
      const aiHelpEventId: string = await this._assistContext.recordAiHelp(command.sessionId, command.userId, {
        aiCallId,
        source,
        kind: ALARM_HELP_KIND,
        alarmCode: command.alarmCode,
      });

      yield { type: "done", aiCallId, source, aiHelpEventId };
    }
  }
}
