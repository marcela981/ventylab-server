/*
 * Funcionalidad: Eventos de grupo
 * Descripción: Eventos de dominio del agregado Group (creado, actualizado, líder del simulador cambiado, eliminado)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Group } from "@/features/groups/domain/entities/group.entity";

export class GroupCreatedEvent extends DomainEvent {
  public readonly entity: Group;

  public constructor({ entity, performedBy }: { entity: Group; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class GroupUpdatedEvent extends DomainEvent {
  public readonly entity: Group;

  public constructor({ entity, performedBy }: { entity: Group; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class GroupSimulatorLeadChangedEvent extends DomainEvent {
  public readonly entity: Group;

  public constructor({ entity, performedBy }: { entity: Group; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class GroupDeletedEvent extends DomainEvent {
  public readonly entity: Group;

  public constructor({ entity, performedBy }: { entity: Group; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
