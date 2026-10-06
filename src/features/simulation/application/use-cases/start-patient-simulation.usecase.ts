/*
 * Funcionalidad: Caso de uso StartPatientSimulationUseCase
 * Descripción: Inicia (o reinicia) el ciclo de señales del paciente simulado del usuario con los ajustes del ventilador recibidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { StartPatientSimulationCommand } from "@/features/simulation/application/commands/start-patient-simulation.command";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";

/**
 * @throws {PatientNotConfiguredError} If the user has no configured patient
 */
@Injectable()
export class StartPatientSimulationUseCase {
  public constructor(private readonly _patientSessions: PatientSimulationSessionsService) {}

  public execute(command: StartPatientSimulationCommand): void {
    this._patientSessions.start(command.userId, command.command);
  }
}
