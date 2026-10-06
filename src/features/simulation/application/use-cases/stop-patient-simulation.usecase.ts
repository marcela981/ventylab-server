/*
 * Funcionalidad: Caso de uso StopPatientSimulationUseCase
 * Descripción: Detiene el ciclo de señales del paciente simulado del usuario; no hace nada si no hay simulación en curso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";

@Injectable()
export class StopPatientSimulationUseCase {
  public constructor(private readonly _patientSessions: PatientSimulationSessionsService) {}

  public execute(userId: string): void {
    this._patientSessions.stop(userId);
  }
}
