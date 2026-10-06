/*
 * Funcionalidad: Manejadores de eventos de evaluaciones
 * Descripción: Al activarse una evaluación emite en tiempo real evaluation:activated a la sala group:{groupId} y al publicarse una nota emite grade:published al estudiante (sala user:{id}) mediante IRealtimePublisher, también cuando el profesor recalcula una nota ya publicada, todos tras confirmar la transacción; un fallo del publicador se registra y no se propaga
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { groupRoom, type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { EvaluationActivatedEvent } from "@/features/evaluation/domain/events/evaluation-assignment.events";
import { EvaluationGradePublishedEvent, EvaluationGradeUpdatedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";

export const EVALUATION_ACTIVATED_REALTIME_EVENT: string = "evaluation:activated";
export const GRADE_PUBLISHED_REALTIME_EVENT: string = "grade:published";

@Injectable()
export class EvaluationEventsHandlers {
  private readonly _logger: Logger = new Logger(EvaluationEventsHandlers.name);

  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  @OnEvent(EvaluationActivatedEvent.name)
  public handleEvaluationActivated(event: EvaluationActivatedEvent): void {
    try {
      this._realtimePublisher.emitToRoom(groupRoom(event.groupId), EVALUATION_ACTIVATED_REALTIME_EVENT, {
        evaluationId: event.evaluationId,
        assignmentId: event.assignmentId,
        title: event.title,
        type: event.type,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      });
    } catch (error) {
      this._logger.warn(`Activation notification failed for assignment ${event.assignmentId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @OnEvent(EvaluationGradePublishedEvent.name)
  public handleGradePublished(event: EvaluationGradePublishedEvent): void {
    this._notifyGrade(event, event.publishedAt);
  }

  @OnEvent(EvaluationGradeUpdatedEvent.name)
  public handleGradeUpdated(event: EvaluationGradeUpdatedEvent): void {
    if (event.publishedAt !== undefined) {
      this._notifyGrade(event, event.publishedAt);
    }
  }

  private _notifyGrade(event: EvaluationGradePublishedEvent | EvaluationGradeUpdatedEvent, publishedAt: Date): void {
    try {
      this._realtimePublisher.emitToUser(event.userId, GRADE_PUBLISHED_REALTIME_EVENT, {
        attemptId: event.attemptId,
        evaluationId: event.evaluationId,
        score: event.score,
        maxScore: event.maxScore,
        grade: event.grade,
        passed: event.passed,
        publishedAt,
      });
    } catch (error) {
      this._logger.warn(`Grade notification failed for attempt ${event.attemptId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
