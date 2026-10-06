/*
 * Funcionalidad: Eventos de intento de evaluación
 * Descripción: Evento de dominio ClinicalCaseEvaluatedEvent publicado cuando se registra la evaluación de la configuración de un estudiante en un caso clínico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type EvaluationAttempt } from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";

export class ClinicalCaseEvaluatedEvent extends DomainEvent {
  public readonly entity: EvaluationAttempt;

  public constructor({ entity, performedBy }: { entity: EvaluationAttempt; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
