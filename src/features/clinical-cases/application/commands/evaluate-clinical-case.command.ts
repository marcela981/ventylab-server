/*
 * Funcionalidad: Comando EvaluateClinicalCaseCommand
 * Descripción: Datos para evaluar la configuración del ventilador de un estudiante en un caso clínico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorConfiguration } from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";

export class EvaluateClinicalCaseCommand {
  public readonly userId: string;
  public readonly caseId: string;
  public readonly configuration: VentilatorConfiguration;

  public constructor({ userId, caseId, configuration }: { userId: string; caseId: string; configuration: VentilatorConfiguration }) {
    this.userId = userId;
    this.caseId = caseId;
    this.configuration = configuration;
  }
}
