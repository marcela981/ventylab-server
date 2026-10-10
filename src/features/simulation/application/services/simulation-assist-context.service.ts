/*
 * Funcionalidad: Servicio de contexto de asistencia de simulación
 * Descripción: Entrega a la asistencia de IA el estado de una sesión activa del actor (resumen del caso sin datos personales, modo, ajustes vigentes, métricas, alarmas, objetivos y últimos cambios de parámetros, repetidos en el servidor), la política de asistencia de la rúbrica de la sesión y registra en el servidor el evento AI_HELP con el id de la llamada y su origen
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  type SimulationSessionContext,
  SimulationSessionRuntime,
} from "@/features/simulation/application/services/simulation-session-runtime.service";
import { ASSIST_MAX_RECENT_CHANGES, type AssistSnapshotInput } from "@/features/simulation/domain/assist/assist-snapshot";
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

export interface SimulationAssistContext {
  readonly sessionId: string;
  readonly simTimeMs: number;
  readonly assistancePolicy: AssistancePolicy;
  readonly rubric: SimulationRubric;
  readonly input: AssistSnapshotInput;
}

export interface SimulationAiHelpRecord {
  readonly aiCallId?: string;
  readonly source: AiHelpSourceValue;
}

@Injectable()
export class SimulationAssistContextService {
  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async getAssistContext(sessionId: string, userId: string): Promise<SimulationAssistContext> {
    const session: SimulationSession = await this._loadActiveOwnedSession(sessionId, userId);
    const context: SimulationSessionContext = await this._runtime.loadContext(session);
    const result: ReplayResult = this._runtime.replay(context, session.lastSimTimeMs);
    const rubric: SimulationRubric = await this._runtime.resolveRubric(session, context.caseDefinition);
    const initialSettings: Partial<VentilatorSettings> = context.caseDefinition.engineCase.initialSettings;

    return {
      sessionId: session.id,
      simTimeMs: result.final.simTimeMs,
      assistancePolicy: rubric.assistancePolicy ?? DEFAULT_ASSISTANCE_POLICY,
      rubric,
      input: {
        caseSummary: context.caseDefinition.summary,
        mode: session.mode,
        settings: settingsAfterEvents(initialSettings, context.events),
        metrics: result.final,
        alarms: result.final.alarms,
        targets: result.final.targets,
        recentChanges: settingsChangesOf(initialSettings, context.events).slice(-ASSIST_MAX_RECENT_CHANGES),
      },
    };
  }

  public async getAssistancePolicy(sessionId: string): Promise<AssistancePolicy> {
    const session: SimulationSession = await this._runtime.getSession(sessionId);
    const context: SimulationSessionContext = await this._runtime.loadContext(session);
    const rubric: SimulationRubric = await this._runtime.resolveRubric(session, context.caseDefinition);

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

      const payload: Record<string, unknown> =
        record.aiCallId === undefined ? { source: record.source } : { aiCallId: record.aiCallId, source: record.source };

      await this._sessionsRepository.insertEvents(
        [{ id: eventId, sessionId: session.id, simTimeMs: session.lastSimTimeMs, type: AI_HELP_EVENT_TYPE, payload, receivedAt: now }],
        transaction,
      );

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
