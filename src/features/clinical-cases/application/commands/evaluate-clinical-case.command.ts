/*
 * Funcionalidad: Comando EvaluateClinicalCaseCommand
 * Descripción: Datos para evaluar la configuración del ventilador de un estudiante en un caso clínico, con el rol del usuario para la cuota de IA
 * Versión: 1.1
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
  public readonly userRole?: string;

  public constructor({
    userId,
    caseId,
    configuration,
    userRole,
  }: {
    userId: string;
    caseId: string;
    configuration: VentilatorConfiguration;
    userRole?: string;
  }) {
    this.userId = userId;
    this.caseId = caseId;
    this.configuration = configuration;
    this.userRole = userRole;
  }
}
