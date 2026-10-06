/*
 * Funcionalidad: Eventos de dominio de pasos (tarjetas)
 * Descripción: Define los eventos StepCreatedEvent, StepUpdatedEvent, StepDeactivatedEvent, StepOrderChangedEvent, StepsReorderedEvent publicados por el bus de eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type Step, type StepChanges } from "@/features/steps/domain/entities/step.entity";

export class StepCreatedEvent extends DomainEvent {
  public readonly entity: Step;

  public constructor({ entity, performedBy }: { entity: Step; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class StepUpdatedEvent extends DomainEvent {
  public readonly entity: Step;
  public readonly changes: StepChanges;

  public constructor({ entity, changes, performedBy }: { entity: Step; changes: StepChanges; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
    this.changes = changes;
  }
}

export class StepDeactivatedEvent extends DomainEvent {
  public readonly entity: Step;

  public constructor({ entity, performedBy }: { entity: Step; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class StepOrderChangedEvent extends DomainEvent {
  public readonly entity: Step;
  public readonly previousOrder: number;
  public readonly newOrder: number;

  public constructor({
    entity,
    previousOrder,
    newOrder,
    performedBy,
  }: {
    entity: Step;
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

export class StepsReorderedEvent extends DomainEvent {
  public readonly lessonId: string;
  public readonly previousOrder: Record<string, number>;
  public readonly newOrder: Record<string, number>;

  public constructor({
    lessonId,
    previousOrder,
    newOrder,
    performedBy,
  }: {
    lessonId: string;
    previousOrder: Record<string, number>;
    newOrder: Record<string, number>;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.lessonId = lessonId;
    this.previousOrder = previousOrder;
    this.newOrder = newOrder;
  }
}
