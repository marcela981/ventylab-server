/*
 * Funcionalidad: Servicio de contexto de asistencia de simulación
 * Descripción: Entrega a la asistencia de IA el estado de una sesión activa del actor al tiempo simulado actual de la consola (resumen del caso sin datos personales, modo, ajustes vigentes, métricas, alarmas, objetivos, últimos cambios de parámetros, tendencias y sus pendientes, repetidos en el servidor), la política de asistencia de la rúbrica de la sesión y registra en el servidor el evento AI_HELP con el id de la llamada y su origen
 * Versión: 1.3 (estado al tiempo simulado actual de la consola, validado contra el último evento, la cota del reloj y la fecha límite; foto del cliente comparada con la repetición; AI_HELP en el tiempo analizado)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  type SimulationSessionContext,
  SimulationSessionRuntime,
} from "@/features/simulation/application/services/simulation-session-runtime.service";
import {
  SIMULATION_SESSION_SETTINGS_TOKEN,
  type SimulationSessionSettings,
} from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { type AssistContextComparison, type ClientAssistSnapshot, compareClientSnapshot } from "@/features/simulation/domain/assist/assist-context-check";
import { resolveAssistSimTimeMs } from "@/features/simulation/domain/assist/assist-sim-time";
import { ASSIST_MAX_RECENT_CHANGES, buildAssistTrends } from "@/features/simulation/domain/assist/assist-snapshot";
import { type AssistStateInput, buildAssistSlopes } from "@/features/simulation/domain/assist/assist-state-snapshot";
import { type ReplayResult, type VentilatorSettings } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type ISimulationSessionsRepository,
  SIMULATION_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { type AssistancePolicy, DEFAULT_ASSISTANCE_POLICY, type SimulationRubric } from "@/features/simulation/domain/scoring";
import { settingsAfterEvents, settingsChangesOf } from "@/features/simulation/domain/sessions/simulation-session-events";
import { SimulationSessionAccessDeniedError, SimulationSessionNotActiveError } from "@/features/simulation/domain/simulation.errors";
import { AI_HELP_EVENT_TYPE, type AiHelpSourceValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

/** What the console sends with a help request: its simulated time and what it shows */
export interface SimulationAssistRequest {
  readonly simTimeMs?: number;
  readonly clientSnapshot?: ClientAssistSnapshot;
  /** The console could not send its pending events before asking (bounded flush timed out) */
  readonly unsentChanges?: boolean;
}

export interface SimulationAssistContext {
  readonly sessionId: string;
  /** Simulated time the state was rebuilt at (the current time of the console, validated) */
  readonly simTimeMs: number;
  readonly assistancePolicy: AssistancePolicy;
  readonly rubric: SimulationRubric;
  readonly input: AssistStateInput;
  readonly comparison: AssistContextComparison;
}

export interface SimulationAiHelpRecord {
  readonly aiCallId?: string;
  readonly source: AiHelpSourceValue;
  /** "ALARM_HELP" for the "¿Cómo estabilizar?" answers; absent for the assistant */
  readonly kind?: string;
  readonly alarmCode?: string;
  /** Simulated time the answer analyzed; the event is stored at it */
  readonly simTimeMs?: number;
}

@Injectable()
export class SimulationAssistContextService {
  private readonly _logger: Logger = new Logger(SimulationAssistContextService.name);

  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    private readonly _runtime: SimulationSessionRuntime,
    @Inject(SIMULATION_SESSION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSessionSettings,
  ) {}

  /**
   * The state of the session at the current simulated time of the console, rebuilt by a deterministic server replay.
   * The client snapshot is only compared with it (and the difference logged): the AI always gets the server state.
   * @throws {SimulationEventTimeNotMonotonicError} If the requested time is behind the last stored event
   * @throws {SimulationEventTimeAheadError} If the requested time is ahead of the wall-clock bound or the exam deadline
   */
  public async getAssistContext(sessionId: string, userId: string, request: SimulationAssistRequest = {}): Promise<SimulationAssistContext> {
    const now: Date = new Date();
    const session: SimulationSession = await this._loadActiveOwnedSession(sessionId, userId);
    const expiresAt: Date | undefined = await this._runtime.getExpiresAt(session);
    const simTimeMs: number = resolveAssistSimTimeMs({
      requestedMs: request.simTimeMs,
      lastSimTimeMs: session.lastSimTimeMs,
      startedAt: session.startedAt,
      now,
      timeMultiplier: session.timeMultiplier,
      toleranceMs: this._settings.eventTimeToleranceMs,
      expiresAt,
    });
    const context: SimulationSessionContext = await this._runtime.loadContext(session);
    const result: ReplayResult = this._runtime.replay(context, simTimeMs);
    const rubric: SimulationRubric = await this._runtime.resolveRubric(context);
    const initialSettings: Partial<VentilatorSettings> = context.caseDefinition.engineCase.initialSettings;
    const settings: VentilatorSettings = settingsAfterEvents(initialSettings, context.events);
    const comparison: AssistContextComparison = compareClientSnapshot(request.clientSnapshot, result.final, settings);

    if (comparison.check === "DIVERGED") {
      this._logger.warn(
        JSON.stringify({
          event: "sim_assist_context_divergence",
          sessionId: session.id,
          simTimeMs,
          unsentChanges: request.unsentChanges === true,
          differences: comparison.differences,
        }),
      );
    }

    return {
      sessionId: session.id,
      simTimeMs: result.final.simTimeMs,
      assistancePolicy: rubric.assistancePolicy ?? DEFAULT_ASSISTANCE_POLICY,
      rubric,
      comparison,
      input: {
        caseSummary: context.caseDefinition.summary,
        mode: session.mode,
        settings,
        metrics: result.final,
        alarms: result.final.alarms,
        targets: result.final.targets,
        recentChanges: settingsChangesOf(initialSettings, context.events).slice(-ASSIST_MAX_RECENT_CHANGES),
        trends: buildAssistTrends(result.metricsTimeline, session.timeMultiplier),
        slopes: buildAssistSlopes(result.metricsTimeline),
        ...(request.unsentChanges === true ? { unsentChanges: true } : {}),
      },
    };
  }

  public async getAssistancePolicy(sessionId: string): Promise<AssistancePolicy> {
    const session: SimulationSession = await this._runtime.getSession(sessionId);
    const context: SimulationSessionContext = await this._runtime.loadContext(session);
    const rubric: SimulationRubric = await this._runtime.resolveRubric(context);

    return rubric.assistancePolicy ?? DEFAULT_ASSISTANCE_POLICY;
  }

  public async recordAiHelp(sessionId: string, userId: string, record: SimulationAiHelpRecord): Promise<string> {
    const now: Date = new Date();
    const eventId: string = generateId();

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const session: SimulationSession = await this._runtime.lockSession(sessionId, transaction);

      if (!session.isOwnedBy(userId)) {
        throw new SimulationSessionAccessDeniedError();
      }

      if (!session.isActive) {
        throw new SimulationSessionNotActiveError();
      }

      const payload: Record<string, unknown> = {
        ...(record.aiCallId === undefined ? {} : { aiCallId: record.aiCallId }),
        source: record.source,
        ...(record.kind === undefined ? {} : { kind: record.kind }),
        ...(record.alarmCode === undefined ? {} : { alarmCode: record.alarmCode }),
      };

      // Stored at the analyzed time; lastSimTimeMs is not moved, so events still queued in the console stay acceptable.
      const simTimeMs: number = Math.max(session.lastSimTimeMs, record.simTimeMs ?? session.lastSimTimeMs);

      await this._sessionsRepository.insertEvents(
        [{ id: eventId, sessionId: session.id, simTimeMs, type: AI_HELP_EVENT_TYPE, payload, receivedAt: now }],
        transaction,
      );

      // A help request is activity: it keeps a session where nothing was touched from being abandoned.
      session.recordActivity(session.lastSimTimeMs, now);

      await this._sessionsRepository.save(session, transaction);
    });

    return eventId;
  }

  private async _loadActiveOwnedSession(sessionId: string, userId: string): Promise<SimulationSession> {
    const session: SimulationSession = await this._runtime.getSession(sessionId);

    if (!session.isOwnedBy(userId)) {
      throw new SimulationSessionAccessDeniedError();
    }

    const settled: SimulationSession = await this._runtime.settleIfNeeded(session, new Date());

    if (!settled.isActive) {
      throw new SimulationSessionNotActiveError();
    }

    return settled;
  }
}
