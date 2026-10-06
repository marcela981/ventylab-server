/*
 * Funcionalidad: Evento LessonCompletedEvent
 * Descripción: Evento de dominio publicado cuando un usuario completa una lección por primera vez; indica si con ello completó el módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

export class LessonCompletedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly lessonId: string;
  public readonly moduleId: string;
  public readonly moduleCompleted: boolean;

  public constructor({
    userId,
    lessonId,
    moduleId,
    moduleCompleted,
  }: {
    userId: string;
    lessonId: string;
    moduleId: string;
    moduleCompleted: boolean;
  }) {
    super({ performedBy: userId });
    this.userId = userId;
    this.lessonId = lessonId;
    this.moduleId = moduleId;
    this.moduleCompleted = moduleCompleted;
  }
}
