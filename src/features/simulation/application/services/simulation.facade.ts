/*
 * Funcionalidad: Fachada SimulationFacade
 * Descripción: API pública de las sesiones de simulación con eventos para otras features: resumen de una sesión, calificación por rúbrica recalculada siempre con la repetición del servidor (nunca con datos del cliente), sesiones paginadas de un usuario y estadísticas de sesiones de los miembros de un grupo obtenidos con GroupsFacade
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { GroupsFacade, type GroupMemberSummary } from "@/features/groups/application/services/groups.facade";
import {
  type SimulationGroupSessionStats,
  type SimulationSessionScoreResult,
} from "@/features/simulation/application/results/simulation-session.results";
import {
  type SimulationSessionContext,
  SimulationSessionRuntime,
} from "@/features/simulation/application/services/simulation-session-runtime.service";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationSessionStatusCount,
  type SimulationSessionSummary,
  type SimulationSessionView,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  type GetSimulationSessionsQuery,
  type ISimulationSessionsRepository,
  SIMULATION_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import { type SimulationScore } from "@/features/simulation/domain/scoring";
import {
  SimulationCaseNotFoundError,
  SimulationCaseNotReadyError,
  SimulationRubricInvalidError,
} from "@/features/simulation/domain/simulation.errors";
import {
  ABANDONED_SIMULATION_STATUS,
  ACTIVE_SIMULATION_STATUS,
  ENDED_SIMULATION_STATUS,
} from "@/features/simulation/domain/value-objects/simulation-session-values";

export const SIMULATION_SESSION_NOT_FOUND_REASON: string = "SESSION_NOT_FOUND";
export const SIMULATION_CASE_UNAVAILABLE_REASON: string = "CASE_UNAVAILABLE";
export const SIMULATION_INVALID_RUBRIC_REASON: string = "INVALID_RUBRIC";

export type SimulationSessionsPageQuery = Omit<GetSimulationSessionsQuery, "userId">;

@Injectable()
export class SimulationFacade {
  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    private readonly _runtime: SimulationSessionRuntime,
    private readonly _groupsFacade: GroupsFacade,
  ) {}

  public static toView(session: SimulationSession): SimulationSessionView {
    return {
      id: session.id,
      userId: session.userId,
      caseId: session.caseId,
      mode: session.mode,
      attemptId: session.attemptId,
      questionId: session.questionId,
      engineVersion: session.engineVersion,
      timeMultiplier: session.timeMultiplier,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      lastEventAt: session.lastEventAt,
      lastSimTimeMs: session.lastSimTimeMs,
      score: session.summary?.score,
    };
  }

  public async getSessionSummary(sessionId: string): Promise<SimulationSessionSummary | undefined> {
    const session: SimulationSession | undefined = await this._sessionsRepository.getById(sessionId);

    if (!session) {
      return undefined;
    }

    if (session.summary) {
      return session.summary;
    }

    const context: SimulationSessionContext = await this._runtime.loadContext(session);

    return await this._runtime.computeSummary(context, session.lastSimTimeMs, session.endedAt ?? new Date());
  }

  public async getSessionScore(sessionId: string, rubric?: unknown): Promise<SimulationSessionScoreResult> {
    const session: SimulationSession | undefined = await this._sessionsRepository.getById(sessionId);

    if (!session) {
      return { available: false, reason: SIMULATION_SESSION_NOT_FOUND_REASON };
    }

    try {
      const context: SimulationSessionContext = await this._runtime.loadContext(session);
      const { score }: { score: SimulationScore } = await this._runtime.computeScore(context, session.lastSimTimeMs, rubric);

      return { available: true, score: score.score, breakdown: score.breakdown };
    } catch (error: unknown) {
      if (error instanceof SimulationRubricInvalidError) {
        return { available: false, reason: SIMULATION_INVALID_RUBRIC_REASON };
      }

      if (error instanceof SimulationCaseNotFoundError || error instanceof SimulationCaseNotReadyError) {
        return { available: false, reason: SIMULATION_CASE_UNAVAILABLE_REASON };
      }

      throw error;
    }
  }

  public async getUserSessions(userId: string, query: SimulationSessionsPageQuery): Promise<Paginated<SimulationSessionView>> {
    const sessions: Paginated<SimulationSession> = await this._sessionsRepository.getAll({ ...query, userId });

    return sessions.map(SimulationFacade.toView);
  }

  public async getGroupSessionStats(groupId: string): Promise<SimulationGroupSessionStats> {
    const members: GroupMemberSummary[] = await this._groupsFacade.getGroupMembers(groupId);
    const userIds: string[] = members.map((member: GroupMemberSummary): string => member.userId);
    const counts: SimulationSessionStatusCount[] = userIds.length > 0 ? await this._sessionsRepository.countByStatusForUsers(userIds) : [];
    const countOf = (status: string): number =>
      counts.filter((row: SimulationSessionStatusCount): boolean => row.status === status).reduce(
        (sum: number, row: SimulationSessionStatusCount): number => sum + row.count,
        0,
      );
    const scored: SimulationSessionStatusCount[] = counts.filter(
      (row: SimulationSessionStatusCount): boolean => row.averageScore !== null && row.scoredCount > 0,
    );
    const scoredTotal: number = scored.reduce((sum: number, row: SimulationSessionStatusCount): number => sum + row.scoredCount, 0);
    const scoreSum: number = scored.reduce(
      (sum: number, row: SimulationSessionStatusCount): number => sum + (row.averageScore ?? 0) * row.scoredCount,
      0,
    );

    return {
      groupId,
      memberCount: userIds.length,
      totalSessions: counts.reduce((sum: number, row: SimulationSessionStatusCount): number => sum + row.count, 0),
      activeSessions: countOf(ACTIVE_SIMULATION_STATUS),
      endedSessions: countOf(ENDED_SIMULATION_STATUS),
      abandonedSessions: countOf(ABANDONED_SIMULATION_STATUS),
      averageScore: scoredTotal > 0 ? scoreSum / scoredTotal : null,
    };
  }
}
