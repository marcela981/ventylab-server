/*
 * Funcionalidad: Eventos de dominio de personalizaciones de contenido por estudiante
 * Descripción: Define los eventos ContentOverrideCreatedEvent, ContentOverrideUpdatedEvent, ContentOverrideDeactivatedEvent publicados por el bus de eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type ContentOverride, type ContentOverrideChanges } from "@/features/overrides/domain/entities/content-override.entity";

export class ContentOverrideCreatedEvent extends DomainEvent {
  public readonly entity: ContentOverride;

  public constructor({ entity, performedBy }: { entity: ContentOverride; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ContentOverrideUpdatedEvent extends DomainEvent {
  public readonly entity: ContentOverride;
  public readonly changes: ContentOverrideChanges;

  public constructor({ entity, changes, performedBy }: { entity: ContentOverride; changes: ContentOverrideChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class ContentOverrideDeactivatedEvent extends DomainEvent {
  public readonly entity: ContentOverride;

  public constructor({ entity, performedBy }: { entity: ContentOverride; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
