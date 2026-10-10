/*
 * Funcionalidad: Comando UpdateClinicalCaseCommand
 * Descripción: Intención de reemplazar el contenido y la definición simulable de un caso clínico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";

export class UpdateClinicalCaseCommand {
  public readonly caseId: string;
  public readonly content: ClinicalCaseContent;
  public readonly performedBy: string;

  public constructor({ caseId, content, performedBy }: { caseId: string; content: ClinicalCaseContent; performedBy: string }) {
    this.caseId = caseId;
    this.content = content;
    this.performedBy = performedBy;
  }
}
