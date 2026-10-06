/*
 * Funcionalidad: Caso de uso ConfigurePatientUseCase
 * Descripción: Construye el paciente simulado desde un caso clínico del catálogo o desde el formulario y lo registra para el usuario, conservando los ajustes del ventilador y deteniendo el ciclo anterior
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ConfigurePatientCommand } from "@/features/simulation/application/commands/configure-patient.command";
import { PatientSimulationSessionsService } from "@/features/simulation/application/services/patient-simulation-sessions.service";
import { buildPatient } from "@/features/simulation/domain/services/patient-factory";
import { type PatientModel } from "@/features/simulation/domain/value-objects/patient-model";

/**
 * @throws {PatientDataRequiredError} If neither a clinical case nor demographics and condition are given
 * @throws {SimulationCaseNotFoundError} If the clinical case is not in the simulator catalog
 */
@Injectable()
export class ConfigurePatientUseCase {
  public constructor(private readonly _patientSessions: PatientSimulationSessionsService) {}

  public execute(command: ConfigurePatientCommand): PatientModel {
    const patient: PatientModel = buildPatient(command.configuration);

    this._patientSessions.configure(command.userId, patient);

    return patient;
  }
}
