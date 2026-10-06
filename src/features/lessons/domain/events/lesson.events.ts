/*
 * Funcionalidad: Eventos de dominio de lecciones
 * Descripción: Define los eventos LessonCreatedEvent, LessonUpdatedEvent, LessonDeactivatedEvent, LessonBlocksSavedEvent publicados por el bus de eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Lesson, type LessonChanges } from "@/features/lessons/domain/entities/lesson.entity";

export class LessonCreatedEvent extends DomainEvent {
  public readonly entity: Lesson;

  public constructor({ entity, performedBy }: { entity: Lesson; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class LessonUpdatedEvent extends DomainEvent {
  public readonly entity: Lesson;
  public readonly changes: LessonChanges;

  public constructor({ entity, changes, performedBy }: { entity: Lesson; changes: LessonChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class LessonDeactivatedEvent extends DomainEvent {
  public readonly entity: Lesson;

  public constructor({ entity, performedBy }: { entity: Lesson; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class LessonBlocksSavedEvent extends DomainEvent {
  public readonly entity: Lesson;

  public constructor({ entity, performedBy }: { entity: Lesson; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
