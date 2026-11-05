/*
 * Funcionalidad: Eventos de miembro de grupo
 * Descripción: Eventos de dominio del agregado GroupMember (agregado al grupo, rol cambiado, removido del grupo); v1.1: estudiante agregado a un grupo STUDENT, publicado también como evento de catálogo group.studentAdded
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { catalogMeta, type CatalogDomainEvent, type GroupStudentAddedPayload } from "@/common/domain/events/domain-event-catalog";
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

// Published once a student joins a STUDENT group, also under the catalog name group.studentAdded (notifications).
export class GroupStudentAddedEvent extends DomainEvent implements CatalogDomainEvent<"group.studentAdded"> {
  public readonly groupId: string;
  public readonly groupName: string;
  public readonly userId: string;

  public constructor({ groupId, groupName, userId, performedBy }: { groupId: string; groupName: string; userId: string; performedBy?: string }) {
    super({ performedBy });
    this.groupId = groupId;
    this.groupName = groupName;
    this.userId = userId;
  }

  public get catalogName(): "group.studentAdded" {
    return "group.studentAdded";
  }

  public toCatalogPayload(): GroupStudentAddedPayload {
    return { ...catalogMeta(this), groupId: this.groupId, groupName: this.groupName, userId: this.userId };
  }
}
