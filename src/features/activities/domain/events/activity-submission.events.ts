/*
 * Funcionalidad: Eventos de entrega de actividad
 * Descripción: Eventos de dominio del agregado ActivitySubmission (iniciada, borrador guardado, enviada, calificada, reiniciada); el evento de calificación lleva los datos de la actividad para registrar la nota en la tabla de calificaciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";

export class ActivitySubmissionStartedEvent extends DomainEvent {
  public readonly entity: ActivitySubmission;

  public constructor({ entity, performedBy }: { entity: ActivitySubmission; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivitySubmissionDraftSavedEvent extends DomainEvent {
  public readonly entity: ActivitySubmission;

  public constructor({ entity, performedBy }: { entity: ActivitySubmission; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivitySubmissionSubmittedEvent extends DomainEvent {
  public readonly entity: ActivitySubmission;

  public constructor({ entity, performedBy }: { entity: ActivitySubmission; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class ActivitySubmissionGradedEvent extends DomainEvent {
  public readonly entity: ActivitySubmission;
  public readonly activityType: string;
  public readonly activityTitle: string;

  public constructor({
    entity,
    activityType,
    activityTitle,
    performedBy,
  }: {
    entity: ActivitySubmission;
    activityType: string;
    activityTitle: string;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.entity = entity;
    this.activityType = activityType;
    this.activityTitle = activityTitle;
  }
}

export class ActivitySubmissionResetEvent extends DomainEvent {
  public readonly entity: ActivitySubmission;

  public constructor({ entity, performedBy }: { entity: ActivitySubmission; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
