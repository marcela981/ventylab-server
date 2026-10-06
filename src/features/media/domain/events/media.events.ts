/*
 * Funcionalidad: Eventos de dominio de media
 * Descripción: Define los eventos emitidos cuando un archivo de media se carga o se elimina
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Media } from "@/features/media/domain/entities/media.entity";

export class MediaUploadedEvent extends DomainEvent {
  public readonly entity: Media;

  public constructor({ entity, performedBy }: { entity: Media; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class MediaDeletedEvent extends DomainEvent {
  public readonly entity: Media;

  public constructor({ entity, performedBy }: { entity: Media; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
