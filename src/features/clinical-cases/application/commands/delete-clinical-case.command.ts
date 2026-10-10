/*
 * Funcionalidad: Comando DeleteClinicalCaseCommand
 * Descripción: Intención de eliminar un caso clínico sin uso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteClinicalCaseCommand {
  public readonly caseId: string;
  public readonly performedBy: string;

  public constructor({ caseId, performedBy }: { caseId: string; performedBy: string }) {
    this.caseId = caseId;
    this.performedBy = performedBy;
  }
}
