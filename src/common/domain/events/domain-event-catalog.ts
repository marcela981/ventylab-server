/*
 * Funcionalidad: Catálogo tipado de eventos de dominio
 * Descripción: Mapa nombre de catálogo -> carga útil de los eventos de dominio que consumen los suscriptores transversales (notificaciones, auditoría, analítica), el contrato CatalogDomainEvent que implementan los eventos publicados también bajo un nombre de catálogo y la guarda de tipo que usa el bus
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DomainEvent } from "@/common/domain/events/domain-event";

export interface CatalogEventMeta {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly actorId?: string;
}

export interface CatalogReservationHolder {
  readonly type: "USER" | "GROUP";
  readonly userId?: string;
  readonly groupId?: string;
}

export interface ReservationCreatedPayload extends CatalogEventMeta {
  readonly reservationId: string;
  readonly holder: CatalogReservationHolder;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly createdById: string;
}

export interface ReservationCancelledPayload extends CatalogEventMeta {
  readonly reservationId: string;
  readonly holder: CatalogReservationHolder;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly wasActive: boolean;
}

export interface ReservationPreemptedPayload extends CatalogEventMeta {
  readonly reservationId: string;
  readonly previousHolder: CatalogReservationHolder;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly wasActive: boolean;
  readonly reason?: string;
  readonly preemptedById: string;
  readonly replacedByReservationId: string;
}

export interface EvaluationActivatedPayload extends CatalogEventMeta {
  readonly assignmentId: string;
  readonly evaluationId: string;
  readonly groupId: string;
  readonly title: string;
  readonly type: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface GradePublishedPayload extends CatalogEventMeta {
  readonly attemptId: string;
  readonly evaluationId: string;
  readonly userId: string;
  readonly score: number;
  readonly maxScore: number;
  readonly grade: number;
  readonly passed: boolean;
  readonly publishedAt: Date;
}

export interface GradeFeedbackReadyPayload extends CatalogEventMeta {
  readonly attemptId: string;
  readonly evaluationId: string;
  readonly userId: string;
  readonly feedbackId: string;
}

export interface EvaluationAttemptResetPayload extends CatalogEventMeta {
  readonly evaluationId: string;
  readonly userId: string;
  readonly title: string;
  readonly extraAttempts: number;
}

export interface UserRoleChangedPayload extends CatalogEventMeta {
  readonly userId: string;
  readonly previousRole: string;
  readonly newRole: string;
}

export interface UserStatusChangedPayload extends CatalogEventMeta {
  readonly userId: string;
  readonly isActive: boolean;
}

export interface VentilatorDeviceOfflinePayload extends CatalogEventMeta {
  readonly reason: string;
  readonly lastMessageAt?: Date;
}

export interface VentilatorDeviceOnlinePayload extends CatalogEventMeta {
  readonly at: Date;
}

export interface DomainEventCatalog {
  "reservation.created": ReservationCreatedPayload;
  "reservation.cancelled": ReservationCancelledPayload;
  "reservation.preempted": ReservationPreemptedPayload;
  "evaluation.activated": EvaluationActivatedPayload;
  "grade.published": GradePublishedPayload;
  "grade.feedbackReady": GradeFeedbackReadyPayload;
  "evaluation.attemptReset": EvaluationAttemptResetPayload;
  "user.roleChanged": UserRoleChangedPayload;
  "user.statusChanged": UserStatusChangedPayload;
  "ventilator.deviceOffline": VentilatorDeviceOfflinePayload;
  "ventilator.deviceOnline": VentilatorDeviceOnlinePayload;
}

export type DomainEventName = keyof DomainEventCatalog;

export interface CatalogDomainEvent<TName extends DomainEventName = DomainEventName> {
  readonly catalogName: TName;
  toCatalogPayload(): DomainEventCatalog[TName];
}

export function catalogMeta(event: DomainEvent): CatalogEventMeta {
  return { eventId: event.id, occurredAt: event.occurredAt, actorId: event.performedBy };
}

export function isCatalogDomainEvent(event: DomainEvent): event is DomainEvent & CatalogDomainEvent {
  const candidate: Partial<CatalogDomainEvent> = event as Partial<CatalogDomainEvent>;

  return typeof candidate.catalogName === "string" && typeof candidate.toCatalogPayload === "function";
}
