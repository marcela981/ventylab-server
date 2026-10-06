/*
 * Funcionalidad: Eventos de dominio de secciones
 * Descripción: Define SectionCreatedEvent y SectionUpdatedEvent, publicados por el agregado Section al crearse o modificarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Section, type SectionChanges } from "@/features/sections/domain/entities/section.entity";

export class SectionCreatedEvent extends DomainEvent {
  public readonly entity: Section;

  public constructor({ entity, performedBy }: { entity: Section; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class SectionUpdatedEvent extends DomainEvent {
  public readonly entity: Section;
  public readonly changes: SectionChanges;

  public constructor({ entity, changes, performedBy }: { entity: Section; changes: SectionChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}
