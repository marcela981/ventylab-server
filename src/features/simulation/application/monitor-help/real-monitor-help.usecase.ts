/*
 * Funcionalidad: Asistencia y ayuda de alarmas en modo real
 * Descripción: Con la telemetría reciente del ventilador físico que envía el cliente (ajustes informados, métricas, alarmas del equipo, límites del cliente, tendencia) y el caso cargado si lo hay, transmite la asistencia (SIM_ASSIST) o la ayuda "¿Cómo estabilizar?" de una alarma (reglas deterministas y luego SIM_ALARM_HELP) por AiGateway, con respaldo determinista. Nunca envía comandos al equipo: este caso de uso no depende de los comandos del ventilador; el usuario decide y aplica
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
import { type MonitorHelpEvent } from "@/features/simulation/application/monitor-help/monitor-help-stream.result";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import {
  type AlarmRuleContext,
  type StabilizationRule,
  stabilizationRulesFor,
  stabilizationRulesText,
} from "@/features/simulation/domain/assist/alarm-stabilization-rules";
import { type AssistCaseSummary } from "@/features/simulation/domain/assist/assist-snapshot";

export const REAL_MONITOR_REF_TYPE: string = "real_monitor";

const REAL_STATE_MAX_LENGTH: number = 4000;

export interface RealMonitorState {
  readonly mode?: string;
  readonly settings?: Readonly<Record<string, number | undefined>>;
  readonly metrics?: {
    readonly peakPressureCmH2O?: number;
    readonly plateauPressureCmH2O?: number;
    readonly totalPeepCmH2O?: number;
    readonly autoPeepCmH2O?: number;
    readonly exhaledTidalVolumeMl?: number;
    readonly measuredRespiratoryRateBpm?: number;
    readonly minuteVolumeLpm?: number;
    readonly spo2Percent?: number;
    readonly etco2MmHg?: number;
  };
  readonly alarms?: readonly string[];
  readonly limits?: Readonly<Record<string, number | undefined>>;
  readonly trend?: ReadonlyArray<Readonly<Record<string, number | undefined>>>;
  readonly caseId?: string;
}

export interface RealMonitorHelpCommand {
  readonly userId: string;
  readonly userRole: string;
  readonly state: RealMonitorState;
  readonly language: LanguageValue;
  readonly signal?: AbortSignal;
}

export interface RealAssistCommand extends RealMonitorHelpCommand {
  readonly question?: string;
}

export interface RealAlarmHelpCommand extends RealMonitorHelpCommand {
  readonly alarmCode: string;
}

export function realRuleContext(state: RealMonitorState): AlarmRuleContext {
  const metrics: RealMonitorState["metrics"] = state.metrics ?? {};

  return {
    peakPressureCmH2O: metrics.peakPressureCmH2O,
    plateauPressureCmH2O: metrics.plateauPressureCmH2O,
    autoPeepCmH2O: metrics.autoPeepCmH2O,
    spo2Percent: metrics.spo2Percent,
    fio2: state.settings?.fio2,
    peepCmH2O: state.settings?.peepCmH2O,
    mode: state.mode,
  };
}

/** Deterministic answer without AI: the first applicable rule of each active alarm */
export function realDeterministicAdvice(state: RealMonitorState, language: LanguageValue): string {
  const alarms: readonly string[] = state.alarms ?? [];

  if (alarms.length === 0) {
    return language === "en"
      ? "No active alarms: keep watching the curves and the client limits; open an alarm for its stabilization steps."
      : "Sin alarmas activas: sigue vigilando las curvas y los límites del cliente; abre una alarma para ver cómo estabilizarla.";
  }

  return alarms
    .map((code: string): string => {
      const [first] = stabilizationRulesFor(code, realRuleContext(state), language === "en" ? "en" : "es");

      return `${code}: ${first.text} (${first.reference})`;
    })
    .join("\n");
}

@Injectable()
export class RealMonitorHelpUseCase {
  public constructor(
    private readonly _aiGateway: AiGateway,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async assist(command: RealAssistCommand): Promise<AsyncIterable<MonitorHelpEvent>> {
    const monitorState: string = await this._monitorStateText(command.state);
    const chunks: AsyncIterable<AiStreamChunk> = await this._aiGateway.stream(
      "SIM_ASSIST",
      { simulationState: monitorState, question: command.question?.trim() ?? "", language: command.language },
      {
        userId: command.userId,
        userRole: command.userRole,
        refType: REAL_MONITOR_REF_TYPE,
        refId: command.userId,
        fallback: (): string => realDeterministicAdvice(command.state, command.language),
        signal: command.signal,
      },
    );

    return RealMonitorHelpUseCase._relay(chunks, undefined);
  }

  public async alarmHelp(command: RealAlarmHelpCommand): Promise<AsyncIterable<MonitorHelpEvent>> {
    const rules: StabilizationRule[] = stabilizationRulesFor(command.alarmCode, realRuleContext(command.state), command.language === "en" ? "en" : "es");
    const monitorState: string = await this._monitorStateText(command.state);
    const chunks: AsyncIterable<AiStreamChunk> = await this._aiGateway.stream(
      "SIM_ALARM_HELP",
      { alarm: command.alarmCode, monitorState, rules: stabilizationRulesText(rules), language: command.language },
      {
        userId: command.userId,
        userRole: command.userRole,
        refType: REAL_MONITOR_REF_TYPE,
        refId: command.userId,
        fallback: (): string => realDeterministicAdvice({ ...command.state, alarms: [command.alarmCode] }, command.language),
        signal: command.signal,
      },
    );

    return RealMonitorHelpUseCase._relay(chunks, { type: "rules", alarmCode: command.alarmCode, rules });
  }

  private static async *_relay(chunks: AsyncIterable<AiStreamChunk>, first: MonitorHelpEvent | undefined): AsyncGenerator<MonitorHelpEvent> {
    if (first !== undefined) {
      yield first;
    }

    for await (const chunk of chunks) {
      if (chunk.type === "delta") {
        yield { type: "delta", text: chunk.text };

        continue;
      }

      yield { type: "done", aiCallId: chunk.result.aiCallId, source: chunk.result.source };
    }
  }

  // The loaded case adds its title and pathology; an unknown or unready case is simply left out.
  private async _monitorStateText(state: RealMonitorState): Promise<string> {
    let caseSummary: AssistCaseSummary | undefined;

    if (state.caseId !== undefined) {
      caseSummary = await this._runtime.loadCase(state.caseId).then(
        (definition: { summary: AssistCaseSummary }): AssistCaseSummary => definition.summary,
        (): undefined => undefined,
      );
    }

    const text: string = JSON.stringify({
      source: "REAL_VENTILATOR",
      ...(caseSummary === undefined ? {} : { case: { title: caseSummary.title, pathology: caseSummary.pathology } }),
      mode: state.mode ?? null,
      settings: state.settings ?? {},
      metrics: state.metrics ?? {},
      alarms: state.alarms ?? [],
      limits: state.limits ?? {},
      trend: state.trend ?? [],
    });

    return text.length <= REAL_STATE_MAX_LENGTH ? text : text.slice(0, REAL_STATE_MAX_LENGTH);
  }
}
