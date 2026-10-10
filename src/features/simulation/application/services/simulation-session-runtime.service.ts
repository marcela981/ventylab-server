/*
 * Funcionalidad: Servicio de ejecución de sesiones de simulación
 * Descripción: Carga el caso del motor de una sesión con ClinicalCasesFacade, sus eventos y su rúbrica (pregunta de examen, rúbrica del caso o la rúbrica por defecto), repite la simulación en el servidor con la semilla y el multiplicador de la sesión, calcula el resumen calificado y aplica las transiciones diferidas: una sesión de examen pasada la fecha límite del intento se termina con su resumen y una sesión sin actividad por más del umbral configurado pasa a ABANDONED, también en barrido para las sesiones activas de un usuario antes de listarlas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { DomainError } from "@/common/domain/errors/domain-error";
import { generateId } from "@/common/domain/utils/generate-id";
import { type Paginated } from "@/common/domain/utils/paginated";
import { ClinicalCasesFacade } from "@/features/clinical-cases/application/services/clinical-cases.facade";
import { type ClinicalCaseSnapshot } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import {
  EXAM_ATTEMPT_READER_TOKEN,
  type ExamAttemptInfo,
  type ExamQuestionInfo,
  type IExamAttemptReader,
} from "@/features/simulation/application/ports/exam-attempt-reader.interface";
import { SimulationCaseMapper, type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import {
  SIMULATION_SESSION_SETTINGS_TOKEN,
  type SimulationSessionSettings,
} from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { replay, EngineValidationError, type ReplayResult } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationEventRecord,
  type SimulationSessionSummary,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  type ISimulationSessionsRepository,
  SIMULATION_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { computeSimulationScore, type SimulationRubric, type SimulationScore } from "@/features/simulation/domain/scoring";
import { toEngineEvents } from "@/features/simulation/domain/sessions/simulation-session-events";
import { resolveSessionRubric } from "@/features/simulation/domain/sessions/simulation-session-rubric";
import {
  SimulationCaseNotFoundError,
  SimulationCaseNotReadyError,
  SimulationSessionNotFoundError,
} from "@/features/simulation/domain/simulation.errors";
import { ACTIVE_SIMULATION_STATUS, AI_HELP_EVENT_TYPE, END_EVENT_TYPE } from "@/features/simulation/domain/value-objects/simulation-session-values";

export interface SimulationSessionContext {
  readonly session: SimulationSession;
  readonly caseDefinition: SimulationCaseDefinition;
  readonly events: readonly SimulationEventRecord[];
}

export type SimulationEndReason = "CLIENT" | "DEADLINE";

const ACTIVE_SWEEP_LIMIT: number = 100;

@Injectable()
export class SimulationSessionRuntime {
  private readonly _logger: Logger = new Logger(SimulationSessionRuntime.name);

  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    @Inject(EXAM_ATTEMPT_READER_TOKEN)
    private readonly _examAttemptReader: IExamAttemptReader,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(SIMULATION_SESSION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSessionSettings,
    private readonly _clinicalCasesFacade: ClinicalCasesFacade,
  ) {}

  public async loadCase(caseId: string): Promise<SimulationCaseDefinition> {
    const snapshot: ClinicalCaseSnapshot | undefined = await this._clinicalCasesFacade.getCaseById(caseId);

    if (!snapshot) {
      throw new SimulationCaseNotFoundError();
    }

    const definition: SimulationCaseDefinition | undefined = SimulationCaseMapper.toDefinition(snapshot);

    if (!definition) {
      throw new SimulationCaseNotReadyError();
    }

    return definition;
  }

  public async loadContext(session: SimulationSession, transaction?: unknown): Promise<SimulationSessionContext> {
    const caseDefinition: SimulationCaseDefinition = await this.loadCase(session.caseId);
    const events: SimulationEventRecord[] = await this._sessionsRepository.getEvents(session.id, transaction);

    return { session, caseDefinition, events };
  }

  public async resolveRubric(session: SimulationSession, caseDefinition: SimulationCaseDefinition, override?: unknown): Promise<SimulationRubric> {
    const question: ExamQuestionInfo | undefined =
      session.isExam && session.questionId !== undefined ? await this._examAttemptReader.getQuestion(session.questionId) : undefined;

    return resolveSessionRubric([override, question?.rubric, caseDefinition.defaultRubric]);
  }

  public replay(context: SimulationSessionContext, untilMs: number): ReplayResult {
    try {
      return replay(context.caseDefinition.engineCase, context.session.seed, toEngineEvents(context.events), untilMs, {
        timeMultiplier: context.session.timeMultiplier,
      });
    } catch (error: unknown) {
      if (error instanceof EngineValidationError) {
        throw new SimulationCaseNotReadyError();
      }

      throw error;
    }
  }

  public async computeScore(context: SimulationSessionContext, untilMs: number, rubricOverride?: unknown): Promise<{ result: ReplayResult; score: SimulationScore; aiHelpCount: number }> {
    const rubric: SimulationRubric = await this.resolveRubric(context.session, context.caseDefinition, rubricOverride);
    const result: ReplayResult = this.replay(context, untilMs);
    const aiHelpCount: number = context.events.filter((event: SimulationEventRecord): boolean => event.type === AI_HELP_EVENT_TYPE).length;

    return { result, score: computeSimulationScore(result, rubric, { aiHelpCount }), aiHelpCount };
  }

  public async computeSummary(context: SimulationSessionContext, untilMs: number, now: Date): Promise<SimulationSessionSummary> {
    const { result, score, aiHelpCount } = await this.computeScore(context, untilMs);

    return {
      engineVersion: context.session.engineVersion,
      simTimeMs: untilMs,
      durationMs: Math.max(0, now.getTime() - context.session.startedAt.getTime()),
      finalMetrics: result.final,
      targets: result.final.targets,
      score: score.score,
      breakdown: score.breakdown,
      aiHelpCount,
    };
  }

  public async getExpiresAt(session: SimulationSession): Promise<Date | undefined> {
    if (!session.isExam || session.attemptId === undefined) {
      return undefined;
    }

    const attempt: ExamAttemptInfo | undefined = await this._examAttemptReader.getAttempt(session.attemptId);

    return attempt?.deadlineAt;
  }

  public async endSession(session: SimulationSession, untilMs: number, now: Date, reason: SimulationEndReason, transaction: unknown): Promise<SimulationSessionSummary> {
    const context: SimulationSessionContext = await this.loadContext(session, transaction);
    const summary: SimulationSessionSummary = await this.computeSummary(context, untilMs, now);

    session.end(summary, now);

    await this._sessionsRepository.insertEvents(
      [{ id: generateId(), sessionId: session.id, simTimeMs: untilMs, type: END_EVENT_TYPE, payload: { reason }, receivedAt: now }],
      transaction,
    );

    await this._sessionsRepository.save(session, transaction);

    return summary;
  }

  public async settle(session: SimulationSession, now: Date, transaction: unknown): Promise<boolean> {
    if (!session.isActive) {
      return false;
    }

    const expiresAt: Date | undefined = await this.getExpiresAt(session);

    if (expiresAt !== undefined && now.getTime() > expiresAt.getTime()) {
      await this.endSession(session, session.lastSimTimeMs, now, "DEADLINE", transaction);

      return true;
    }

    if (now.getTime() - session.lastEventAt.getTime() > this._settings.abandonAfterMs) {
      session.abandon(now);

      await this._sessionsRepository.save(session, transaction);

      return true;
    }

    return false;
  }

  public async getSession(sessionId: string): Promise<SimulationSession> {
    const session: SimulationSession | undefined = await this._sessionsRepository.getById(sessionId);

    if (!session) {
      throw new SimulationSessionNotFoundError();
    }

    return session;
  }

  public async settleIfNeeded(session: SimulationSession, now: Date): Promise<SimulationSession> {
    if (!session.isActive) {
      return session;
    }

    const idle: boolean = now.getTime() - session.lastEventAt.getTime() > this._settings.abandonAfterMs;
    const expiresAt: Date | undefined = await this.getExpiresAt(session);
    const expired: boolean = expiresAt !== undefined && now.getTime() > expiresAt.getTime();

    if (!idle && !expired) {
      return session;
    }

    return await this._transactionManager.run(async (transaction: unknown): Promise<SimulationSession> => {
      const locked: SimulationSession = await this.lockSession(session.id, transaction);

      await this.settle(locked, now, transaction);

      return locked;
    });
  }

  public async settleActiveSessionsOf(userId: string, now: Date): Promise<void> {
    const active: Paginated<SimulationSession> = await this._sessionsRepository.getAll({
      userId,
      status: ACTIVE_SIMULATION_STATUS,
      page: 1,
      limit: ACTIVE_SWEEP_LIMIT,
    });

    for (const session of active.data) {
      try {
        await this.settleIfNeeded(session, now);
      } catch (error: unknown) {
        if (!(error instanceof DomainError)) {
          throw error;
        }

        this._logger.warn(`Could not settle simulation session ${session.id}: ${error.message}`);
      }
    }
  }

  public async lockSession(sessionId: string, transaction: unknown): Promise<SimulationSession> {
    const session: SimulationSession | undefined = await this._sessionsRepository.getByIdForUpdate(sessionId, transaction);

    if (!session) {
      throw new SimulationSessionNotFoundError();
    }

    return session;
  }
}
