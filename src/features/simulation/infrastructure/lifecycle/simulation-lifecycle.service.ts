/*
 * Funcionalidad: Ciclo de vida de la simulación
 * Descripción: Al iniciar el módulo carga la reserva activa en la caché sin bloquear ni tumbar el arranque; al apagar detiene los pacientes simulados (la conexión MQTT y la telemetría del ventilador físico pertenecen a VentilatorTelemetryModule)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";

import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";

@Injectable()
export class SimulationLifecycleService implements OnModuleInit, OnApplicationShutdown {
  private readonly _logger: Logger = new Logger(SimulationLifecycleService.name);

  public constructor(
    private readonly _reservationCache: ReservationCacheService,
    private readonly _patientSessions: PatientSimulationSessionsService,
  ) {}

  public async onModuleInit(): Promise<void> {
    try {
      await this._reservationCache.refresh();
    } catch (error) {
      this._logger.warn(`Active reservation could not be loaded: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public onApplicationShutdown(): void {
    this._patientSessions.stopAll();
  }
}
