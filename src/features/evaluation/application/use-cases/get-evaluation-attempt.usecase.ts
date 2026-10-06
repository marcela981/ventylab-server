/*
 * Funcionalidad: Caso de uso GetEvaluationAttemptUseCase
 * Descripción: Detalle del intento para su propietario (404 para cualquier otro): cierra de forma perezosa un intento vencido antes de leerlo, carga la evaluación con escenarios, preguntas y opciones, ordena las preguntas (barajadas de forma determinista por intento si shuffleQuestions), resuelve las URLs de medios con IMediaUrlResolver cuando está disponible y entrega el plazo efectivo y la hora del servidor; ocultar las respuestas correctas es responsabilidad del mapeador del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Optional } from "@nestjs/common";

import {
  type IMediaUrlResolver,
  MEDIA_URL_RESOLVER_TOKEN,
  type ResolvedMediaURL,
} from "@/common/application/ports/media-url-resolver.interface";
import { StudentEvaluationAttemptDetailResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { EvaluationAttemptCloser, type EvaluationAttemptContext } from "@/features/evaluation/application/services/evaluation-attempt-closer";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { shuffleForAttempt } from "@/features/evaluation/domain/services/evaluation-attempt-policy";

/**
 * @throws {EvaluationAttemptNotFoundError} If the attempt does not exist or belongs to another user
 * @throws {EvaluationNotFoundError} If the evaluation of the attempt does not exist
 */
@Injectable()
export class GetEvaluationAttemptUseCase {
  public constructor(
    private readonly _closer: EvaluationAttemptCloser,
    @Optional()
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver?: IMediaUrlResolver,
  ) {}

  public async execute(attemptId: string, userId: string): Promise<StudentEvaluationAttemptDetailResult> {
    const now: Date = new Date();
    const owned: StudentEvaluationAttempt = await this._closer.getOwned(attemptId, userId);

    await this._closer.lazyClose(owned, now);

    const attempt: StudentEvaluationAttempt = owned.isInProgress ? await this._closer.getOwned(attemptId, userId) : owned;
    const context: EvaluationAttemptContext = await this._closer.loadContext(attempt);

    const ordered: EvaluationQuestionItem[] = [...context.evaluation.questions].sort(
      (left: EvaluationQuestionItem, right: EvaluationQuestionItem) => left.order - right.order,
    );

    return new StudentEvaluationAttemptDetailResult({
      attempt,
      evaluation: context.evaluation,
      questions: context.evaluation.shuffleQuestions ? shuffleForAttempt(ordered, attempt.id) : ordered,
      mediaUrls: await this._resolveMedia(context.evaluation.referencedMediaIds),
      deadlineAt: context.deadlineAt,
      now,
      passingGrade: this._closer.passingGrade,
    });
  }

  private async _resolveMedia(mediaIds: string[]): Promise<Map<string, ResolvedMediaURL>> {
    if (!this._mediaUrlResolver || mediaIds.length === 0) {
      return new Map<string, ResolvedMediaURL>();
    }

    return await this._mediaUrlResolver.resolveMany(mediaIds);
  }
}
