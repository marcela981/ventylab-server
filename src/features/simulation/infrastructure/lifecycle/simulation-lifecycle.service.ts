/*
 * Funcionalidad: Ciclo de vida de la simulación
 * Descripción: Al apagar detiene los pacientes simulados (la conexión MQTT y la telemetría del ventilador físico pertenecen a VentilatorTelemetryModule, y el control y los comandos del ventilador físico a VentilatorCommandsModule)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, type OnApplicationShutdown } from "@nestjs/common";

import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";

@Injectable()
export class SimulationLifecycleService implements OnApplicationShutdown {
  public constructor(private readonly _patientSessions: PatientSimulationSessionsService) {}

  public onApplicationShutdown(): void {
    this._patientSessions.stopAll();
  }
}
