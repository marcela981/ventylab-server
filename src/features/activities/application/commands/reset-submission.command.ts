/*
 * Funcionalidad: Comando ResetSubmissionCommand
 * Descripción: Datos para reiniciar (eliminar) el intento de un estudiante en una actividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ResetSubmissionCommand {
  public readonly submissionId: string;
  public readonly performedBy: string;

  public constructor({ submissionId, performedBy }: { submissionId: string; performedBy: string }) {
    this.submissionId = submissionId;
    this.performedBy = performedBy;
  }
}
