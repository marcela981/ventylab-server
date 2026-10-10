/*
 * Funcionalidad: Manejadores de eventos de la telemetría del ventilador
 * Descripción: Refresca de inmediato el acceso a la sala ventilator ante reservas creadas, canceladas, desplazadas o completadas, une al titular que se autentica por Socket.io y atiende el mensaje entrante ventilator:join
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import {
  REALTIME_CLIENT_AUTHENTICATED_EVENT,
  REALTIME_CLIENT_MESSAGE_EVENT,
  type RealtimeClientAuthenticatedPayload,
  type RealtimeClientMessagePayload,
} from "@/common/application/ports/realtime-publisher.interface";
import {
  ReservationCancelledEvent,
  ReservationCompletedEvent,
  ReservationCreatedEvent,
  ReservationPreemptedEvent,
} from "@/features/reservations/domain/events/reservation.events";
import { VENTILATOR_JOIN_MESSAGE } from "@/features/ventilator-telemetry/application/realtime/ventilator-telemetry-events";
import { VentilatorRoomAccessService } from "@/features/ventilator-telemetry/application/services/ventilator-room-access.service";

@Injectable()
export class VentilatorTelemetryEventsHandlers {
  private readonly _logger: Logger = new Logger(VentilatorTelemetryEventsHandlers.name);

  public constructor(private readonly _roomAccess: VentilatorRoomAccessService) {}

  @OnEvent(ReservationCreatedEvent.name)
  @OnEvent(ReservationCancelledEvent.name)
  @OnEvent(ReservationPreemptedEvent.name)
  @OnEvent(ReservationCompletedEvent.name)
  public handleReservationChanged(): void {
    void this._roomAccess.requestRefresh();
  }

  @OnEvent(REALTIME_CLIENT_AUTHENTICATED_EVENT)
  public handleClientAuthenticated(payload: RealtimeClientAuthenticatedPayload): void {
    try {
      this._roomAccess.handleClientAuthenticated({ userId: payload.userId, role: payload.role });
    } catch (error: unknown) {
      this._logger.warn(`Joining the ventilator room on authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @OnEvent(REALTIME_CLIENT_MESSAGE_EVENT)
  public handleClientMessage(message: RealtimeClientMessagePayload): void {
    if (message.event !== VENTILATOR_JOIN_MESSAGE) {
      return;
    }

    try {
      this._roomAccess.handleJoinRequest({ userId: message.userId, role: message.role });
    } catch (error: unknown) {
      this._logger.warn(`Handling ${VENTILATOR_JOIN_MESSAGE} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
