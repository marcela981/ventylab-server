/*
 * Funcionalidad: Comando DuplicateClinicalCaseCommand
 * Descripción: Intención de copiar un caso clínico como borrador no validado, con un sufijo traducido en el título
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DuplicateClinicalCaseCommand {
  public readonly caseId: string;
  public readonly titleSuffix: string;
  public readonly performedBy: string;

  public constructor({ caseId, titleSuffix, performedBy }: { caseId: string; titleSuffix: string; performedBy: string }) {
    this.caseId = caseId;
    this.titleSuffix = titleSuffix;
    this.performedBy = performedBy;
  }
}
