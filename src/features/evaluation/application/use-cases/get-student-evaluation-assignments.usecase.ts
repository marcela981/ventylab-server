/*
 * Funcionalidad: Caso de uso GetStudentEvaluationAssignmentsUseCase
 * Descripción: Consulta interna (aún sin ruta ni fachada) de las asignaciones visibles para un estudiante: las del grupo STUDENT activo que devuelve GroupsFacade.getStudentGroupOfUser, con su estado derivado; sin grupo devuelve una lista vacía
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
import { type EvaluationAssignmentView } from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import {
  EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";

@Injectable()
export class GetStudentEvaluationAssignmentsUseCase {
  public constructor(
    @Inject(EVALUATION_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IEvaluationAssignmentsRepository,
    private readonly _access: EvaluationAssignmentAccess,
  ) {}

  public async execute(userId: string): Promise<EvaluationAssignmentResult[]> {
    const groupId: string | undefined = await this._access.studentGroupIdOf(userId);

    if (groupId === undefined) {
      return [];
    }

    const views: EvaluationAssignmentView[] = await this._assignmentsRepository.getStudentGroupViews(groupId);
    const now: Date = new Date();

    return views.map((view: EvaluationAssignmentView) => withAssignmentState(view, now));
  }
}
