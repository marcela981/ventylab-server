/*
 * Funcionalidad: Resultado ActivePatientResult
 * Descripción: Paciente simulado configurado para el usuario (si existe) y si su ciclo de señales está en curso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PatientModel } from "@/features/simulation/domain/value-objects/patient-model";

export class ActivePatientResult {
  public readonly patient?: PatientModel;
  public readonly isSimulating: boolean;

  public constructor({ patient, isSimulating }: { patient?: PatientModel; isSimulating: boolean }) {
    this.patient = patient;
    this.isSimulating = isSimulating;
  }
}
