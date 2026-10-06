/*
 * Funcionalidad: Eventos de asignación de actividad
 * Descripción: Eventos de dominio del agregado ActivityAssignment (asignada a un grupo, reasignada, retirada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";

export class ActivityAssignedEvent extends DomainEvent {
  public readonly entity: ActivityAssignment;

  public constructor({ entity, performedBy }: { entity: ActivityAssignment; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivityAssignmentUpdatedEvent extends DomainEvent {
  public readonly entity: ActivityAssignment;

  public constructor({ entity, performedBy }: { entity: ActivityAssignment; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivityAssignmentRemovedEvent extends DomainEvent {
  public readonly entity: ActivityAssignment;

  public constructor({ entity, performedBy }: { entity: ActivityAssignment; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
