/*
 * Funcionalidad: Caso de uso GetSimulationHealthUseCase
 * Descripción: Arma la instantánea de salud del módulo sin E/S: estado y tópico MQTT y tramas por segundo leídos de VentilatorTelemetryFacade, usuarios autenticados por WebSocket (IRealtimePublisher) y reserva activa en caché
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { SimulationHealthResult } from "@/features/simulation/application/results/simulation-health.result";
import { type CachedReservation, ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { CONNECTED_STATUS_VALUE, DISCONNECTED_STATUS_VALUE } from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { type VentilatorTelemetryConnectionInfo, type VentilatorTelemetryStatus } from "@/features/ventilator-telemetry/application/results/ventilator-telemetry-status.result";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

@Injectable()
export class GetSimulationHealthUseCase {
  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    private readonly _telemetryFacade: VentilatorTelemetryFacade,
    private readonly _reservationCache: ReservationCacheService,
  ) {}

  public execute(): SimulationHealthResult {
    const userIds: string[] = this._realtimePublisher.getConnectedUserIds();
    const reservation: CachedReservation | undefined = this._reservationCache.current;
    const status: VentilatorTelemetryStatus = this._telemetryFacade.getStatus();
    const connection: VentilatorTelemetryConnectionInfo = this._telemetryFacade.getConnectionInfo();
    const now: number = Date.now();

    return new SimulationHealthResult({
      mqtt: {
        status: status.brokerConnected ? CONNECTED_STATUS_VALUE : DISCONNECTED_STATUS_VALUE,
        brokerUrl: connection.brokerUrl ?? "",
        topic: connection.telemetryTopic,
      },
      ws: {
        connectedUsers: userIds.length,
        userIds,
      },
      telemetry: {
        lastFrameAt: status.lastMessageAt ?? null,
        lastFrameAgeMs: status.lastMessageAt !== undefined ? now - status.lastMessageAt : null,
        framesPerSecond: status.msgRate,
      },
      reservation: reservation
        ? { isReserved: true, currentUser: reservation.userId, endsAt: reservation.endTime }
        : { isReserved: false },
    });
  }
}
