/*
 * Funcionalidad: Caso de uso GetStudentGradesUseCase
 * Descripción: Notas publicadas de un estudiante para un profesor o administrador, con intento, evaluación, módulo y aprobación según la nota aprobatoria vigente: ADMIN ve todas; un profesor solo si gestiona o supervisa un grupo STUDENT del estudiante (GroupsFacade, 403 en otro caso) y solo las notas de su alcance de calificación (asignaciones de sus grupos o intentos heredados de evaluaciones que creó)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { EvaluationGradingAccess } from "@/features/evaluation/application/services/evaluation-grading-access";
import { EvaluationStudentGradesForbiddenError } from "@/features/evaluation/domain/evaluation.errors";
import { type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { hasPassedEvaluation } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import { ADMIN_EVALUATION_ACTOR_ROLE, type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";

/**
 * @throws {EvaluationStudentGradesForbiddenError} If the requester is a teacher who neither manages nor supervises a STUDENT group of the student
 */
@Injectable()
export class GetStudentGradesUseCase {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    private readonly _access: EvaluationGradingAccess,
    private readonly _groupsFacade: GroupsFacade,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
  ) {}

  public async execute(userId: string, actor: EvaluationActor): Promise<EvaluationUserGrade[]> {
    if (actor.role !== ADMIN_EVALUATION_ACTOR_ROLE && !(await this._groupsFacade.canManageAnyGroupOfUser({ id: actor.id, role: actor.role }, userId))) {
      throw new EvaluationStudentGradesForbiddenError();
    }

    const scope: EvaluationAssignmentScope | undefined = await this._access.scopeFor(actor);
    const views: PublishedGradeView[] = await this._gradingRepository.getPublishedGradesOfUser(userId, scope);
    const passingGrade: number = this._gradingConfig.passingGrade;

    return views.map((view: PublishedGradeView): EvaluationUserGrade => ({ ...view, passed: hasPassedEvaluation(view.grade, passingGrade) }));
  }
}
