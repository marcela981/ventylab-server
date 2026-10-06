/*
 * Funcionalidad: Eventos de miembro de grupo
 * Descripción: Eventos de dominio del agregado GroupMember (agregado al grupo, rol cambiado, removido del grupo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";

export class GroupMemberAddedEvent extends DomainEvent {
  public readonly entity: GroupMember;

  public constructor({ entity, performedBy }: { entity: GroupMember; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class GroupMemberRoleChangedEvent extends DomainEvent {
  public readonly entity: GroupMember;

  public constructor({ entity, performedBy }: { entity: GroupMember; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class GroupMemberRemovedEvent extends DomainEvent {
  public readonly entity: GroupMember;

  public constructor({ entity, performedBy }: { entity: GroupMember; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
