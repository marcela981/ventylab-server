/*
 * Funcionalidad: Eventos de dominio de niveles
 * Descripción: Define los eventos LevelCreatedEvent, LevelUpdatedEvent, LevelDeactivatedEvent, LevelOrderChangedEvent, LevelsReorderedEvent, LevelPrerequisiteAddedEvent y otros publicados por el bus de eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Level, type LevelChanges } from "@/features/levels/domain/entities/level.entity";

export class LevelCreatedEvent extends DomainEvent {
  public readonly entity: Level;

  public constructor({ entity, performedBy }: { entity: Level; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class LevelUpdatedEvent extends DomainEvent {
  public readonly entity: Level;
  public readonly changes: LevelChanges;

  public constructor({ entity, changes, performedBy }: { entity: Level; changes: LevelChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class LevelDeactivatedEvent extends DomainEvent {
  public readonly entity: Level;

  public constructor({ entity, performedBy }: { entity: Level; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class LevelOrderChangedEvent extends DomainEvent {
  public readonly entity: Level;
  public readonly previousOrder: number;
  public readonly newOrder: number;

  public constructor({
    entity,
    previousOrder,
    newOrder,
    performedBy,
  }: {
    entity: Level;
    previousOrder: number;
    newOrder: number;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.entity = entity;
    this.previousOrder = previousOrder;
    this.newOrder = newOrder;
  }
}

export class LevelsReorderedEvent extends DomainEvent {
  public readonly previousOrder: Record<string, number>;
  public readonly newOrder: Record<string, number>;

  public constructor({
    previousOrder,
    newOrder,
    performedBy,
  }: {
    previousOrder: Record<string, number>;
    newOrder: Record<string, number>;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.previousOrder = previousOrder;
    this.newOrder = newOrder;
  }
}

export class LevelPrerequisiteAddedEvent extends DomainEvent {
  public readonly entity: Level;
  public readonly prerequisiteLevelId: string;
  public readonly prerequisiteTitle: string;

  public constructor({
    entity,
    prerequisiteLevelId,
    prerequisiteTitle,
    performedBy,
  }: {
    entity: Level;
    prerequisiteLevelId: string;
    prerequisiteTitle: string;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.entity = entity;
    this.prerequisiteLevelId = prerequisiteLevelId;
    this.prerequisiteTitle = prerequisiteTitle;
  }
}

export class LevelPrerequisiteRemovedEvent extends DomainEvent {
  public readonly entity: Level;
  public readonly prerequisiteLevelId: string;
  public readonly prerequisiteTitle: string;

  public constructor({
    entity,
    prerequisiteLevelId,
    prerequisiteTitle,
    performedBy,
  }: {
    entity: Level;
    prerequisiteLevelId: string;
    prerequisiteTitle: string;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.entity = entity;
    this.prerequisiteLevelId = prerequisiteLevelId;
    this.prerequisiteTitle = prerequisiteTitle;
  }
}

export class LevelNodeCreatedEvent extends DomainEvent {
  public readonly entity: Level;

  public constructor({ entity, performedBy }: { entity: Level; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class LevelNodeUpdatedEvent extends DomainEvent {
  public readonly entity: Level;
  public readonly changes: LevelChanges;

  public constructor({ entity, changes, performedBy }: { entity: Level; changes: LevelChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class LevelNodeDeletedEvent extends DomainEvent {
  public readonly levelId: string;

  public constructor({ levelId, performedBy }: { levelId: string; performedBy?: string }) {
    super({ performedBy });
    this.levelId = levelId;
  }
}
