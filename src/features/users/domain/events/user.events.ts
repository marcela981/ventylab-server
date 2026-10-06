/*
 * Funcionalidad: Eventos de usuario
 * Descripción: Eventos de dominio de creación, actualización de perfil, cambio de contraseña y cambio de rol del usuario; incluye UserStatusChangedEvent y UserGoogleAccountLinkedEvent
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type User } from "@/features/users/domain/entities/user.entity";

export class UserCreatedEvent extends DomainEvent {
  public readonly entity: User;

  public constructor({ entity, performedBy }: { entity: User; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class UserProfileUpdatedEvent extends DomainEvent {
  public readonly entity: User;
  public readonly changes: Record<string, { before: unknown; after: unknown }>;

  public constructor({
    entity,
    changes,
    performedBy,
  }: {
    entity: User;
    changes: Record<string, { before: unknown; after: unknown }>;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  public readonly entity: User;

  public constructor({ entity, performedBy }: { entity: User; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class UserRoleChangedEvent extends DomainEvent {
  public readonly entity: User;
  public readonly previousRole: string;
  public readonly newRole: string;

  public constructor({
    entity,
    previousRole,
    newRole,
    performedBy,
  }: {
    entity: User;
    previousRole: string;
    newRole: string;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.entity = entity;
    this.previousRole = previousRole;
    this.newRole = newRole;
  }
}

export class UserStatusChangedEvent extends DomainEvent {
  public readonly entity: User;
  public readonly isActive: boolean;

  public constructor({ entity, isActive, performedBy }: { entity: User; isActive: boolean; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.isActive = isActive;
  }
}

export class UserGoogleAccountLinkedEvent extends DomainEvent {
  public readonly entity: User;

  public constructor({ entity, performedBy }: { entity: User; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
