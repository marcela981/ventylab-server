/*
 * Funcionalidad: Comando ValidateClinicalCaseCommand
 * Descripción: Intención de marcar un caso clínico como validado por un experto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ValidateClinicalCaseCommand {
  public readonly caseId: string;
  public readonly performedBy: string;

  public constructor({ caseId, performedBy }: { caseId: string; performedBy: string }) {
    this.caseId = caseId;
    this.performedBy = performedBy;
  }
}
