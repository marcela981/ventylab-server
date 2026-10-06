/*
 * Funcionalidad: Eventos de calificación
 * Descripción: Eventos de dominio del agregado Score (registrada, actualizada, eliminada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Score } from "@/features/scores/domain/entities/score.entity";

export class ScoreRecordedEvent extends DomainEvent {
  public readonly entity: Score;

  public constructor({ entity, performedBy }: { entity: Score; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ScoreUpdatedEvent extends DomainEvent {
  public readonly entity: Score;

  public constructor({ entity, performedBy }: { entity: Score; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ScoreDeletedEvent extends DomainEvent {
  public readonly entity: Score;

  public constructor({ entity, performedBy }: { entity: Score; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
