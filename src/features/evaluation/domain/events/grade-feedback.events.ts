/*
 * Funcionalidad: Eventos de dominio de la retroalimentación de calificación
 * Descripción: Evento de regeneración solicitada: lleva el intento y la fila PENDING reservada para que la generación corra de forma asíncrona fuera de la petición del docente; GradeFeedbackReadyEvent se emite al guardarse la retroalimentación lista y se publica también como grade.feedbackReady
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type CatalogDomainEvent, catalogMeta, type GradeFeedbackReadyPayload } from "@/common/domain/events/domain-event-catalog";

export class GradeFeedbackRegenerationRequestedEvent extends DomainEvent {
  public readonly attemptId: string;
  public readonly feedbackId: string;

  public constructor({ attemptId, feedbackId, performedBy }: { attemptId: string; feedbackId: string; performedBy?: string }) {
    super({ performedBy });
    this.attemptId = attemptId;
    this.feedbackId = feedbackId;
  }
}

export class GradeFeedbackReadyEvent extends DomainEvent implements CatalogDomainEvent<"grade.feedbackReady"> {
  public readonly attemptId: string;
  public readonly evaluationId: string;
  public readonly userId: string;
  public readonly feedbackId: string;

  public constructor({
    attemptId,
    evaluationId,
    userId,
    feedbackId,
    performedBy,
  }: {
    attemptId: string;
    evaluationId: string;
    userId: string;
    feedbackId: string;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.attemptId = attemptId;
    this.evaluationId = evaluationId;
    this.userId = userId;
    this.feedbackId = feedbackId;
  }

  public get catalogName(): "grade.feedbackReady" {
    return "grade.feedbackReady";
  }

  public toCatalogPayload(): GradeFeedbackReadyPayload {
    return {
      ...catalogMeta(this),
      attemptId: this.attemptId,
      evaluationId: this.evaluationId,
      userId: this.userId,
      feedbackId: this.feedbackId,
    };
  }
}
