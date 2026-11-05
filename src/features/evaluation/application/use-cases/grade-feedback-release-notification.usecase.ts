/*
 * Funcionalidad: Caso de uso NotifyReleasedGradeFeedbackUseCase
 * Descripción: Al liberar el docente las respuestas de un intento (EvaluationAnswersReleasedEvent), avisa al estudiante con GradeFeedbackReadyEvent (notificación FEEDBACK_READY) si la retroalimentación global vigente ya está READY; si todavía se genera, el aviso sale al terminar la generación. Ajustes C1: la retroalimentación IA solo llega al estudiante con las respuestas liberadas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type EvaluationAnswersReleasedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { GradeFeedbackReadyEvent } from "@/features/evaluation/domain/events/grade-feedback.events";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { GRADE_FEEDBACKS_REPOSITORY_TOKEN, type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import { READY_FEEDBACK_STATUS } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

@Injectable()
export class NotifyReleasedGradeFeedbackUseCase {
  public constructor(
    @Inject(GRADE_FEEDBACKS_REPOSITORY_TOKEN)
    private readonly _feedbacksRepository: IGradeFeedbacksRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(event: EvaluationAnswersReleasedEvent): Promise<boolean> {
    const records: GradeFeedbackRecord[] = await this._feedbacksRepository.getByAttempt(event.attemptId);
    const overall: GradeFeedbackRecord | undefined = records.find((record: GradeFeedbackRecord) => record.questionId === undefined && record.status === READY_FEEDBACK_STATUS);

    if (!overall) {
      return false;
    }

    this._eventBus.publish([new GradeFeedbackReadyEvent({ attemptId: event.attemptId, evaluationId: event.evaluationId, userId: event.userId, feedbackId: overall.id })]);

    return true;
  }
}
