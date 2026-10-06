/*
 * Funcionalidad: Caso de uso GetActivePatientUseCase
 * Descripción: Devuelve el paciente simulado configurado del usuario y si su ciclo de señales está en curso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ActivePatientResult } from "@/features/simulation/application/results/active-patient.result";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";

@Injectable()
export class GetActivePatientUseCase {
  public constructor(private readonly _patientSessions: PatientSimulationSessionsService) {}

  public execute(userId: string): ActivePatientResult {
    return new ActivePatientResult({
      patient: this._patientSessions.getActivePatient(userId),
      isSimulating: this._patientSessions.isSimulating(userId),
    });
  }
}
