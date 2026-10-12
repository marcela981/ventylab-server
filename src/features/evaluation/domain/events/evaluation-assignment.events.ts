/*
 * Funcionalidad: Eventos de dominio de asignaciones de evaluación
 * Descripción: Evento emitido al activar una evaluación para un grupo, con los datos que la notificación en tiempo real envía a la sala del grupo; se publica también como evaluation.activated
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type CatalogDomainEvent, catalogMeta, type EvaluationActivatedPayload } from "@/common/domain/events/domain-event-catalog";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export class EvaluationActivatedEvent extends DomainEvent implements CatalogDomainEvent<"evaluation.activated"> {
  public readonly assignmentId: string;
  public readonly evaluationId: string;
  public readonly groupId: string;
  public readonly title: string;
  public readonly type: EvaluationTypeValue;
  public readonly startsAt: Date;
  public readonly endsAt: Date;

  public constructor({
    assignmentId,
    evaluationId,
    groupId,
    title,
    type,
    startsAt,
    endsAt,
    performedBy,
  }: {
    assignmentId: string;
    evaluationId: string;
    groupId: string;
    title: string;
    type: EvaluationTypeValue;
    startsAt: Date;
    endsAt: Date;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.assignmentId = assignmentId;
    this.evaluationId = evaluationId;
    this.groupId = groupId;
    this.title = title;
    this.type = type;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
  }

  public get catalogName(): "evaluation.activated" {
    return "evaluation.activated";
  }

  public toCatalogPayload(): EvaluationActivatedPayload {
    return {
      ...catalogMeta(this),
      assignmentId: this.assignmentId,
      evaluationId: this.evaluationId,
      groupId: this.groupId,
      title: this.title,
      type: this.type,
      startsAt: this.startsAt,
      endsAt: this.endsAt,
    };
  }
}
