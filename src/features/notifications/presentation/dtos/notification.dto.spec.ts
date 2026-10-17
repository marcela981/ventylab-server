/*
 * Funcionalidad: Pruebas del contrato de datos de notificaciones
 * Descripción: Verifica que cada tipo de notificación tiene una variante documentada y que las claves de data que producen las plantillas coinciden con las propiedades documentadas del DTO de datos de su variante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import "reflect-metadata";

import { type CatalogEventMeta } from "@/common/domain/events/domain-event-catalog";
import { type NotificationContent } from "@/features/notifications/domain/entities/notification.entity";
import { NOTIFICATION_TEMPLATES } from "@/features/notifications/domain/services/notification-templates";
import { type NotificationTypeValue, NOTIFICATION_TYPES } from "@/features/notifications/domain/value-objects/notification-type";
import { NOTIFICATION_VARIANT_DTOS } from "@/features/notifications/presentation/dtos/notification.dto";

const SWAGGER_PROPERTIES_ARRAY: string = "swagger/apiModelPropertiesArray";
const SWAGGER_PROPERTIES: string = "swagger/apiModelProperties";
const META: CatalogEventMeta = { eventId: "event-1", occurredAt: new Date("2026-10-11T15:00:00.000Z"), actorId: "teacher-1" };
const STARTS_AT: Date = new Date("2026-10-12T13:00:00.000Z");
const ENDS_AT: Date = new Date("2026-10-12T14:00:00.000Z");

const CONTENTS: NotificationContent[] = [
  NOTIFICATION_TEMPLATES.reservationPreempted({ ...META, reservationId: "r-1", previousHolder: { type: "USER", userId: "s-1" }, startsAt: STARTS_AT, endsAt: ENDS_AT, wasActive: false, preemptedById: "t-1", replacedByReservationId: "r-2" }),
  NOTIFICATION_TEMPLATES.reservationCancelled({ ...META, reservationId: "r-1", holder: { type: "USER", userId: "s-1" }, startsAt: STARTS_AT, endsAt: ENDS_AT, wasActive: false }),
  NOTIFICATION_TEMPLATES.evaluationActivated({ ...META, assignmentId: "a-1", evaluationId: "e-1", groupId: "g-1", title: "Parcial 1", type: "EXAM", startsAt: STARTS_AT, endsAt: ENDS_AT }),
  NOTIFICATION_TEMPLATES.gradePublished({ ...META, attemptId: "at-1", evaluationId: "e-1", userId: "s-1", score: 8, maxScore: 10, grade: 4, passed: true, publishedAt: STARTS_AT }),
  NOTIFICATION_TEMPLATES.feedbackReady({ ...META, attemptId: "at-1", evaluationId: "e-1", userId: "s-1", feedbackId: "f-1" }),
  NOTIFICATION_TEMPLATES.roleChanged({ ...META, userId: "s-1", previousRole: "STUDENT", newRole: "TEACHER" }),
  NOTIFICATION_TEMPLATES.ventilatorOffline({ ...META, reason: "heartbeat_timeout" }, "r-1"),
];

function documentedDataKeys(type: NotificationTypeValue): string[] {
  const variant: new () => object = NOTIFICATION_VARIANT_DTOS[type];
  const dataProperty: { type?: unknown } | undefined = Reflect.getMetadata(SWAGGER_PROPERTIES, variant.prototype, "data") as { type?: unknown } | undefined;
  const dataDTO: unknown = dataProperty?.type;

  if (typeof dataDTO !== "function") {
    return [];
  }

  const keys: string[] = (Reflect.getMetadata(SWAGGER_PROPERTIES_ARRAY, (dataDTO as { prototype: object }).prototype) as string[] | undefined) ?? [];

  return keys.map((key: string): string => key.replace(/^:/, "")).sort();
}

describe("Notification DTO contract", () => {
  it("documents one variant per notification type", () => {
    const variantTypes: string[] = Object.keys(NOTIFICATION_VARIANT_DTOS).sort();

    expect(variantTypes).toEqual([...NOTIFICATION_TYPES].sort());
  });

  it.each(CONTENTS.map((content: NotificationContent): [string, NotificationContent] => [content.type, content]))("documents the data keys produced for %s", (_type: string, content: NotificationContent) => {
    const producedKeys: string[] = Object.keys(content.data ?? {}).sort();

    const documentedKeys: string[] = documentedDataKeys(content.type);

    expect(documentedKeys).toEqual(producedKeys);
  });
});
