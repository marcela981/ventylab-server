/*
 * Funcionalidad: Manejadores realtime de simulación
 * Descripción: Difunden por IRealtimePublisher `ventilator:reserved` y `ventilator:released` a todos los clientes cuando se reserva o libera el ventilador físico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { VENTILATOR_RELEASED_EVENT, VENTILATOR_RESERVED_EVENT } from "@/features/simulation/application/realtime/ventilator-realtime-events";
import { VentilatorReleasedEvent, VentilatorReservedEvent } from "@/features/simulation/domain/events/ventilator-reservation.events";

@Injectable()
export class SimulationRealtimeHandlers {
  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  @OnEvent(VentilatorReservedEvent.name)
  public handleVentilatorReserved(event: VentilatorReservedEvent): void {
    this._realtimePublisher.broadcast(VENTILATOR_RESERVED_EVENT, {
      userId: event.entity.userId,
      userName: event.holderName ?? null,
      reservationId: event.entity.id,
      groupId: event.entity.groupId ?? null,
      leaderId: event.entity.leaderId ?? null,
      endTime: event.entity.endTime.getTime(),
    });
  }

  @OnEvent(VentilatorReleasedEvent.name)
  public handleVentilatorReleased(event: VentilatorReleasedEvent): void {
    this._realtimePublisher.broadcast(VENTILATOR_RELEASED_EVENT, { userId: event.entity.userId });
  }
}
