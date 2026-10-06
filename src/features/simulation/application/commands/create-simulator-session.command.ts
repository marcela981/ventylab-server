/*
 * Funcionalidad: Comando CreateSimulatorSessionCommand
 * Descripción: Intención de abrir una sesión del simulador; en modo paciente simulado incluye los datos para configurar el paciente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PatientConfiguration } from "@/features/simulation/domain/services/patient-factory";

export class CreateSimulatorSessionCommand {
  public readonly userId: string;
  public readonly isRealVentilator: boolean;
  public readonly patientData?: PatientConfiguration;
  public readonly parametersLog?: unknown[];
  public readonly ventilatorData?: unknown[];
  public readonly notes?: string;
  public readonly clinicalCaseId?: string;

  public constructor({
    userId,
    isRealVentilator,
    patientData,
    parametersLog,
    ventilatorData,
    notes,
    clinicalCaseId,
  }: {
    userId: string;
    isRealVentilator: boolean;
    patientData?: PatientConfiguration;
    parametersLog?: unknown[];
    ventilatorData?: unknown[];
    notes?: string;
    clinicalCaseId?: string;
  }) {
    this.userId = userId;
    this.isRealVentilator = isRealVentilator;
    this.patientData = patientData;
    this.parametersLog = parametersLog;
    this.ventilatorData = ventilatorData;
    this.notes = notes;
    this.clinicalCaseId = clinicalCaseId;
  }
}
