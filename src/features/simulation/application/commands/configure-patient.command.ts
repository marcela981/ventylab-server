/*
 * Funcionalidad: Comando ConfigurePatientCommand
 * Descripción: Intención de configurar el paciente simulado del usuario desde un caso clínico del catálogo o desde datos del formulario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PatientConfiguration } from "@/features/simulation/domain/services/patient-factory";

export class ConfigurePatientCommand {
  public readonly userId: string;
  public readonly configuration: PatientConfiguration;

  public constructor({ userId, configuration }: { userId: string; configuration: PatientConfiguration }) {
    this.userId = userId;
    this.configuration = configuration;
  }
}
