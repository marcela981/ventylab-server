/*
 * Funcionalidad: Manejadores de eventos de retroalimentación de calificación
 * Descripción: Generan la retroalimentación de forma asíncrona (@OnEvent con async: true, EventEmitter2 difiere el oyente con setImmediate, así la entrega o la calificación nunca esperan): al calificarse un intento (EvaluationAttemptGradedEvent) y al pedirse una regeneración (GradeFeedbackRegenerationRequestedEvent); nunca propagan errores al emisor y solo registran el nombre del error
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { GenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-generation.command";
import { GenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-generation.usecase";
import { EvaluationAttemptGradedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { GradeFeedbackRegenerationRequestedEvent } from "@/features/evaluation/domain/events/grade-feedback.events";

@Injectable()
export class GradeFeedbackEventsHandlers {
  private readonly _logger: Logger = new Logger(GradeFeedbackEventsHandlers.name);

  public constructor(private readonly _generateGradeFeedbackUseCase: GenerateGradeFeedbackUseCase) {}

  @OnEvent(EvaluationAttemptGradedEvent.name, { async: true })
  public async handleAttemptGraded(event: EvaluationAttemptGradedEvent): Promise<void> {
    await this._generate(new GenerateGradeFeedbackCommand({ attemptId: event.attemptId }));
  }

  @OnEvent(GradeFeedbackRegenerationRequestedEvent.name, { async: true })
  public async handleRegenerationRequested(event: GradeFeedbackRegenerationRequestedEvent): Promise<void> {
    await this._generate(new GenerateGradeFeedbackCommand({ attemptId: event.attemptId, pendingFeedbackId: event.feedbackId }));
  }

  private async _generate(command: GenerateGradeFeedbackCommand): Promise<void> {
    try {
      await this._generateGradeFeedbackUseCase.execute(command);
    } catch (error: unknown) {
      // Only the error name: messages may echo prompt content or student answers
      this._logger.error(`Grade feedback generation failed for attempt ${command.attemptId} (${error instanceof Error ? error.name : "UnknownError"})`);
    }
  }
}
