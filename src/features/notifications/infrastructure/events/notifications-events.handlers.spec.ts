/*
 * Funcionalidad: Pruebas de los suscriptores de notificaciones
 * Descripción: Verifica por cada evento de catálogo los destinatarios, el tipo y el texto de plantilla, la expansión de grupos en una sola inserción en lote, persistir antes de emitir notification:new, el aviso de ventilador fuera de línea solo a titulares de la reserva activa y que los errores se registran sin propagarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { type CatalogEventMeta, type ReservationCancelledPayload } from "@/common/domain/events/domain-event-catalog";
import { NOTIFICATION_NEW_REALTIME_EVENT } from "@/features/notifications/application/results/notification.result";
import { NotificationRecipientsService } from "@/features/notifications/application/services/notification-recipients.service";
import {
  groupsFacadeWithMembers,
  InMemoryNotificationsRepository,
  recordingRealtimePublisher,
  reservationsFacadeWithActive,
} from "@/features/notifications/application/testing/notifications-test-doubles-spec";
import { DeliverNotificationsUseCase } from "@/features/notifications/application/use-cases/deliver-notifications.usecase";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { NotificationsEventsHandlers } from "@/features/notifications/infrastructure/events/notifications-events.handlers";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";

const META: CatalogEventMeta = { eventId: "event-1", occurredAt: new Date("2026-10-11T15:00:00.000Z"), actorId: "teacher-1" };
const STARTS_AT: Date = new Date("2026-10-12T13:00:00.000Z");
const ENDS_AT: Date = new Date("2026-10-12T14:00:00.000Z");

interface Harness {
  handlers: NotificationsEventsHandlers;
  repository: InMemoryNotificationsRepository;
  emitToUser: jest.Mock;
  calls: string[];
}

function harness(options: { members?: Record<string, string[]>; active?: ActiveReservationSummary; activeHolders?: string[] } = {}): Harness {
  const repository: InMemoryNotificationsRepository = new InMemoryNotificationsRepository();
  const { publisher, emitToUser } = recordingRealtimePublisher(repository.calls);
  const recipients: NotificationRecipientsService = new NotificationRecipientsService(
    groupsFacadeWithMembers(options.members ?? {}),
    reservationsFacadeWithActive(options.active, options.activeHolders ?? []),
  );
  const handlers: NotificationsEventsHandlers = new NotificationsEventsHandlers(recipients, new DeliverNotificationsUseCase(repository, publisher));

  return { handlers, repository, emitToUser, calls: repository.calls };
}

function recipientsOf(repository: InMemoryNotificationsRepository): string[] {
  return repository.rows.map((row: Notification) => row.userId);
}

describe("NotificationsEventsHandlers", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("notifies a preempted user holder, persisting before emitting notification:new", async () => {
    const { handlers, repository, emitToUser, calls } = harness();

    await handlers.handleReservationPreempted({
      ...META,
      reservationId: "reservation-1",
      previousHolder: { type: "USER", userId: "student-1" },
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      wasActive: false,
      reason: "Clase práctica",
      preemptedById: "teacher-1",
      replacedByReservationId: "reservation-2",
    });

    expect(recipientsOf(repository)).toEqual(["student-1"]);
    expect(repository.rows[0].type).toBe("RESERVATION_PREEMPTED");
    expect(repository.rows[0].title).toBe("Tu reserva del ventilador fue desplazada");
    expect(repository.rows[0].body).toContain("Motivo: Clase práctica");
    expect(repository.rows[0].data).toEqual({ reservationId: "reservation-1", replacedByReservationId: "reservation-2" });
    expect(calls).toEqual(["createMany", `emit:${NOTIFICATION_NEW_REALTIME_EVENT}:student-1`]);
    expect(emitToUser).toHaveBeenCalledWith("student-1", NOTIFICATION_NEW_REALTIME_EVENT, expect.objectContaining({ id: repository.rows[0].id, readAt: null }));
  });

  it("expands a group holder into its members with a single batch insert", async () => {
    const { handlers, repository } = harness({ members: { "group-1": ["student-1", "student-2", "student-3"] } });

    await handlers.handleReservationPreempted({
      ...META,
      reservationId: "reservation-1",
      previousHolder: { type: "GROUP", groupId: "group-1" },
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      wasActive: true,
      preemptedById: "teacher-1",
      replacedByReservationId: "reservation-2",
    });

    expect(repository.createManyCalls).toHaveLength(1);
    expect(recipientsOf(repository)).toEqual(["student-1", "student-2", "student-3"]);
  });

  it("notifies the group members of an assigned evaluation except the assigning actor, phrased as available from its start", async () => {
    const { handlers, repository } = harness({ members: { "group-1": ["student-1", "teacher-1", "student-2"] } });

    await handlers.handleEvaluationActivated({
      ...META,
      assignmentId: "assignment-1",
      evaluationId: "evaluation-1",
      groupId: "group-1",
      title: "Parcial 1",
      type: "EXAM",
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
    });

    expect(repository.createManyCalls).toHaveLength(1);
    expect(recipientsOf(repository)).toEqual(["student-1", "student-2"]);
    expect(repository.rows[0].type).toBe("EVALUATION_ACTIVATED");
    expect(repository.rows[0].title).toBe("Nueva evaluación asignada");
    expect(repository.rows[0].body).toContain("\"Parcial 1\", disponible desde el");
    expect(repository.rows[0].data).toEqual({ evaluationId: "evaluation-1", assignmentId: "assignment-1" });
  });

  it("notifies the holder of a reservation cancelled by someone else and nobody when the holder cancels it", async () => {
    const { handlers, repository } = harness();
    const cancelled: Omit<ReservationCancelledPayload, keyof CatalogEventMeta> = { reservationId: "reservation-1", holder: { type: "USER", userId: "student-1" }, startsAt: STARTS_AT, endsAt: ENDS_AT, wasActive: false };

    await handlers.handleReservationCancelled({ ...META, actorId: "student-1", ...cancelled });
    await handlers.handleReservationCancelled({ ...META, actorId: "admin-1", ...cancelled });

    expect(recipientsOf(repository)).toEqual(["student-1"]);
    expect(repository.rows[0].type).toBe("RESERVATION_CANCELLED");
    expect(repository.createManyCalls).toHaveLength(1);
  });

  it.each([
    [
      "grade.published",
      (handlers: NotificationsEventsHandlers): Promise<void> =>
        handlers.handleGradePublished({
          ...META,
          attemptId: "attempt-1",
          evaluationId: "evaluation-1",
          userId: "student-1",
          score: 8,
          maxScore: 10,
          grade: 4,
          passed: true,
          publishedAt: STARTS_AT,
        }),
      "GRADE_PUBLISHED",
      "Calificación publicada",
    ],
    [
      "grade.feedbackReady",
      (handlers: NotificationsEventsHandlers): Promise<void> =>
        handlers.handleFeedbackReady({ ...META, attemptId: "attempt-1", evaluationId: "evaluation-1", userId: "student-1", feedbackId: "feedback-1" }),
      "FEEDBACK_READY",
      "Retroalimentación disponible",
    ],
    [
      "user.roleChanged",
      (handlers: NotificationsEventsHandlers): Promise<void> => handlers.handleRoleChanged({ ...META, userId: "student-1", previousRole: "STUDENT", newRole: "TEACHER" }),
      "ROLE_CHANGED",
      "Tu rol cambió",
    ],
  ])("notifies the target user of %s", async (_name: string, act: (handlers: NotificationsEventsHandlers) => Promise<void>, type: string, title: string) => {
    const { handlers, repository, emitToUser } = harness();

    await act(handlers);

    expect(recipientsOf(repository)).toEqual(["student-1"]);
    expect(repository.rows[0].type).toBe(type);
    expect(repository.rows[0].title).toBe(title);
    expect(emitToUser).toHaveBeenCalledTimes(1);
  });

  it("notifies only the holders of the active reservation when the ventilator goes offline", async () => {
    const active: ActiveReservationSummary = { id: "reservation-1", holderType: "GROUP", groupId: "group-1", createdById: "teacher-1", startsAt: STARTS_AT, endsAt: ENDS_AT };
    const { handlers, repository } = harness({ active, activeHolders: ["student-1", "student-2"], members: { "group-2": ["student-9"] } });

    await handlers.handleDeviceOffline({ ...META, reason: "heartbeat_timeout" });

    expect(recipientsOf(repository)).toEqual(["student-1", "student-2"]);
    expect(repository.rows[0].type).toBe("VENTILATOR_OFFLINE");
    expect(repository.rows[0].data).toEqual({ reservationId: "reservation-1", reason: "heartbeat_timeout" });
  });

  it("notifies nobody when the ventilator goes offline without an active reservation", async () => {
    const { handlers, repository, emitToUser } = harness();

    await handlers.handleDeviceOffline({ ...META, reason: "heartbeat_timeout" });

    expect(repository.createManyCalls).toHaveLength(0);
    expect(emitToUser).not.toHaveBeenCalled();
  });

  it("logs a delivery failure without rejecting and emits nothing", async () => {
    const { handlers, repository, emitToUser } = harness();

    jest.spyOn(repository, "createMany").mockRejectedValue(new TypeError("db down"));

    await expect(handlers.handleRoleChanged({ ...META, userId: "student-1", previousRole: "STUDENT", newRole: "TEACHER" })).resolves.toBeUndefined();

    expect(emitToUser).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("Notification delivery failed for user.roleChanged event event-1 (TypeError)");
  });
});
