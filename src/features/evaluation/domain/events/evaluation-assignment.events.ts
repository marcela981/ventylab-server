/*
 * Funcionalidad: Eventos de dominio de asignaciones de evaluación
 * Descripción: Evento emitido al activar una evaluación para un grupo, con los datos que la notificación en tiempo real envía a la sala del grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export class EvaluationActivatedEvent extends DomainEvent {
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
}
