/*
 * Funcionalidad: Eventos de actividad
 * Descripción: Eventos de dominio del agregado Activity (creada, actualizada, desactivada, publicada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";

export class ActivityCreatedEvent extends DomainEvent {
  public readonly entity: Activity;

  public constructor({ entity, performedBy }: { entity: Activity; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivityUpdatedEvent extends DomainEvent {
  public readonly entity: Activity;

  public constructor({ entity, performedBy }: { entity: Activity; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivityDeactivatedEvent extends DomainEvent {
  public readonly entity: Activity;

  public constructor({ entity, performedBy }: { entity: Activity; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivityPublishedEvent extends DomainEvent {
  public readonly entity: Activity;

  public constructor({ entity, performedBy }: { entity: Activity; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
