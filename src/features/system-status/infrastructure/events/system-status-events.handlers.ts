/*
 * Funcionalidad: Manejadores de eventos del estado del sistema
 * Descripción: Reevalúa el estado del sistema con los eventos del bus ventilator.deviceOffline y ventilator.deviceOnline, y lleva la presencia de sockets de ADMIN y TEACHER (realtime.client-authenticated y realtime.client-disconnected) que habilita la reevaluación periódica
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
  type RealtimeClientAuthenticatedPayload,
  type RealtimeClientDisconnectedPayload,
} from "@/common/application/ports/realtime-publisher.interface";
import { SystemStatusMonitor } from "@/features/system-status/application/services/system-status-monitor.service";

@Injectable()
export class SystemStatusEventsHandlers {
  public constructor(private readonly _monitor: SystemStatusMonitor) {}

  @OnEvent("ventilator.deviceOffline", { async: true })
  public handleDeviceOffline(): void {
    this._monitor.reevaluate();
  }

  @OnEvent("ventilator.deviceOnline", { async: true })
  public handleDeviceOnline(): void {
    this._monitor.reevaluate();
  }

  @OnEvent(REALTIME_CLIENT_AUTHENTICATED_EVENT)
  public handleClientAuthenticated(payload: RealtimeClientAuthenticatedPayload): void {
    this._monitor.watch(payload.socketId, payload.role);
  }

  @OnEvent(REALTIME_CLIENT_DISCONNECTED_EVENT)
  public handleClientDisconnected(payload: RealtimeClientDisconnectedPayload): void {
    this._monitor.unwatch(payload.socketId);
  }
}
