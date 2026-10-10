/*
 * Funcionalidad: Manejadores de eventos de los comandos del ventilador
 * Descripción: Revoca de inmediato el control exclusivo cuando la reserva del operador se desplaza, cancela o completa, refresca la reserva activa cuando se crea una, y lleva la presencia del operador con los eventos internos del gateway (autenticación, desconexión del último socket y mensaje entrante ventilator:heartbeat). Solo revoca el control: nunca envía comandos al dispositivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import {
  REALTIME_CLIENT_AUTHENTICATED_EVENT,
  REALTIME_CLIENT_DISCONNECTED_EVENT,
  REALTIME_CLIENT_MESSAGE_EVENT,
  type RealtimeClientAuthenticatedPayload,
  type RealtimeClientDisconnectedPayload,
  type RealtimeClientMessagePayload,
} from "@/common/application/ports/realtime-publisher.interface";
import {
  ReservationCancelledEvent,
  ReservationCompletedEvent,
  ReservationCreatedEvent,
  ReservationPreemptedEvent,
} from "@/features/reservations/domain/events/reservation.events";
import { VENTILATOR_HEARTBEAT_MESSAGE } from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import { OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";

@Injectable()
export class VentilatorCommandsEventsHandlers {
  public constructor(private readonly _operatorControl: OperatorControlService) {}

  @OnEvent(ReservationPreemptedEvent.name)
  public handleReservationPreempted(event: ReservationPreemptedEvent): void {
    this._operatorControl.revokeForReservation(event.reservationId, "reservation_preempted");
  }

  @OnEvent(ReservationCancelledEvent.name)
  @OnEvent(ReservationCompletedEvent.name)
  public handleReservationEnded(event: ReservationCancelledEvent | ReservationCompletedEvent): void {
    this._operatorControl.revokeForReservation(event.reservationId, "reservation_ended");
  }

  @OnEvent(ReservationCreatedEvent.name)
  public handleReservationCreated(): void {
    void this._operatorControl.requestRefresh();
  }

  @OnEvent(REALTIME_CLIENT_AUTHENTICATED_EVENT)
  public handleClientAuthenticated(payload: RealtimeClientAuthenticatedPayload): void {
    this._operatorControl.touch(payload.userId);
  }

  @OnEvent(REALTIME_CLIENT_DISCONNECTED_EVENT)
  public handleClientDisconnected(payload: RealtimeClientDisconnectedPayload): void {
    this._operatorControl.handleDisconnected(payload.userId, payload.remainingSockets);
  }

  @OnEvent(REALTIME_CLIENT_MESSAGE_EVENT)
  public handleClientMessage(message: RealtimeClientMessagePayload): void {
    if (message.event === VENTILATOR_HEARTBEAT_MESSAGE) {
      this._operatorControl.touch(message.userId);
    }
  }
}
