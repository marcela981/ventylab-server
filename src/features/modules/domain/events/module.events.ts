/*
 * Funcionalidad: Eventos de dominio de módulos
 * Descripción: Define los eventos ModuleCreatedEvent, ModuleUpdatedEvent, ModuleDeactivatedEvent, ModulePrerequisiteAddedEvent, ModulePrerequisiteRemovedEvent, ModuleNodeCreatedEvent y otros publicados por el bus de eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Module, type ModuleChanges } from "@/features/modules/domain/entities/module.entity";

export class ModuleCreatedEvent extends DomainEvent {
  public readonly entity: Module;

  public constructor({ entity, performedBy }: { entity: Module; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ModuleUpdatedEvent extends DomainEvent {
  public readonly entity: Module;
  public readonly changes: ModuleChanges;

  public constructor({ entity, changes, performedBy }: { entity: Module; changes: ModuleChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class ModuleDeactivatedEvent extends DomainEvent {
  public readonly entity: Module;

  public constructor({ entity, performedBy }: { entity: Module; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ModulePrerequisiteAddedEvent extends DomainEvent {
  public readonly entity: Module;
  public readonly prerequisiteId: string;

  public constructor({ entity, prerequisiteId, performedBy }: { entity: Module; prerequisiteId: string; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.prerequisiteId = prerequisiteId;
  }
}

export class ModulePrerequisiteRemovedEvent extends DomainEvent {
  public readonly entity: Module;
  public readonly prerequisiteId: string;

  public constructor({ entity, prerequisiteId, performedBy }: { entity: Module; prerequisiteId: string; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.prerequisiteId = prerequisiteId;
  }
}

export class ModuleNodeCreatedEvent extends DomainEvent {
  public readonly entity: Module;

  public constructor({ entity, performedBy }: { entity: Module; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ModuleNodeUpdatedEvent extends DomainEvent {
  public readonly entity: Module;
  public readonly changes: ModuleChanges;

  public constructor({ entity, changes, performedBy }: { entity: Module; changes: ModuleChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class ModuleNodeDeletedEvent extends DomainEvent {
  public readonly moduleId: string;

  public constructor({ moduleId, performedBy }: { moduleId: string; performedBy?: string }) {
    super({ performedBy });
    this.moduleId = moduleId;
  }
}
