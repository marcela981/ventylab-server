/*
 * Funcionalidad: Eventos de intento de quiz
 * Descripción: Evento de dominio QuizAttemptedEvent publicado cuando un usuario registra su intento de un quiz
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type QuizAttempt } from "@/features/quizzes/domain/entities/quiz-attempt.entity";

export class QuizAttemptedEvent extends DomainEvent {
  public readonly entity: QuizAttempt;

  public constructor({ entity, performedBy }: { entity: QuizAttempt; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
