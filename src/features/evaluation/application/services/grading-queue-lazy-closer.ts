/*
 * Funcionalidad: Cierre perezoso de la cola de revisión
 * Descripción: Antes de leer la cola de revisión o su conteo, cierra con el cierre compartido de intentos, y como máximo un número fijo por solicitud, los intentos en curso vencidos (plazo efectivo más la gracia de entrega configurable) que coinciden con el filtro de la cola en el alcance del solicitante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EvaluationAttemptCloser } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type GradingAttemptFilter,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import {
  type IStudentEvaluationAttemptsRepository,
  STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN,
} from "@/features/evaluation/domain/repositories/student-evaluation-attempts.repository";

export const MAX_LAZY_CLOSES_PER_QUEUE_REQUEST: number = 50;

@Injectable()
export class GradingQueueLazyCloser {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    @Inject(STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN)
    private readonly _attemptsRepository: IStudentEvaluationAttemptsRepository,
    private readonly _closer: EvaluationAttemptCloser,
  ) {}

  public async closeExpired(filter: GradingAttemptFilter, now: Date): Promise<void> {
    const expiredIds: string[] = await this._gradingRepository.getExpiredInProgressAttemptIds(
      filter,
      this._closer.expiredDeadlineCutoff(now),
      MAX_LAZY_CLOSES_PER_QUEUE_REQUEST,
    );

    for (const attemptId of expiredIds) {
      const attempt: StudentEvaluationAttempt | undefined = await this._attemptsRepository.getById(attemptId);

      if (attempt) {
        await this._closer.lazyClose(attempt, now);
      }
    }
  }
}
