/*
 * Funcionalidad: Caso de uso GetEvaluationAssignmentsUseCase
 * Descripción: Lista las asignaciones de una evaluación con grupo, conteos de intentos por estado y estado derivado; ADMIN ve todas y TEACHER solo las de grupos STUDENT que creó o supervisa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type EvaluationAssignmentResult, withAssignmentState } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationAssignmentView } from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type EvaluationAssignmentScope,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 */
@Injectable()
export class GetEvaluationAssignmentsUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _access: EvaluationAssignmentAccess,
  ) {}

  public async execute(evaluationId: string, actor: EvaluationActor): Promise<EvaluationAssignmentResult[]> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(evaluationId);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const views: EvaluationAssignmentView[] = await this._assignmentsRepository.getViewsByEvaluation(evaluation.id, scope);
    const now: Date = new Date();

    return views.map((view: EvaluationAssignmentView) => withAssignmentState(view, now));
  }
}
