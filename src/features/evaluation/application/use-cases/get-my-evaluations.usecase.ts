/*
 * Funcionalidad: Caso de uso GetMyEvaluationsUseCase
 * Descripción: Listado del estudiante: cierra de forma perezosa sus intentos vencidos, toma las asignaciones de su grupo STUDENT activo con el estado derivado (GetStudentEvaluationAssignmentsUseCase; sin grupo, lista vacía) y añade el resumen de cada evaluación (sin respuestas) y los resúmenes de sus propios intentos, incluidos los heredados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { type StudentEvaluationListItemResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { EvaluationAttemptCloser } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { GetStudentEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-student-evaluation-assignments.usecase";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  type StudentAttemptSummaryView,
  type StudentEvaluationBriefView,
} from "@/features/evaluation/domain/read-models/student-evaluation.read-model";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";

@Injectable()
export class GetMyEvaluationsUseCase {
  public constructor(
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _closer: EvaluationAttemptCloser,
    private readonly _getStudentAssignmentsUseCase: GetStudentEvaluationAssignmentsUseCase,
  ) {}

  public async execute(userId: string): Promise<StudentEvaluationListItemResult[]> {
    const now: Date = new Date();
    const inProgress: StudentEvaluationAttempt[] = await this._attemptsRepository.getInProgressByUser(userId);

    for (const attempt of inProgress) {
      await this._closer.lazyClose(attempt, now);
    }

    const assignments: EvaluationAssignmentResult[] = await this._getStudentAssignmentsUseCase.execute(userId);

    if (assignments.length === 0) {
      return [];
    }

    const evaluationIds: string[] = [...new Set<string>(assignments.map((assignment: EvaluationAssignmentResult) => assignment.evaluationId))];

    const [briefs, attempts] = await Promise.all([
      this._attemptsRepository.getStudentEvaluationBriefs(evaluationIds),
      this._attemptsRepository.getUserAttemptSummaries(userId, evaluationIds),
    ]);

    return assignments.map((assignment: EvaluationAssignmentResult) => ({
      assignment,
      evaluation: briefs.find((brief: StudentEvaluationBriefView) => brief.id === assignment.evaluationId),
      attempts: attempts
        .filter((attempt: StudentAttemptSummaryView) => attempt.evaluationId === assignment.evaluationId)
        .sort((left: StudentAttemptSummaryView, right: StudentAttemptSummaryView) => left.attemptNumber - right.attemptNumber),
      passingGrade: this._closer.passingGrade,
    }));
  }
}
