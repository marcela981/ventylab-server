/*
 * Funcionalidad: Caso de uso GetSimulationHealthUseCase
 * Descripción: Arma la instantánea de salud del módulo sin E/S: estado y tópico MQTT, usuarios autenticados por WebSocket (IRealtimePublisher), tramas por segundo y reserva activa en caché
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { type IVentilatorDeviceGateway, VENTILATOR_DEVICE_GATEWAY_TOKEN } from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import { SimulationHealthResult } from "@/features/simulation/application/results/simulation-health.result";
import { type CachedReservation, ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { TelemetryMonitorService } from "@/features/simulation/application/services/telemetry-monitor.service";

@Injectable()
export class GetSimulationHealthUseCase {
  public constructor(
    @Inject(VENTILATOR_DEVICE_GATEWAY_TOKEN)
    private readonly _deviceGateway: IVentilatorDeviceGateway,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    private readonly _reservationCache: ReservationCacheService,
    private readonly _telemetryMonitor: TelemetryMonitorService,
  ) {}

  public execute(): SimulationHealthResult {
    const userIds: string[] = this._realtimePublisher.getConnectedUserIds();
    const reservation: CachedReservation | undefined = this._reservationCache.current;

    return new SimulationHealthResult({
      mqtt: {
        status: this._deviceGateway.getStatus(),
        brokerUrl: this._deviceGateway.connectionInfo.brokerUrl,
        topic: this._deviceGateway.connectionInfo.telemetryTopic,
      },
      ws: {
        connectedUsers: userIds.length,
        userIds,
      },
      telemetry: this._telemetryMonitor.frameStats(),
      reservation: reservation
        ? { isReserved: true, currentUser: reservation.userId, endsAt: reservation.endTime }
        : { isReserved: false },
    });
  }
}
