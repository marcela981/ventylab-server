/*
 * Funcionalidad: Servicio AnalyticsScopeService
 * Descripción: Decide el alcance de la analítica docente con GroupsFacade y EvaluationFacade: ADMIN ve todo; un profesor solo los grupos que creó o supervisa, los estudiantes de esos grupos y las evaluaciones asignadas a alguno de ellos (fuera de alcance responde 403, grupo o evaluación inexistentes 404); también da la clave de alcance que separa las entradas de caché por solicitante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AnalyticsEvaluationNotFoundError, AnalyticsGroupNotFoundError, AnalyticsScopeForbiddenError } from "@/features/analytics/domain/analytics.errors";
import { EvaluationFacade } from "@/features/evaluation/application/services/evaluation.facade";
import { type EvaluationReferenceView } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { GroupsFacade, type GroupSummary } from "@/features/groups/application/services/groups.facade";

export const ADMIN_ANALYTICS_ROLE: string = "ADMIN";

export interface AnalyticsActor {
  readonly id: string;
  readonly role: string;
}

@Injectable()
export class AnalyticsScopeService {
  public constructor(
    private readonly _groupsFacade: GroupsFacade,
    private readonly _evaluationFacade: EvaluationFacade,
  ) {}

  public scopeKey(actor: AnalyticsActor): string {
    return actor.role === ADMIN_ANALYTICS_ROLE ? "admin" : `user:${actor.id}`;
  }

  public async assertGroupInScope(actor: AnalyticsActor, groupId: string): Promise<GroupSummary> {
    const group: GroupSummary | undefined = await this._groupsFacade.getGroupSummary(groupId);

    if (!group) {
      throw new AnalyticsGroupNotFoundError();
    }

    if (actor.role !== ADMIN_ANALYTICS_ROLE && !(await this._groupsFacade.canManageGroup(actor, groupId))) {
      throw new AnalyticsScopeForbiddenError();
    }

    return group;
  }

  public async assertStudentInScope(actor: AnalyticsActor, userId: string): Promise<void> {
    if (actor.role === ADMIN_ANALYTICS_ROLE) {
      return;
    }

    if (!(await this._groupsFacade.canManageAnyGroupOfUser(actor, userId))) {
      throw new AnalyticsScopeForbiddenError();
    }
  }

  public async assertEvaluationInScope(actor: AnalyticsActor, evaluationId: string): Promise<EvaluationReferenceView> {
    const evaluation: EvaluationReferenceView | undefined = await this._evaluationFacade.getEvaluationReference(evaluationId);

    if (!evaluation) {
      throw new AnalyticsEvaluationNotFoundError();
    }

    if (actor.role === ADMIN_ANALYTICS_ROLE) {
      return evaluation;
    }

    for (const groupId of evaluation.assignedGroupIds) {
      if (await this._groupsFacade.canManageGroup(actor, groupId)) {
        return evaluation;
      }
    }

    throw new AnalyticsScopeForbiddenError();
  }
}
