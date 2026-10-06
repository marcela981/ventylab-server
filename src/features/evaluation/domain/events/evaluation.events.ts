/*
 * Funcionalidad: Eventos de dominio de evaluaciones
 * Descripción: Eventos emitidos por el agregado Evaluation al crearse, editarse (datos, escenarios, preguntas, opciones u orden), cambiar de estado y eliminarse físicamente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";

export class EvaluationCreatedEvent extends DomainEvent {
  public readonly evaluationId: string;
  public readonly duplicatedFromId?: string;

  public constructor({ evaluationId, duplicatedFromId, performedBy }: { evaluationId: string; duplicatedFromId?: string; performedBy?: string }) {
    super({ performedBy });
    this.evaluationId = evaluationId;
    this.duplicatedFromId = duplicatedFromId;
  }
}

export class EvaluationUpdatedEvent extends DomainEvent {
  public readonly evaluationId: string;
  public readonly action: string;

  public constructor({ evaluationId, action, performedBy }: { evaluationId: string; action: string; performedBy?: string }) {
    super({ performedBy });
    this.evaluationId = evaluationId;
    this.action = action;
  }
}

export class EvaluationStatusChangedEvent extends DomainEvent {
  public readonly evaluationId: string;
  public readonly from: EvaluationStatusValue;
  public readonly to: EvaluationStatusValue;

  public constructor({
    evaluationId,
    from,
    to,
    performedBy,
  }: {
    evaluationId: string;
    from: EvaluationStatusValue;
    to: EvaluationStatusValue;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.evaluationId = evaluationId;
    this.from = from;
    this.to = to;
  }
}

export class EvaluationDeletedEvent extends DomainEvent {
  public readonly evaluationId: string;

  public constructor({ evaluationId, performedBy }: { evaluationId: string; performedBy?: string }) {
    super({ performedBy });
    this.evaluationId = evaluationId;
  }
}
