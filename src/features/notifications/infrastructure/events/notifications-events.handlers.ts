/*
 * Funcionalidad: Suscriptores de notificaciones
 * Descripción: Escuchan los eventos de catálogo (reservas, evaluaciones, calificaciones, rol, ventilador fuera de línea) en segundo plano, resuelven los destinatarios, construyen el texto con las plantillas y entregan las notificaciones con DeliverNotificationsUseCase; atrapan y registran todo error
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type DomainEventCatalog, type DomainEventName } from "@/common/domain/events/domain-event-catalog";
import { type ActiveReservationRecipients, NotificationRecipientsService } from "@/features/notifications/application/services/notification-recipients.service";
import { DeliverNotificationsUseCase } from "@/features/notifications/application/use-cases/deliver-notifications.usecase";
import { type NotificationContent } from "@/features/notifications/domain/entities/notification.entity";
import { NOTIFICATION_TEMPLATES } from "@/features/notifications/domain/services/notification-templates";

function withoutActor(userIds: string[], actorId: string | undefined): string[] {
  return userIds.filter((userId: string): boolean => userId !== actorId);
}

@Injectable()
export class NotificationsEventsHandlers {
  private readonly _logger: Logger = new Logger(NotificationsEventsHandlers.name);

  public constructor(
    private readonly _recipients: NotificationRecipientsService,
    private readonly _deliverNotifications: DeliverNotificationsUseCase,
  ) {}

  @OnEvent("reservation.preempted", { async: true })
  public async handleReservationPreempted(payload: DomainEventCatalog["reservation.preempted"]): Promise<void> {
    await this._run("reservation.preempted", payload.eventId, async (): Promise<void> => {
      const recipients: string[] = await this._recipients.forReservationHolder(payload.previousHolder);

      await this._deliver(withoutActor(recipients, payload.actorId), NOTIFICATION_TEMPLATES.reservationPreempted(payload));
    });
  }

  @OnEvent("reservation.cancelled", { async: true })
  public async handleReservationCancelled(payload: DomainEventCatalog["reservation.cancelled"]): Promise<void> {
    await this._run("reservation.cancelled", payload.eventId, async (): Promise<void> => {
      const recipients: string[] = await this._recipients.forReservationHolder(payload.holder);

      await this._deliver(withoutActor(recipients, payload.actorId), NOTIFICATION_TEMPLATES.reservationCancelled(payload));
    });
  }

  @OnEvent("evaluation.activated", { async: true })
  public async handleEvaluationActivated(payload: DomainEventCatalog["evaluation.activated"]): Promise<void> {
    await this._run("evaluation.activated", payload.eventId, async (): Promise<void> => {
      const recipients: string[] = await this._recipients.forGroup(payload.groupId);

      await this._deliver(withoutActor(recipients, payload.actorId), NOTIFICATION_TEMPLATES.evaluationActivated(payload));
    });
  }

  @OnEvent("grade.published", { async: true })
  public async handleGradePublished(payload: DomainEventCatalog["grade.published"]): Promise<void> {
    await this._run("grade.published", payload.eventId, async (): Promise<void> => {
      await this._deliver([payload.userId], NOTIFICATION_TEMPLATES.gradePublished(payload));
    });
  }

  @OnEvent("grade.feedbackReady", { async: true })
  public async handleFeedbackReady(payload: DomainEventCatalog["grade.feedbackReady"]): Promise<void> {
    await this._run("grade.feedbackReady", payload.eventId, async (): Promise<void> => {
      await this._deliver([payload.userId], NOTIFICATION_TEMPLATES.feedbackReady(payload));
    });
  }

  @OnEvent("user.roleChanged", { async: true })
  public async handleRoleChanged(payload: DomainEventCatalog["user.roleChanged"]): Promise<void> {
    await this._run("user.roleChanged", payload.eventId, async (): Promise<void> => {
      await this._deliver([payload.userId], NOTIFICATION_TEMPLATES.roleChanged(payload));
    });
  }

  @OnEvent("ventilator.deviceOffline", { async: true })
  public async handleDeviceOffline(payload: DomainEventCatalog["ventilator.deviceOffline"]): Promise<void> {
    await this._run("ventilator.deviceOffline", payload.eventId, async (): Promise<void> => {
      const active: ActiveReservationRecipients | undefined = await this._recipients.forActiveReservation(payload.occurredAt);

      if (!active) {
        return;
      }

      await this._deliver(active.userIds, NOTIFICATION_TEMPLATES.ventilatorOffline(payload, active.reservationId));
    });
  }

  private async _deliver(recipients: string[], content: NotificationContent): Promise<void> {
    await this._deliverNotifications.execute(recipients, content);
  }

  private async _run(eventName: DomainEventName, eventId: string, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error: unknown) {
      this._logger.error(`Notification delivery failed for ${eventName} event ${eventId} (${error instanceof Error ? error.name : "UnknownError"})`);
    }
  }
}
